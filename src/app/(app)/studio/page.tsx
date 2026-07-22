"use client";

import {
  ChangeEvent,
  DragEvent,
  KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabase, isCloudConfigured, ownerEmail } from "@/lib/supabase";

type BucketKey = "product" | "competitorThumbnail" | "competitorDetail" | "review";
type AiStatus = "checking" | "connected" | "missing" | "error";
type OutputTab = "thumbnail" | "detail" | "copy" | "gallery";
type ImageFormat = "thumbnail" | "detail";
type FontScale = "compact" | "default" | "comfortable";
type CloudProject = { id: string; name: string; updated_at: string };
type StoredImage = Omit<ImageAsset, "dataUrl"> & { path: string };
type StoredState = {
  images: Record<BucketKey, StoredImage[]>;
  reviewText: string;
  tone: string;
  sectionCount: number;
  thumbnailCount: number;
  result: AnalysisResult | null;
  generatedThumbnails: Record<number, string>;
  generatedDetails: Record<number, string>;
};

type ImageAsset = {
  id: string;
  name: string;
  dataUrl: string;
  width: number;
  height: number;
  size: number;
};

type ProductProfile = {
  name: string;
  category: string;
  color: string;
  materials: string[];
  features: string[];
  target_customer: string;
  evidence_notes: string[];
  uncertainties: string[];
};

type AnalysisResult = {
  mode?: "ai" | "demo";
  product: ProductProfile;
  strategy: {
    positioning: string;
    review_insights: string[];
    competitive_patterns: string[];
    differentiators: string[];
  };
  thumbnails: Array<{ title: string; goal: string; prompt: string }>;
  detail_sections: Array<{
    number: number;
    title: string;
    copy_headline: string;
    copy_body: string;
    prompt: string;
  }>;
  copy_draft: {
    hero: string;
    subcopy: string;
    bullets: string[];
    trust_copy: string;
    cta: string;
  };
  warnings: string[];
};

const MAX_IMAGES = 20;
// Vercel Functions accept request bodies up to 4.5 MB. Base64 adds roughly 33%,
// so the optimized source images stay below this raw-byte budget.
const MAX_TOTAL_BYTES = 3.15 * 1024 * 1024;
const MAX_REVIEW_TEXT = 12000;

const BUCKETS: Record<
  BucketKey,
  {
    step: string;
    eyebrow: string;
    title: string;
    description: string;
    accent: string;
  }
> = {
  product: {
    step: "01",
    eyebrow: "필수",
    title: "내 제품 사진",
    description: "정면·측면·구성품·사용 장면을 올려주세요.",
    accent: "violet",
  },
  competitorThumbnail: {
    step: "02",
    eyebrow: "썸네일 벤치마크",
    title: "경쟁사 썸네일",
    description: "상위 판매자의 검색 썸네일만 올려주세요.",
    accent: "blue",
  },
  competitorDetail: {
    step: "03",
    eyebrow: "상세 벤치마크",
    title: "경쟁사 상세페이지",
    description: "상위 판매자의 상세페이지 이미지만 올려주세요.",
    accent: "violet",
  },
  review: {
    step: "04",
    eyebrow: "고객 언어",
    title: "리뷰 스크린샷",
    description: "스크린샷을 올리거나 필요한 리뷰 문구만 복사해 붙여넣으세요.",
    accent: "amber",
  },
};

const TONES = [
  { value: "conversion", label: "전환 집중형", hint: "혜택과 차별점 우선" },
  { value: "premium", label: "프리미엄형", hint: "여백과 감성 중심" },
  { value: "information", label: "정보 설득형", hint: "근거와 비교 중심" },
];

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function dataUrlToBlob(dataUrl: string) {
  const [header, encoded] = dataUrl.split(",");
  const mime = header.match(/data:(.*?);/)?.[1] || "image/webp";
  const binary = window.atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return new Blob([bytes], { type: mime });
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("저장 이미지를 불러오지 못했습니다."));
    reader.readAsDataURL(blob);
  });
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("파일을 읽지 못했습니다."));
    reader.readAsDataURL(file);
  });
}

async function optimizeImage(file: File, bucket: BucketKey): Promise<ImageAsset> {
  const source = await readFileAsDataUrl(file);
  const image = new Image();
  image.src = source;
  await image.decode();

  const isLongImage = bucket === "review" || bucket === "competitorDetail";
  const maxWidth = isLongImage ? 1100 : 1100;
  const maxHeight = isLongImage ? 3200 : 1100;
  const ratio = Math.min(1, maxWidth / image.width, maxHeight / image.height);
  const width = Math.max(1, Math.round(image.width * ratio));
  const height = Math.max(1, Math.round(image.height * ratio));
  const canvas = document.createElement("canvas");
  let outputWidth = width;
  let outputHeight = height;
  let quality = isLongImage ? 0.72 : 0.7;
  const targetBytes = (isLongImage ? 120 : 90) * 1024;
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  let dataUrl = "";
  for (let attempt = 0; attempt < 7; attempt += 1) {
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    const nextContext = canvas.getContext("2d");
    if (!nextContext) throw new Error("이미지를 처리하지 못했습니다.");
    nextContext.fillStyle = "#fff";
    nextContext.fillRect(0, 0, outputWidth, outputHeight);
    nextContext.drawImage(image, 0, 0, outputWidth, outputHeight);
    dataUrl = canvas.toDataURL("image/jpeg", quality);
    const encodedBytes = Math.ceil((dataUrl.length * 3) / 4);
    if (encodedBytes <= targetBytes) break;
    outputWidth = Math.max(420, Math.round(outputWidth * 0.84));
    outputHeight = Math.max(420, Math.round(outputHeight * 0.84));
    quality = Math.max(0.44, quality - 0.07);
  }

  return {
    id: makeId(),
    name: file.name || `붙여넣은 이미지 ${new Date().toLocaleTimeString("ko-KR")}`,
    dataUrl,
    width: outputWidth,
    height: outputHeight,
    size: Math.ceil((dataUrl.length * 3) / 4),
  };
}

function totalBytes(images: Record<BucketKey, ImageAsset[]>) {
  return Object.values(images).flat().reduce((sum, image) => sum + image.size, 0);
}

function demoResult(
  counts: Record<BucketKey, number>,
  reviewTextLength: number,
  sectionCount: number,
  thumbnailCount: number,
  tone: string,
): AnalysisResult {
  const toneLabel = TONES.find((item) => item.value === tone)?.label ?? "전환 집중형";
  const productReference =
    "첨부한 ‘내 제품 사진’을 형태·색상·비율·부품 구조의 절대 기준으로 사용한다. 제품을 새로 해석하거나 구조를 바꾸지 않는다. MORIVA 브랜드 팔레트인 딥 네이비(#071A35), 화이트, 골드(#C9961A)를 절제되게 적용한다.";
  const sections = [
    ["첫 화면 · 문제 제기", "매일 쓰는 제품일수록, 작은 불편부터 달라야 합니다"],
    ["핵심 혜택", "한눈에 이해되는 가장 강한 구매 이유"],
    ["사용 장면", "설명하지 않아도 보이는 간편함"],
    ["디테일 1", "눈에 보이는 구조가 만드는 차이"],
    ["디테일 2", "사용할수록 만족스러운 설계"],
    ["리뷰 인사이트", "고객이 먼저 확인한 선택의 이유"],
    ["경쟁 방식 비교", "비슷해 보여도 사용 경험은 다릅니다"],
    ["구성·사이즈", "구매 전에 꼭 확인하세요"],
    ["사용법", "처음부터 어렵지 않게"],
    ["마무리 CTA", "오늘부터 더 편한 일상을 시작하세요"],
  ].slice(0, sectionCount);

  return {
    mode: "demo",
    product: {
      name: "첨부 이미지 기반 제품",
      category: "AI 연결 후 자동 판별",
      color: "사진에서 자동 추출",
      materials: ["사진 기반 판별 예정"],
      features: ["제품 구조", "사용 방식", "구성품", "차별 디테일"],
      target_customer: "리뷰와 사용 장면을 기반으로 자동 추론",
      evidence_notes: [
        `내 제품 사진 ${counts.product}장`,
        `경쟁사 썸네일 ${counts.competitorThumbnail}장`,
        `경쟁사 상세페이지 ${counts.competitorDetail}장`,
        `리뷰 스크린샷 ${counts.review}장`,
        ...(reviewTextLength ? [`복사한 리뷰 문구 ${reviewTextLength.toLocaleString("ko-KR")}자`] : []),
      ],
      uncertainties: ["AI 키 연결 전에는 정확한 제품 속성을 확정하지 않습니다."],
    },
    strategy: {
      positioning: `${toneLabel} 구성 — 경쟁사 표현은 참고하되 문구와 레이아웃은 새롭게 재구성`,
      review_insights: [
        "리뷰에서 반복되는 불편을 첫 화면의 문제 제기로 전환",
        "호평 표현은 과장 없이 고객이 체감하는 혜택 언어로 재작성",
        "구매 전 질문은 사용법·사이즈·구성 섹션에서 선제 해소",
      ],
      competitive_patterns: [
        "상위 판매자의 정보 순서와 강조 강도를 벤치마킹",
        "브랜드·문구·레이아웃을 그대로 복제하지 않고 설득 원리만 활용",
      ],
      differentiators: ["제품 사진에서 확인되는 실제 구조", "리뷰 근거형 카피", "모바일 가독성 중심 구성"],
    },
    thumbnails: Array.from({ length: thumbnailCount }, (_, index) => ({
      title: [`제품 집중 메인컷`, `핵심 기능 시연컷`, `구성·혜택 강조컷`][index] ?? `썸네일 변형 ${index + 1}`,
      goal: index === 0 ? "검색 결과에서 제품 형태와 품질을 즉시 인지" : "핵심 사용 이점을 한 장면으로 전달",
      prompt: `@이미지 만들기\n\n쿠팡 로켓그로스용 1:1 상품 썸네일을 제작한다.\n\n${productReference}\n경쟁사 썸네일 ${counts.competitorThumbnail}장의 제품 크기·구도·시선 집중 방식만 참고하고, 브랜드·문구·배치·그래픽은 독창적으로 재구성한다.\n\n[연출 방향 ${index + 1}]\n- ${index === 0 ? "제품 전체 형태가 가장 명확한 3/4 스튜디오 메인컷" : index === 1 ? "제품의 핵심 기능이 실제 사용되는 순간을 보여주는 라이프스타일 컷" : "제품과 구성품을 균형 있게 배열한 가치 제안 컷"}\n- 밝고 깨끗한 한국형 커머스 사진, 선명한 초점, 자연스러운 접지 그림자\n- 제품이 프레임 밖으로 잘리지 않게 전체 노출\n- 최종 비율 1:1, 1080×1080px\n- 한국어 문구는 생성 이미지에 직접 넣지 말고 텍스트 안전 여백 확보\n\n[금지]\n제품 디자인 변경, 부품 추가·삭제, 로고 왜곡, 존재하지 않는 기능 표현, 경쟁사 레이아웃 복제, 중국어·임의 문자 생성.`,
    })),
    detail_sections: sections.map(([title, headline], index) => ({
      number: index + 1,
      title,
      copy_headline: headline,
      copy_body:
        index === 5
          ? "리뷰에 반복해서 등장한 기대와 불편을 실제 제품 근거로 답합니다."
          : "제품 사진에서 확인되는 사실만 사용해 짧고 명확하게 설득합니다.",
      prompt: `@이미지 만들기\n\n쿠팡 로켓그로스 상세페이지의 ${index + 1}번 섹션 ‘${title}’을 제작한다.\n\n${productReference}\n- 캔버스 폭 780px, 세로형 단일 섹션\n- ${toneLabel} 디자인, 모바일에서 1초 안에 읽히는 정보 위계\n- 헤드라인: “${headline}”\n- ${index === 5 ? `첨부 리뷰 스크린샷 ${counts.review}장${reviewTextLength ? `과 복사한 리뷰 문구 ${reviewTextLength.toLocaleString("ko-KR")}자` : ""}에서 반복되는 고객 표현을 요약하되, 특정 개인 리뷰를 그대로 복사하지 않는다.` : "제품의 실제 디테일을 크게 보여주고 기능과 혜택의 인과관계를 시각화한다."}\n- 경쟁사와 동일한 문구·레이아웃·아이콘을 사용하지 않는다.\n- 정확한 한국어 텍스트 배치를 위한 깨끗한 여백을 확보한다.\n\n[절대 금지]\n확인되지 않은 수치·인증·효과, 제품 형태 변경, 과장 비교, 경쟁사 상표 노출, 오탈자·무의미한 글자.`,
    })),
    copy_draft: {
      hero: "매일 쓰는 순간, 불편은 더 작게",
      subcopy: "사진에서 확인되는 제품의 실제 장점과 고객의 언어를 연결한 첫 카피입니다.",
      bullets: ["한눈에 이해되는 사용 방식", "디테일에서 느껴지는 편리함", "구매 전 궁금증까지 미리 해결"],
      trust_copy: "첨부 자료에서 확인되는 사실만 사용하고, 확인되지 않은 성능과 수치는 제외합니다.",
      cta: "더 편한 선택, 지금 확인해보세요.",
    },
    warnings: ["현재는 AI 연결 전 데모 초안입니다. 실제 제품명·소재·색상은 확정하지 않았습니다."],
  };
}

function UploadCard({
  bucket,
  images,
  active,
  busy,
  onActivate,
  onFiles,
  onRemove,
  reviewText,
  onReviewTextChange,
}: {
  bucket: BucketKey;
  images: ImageAsset[];
  active: boolean;
  busy: boolean;
  onActivate: () => void;
  onFiles: (files: File[]) => void;
  onRemove: (id: string) => void;
  reviewText?: string;
  onReviewTextChange?: (value: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const config = BUCKETS[bucket];
  const [dragging, setDragging] = useState(false);

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    onActivate();
    onFiles(Array.from(event.dataTransfer.files));
  };

  return (
    <section
      className={`upload-card accent-${config.accent} ${active ? "is-active" : ""}`}
      onClick={onActivate}
      onFocus={onActivate}
    >
      <div className="upload-card-head">
        <div className="step-badge">{config.step}</div>
        <div className="upload-card-title">
          <div className="eyebrow-row">
            <span>{config.eyebrow}</span>
            <span className="count-label">{images.length} / {MAX_IMAGES}</span>
          </div>
          <h2>{config.title}</h2>
          <p>{config.description}</p>
        </div>
        {active && <span className="paste-target">붙여넣기 대상</span>}
      </div>

      <div
        className={`drop-zone ${dragging ? "is-dragging" : ""}`}
        role="button"
        tabIndex={0}
        aria-label={`${config.title} 이미지 첨부`}
        onClick={(event) => {
          event.stopPropagation();
          onActivate();
          inputRef.current?.click();
        }}
        onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
          if (event.key === "Enter" || event.key === " ") inputRef.current?.click();
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          hidden
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            onFiles(Array.from(event.target.files ?? []));
            event.target.value = "";
          }}
        />
        <div className="drop-icon"><span>＋</span></div>
        <div>
          <strong>{busy ? "이미지를 최적화하는 중…" : "클릭하거나 이미지를 끌어오세요"}</strong>
          <p>PNG · JPG · WEBP &nbsp;·&nbsp; Ctrl+V 가능</p>
        </div>
        <button type="button" className="soft-button" disabled={busy}>파일 선택</button>
      </div>

      {bucket === "review" && (
        <div className="review-text-box" onClick={(event) => event.stopPropagation()}>
          <div className="review-text-head">
            <div>
              <span>REVIEW TEXT PASTE</span>
              <strong>필요한 리뷰 문구만 붙여넣기</strong>
            </div>
            <span>{(reviewText ?? "").length.toLocaleString("ko-KR")} / {MAX_REVIEW_TEXT.toLocaleString("ko-KR")}자</span>
          </div>
          <textarea
            value={reviewText ?? ""}
            maxLength={MAX_REVIEW_TEXT}
            aria-label="복사한 리뷰 문구"
            placeholder="판매자 페이지에서 관련 리뷰를 드래그해 선택한 뒤 Ctrl+C → 여기에 Ctrl+V 하세요. 선택한 문구를 이 영역에 바로 끌어다 놓아도 됩니다."
            onFocus={onActivate}
            onChange={(event) => onReviewTextChange?.(event.target.value)}
          />
          <div className="review-text-foot">
            <span>호평 · 불편 · 반복 질문을 줄바꿈으로 구분하면 더 정확합니다.</span>
            {(reviewText ?? "").length > 0 && (
              <button type="button" onClick={() => onReviewTextChange?.("")}>문구 지우기</button>
            )}
          </div>
        </div>
      )}

      {images.length > 0 && (
        <div className="image-strip" aria-label={`${config.title} 미리보기`}>
          {images.map((image, index) => (
            <figure className="image-tile" key={image.id}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.dataUrl} alt={`${config.title} ${index + 1}`} />
              <figcaption>{String(index + 1).padStart(2, "0")}</figcaption>
              <button
                type="button"
                aria-label={`${index + 1}번 이미지 삭제`}
                onClick={(event) => {
                  event.stopPropagation();
                  onRemove(image.id);
                }}
              >×</button>
            </figure>
          ))}
        </div>
      )}
    </section>
  );
}

function CopyButton({ text, label = "복사" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };
  return (
    <button type="button" className="copy-button" onClick={handleCopy}>
      <span>{copied ? "✓" : "□"}</span> {copied ? "복사됨" : label}
    </button>
  );
}

let brandReferencePromise: Promise<string> | null = null;

async function optimizeReferenceDataUrl(dataUrl: string, maxEdge = 1400, quality = 0.76) {
  const image = new Image();
  image.src = dataUrl;
  await image.decode();
  const scale = Math.min(1, maxEdge / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("수정 이미지를 최적화하지 못했습니다.");
  context.fillStyle = "#fff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", quality);
}

async function getBrandReference() {
  if (!brandReferencePromise) {
    brandReferencePromise = fetch("/moriva-brand-guide.png")
      .then((response) => {
        if (!response.ok) throw new Error("MORIVA 로고 가이드를 불러오지 못했습니다.");
        return response.blob();
      })
      .then(blobToDataUrl)
      .then((dataUrl) => optimizeReferenceDataUrl(dataUrl, 1200, 0.8))
      .catch((error) => {
        brandReferencePromise = null;
        throw error;
      });
  }
  return brandReferencePromise;
}

async function requestGeneratedImage(prompt: string, format: ImageFormat, references: string[]) {
  const [brandImage, ...optimizedReferences] = await Promise.all([
    getBrandReference(),
    ...references.slice(0, 4).map((reference, index) =>
      optimizeReferenceDataUrl(reference, index === 0 ? 1400 : 1100, index === 0 ? 0.78 : 0.72)
    ),
  ]);
  const response = await fetch("/api/generate-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, format, productImages: optimizedReferences, brandImage }),
  });
  const data = (await response.json()) as { image?: string; code?: string; error?: string };
  if (!response.ok || !data.image) {
    if (data.code === "NO_API_KEY") throw new Error("OPENAI_API_KEY가 연결되지 않았습니다.");
    throw new Error(data.error || "이미지를 만들지 못했습니다.");
  }
  return data.image;
}

function DirectImageButton({
  prompt,
  productImages,
  format,
  title,
  imageUrl,
  onGenerated,
  onNotice,
}: {
  prompt: string;
  productImages: ImageAsset[];
  format: ImageFormat;
  title: string;
  imageUrl?: string;
  onGenerated: (image: string) => void;
  onNotice: (message: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editInstruction, setEditInstruction] = useState("");

  const createImage = async () => {
    if (!productImages.length) {
      onNotice("제품 사진을 먼저 첨부해주세요.");
      return;
    }
    setLoading(true);
    try {
      const image = await requestGeneratedImage(prompt, format, productImages.map((item) => item.dataUrl));
      onGenerated(image);
      setOpen(true);
    } catch (error) {
      onNotice(error instanceof Error ? error.message : "이미지 생성 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const editImage = async () => {
    if (!imageUrl || !editInstruction.trim()) {
      onNotice("수정할 내용을 입력해주세요.");
      return;
    }
    setLoading(true);
    try {
      const editPrompt = `${prompt}\n\n[기존 생성 이미지 수정]\n첫 번째 참조 이미지는 방금 생성된 결과다. 전체 구성과 제품 일관성을 유지하면서 아래 요청만 정확히 수정한다.\n- ${editInstruction.trim()}\n수정 요청과 관계없는 제품 형태·색상·로고·문구·배경은 임의로 바꾸지 않는다.`;
      const references = [imageUrl, ...productImages.map((item) => item.dataUrl)];
      const image = await requestGeneratedImage(editPrompt, format, references);
      onGenerated(image);
      setEditInstruction("");
      onNotice("수정 이미지를 만들었습니다.");
    } catch (error) {
      onNotice(error instanceof Error ? error.message : "이미지 수정 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button type="button" className="direct-image-button" onClick={() => imageUrl ? setOpen(true) : void createImage()} disabled={loading}>
        <span>{loading ? "◌" : imageUrl ? "✓" : "✦"}</span>{loading ? "이미지 만드는 중" : imageUrl ? "결과 보기 · 편집" : "개별 이미지 만들기"}
      </button>
      {imageUrl && open && (
        <div className="generated-modal" role="dialog" aria-modal="true" aria-label={`${title} 생성 이미지`}>
          <div className="generated-card">
            <div className="generated-card-head">
              <div><span>CHATGPT IMAGE</span><strong>{title}</strong></div>
              <button type="button" aria-label="닫기" onClick={() => setOpen(false)}>×</button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt={`${title} 생성 결과`} />
            <div className="generated-edit-box">
              <label htmlFor={`edit-${format}-${title}`}>이 이미지만 수정하기</label>
              <textarea id={`edit-${format}-${title}`} value={editInstruction} onChange={(event) => setEditInstruction(event.target.value)} placeholder="예: 제품을 10% 크게, 헤드라인은 유지하고 배경만 밝은 거실로 변경" />
              <button type="button" onClick={() => void editImage()} disabled={loading}>{loading ? "수정 이미지 만드는 중…" : "수정 이미지 만들기"}</button>
            </div>
            <div className="generated-actions">
              <p>수정 결과는 현재 항목에 새 버전으로 교체됩니다.</p>
              <a href={imageUrl} download={`moriva-${format}.${imageUrl.startsWith("data:image/webp") ? "webp" : "png"}`}>
                {imageUrl.startsWith("data:image/webp") ? "WEBP" : "PNG"} 다운로드
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function OutputPanel({
  result,
  productImages,
  onNotice,
  generatedThumbnails,
  setGeneratedThumbnails,
  generatedDetails,
  setGeneratedDetails,
}: {
  result: AnalysisResult;
  productImages: ImageAsset[];
  onNotice: (message: string) => void;
  generatedThumbnails: Record<number, string>;
  setGeneratedThumbnails: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  generatedDetails: Record<number, string>;
  setGeneratedDetails: React.Dispatch<React.SetStateAction<Record<number, string>>>;
}) {
  const [tab, setTab] = useState<OutputTab>("thumbnail");
  const [openSections, setOpenSections] = useState<number[]>([0]);
  const [selectedDetails, setSelectedDetails] = useState<number[]>([]);
  const [batchProgress, setBatchProgress] = useState<{ type: ImageFormat; current: number; total: number } | null>(null);
  const [galleryEdits, setGalleryEdits] = useState<Record<string, string>>({});
  const [galleryLoading, setGalleryLoading] = useState<string | null>(null);

  const editGalleryImage = async (type: ImageFormat, index: number) => {
    const key = `${type}-${index}`;
    const instruction = galleryEdits[key]?.trim();
    const currentImage = type === "thumbnail" ? generatedThumbnails[index] : generatedDetails[index];
    const item = type === "thumbnail" ? result.thumbnails[index] : result.detail_sections[index];
    if (!currentImage || !instruction) {
      onNotice("수정하거나 보완할 내용을 입력해주세요.");
      return;
    }
    setGalleryLoading(key);
    try {
      const editPrompt = `${item.prompt}\n\n[현재 생성 이미지 수정 및 프롬프트 보완]\n첫 번째 참조 이미지는 현재 생성 결과다. 전체 제품과 디자인의 일관성은 유지하고 아래 요청을 우선 반영한다.\n\n${instruction}\n\n요청하지 않은 제품 형태·색상·로고·구성품·핵심 카피는 임의로 변경하지 않는다.`;
      const image = await requestGeneratedImage(editPrompt, type, [currentImage, ...productImages.map((product) => product.dataUrl)]);
      if (type === "thumbnail") setGeneratedThumbnails((current) => ({ ...current, [index]: image }));
      else setGeneratedDetails((current) => ({ ...current, [index]: image }));
      setGalleryEdits((current) => ({ ...current, [key]: "" }));
      onNotice("수정 요청을 반영한 새 이미지를 만들었습니다.");
    } catch (error) {
      onNotice(error instanceof Error ? error.message : "이미지 수정 중 오류가 발생했습니다.");
    } finally {
      setGalleryLoading(null);
    }
  };

  const generateAll = async (type: ImageFormat) => {
    if (!productImages.length) {
      onNotice("제품 사진을 먼저 첨부해주세요.");
      return;
    }
    const items = type === "thumbnail" ? result.thumbnails : result.detail_sections;
    setBatchProgress({ type, current: 0, total: items.length });
    let completed = 0;
    try {
      for (let index = 0; index < items.length; index += 1) {
        const image = await requestGeneratedImage(items[index].prompt, type, productImages.map((item) => item.dataUrl));
        if (type === "thumbnail") {
          setGeneratedThumbnails((current) => ({ ...current, [index]: image }));
        } else {
          setGeneratedDetails((current) => ({ ...current, [index]: image }));
          setSelectedDetails((current) => current.includes(index) ? current : [...current, index]);
        }
        completed = index + 1;
        setBatchProgress({ type, current: completed, total: items.length });
      }
      onNotice(`${type === "thumbnail" ? "썸네일" : "상세페이지"} 전체 이미지 ${completed}장을 만들었습니다.`);
    } catch (error) {
      onNotice(`${completed}장 생성 후 중단: ${error instanceof Error ? error.message : "이미지 생성 오류"}`);
    } finally {
      setBatchProgress(null);
    }
  };

  const stitchSelectedDetails = async () => {
    const indexes = selectedDetails.filter((index) => generatedDetails[index]).sort((a, b) => a - b);
    if (!indexes.length) {
      onNotice("먼저 연결할 상세페이지 이미지를 선택해주세요.");
      return;
    }
    try {
      const loaded = await Promise.all(indexes.map((index) => new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("생성 이미지를 읽지 못했습니다."));
        image.src = generatedDetails[index];
      })));
      const width = 780;
      const heights = loaded.map((image) => Math.round(image.height * (width / image.width)));
      const totalHeight = heights.reduce((sum, height) => sum + height, 0);
      if (totalHeight > 30000) {
        onNotice("선택한 이미지가 너무 깁니다. 일부 섹션만 선택해 나누어 저장해주세요.");
        return;
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = totalHeight;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("긴 이미지를 만들지 못했습니다.");
      context.fillStyle = "#fff";
      context.fillRect(0, 0, width, totalHeight);
      let y = 0;
      loaded.forEach((image, index) => {
        context.drawImage(image, 0, y, width, heights[index]);
        y += heights[index];
      });
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.92));
      if (!blob) throw new Error("긴 이미지를 저장하지 못했습니다.");
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `moriva-detail-page-${indexes.map((index) => index + 1).join("-")}.webp`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      onNotice(`선택한 ${indexes.length}개 섹션을 긴 이미지로 저장했습니다.`);
    } catch (error) {
      onNotice(error instanceof Error ? error.message : "긴 이미지 제작 중 오류가 발생했습니다.");
    }
  };
  const thumbnailMasterPrompt = useMemo(() => {
    const thumbnails = result.thumbnails.map((item, index) => (
      `[THUMBNAIL ${String(index + 1).padStart(2, "0")} · ${item.title}]\n목표: ${item.goal}\n\n${item.prompt}`
    )).join("\n\n━━━━━━━━━━━━━━━━━━━━\n\n");
    return `@이미지 만들기\n\nMORIVA 쿠팡 로켓그로스 썸네일 세트를 제작한다.\n\n[공통 절대 규칙]\n- 함께 첨부한 내 제품 사진을 형태·색상·비율·부품 구조의 절대 기준으로 사용한다.\n- 제품 디자인, 로고, 패키지 문구와 구성품을 임의로 바꾸지 않는다.\n- 각 썸네일은 1:1, 1080×1080px 독립 이미지로 제작한다.\n- 경쟁사 썸네일은 제품 크기·구도·시선 집중 원리만 참고하고 브랜드·문구·배치를 복제하지 않는다.\n- 확인되지 않은 기능·수치·인증은 표현하지 않는다.\n- 정확한 한글만 사용하고 중국어·임의 문자·오탈자를 금지한다.\n\n[제작 순서]\n아래 THUMBNAIL 01부터 마지막 안까지 순서대로 각각 제작한다.\n\n${thumbnails}`;
  }, [result]);
  const detailMasterPrompt = useMemo(() => {
    const sections = result.detail_sections.map((item) => (
      `[SECTION ${String(item.number).padStart(2, "0")} · ${item.title}]\n카피: ${item.copy_headline}\n설명: ${item.copy_body}\n\n${item.prompt}`
    )).join("\n\n━━━━━━━━━━━━━━━━━━━━\n\n");
    return `@이미지 만들기\n\nMORIVA 쿠팡 로켓그로스 상세페이지 전체를 제작한다.\n\n[공통 절대 규칙]\n- 함께 첨부한 내 제품 사진을 제품 형태·색상·비율·부품 구조의 절대 기준으로 사용한다.\n- 제품 디자인, 로고, 패키지 문구와 구성품을 임의로 바꾸지 않는다.\n- 브랜드 팔레트: 딥 네이비 #071A35 / 화이트 / 골드 #C9961A.\n- 모든 섹션은 폭 780px 기준으로 제작하고 모바일 가독성을 우선한다.\n- 섹션별 이미지는 각각 독립 파일로 제작하되 위에서 아래로 연결했을 때 하나의 상세페이지처럼 통일한다.\n- 경쟁사 이미지의 설득 원리만 참고하고 문구·레이아웃·상표를 복제하지 않는다.\n- 확인되지 않은 수치·효과·인증은 넣지 않는다.\n- 정확한 한글만 사용하고 중국어·임의 문자·오탈자를 금지한다.\n\n[제작 순서]\n아래 SECTION 01부터 마지막 섹션까지 순서대로 하나도 빠짐없이 제작한다. 각 섹션을 완성할 때마다 제품 외형 일관성과 한글 오탈자를 검수한다.\n\n${sections}`;
  }, [result]);
  const allText = useMemo(() => {
    if (tab === "thumbnail") return thumbnailMasterPrompt;
    if (tab === "detail") return detailMasterPrompt;
    return `${result.copy_draft.hero}\n${result.copy_draft.subcopy}\n\n${result.copy_draft.bullets.map((item) => `• ${item}`).join("\n")}\n\n${result.copy_draft.trust_copy}\n${result.copy_draft.cta}`;
  }, [detailMasterPrompt, result, tab, thumbnailMasterPrompt]);

  return (
    <section className="output-section" id="results">
      <div className="output-head">
        <div>
          <span className="section-kicker">PROMPT PACKAGE</span>
          <h2>바로 붙여넣을 수 있는 결과</h2>
          <p>ChatGPT에서 같은 제품 사진을 함께 첨부한 뒤 프롬프트를 사용하세요.</p>
        </div>
        <div className="output-actions">
          <span className={`mode-pill ${result.mode === "demo" ? "demo" : "ai"}`}>
            {result.mode === "demo" ? "데모 초안" : "AI 이미지 분석 완료"}
          </span>
          <CopyButton text={thumbnailMasterPrompt} label="썸네일 전체 한번에 복사" />
          <CopyButton text={detailMasterPrompt} label="상세페이지 전체 한번에 복사" />
        </div>
      </div>

      <div className="result-layout">
        <aside className="product-summary">
          <div className="summary-topline"><span>AI PRODUCT READ</span><span>●</span></div>
          <h3>{result.product.name}</h3>
          <p>{result.product.category}</p>
          <dl>
            <div><dt>컬러</dt><dd>{result.product.color}</dd></div>
            <div><dt>소재</dt><dd>{result.product.materials.join(", ")}</dd></div>
            <div><dt>타깃</dt><dd>{result.product.target_customer}</dd></div>
          </dl>
          <div className="feature-tags">
            {result.product.features.slice(0, 6).map((feature) => <span key={feature}>{feature}</span>)}
          </div>
          <div className="positioning-box">
            <span>추천 포지셔닝</span>
            <strong>{result.strategy.positioning}</strong>
          </div>
          {result.warnings.length > 0 && (
            <div className="warning-note"><span>!</span><p>{result.warnings[0]}</p></div>
          )}
        </aside>

        <div className="result-main">
          <div className="result-tabs" role="tablist" aria-label="생성 결과 유형">
            <button className={tab === "thumbnail" ? "active" : ""} onClick={() => setTab("thumbnail")}>
              썸네일 <span>{result.thumbnails.length}</span>
            </button>
            <button className={tab === "detail" ? "active" : ""} onClick={() => setTab("detail")}>
              상세페이지 <span>{result.detail_sections.length}</span>
            </button>
            <button className={tab === "copy" ? "active" : ""} onClick={() => setTab("copy")}>
              한국어 카피 <span>1</span>
            </button>
            <button className={tab === "gallery" ? "active" : ""} onClick={() => setTab("gallery")}>
              제작 이미지 <span>{Object.keys(generatedThumbnails).length + Object.keys(generatedDetails).length}</span>
            </button>
          </div>

          {tab === "thumbnail" && (
            <div className="prompt-list">
              <div className="batch-create-bar">
                <div><span>THUMBNAIL SET</span><strong>썸네일 전체 이미지를 순서대로 생성</strong><p>각 안은 독립 파일로 저장되고 생성 후 개별 편집할 수 있습니다.</p></div>
                <button type="button" className="direct-image-button batch-button" onClick={() => void generateAll("thumbnail")} disabled={Boolean(batchProgress)}>
                  <span>{batchProgress?.type === "thumbnail" ? "◌" : "✦"}</span>
                  {batchProgress?.type === "thumbnail" ? `${batchProgress.current} / ${batchProgress.total} 생성 중` : "썸네일 전체 이미지 바로 만들기"}
                </button>
              </div>
              {result.thumbnails.map((item, index) => (
                <article className="prompt-card" key={`${item.title}-${index}`}>
                  <div className="prompt-card-head">
                    <span className="number-chip">{String(index + 1).padStart(2, "0")}</span>
                    <div><h3>{item.title}</h3><p>{item.goal}</p></div>
                    <div className="prompt-actions">
                      <CopyButton text={item.prompt} />
                      <DirectImageButton prompt={item.prompt} productImages={productImages} format="thumbnail" title={item.title} imageUrl={generatedThumbnails[index]} onGenerated={(image) => setGeneratedThumbnails((current) => ({ ...current, [index]: image }))} onNotice={onNotice} />
                    </div>
                  </div>
                  <pre>{item.prompt}</pre>
                </article>
              ))}
            </div>
          )}

          {tab === "detail" && (
            <div className="section-list">
              <div className="detail-master-bar">
                <div><span>ONE-PASTE DETAIL PROMPT</span><strong>전체 섹션을 하나의 프롬프트로 묶었습니다</strong><p>제품 사진과 함께 ChatGPT에 한 번만 붙여넣으세요.</p></div>
                <div className="detail-master-actions">
                  <CopyButton text={detailMasterPrompt} label="상세 전체 프롬프트 복사" />
                  <button type="button" className="direct-image-button" onClick={() => void generateAll("detail")} disabled={Boolean(batchProgress)}>
                    <span>{batchProgress?.type === "detail" ? "◌" : "✦"}</span>
                    {batchProgress?.type === "detail" ? `${batchProgress.current} / ${batchProgress.total} 생성 중` : "상세 전체 이미지 바로 만들기"}
                  </button>
                  <button type="button" className="stitch-button" onClick={() => void stitchSelectedDetails()} disabled={!selectedDetails.length}>선택 페이지 길게 붙이기 ({selectedDetails.length})</button>
                </div>
              </div>
              {result.detail_sections.map((item, index) => {
                const isOpen = openSections.includes(index);
                return (
                  <article className={`section-card ${isOpen ? "open" : ""}`} key={`${item.number}-${item.title}`}>
                    <button
                      type="button"
                      className="section-toggle"
                      onClick={() => setOpenSections((current) => current.includes(index) ? current.filter((value) => value !== index) : [...current, index])}
                    >
                      <span className="number-chip">{String(item.number).padStart(2, "0")}</span>
                      <div><span>SECTION</span><h3>{item.title}</h3><p>{item.copy_headline}</p></div>
                      <span className="chevron">⌄</span>
                    </button>
                    {isOpen && (
                      <div className="section-body">
                        <div className="copy-preview"><span>카피 초안</span><strong>{item.copy_headline}</strong><p>{item.copy_body}</p></div>
                        <div className="prompt-inline">
                          <div className="prompt-inline-actions">
                            <CopyButton text={item.prompt} />
                            <DirectImageButton prompt={item.prompt} productImages={productImages} format="detail" title={item.title} imageUrl={generatedDetails[index]} onGenerated={(image) => {
                              setGeneratedDetails((current) => ({ ...current, [index]: image }));
                              setSelectedDetails((current) => current.includes(index) ? current : [...current, index]);
                            }} onNotice={onNotice} />
                          </div>
                          <pre>{item.prompt}</pre>
                        </div>
                      </div>
                    )}
                    {generatedDetails[index] && (
                      <div className="generated-section-row">
                        <label><input type="checkbox" checked={selectedDetails.includes(index)} onChange={(event) => setSelectedDetails((current) => event.target.checked ? [...new Set([...current, index])] : current.filter((value) => value !== index))} /> 긴 이미지에 포함</label>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={generatedDetails[index]} alt={`${item.title} 생성 미리보기`} />
                        <span>SECTION {String(item.number).padStart(2, "0")} 생성 완료 · 결과 보기 버튼에서 개별 편집</span>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}

          {tab === "copy" && (
            <article className="copy-sheet">
              <div className="copy-sheet-head"><span>KOREAN COPY DRAFT</span><CopyButton text={allText} /></div>
              <div className="hero-copy"><span>메인 헤드라인</span><h3>{result.copy_draft.hero}</h3><p>{result.copy_draft.subcopy}</p></div>
              <div className="copy-grid">
                <div><span>핵심 소구점</span><ul>{result.copy_draft.bullets.map((item) => <li key={item}>{item}</li>)}</ul></div>
                <div><span>신뢰 문구</span><p>{result.copy_draft.trust_copy}</p><span className="cta-copy">{result.copy_draft.cta}</span></div>
              </div>
              <div className="insight-row">
                {result.strategy.review_insights.slice(0, 3).map((item, index) => <div key={item}><span>리뷰 인사이트 {index + 1}</span><p>{item}</p></div>)}
              </div>
            </article>
          )}

          {tab === "gallery" && (
            <section className="generated-gallery">
              <div className="gallery-heading">
                <div><span>CREATED IMAGE LIBRARY</span><h3>제작 이미지 보관함</h3><p>생성된 이미지를 한곳에서 확인하고, 이미지마다 수정 요청이나 프롬프트 보완 내용을 입력할 수 있습니다.</p></div>
                <div><strong>{Object.keys(generatedThumbnails).length}</strong><span>썸네일</span><strong>{Object.keys(generatedDetails).length}</strong><span>상세페이지</span></div>
              </div>
              {Object.keys(generatedThumbnails).length + Object.keys(generatedDetails).length === 0 ? (
                <div className="gallery-empty"><span>✦</span><strong>아직 제작된 이미지가 없습니다</strong><p>썸네일 또는 상세페이지 탭에서 전체·개별 이미지 만들기를 실행해주세요.</p></div>
              ) : (
                <div className="gallery-grid">
                  {Object.entries(generatedThumbnails).map(([rawIndex, image]) => {
                    const index = Number(rawIndex);
                    const key = `thumbnail-${index}`;
                    const item = result.thumbnails[index];
                    return (
                      <article className="gallery-card" key={key}>
                        <div className="gallery-card-label"><span>THUMBNAIL {String(index + 1).padStart(2, "0")}</span><strong>{item.title}</strong></div>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={image} alt={`${item.title} 제작 이미지`} />
                        <div className="gallery-card-body">
                          <textarea value={galleryEdits[key] ?? ""} onChange={(event) => setGalleryEdits((current) => ({ ...current, [key]: event.target.value }))} placeholder="수정 요청 또는 프롬프트 보완 내용을 입력하세요. 예: 제품은 유지하고 배경을 더 밝게, 로고 크기 15% 축소" />
                          <div><a href={image} download={`moriva-thumbnail-${index + 1}.webp`}>다운로드</a><button type="button" onClick={() => void editGalleryImage("thumbnail", index)} disabled={galleryLoading === key}>{galleryLoading === key ? "수정 중…" : "수정해서 다시 만들기"}</button></div>
                        </div>
                      </article>
                    );
                  })}
                  {Object.entries(generatedDetails).map(([rawIndex, image]) => {
                    const index = Number(rawIndex);
                    const key = `detail-${index}`;
                    const item = result.detail_sections[index];
                    return (
                      <article className="gallery-card detail" key={key}>
                        <div className="gallery-card-label"><span>DETAIL SECTION {String(item.number).padStart(2, "0")}</span><strong>{item.title}</strong></div>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={image} alt={`${item.title} 제작 이미지`} />
                        <div className="gallery-card-body">
                          <label><input type="checkbox" checked={selectedDetails.includes(index)} onChange={(event) => setSelectedDetails((current) => event.target.checked ? [...new Set([...current, index])] : current.filter((value) => value !== index))} /> 긴 상세페이지에 포함</label>
                          <textarea value={galleryEdits[key] ?? ""} onChange={(event) => setGalleryEdits((current) => ({ ...current, [key]: event.target.value }))} placeholder="수정 요청 또는 프롬프트 보완 내용을 입력하세요. 예: 헤드라인은 유지하고 제품 사진을 더 크게 배치" />
                          <div><a href={image} download={`moriva-detail-${item.number}.webp`}>다운로드</a><button type="button" onClick={() => void editGalleryImage("detail", index)} disabled={galleryLoading === key}>{galleryLoading === key ? "수정 중…" : "수정해서 다시 만들기"}</button></div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
              {Object.keys(generatedDetails).length > 0 && <button type="button" className="gallery-stitch" onClick={() => void stitchSelectedDetails()} disabled={!selectedDetails.length}>선택한 상세페이지 {selectedDetails.length}개 길게 붙여 다운로드</button>}
            </section>
          )}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const [images, setImages] = useState<Record<BucketKey, ImageAsset[]>>({ product: [], competitorThumbnail: [], competitorDetail: [], review: [] });
  const [activeBucket, setActiveBucket] = useState<BucketKey>("product");
  const [reviewText, setReviewText] = useState("");
  const [processing, setProcessing] = useState<BucketKey | null>(null);
  const [tone, setTone] = useState("conversion");
  const [sectionCount, setSectionCount] = useState(8);
  const [thumbnailCount, setThumbnailCount] = useState(3);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [generating, setGenerating] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [aiStatus, setAiStatus] = useState<AiStatus>("checking");
  const [fontScale, setFontScale] = useState<FontScale>("default");
  const [generatedThumbnails, setGeneratedThumbnails] = useState<Record<number, string>>({});
  const [generatedDetails, setGeneratedDetails] = useState<Record<number, string>>({});
  const [cloudOpen, setCloudOpen] = useState(false);
  const [cloudBusy, setCloudBusy] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loginEmail, setLoginEmail] = useState(ownerEmail());
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("새 MORIVA 프로젝트");
  const [projects, setProjects] = useState<CloudProject[]>([]);

  const counts = useMemo(() => ({
    product: images.product.length,
    competitorThumbnail: images.competitorThumbnail.length,
    competitorDetail: images.competitorDetail.length,
    review: images.review.length,
  }), [images]);
  const totalCount = counts.product + counts.competitorThumbnail + counts.competitorDetail + counts.review;
  const ready = counts.product > 0;

  const showNotice = useCallback((message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 3200);
  }, []);

  const refreshProjects = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    const { data, error } = await supabase.from("projects").select("id,name,updated_at").order("updated_at", { ascending: false });
    if (error) throw error;
    setProjects((data ?? []) as CloudProject[]);
  }, []);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;
    void supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 외부 Supabase 상태를 동기화하는 의도된 패턴 (원본 유지)
    if (user) void refreshProjects().catch(() => showNotice("저장 프로젝트 목록을 불러오지 못했습니다."));
  }, [refreshProjects, showNotice, user]);

  const sendLoginLink = async () => {
    const supabase = getSupabase();
    if (!supabase) return showNotice("먼저 Supabase 환경 변수를 연결해주세요.");
    const allowed = ownerEmail();
    if (!loginEmail.trim() || (allowed && loginEmail.trim().toLowerCase() !== allowed)) return showNotice("등록된 본인 이메일만 사용할 수 있습니다.");
    setCloudBusy(true);
    const { error } = await supabase.auth.signInWithOtp({ email: loginEmail.trim(), options: { emailRedirectTo: window.location.origin } });
    setCloudBusy(false);
    showNotice(error ? error.message : "로그인 링크를 이메일로 보냈습니다.");
  };

  const uploadDataUrl = async (path: string, dataUrl: string) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("클라우드가 연결되지 않았습니다.");
    const { error } = await supabase.storage.from("moriva-projects").upload(path, dataUrlToBlob(dataUrl), { upsert: true, contentType: dataUrl.match(/data:(.*?);/)?.[1] || "image/webp" });
    if (error) throw error;
    return path;
  };

  const downloadDataUrl = async (path: string) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("클라우드가 연결되지 않았습니다.");
    const { data, error } = await supabase.storage.from("moriva-projects").download(path);
    if (error) throw error;
    return blobToDataUrl(data);
  };

  const saveProject = async () => {
    const supabase = getSupabase();
    if (!supabase || !user) return setCloudOpen(true);
    setCloudBusy(true);
    try {
      const nextId = projectId ?? window.crypto.randomUUID();
      const storedImages = {} as Record<BucketKey, StoredImage[]>;
      for (const bucket of Object.keys(images) as BucketKey[]) {
        storedImages[bucket] = await Promise.all(images[bucket].map(async ({ dataUrl, ...asset }) => ({
          ...asset,
          path: await uploadDataUrl(`${user.id}/${nextId}/inputs/${bucket}/${asset.id}.webp`, dataUrl),
        })));
      }
      const storedThumbs: Record<number, string> = {};
      for (const [index, dataUrl] of Object.entries(generatedThumbnails)) storedThumbs[Number(index)] = await uploadDataUrl(`${user.id}/${nextId}/generated/thumbnail-${index}.webp`, dataUrl);
      const storedDetails: Record<number, string> = {};
      for (const [index, dataUrl] of Object.entries(generatedDetails)) storedDetails[Number(index)] = await uploadDataUrl(`${user.id}/${nextId}/generated/detail-${index}.webp`, dataUrl);
      const state: StoredState = { images: storedImages, reviewText, tone, sectionCount, thumbnailCount, result, generatedThumbnails: storedThumbs, generatedDetails: storedDetails };
      const { error } = await supabase.from("projects").upsert({ id: nextId, user_id: user.id, name: projectName.trim() || "새 MORIVA 프로젝트", state, updated_at: new Date().toISOString() });
      if (error) throw error;
      setProjectId(nextId);
      await refreshProjects();
      showNotice("프로젝트를 클라우드에 저장했습니다.");
    } catch (error) {
      showNotice(error instanceof Error ? `저장 실패: ${error.message}` : "프로젝트를 저장하지 못했습니다.");
    } finally { setCloudBusy(false); }
  };

  const loadProject = async (id: string) => {
    const supabase = getSupabase();
    if (!supabase || !user) return;
    setCloudBusy(true);
    try {
      const { data, error } = await supabase.from("projects").select("id,name,state").eq("id", id).single();
      if (error) throw error;
      const state = data.state as StoredState;
      const restored = {} as Record<BucketKey, ImageAsset[]>;
      for (const bucket of Object.keys(state.images) as BucketKey[]) restored[bucket] = await Promise.all(state.images[bucket].map(async ({ path, ...asset }) => ({ ...asset, dataUrl: await downloadDataUrl(path) })));
      const thumbs: Record<number, string> = {};
      for (const [index, path] of Object.entries(state.generatedThumbnails ?? {})) thumbs[Number(index)] = await downloadDataUrl(path);
      const details: Record<number, string> = {};
      for (const [index, path] of Object.entries(state.generatedDetails ?? {})) details[Number(index)] = await downloadDataUrl(path);
      setImages(restored); setReviewText(state.reviewText ?? ""); setTone(state.tone ?? "conversion"); setSectionCount(state.sectionCount ?? 8); setThumbnailCount(state.thumbnailCount ?? 3); setResult(state.result ?? null); setGeneratedThumbnails(thumbs); setGeneratedDetails(details); setProjectId(data.id); setProjectName(data.name); setCloudOpen(false);
      showNotice("저장된 프로젝트를 불러왔습니다.");
    } catch (error) {
      showNotice(error instanceof Error ? `불러오기 실패: ${error.message}` : "프로젝트를 불러오지 못했습니다.");
    } finally { setCloudBusy(false); }
  };

  const newProject = () => {
    setProjectId(null); setProjectName("새 MORIVA 프로젝트"); setImages({ product: [], competitorThumbnail: [], competitorDetail: [], review: [] }); setReviewText(""); setResult(null); setGeneratedThumbnails({}); setGeneratedDetails({}); setCloudOpen(false); showNotice("새 프로젝트를 시작했습니다.");
  };

  useEffect(() => {
    const savedScale = window.localStorage.getItem("moriva-font-scale") as FontScale | null;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage에 저장된 값 복원 (원본 유지)
    if (savedScale === "compact" || savedScale === "default" || savedScale === "comfortable") setFontScale(savedScale);
  }, []);

  const changeFontScale = (scale: FontScale) => {
    setFontScale(scale);
    window.localStorage.setItem("moriva-font-scale", scale);
  };

  useEffect(() => {
    let active = true;
    fetch("/api/analyze", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("status");
        const data = (await response.json()) as { connected?: boolean };
        if (active) setAiStatus(data.connected ? "connected" : "missing");
      })
      .catch(() => { if (active) setAiStatus("error"); });
    return () => { active = false; };
  }, []);

  const addFiles = useCallback(async (bucket: BucketKey, files: File[]) => {
    const accepted = files.filter((file) => file.type.startsWith("image/"));
    if (!accepted.length) {
      showNotice("이미지 파일만 첨부할 수 있습니다.");
      return;
    }
    const room = MAX_IMAGES - images[bucket].length;
    if (room <= 0) {
      showNotice(`${BUCKETS[bucket].title}은 최대 ${MAX_IMAGES}장까지 첨부할 수 있습니다.`);
      return;
    }
    const selected = accepted.slice(0, room);
    if (accepted.length > room) showNotice(`최대 ${MAX_IMAGES}장까지만 추가했습니다.`);
    setProcessing(bucket);
    try {
      const optimized = await Promise.all(selected.map((file) => optimizeImage(file, bucket)));
      const next = { ...images, [bucket]: [...images[bucket], ...optimized] };
      if (totalBytes(next) > MAX_TOTAL_BYTES) {
        showNotice("전체 분석 한도를 넘었습니다. 긴 상세페이지를 여러 화면으로 자르기보다 필요한 핵심 구간만 첨부해주세요.");
        return;
      }
      setImages(next);
      setResult(null);
    } catch {
      showNotice("일부 이미지를 처리하지 못했습니다. JPG 또는 PNG로 다시 시도해주세요.");
    } finally {
      setProcessing(null);
    }
  }, [images, showNotice]);

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const files = Array.from(event.clipboardData?.items ?? [])
        .filter((item) => item.type.startsWith("image/"))
        .map((item) => item.getAsFile())
        .filter((file): file is File => Boolean(file));
      if (files.length) {
        event.preventDefault();
        void addFiles(activeBucket, files);
        showNotice(`${BUCKETS[activeBucket].title}에 붙여넣었습니다.`);
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [activeBucket, addFiles, showNotice]);

  const removeImage = (bucket: BucketKey, id: string) => {
    setImages((current) => ({ ...current, [bucket]: current[bucket].filter((image) => image.id !== id) }));
    setResult(null);
  };

  const generate = async () => {
    if (!ready) {
      showNotice("먼저 내 제품 사진을 1장 이상 첨부해주세요.");
      return;
    }
    setGenerating(true);
    setResult(null);
    try {
      const brandImage = await getBrandReference();
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandImage,
          images: {
            product: images.product.map((item) => item.dataUrl),
            competitorThumbnail: images.competitorThumbnail.map((item) => item.dataUrl),
            competitorDetail: images.competitorDetail.map((item) => item.dataUrl),
            review: images.review.map((item) => item.dataUrl),
          },
          reviewText,
          settings: { tone, sectionCount, thumbnailCount, width: 780 },
        }),
      });
      const data = (await response.json()) as AnalysisResult & { code?: string; error?: string };
      if (!response.ok) {
        if (data.code === "NO_API_KEY") setAiStatus("missing");
        else setAiStatus("error");
        throw new Error(data.code === "NO_API_KEY" ? "OPENAI_API_KEY가 등록되지 않았습니다." : data.error || `AI 요청 오류 (${response.status})`);
      }
      setAiStatus("connected");
      setResult({ ...data, mode: "ai" });
      window.setTimeout(() => document.querySelector("#results")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    } catch (error) {
      const fallback = demoResult(counts, reviewText.trim().length, sectionCount, thumbnailCount, tone);
      setResult(fallback);
      showNotice(error instanceof Error ? `${error.message} 데모 프롬프트를 만들었습니다.` : "AI 요청에 실패해 데모 프롬프트를 만들었습니다.");
      window.setTimeout(() => document.querySelector("#results")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <main className={`font-scale-${fontScale}`}>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="MORIVA Prompt Studio 홈">
          <span className="brand-logo-crop">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/moriva-brand-guide.png" alt="MORIVA 모리바 Better Life, Better Move" />
          </span>
          <span className="brand-product"><strong>CONTENT STUDIO</strong><small>COUPANG CREATIVE BUILDER</small></span>
        </a>
        <div className="header-center"><span>쿠팡 로켓그로스</span><strong>이미지 콘텐츠 빌더</strong></div>
        <div className="header-actions">
          <button type="button" className={`cloud-button ${user ? "connected" : ""}`} onClick={() => setCloudOpen(true)}>
            <span>{user ? "●" : "☁"}</span>{user ? (projectId ? "저장됨" : "프로젝트 저장") : "클라우드 저장"}
          </button>
          <div className="font-scale-control" role="group" aria-label="페이지 글자 크기 조절">
            <button type="button" className={fontScale === "compact" ? "active" : ""} onClick={() => changeFontScale("compact")} aria-label="글자 작게">가−</button>
            <button type="button" className={fontScale === "default" ? "active" : ""} onClick={() => changeFontScale("default")} aria-label="글자 기본">가</button>
            <button type="button" className={fontScale === "comfortable" ? "active" : ""} onClick={() => changeFontScale("comfortable")} aria-label="글자 크게">가＋</button>
          </div>
          <button type="button" className="help-button" onClick={() => showNotice("각 영역을 클릭한 뒤 Ctrl+V로 이미지를 붙여넣을 수 있습니다.")}>?</button>
          <span className="save-state"><i></i> MORIVA BRAND SYSTEM</span>
        </div>
      </header>

      <div className="page-shell" id="top">
        <section className="hero">
          <div className="hero-copy-area">
            <span className="hero-label">COUPANG CREATIVE WORKFLOW</span>
            <h1>사진만 넣으면,<br /><em>팔리는 설득 구조</em>가 완성됩니다.</h1>
            <p>제품·경쟁사·리뷰 이미지를 읽고, ChatGPT 이미지 생성에 바로 붙여넣을 프롬프트와 한국어 카피를 한 번에 만듭니다.</p>
          </div>
          <div className="hero-side">
            <div className="hero-brand-panel">
              <div className="reverse-logo-crop">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/moriva-brand-guide.png" alt="MORIVA 모리바" />
              </div>
              <div><span>MORIVA BRAND PROMISE</span><strong>Better Life, Better Move</strong><p>브랜드 컬러와 제품 디테일을 일관되게 유지합니다.</p></div>
            </div>
            <div className="workflow-card" aria-label="작업 흐름">
              <div><span>1</span><strong>이미지 첨부</strong><small>영역별 최대 20장</small></div>
              <i>→</i>
              <div><span>2</span><strong>AI 제품 읽기</strong><small>특징·리뷰 분석</small></div>
              <i>→</i>
              <div><span>3</span><strong>이미지 제작</strong><small>복사 또는 바로 생성</small></div>
            </div>
          </div>
        </section>

        <section className="workspace-grid">
          <div className="upload-stack">
            <div className="section-heading">
              <div><span>STEP 01</span><h2>분석할 자료를 모아주세요</h2></div>
              <p>영역을 선택하면 Ctrl+V 이미지가 그곳에 들어갑니다.</p>
            </div>
            {(Object.keys(BUCKETS) as BucketKey[]).map((bucket) => (
              <UploadCard
                key={bucket}
                bucket={bucket}
                images={images[bucket]}
                active={activeBucket === bucket}
                busy={processing === bucket}
                onActivate={() => setActiveBucket(bucket)}
                onFiles={(files) => void addFiles(bucket, files)}
                onRemove={(id) => removeImage(bucket, id)}
                reviewText={bucket === "review" ? reviewText : undefined}
                onReviewTextChange={bucket === "review" ? (value) => {
                  setReviewText(value);
                  setResult(null);
                } : undefined}
              />
            ))}
          </div>

          <aside className="control-panel">
            <div className="panel-heading"><span>STEP 02</span><h2>생성 설정</h2><p>제품에 맞는 결과 형식을 고르세요.</p></div>

            <div className={`ai-status ai-${aiStatus}`}>
              <span></span>
              <div>
                <strong>{aiStatus === "connected" ? "AI 연결 완료" : aiStatus === "missing" ? "AI 키 미등록" : aiStatus === "error" ? "AI 연결 확인 필요" : "AI 연결 확인 중"}</strong>
                <small>{aiStatus === "connected" ? "OpenAI 이미지 분석을 사용할 수 있습니다." : aiStatus === "missing" ? "Vercel 환경 변수에 OPENAI_API_KEY를 등록하세요." : aiStatus === "error" ? "키·모델·배포 설정을 확인하세요." : "배포 환경을 확인하고 있습니다."}</small>
              </div>
            </div>

            <div className="control-group">
              <label>콘텐츠 방향</label>
              <div className="tone-options">
                {TONES.map((item) => (
                  <button type="button" key={item.value} className={tone === item.value ? "selected" : ""} onClick={() => setTone(item.value)}>
                    <span>{tone === item.value ? "●" : "○"}</span><div><strong>{item.label}</strong><small>{item.hint}</small></div>
                  </button>
                ))}
              </div>
            </div>

            <div className="dual-controls">
              <div className="control-group compact">
                <label htmlFor="thumbnail-count">썸네일 안</label>
                <select id="thumbnail-count" value={thumbnailCount} onChange={(event) => setThumbnailCount(Number(event.target.value))}>
                  <option value={2}>2개</option><option value={3}>3개</option><option value={4}>4개</option>
                </select>
              </div>
              <div className="control-group compact">
                <label htmlFor="section-count">상세 섹션</label>
                <select id="section-count" value={sectionCount} onChange={(event) => setSectionCount(Number(event.target.value))}>
                  <option value={6}>6개</option><option value={8}>8개</option><option value={10}>10개</option>
                </select>
              </div>
            </div>

            <div className="fixed-spec"><span>상세페이지 폭</span><strong>780 px</strong><small>쿠팡 권장 작업 폭</small></div>

            <div className="material-summary">
              <div className="summary-title"><span>첨부 현황</span><strong>{totalCount}장</strong></div>
              {(Object.keys(BUCKETS) as BucketKey[]).map((bucket) => (
                <div className="summary-row" key={bucket}><span><i className={`dot ${BUCKETS[bucket].accent}`}></i>{BUCKETS[bucket].title}</span><strong>{counts[bucket]}장{bucket === "review" && reviewText.trim() ? " + 문구" : ""}</strong></div>
              ))}
              <div className="summary-progress"><i style={{ width: `${Math.min(100, (totalCount / 12) * 100)}%` }}></i></div>
              <p>{ready ? "제품 사진이 준비되었습니다. 경쟁사와 리뷰를 더하면 결과가 정교해집니다." : "내 제품 사진 1장 이상이 필요합니다."}</p>
            </div>

            <button className="generate-button" type="button" onClick={generate} disabled={!ready || generating || Boolean(processing)}>
              <span>{generating ? "◌" : "✦"}</span>
              <div><strong>{generating ? "이미지를 읽고 있습니다…" : "프롬프트 자동 생성"}</strong><small>{generating ? "제품·경쟁사·리뷰를 함께 분석 중" : "썸네일 + 상세페이지 + 카피"}</small></div>
              <b>→</b>
            </button>
            <div className="privacy-note"><span>✓</span><p>클라우드 저장을 실행한 프로젝트만 본인 전용 저장소에 보관됩니다.</p></div>
          </aside>
        </section>

        {result && <OutputPanel result={result} productImages={images.product} onNotice={showNotice} generatedThumbnails={generatedThumbnails} setGeneratedThumbnails={setGeneratedThumbnails} generatedDetails={generatedDetails} setGeneratedDetails={setGeneratedDetails} />}
      </div>

      {cloudOpen && (
        <div className="cloud-overlay" role="dialog" aria-modal="true" aria-label="개인 클라우드 프로젝트">
          <section className="cloud-panel">
            <div className="cloud-panel-head"><div><span>PRIVATE CLOUD</span><strong>내 MORIVA 프로젝트</strong></div><button type="button" onClick={() => setCloudOpen(false)} aria-label="닫기">×</button></div>
            {!isCloudConfigured() ? (
              <div className="cloud-setup"><span>1</span><h3>클라우드 연결 준비가 필요합니다</h3><p>Supabase 프로젝트를 만든 뒤 아래 환경 변수 3개를 Vercel에 등록하면 이 화면에서 로그인과 저장을 사용할 수 있습니다.</p><code>NEXT_PUBLIC_SUPABASE_URL</code><code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code><code>NEXT_PUBLIC_OWNER_EMAIL</code><small>저장소에 포함된 supabase/schema.sql도 Supabase SQL Editor에서 한 번 실행해야 합니다.</small></div>
            ) : !user ? (
              <div className="cloud-login"><h3>본인 이메일로 로그인</h3><p>다른 컴퓨터에서도 같은 이메일로 로그인하면 저장 프로젝트를 그대로 불러올 수 있습니다.</p><input type="email" value={loginEmail} onChange={(event) => setLoginEmail(event.target.value)} placeholder="본인 이메일" /><button type="button" onClick={() => void sendLoginLink()} disabled={cloudBusy}>{cloudBusy ? "전송 중…" : "이메일로 로그인 링크 받기"}</button></div>
            ) : (
              <>
                <div className="cloud-account"><div><span>로그인 계정</span><strong>{user.email}</strong></div><button type="button" onClick={() => void getSupabase()?.auth.signOut()}>로그아웃</button></div>
                <div className="cloud-save-box"><label htmlFor="project-name">현재 프로젝트 이름</label><input id="project-name" value={projectName} onChange={(event) => setProjectName(event.target.value)} /><div><button type="button" className="secondary" onClick={newProject}>＋ 새 프로젝트</button><button type="button" onClick={() => void saveProject()} disabled={cloudBusy}>{cloudBusy ? "저장 중…" : projectId ? "현재 프로젝트 저장" : "새 프로젝트로 저장"}</button></div></div>
                <div className="cloud-project-list"><div className="cloud-list-title"><strong>저장된 프로젝트</strong><span>{projects.length}개</span></div>{projects.length === 0 ? <p className="cloud-empty">아직 저장된 프로젝트가 없습니다.</p> : projects.map((project) => <button type="button" key={project.id} className={project.id === projectId ? "active" : ""} onClick={() => void loadProject(project.id)} disabled={cloudBusy}><div><strong>{project.name}</strong><span>{new Date(project.updated_at).toLocaleString("ko-KR")}</span></div><b>{project.id === projectId ? "현재 열림" : "불러오기"}</b></button>)}</div>
              </>
            )}
          </section>
        </div>
      )}

      {notice && <div className="toast" role="status"><span>✓</span>{notice}</div>}
      {generating && <div className="analysis-overlay" aria-live="polite"><div className="analysis-modal"><div className="scan-orb"><span></span></div><strong>이미지에서 판매 단서를 찾고 있습니다</strong><p>제품 구조 → 경쟁사 설득 방식 → 리뷰 언어 순으로 분석합니다.</p><div className="loading-line"><i></i></div></div></div>}
    </main>
  );
}
