import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { deductCredits, getCreditBalance, InsufficientCreditsError } from "@/lib/credits";
import { STUDIO_IMAGE_CREDIT_COST } from "@/lib/studio-credits";

type GenerateImageBody = {
  prompt?: string;
  format?: "thumbnail" | "detail";
  productImages?: string[];
  brandImage?: string;
};

function validDataUrl(value: unknown): value is string {
  return typeof value === "string" && /^data:image\/(jpeg|png|webp);base64,/.test(value);
}

function dataUrlToBlob(dataUrl: string) {
  const [header, encoded] = dataUrl.split(",", 2);
  const mime = header.match(/^data:(image\/(?:jpeg|png|webp));base64$/)?.[1];
  if (!mime || !encoded) throw new Error("Invalid image data");
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return { blob: new Blob([bytes], { type: mime }), extension: mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg" };
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ code: "NO_API_KEY" }, { status: 503 });

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const userId = session.user.id;

  const balance = await getCreditBalance(userId);
  if (balance < STUDIO_IMAGE_CREDIT_COST) {
    return NextResponse.json(
      { error: `크레딧이 부족합니다. (필요 ${STUDIO_IMAGE_CREDIT_COST} / 보유 ${balance})` },
      { status: 402 }
    );
  }

  let body: GenerateImageBody;
  try {
    body = (await request.json()) as GenerateImageBody;
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  const images = (body.productImages ?? []).filter(validDataUrl).slice(0, 4);
  const brandImage = validDataUrl(body.brandImage) ? body.brandImage : null;
  if (!prompt || !images.length) return NextResponse.json({ error: "프롬프트와 제품 사진이 필요합니다." }, { status: 400 });

  const form = new FormData();
  form.append("model", process.env.OPENAI_IMAGE_MODEL || "gpt-image-2");
  form.append("prompt", `${prompt}\n\n[참조 이미지 적용 규칙]\nproduct-reference 이미지는 실제 제품 및 현재 수정 대상의 기준이다. 첫 번째 이미지가 기존 생성 결과인 경우 그 구성은 유지하고 사용자가 요청한 부분만 수정한다. 제품의 고유 형태, 패키지 디자인, 색상, 비율, 부품 수와 위치를 정확히 보존하며 존재하지 않는 기능이나 구성품을 만들지 않는다. brand-reference 이미지는 MORIVA의 공식 브랜드 가이드다. 브랜드명은 영문 ‘MORIVA’, 한글 ‘모리바’, 슬로건은 ‘Better Life, Better Move’로 정확히 유지한다. 브랜드를 표시하는 장면에서는 가이드의 M 심볼과 워드마크를 왜곡·재설계·오탈자 없이 참고하고, 딥 네이비 #071A35, 화이트, 골드 #C9961A의 시각 체계를 일관되게 적용한다.`);
  form.append("size", body.format === "detail" ? "1024x1536" : "1024x1024");
  form.append("quality", "medium");
  // Vercel Functions cap response bodies at 4.5 MB. WEBP keeps generated
  // 1024px commerce images comfortably below that limit in normal use.
  form.append("output_format", "webp");
  form.append("output_compression", "85");

  try {
    images.forEach((image, index) => {
      const { blob, extension } = dataUrlToBlob(image);
      form.append("image[]", blob, `product-reference-${index + 1}.${extension}`);
    });
    if (brandImage) {
      const { blob, extension } = dataUrlToBlob(brandImage);
      form.append("image[]", blob, `brand-reference-moriva.${extension}`);
    }

    const response = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });
    const payload = (await response.json()) as {
      data?: Array<{ b64_json?: string }>;
      error?: { message?: string; code?: string };
    };
    if (!response.ok) {
      console.error("OpenAI image error", response.status, payload.error?.code, payload.error?.message);
      const message = payload.error?.message || "이미지를 만들지 못했습니다.";
      const friendly = response.status === 413
        ? "수정 이미지 전송 용량이 너무 큽니다. 이미지를 최적화한 뒤 다시 시도해주세요."
        : response.status === 429
          ? "AI 이미지 사용 한도 또는 요청 속도 제한에 도달했습니다. 잠시 후 다시 시도해주세요."
          : message;
      return NextResponse.json({ error: friendly, code: payload.error?.code }, { status: response.status });
    }
    const base64 = payload.data?.[0]?.b64_json;
    if (!base64) return NextResponse.json({ error: "생성된 이미지를 읽지 못했습니다." }, { status: 502 });

    try {
      await deductCredits({
        userId,
        amount: STUDIO_IMAGE_CREDIT_COST,
        metadata: { feature: "studio_generate_image", format: body.format ?? "thumbnail" },
      });
    } catch (err) {
      if (err instanceof InsufficientCreditsError) {
        return NextResponse.json({ error: "크레딧이 부족합니다." }, { status: 402 });
      }
      throw err;
    }

    return NextResponse.json({ image: `data:image/webp;base64,${base64}`, model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-2" });
  } catch (error) {
    console.error("Generate image route failed", error);
    return NextResponse.json({ error: "이미지 생성 중 오류가 발생했습니다." }, { status: 500 });
  }
}
