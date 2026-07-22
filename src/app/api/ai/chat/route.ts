import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { openai, DEFAULT_MODEL, MODEL_CREDIT_RATE, calculateCreditCost } from "@/lib/openai";
import { deductCredits, getCreditBalance, InsufficientCreditsError } from "@/lib/credits";

const chatSchema = z.object({
  message: z.string().min(1).max(4000),
  model: z.string().optional(),
});

// OpenAI 키는 이 서버 라우트 안에서만 사용한다. 클라이언트에는 절대 노출하지 않는다.
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const userId = session.user.id;

  const body = await req.json().catch(() => null);
  const parsed = chatSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const model = parsed.data.model ?? DEFAULT_MODEL;
  if (!(model in MODEL_CREDIT_RATE)) {
    return NextResponse.json({ error: "지원하지 않는 모델입니다." }, { status: 400 });
  }

  // 1) 호출 전: 최소 잔액(0) 확인 — 완전 소진 상태면 OpenAI 호출 자체를 막아 비용 낭비 방지
  const balance = await getCreditBalance(userId);
  if (balance <= 0) {
    return NextResponse.json(
      { error: "크레딧이 부족합니다. 충전 후 다시 시도해주세요." },
      { status: 402 }
    );
  }

  // 2) OpenAI 호출
  const completion = await openai.chat.completions.create({
    model,
    messages: [{ role: "user", content: parsed.data.message }],
  });

  const totalTokens = completion.usage?.total_tokens ?? 0;
  const creditCost = calculateCreditCost(model, totalTokens);

  // 3) 호출 후: 실사용량 기준으로 크레딧 차감. 잔액 부족 시에도 응답은 이미 받았으므로
  //    여기서는 마이너스 허용보다 "차감 실패를 기록"하는 정책이 필요할 수 있다.
  //    (스타터에서는 단순화를 위해 그대로 에러를 반환한다.)
  try {
    await deductCredits({
      userId,
      amount: creditCost,
      metadata: { model, totalTokens },
    });
  } catch (err) {
    if (err instanceof InsufficientCreditsError) {
      return NextResponse.json(
        { error: "크레딧이 부족합니다.", reply: completion.choices[0]?.message?.content },
        { status: 402 }
      );
    }
    throw err;
  }

  return NextResponse.json({
    reply: completion.choices[0]?.message?.content ?? "",
    creditCost,
    totalTokens,
  });
}
