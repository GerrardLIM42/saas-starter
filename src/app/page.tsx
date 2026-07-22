import Image from "next/image";
import Link from "next/link";
import { PricingSection } from "@/components/pricing-section";

const SERVICE_NAME = "MORIVA";
const TAGLINE_TOP = "제품 사진 한 장으로";
const TAGLINE_ACCENT = "쿠팡 콘텐츠를 완성하세요";

const FEATURES = [
  {
    title: "AI 제품·리뷰 분석",
    desc: "내 제품, 경쟁사 썸네일·상세페이지, 리뷰 스크린샷을 올리면 AI가 핵심 판매 포인트와 구매 장벽을 읽어냅니다.",
  },
  {
    title: "쿠팡 최적화 프롬프트",
    desc: "썸네일·상세페이지용 이미지 생성 프롬프트를 바로 만들어 드려요. 복사해서 ChatGPT에 붙여넣기만 하면 됩니다.",
  },
  {
    title: "카피라이팅 자동화",
    desc: "헤드라인, 서브카피, 신뢰 문구, CTA까지 상세페이지에 바로 쓸 수 있는 초안을 함께 제공합니다.",
  },
  {
    title: "구독 + 크레딧 하이브리드",
    desc: "월간/연간 구독으로 매달 기본 크레딧을 받고, 부족하면 언제든 추가로 충전할 수 있어요.",
  },
];

const STEPS = [
  { step: "01", title: "이미지 업로드", desc: "제품·경쟁사·리뷰 사진을 올려요" },
  { step: "02", title: "AI 분석", desc: "판매 포인트와 구매 장벽을 추출해요" },
  { step: "03", title: "콘텐츠 생성", desc: "썸네일·상세페이지·카피 초안 완성" },
];

const FAQS = [
  {
    q: "크레딧은 이월되나요?",
    desc: "구독이 유지되는 동안에는 사용하지 않은 크레딧이 다음 달로 이월됩니다. 구독을 해지하면 보유 크레딧은 해지 시점 이후 소멸됩니다.",
  },
  {
    q: "환불이 가능한가요?",
    desc: "결제 후 7일 이내, 크레딧을 사용하지 않은 경우에 한해 전액 환불이 가능합니다. 자세한 내용은 고객센터로 문의해주세요.",
  },
  {
    q: "플랜은 언제든 변경할 수 있나요?",
    desc: "네, 대시보드의 구독 페이지에서 언제든 업그레이드/다운그레이드하거나 결제 수단을 관리할 수 있습니다.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col items-center bg-[#071a35] text-white">
      {/* Nav */}
      <nav className="sticky top-0 z-20 w-full flex justify-center border-b border-white/10 bg-[#071a35]/90 backdrop-blur">
        <div className="w-full max-w-5xl flex items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex items-center justify-center rounded-md bg-white p-1">
              <Image src="/moriva-favicon.png" alt="MORIVA" width={24} height={24} />
            </span>
            <span className="font-bold tracking-wide text-lg">{SERVICE_NAME}</span>
          </Link>
          <div className="hidden sm:flex items-center gap-6 text-sm text-white/70">
            <Link href="#features" className="hover:text-white transition">기능</Link>
            <Link href="#pricing" className="hover:text-white transition">요금제</Link>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/signin" className="text-white/70 hover:text-white transition">
              로그인
            </Link>
            <Link
              href="/signup"
              className="rounded-md bg-[#c9961a] text-[#071a35] px-4 py-2 font-semibold hover:brightness-110 transition"
            >
              시작하기
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center w-full">
        {/* Hero */}
        <section className="relative w-full flex flex-col items-center text-center gap-7 px-4 py-24 max-w-3xl overflow-hidden">
          <div
            className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-[420px] w-[420px] rounded-full opacity-40 blur-3xl"
            style={{ background: "radial-gradient(circle, rgba(201,150,26,0.35), transparent 70%)" }}
          />
          <span className="relative inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-medium text-white/80">
            <span className="h-1.5 w-1.5 rounded-full bg-[#c9961a]" />
            이커머스 셀러를 위한 AI 콘텐츠 스튜디오
          </span>

          <h1 className="relative text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
            <span className="text-white">{TAGLINE_TOP}</span>
            <br />
            <span className="text-[#c9961a]">{TAGLINE_ACCENT}</span>
          </h1>

          <p className="relative text-white/60 max-w-lg text-base leading-relaxed">
            내 제품, 경쟁사 썸네일·상세페이지, 리뷰 사진을 올리면 AI가 분석해서
            쿠팡 썸네일 프롬프트와 상세페이지 카피 초안까지 자동으로 만들어드립니다.
          </p>

          <div className="relative flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/signup"
              className="rounded-md bg-[#c9961a] text-[#071a35] px-6 py-3 text-sm font-semibold hover:brightness-110 transition"
            >
              무료로 시작하기
            </Link>
            <Link
              href="#features"
              className="rounded-md border border-white/20 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition"
            >
              기능 살펴보기
            </Link>
          </div>

          {/* Steps strip */}
          <div className="relative mt-10 grid w-full max-w-2xl grid-cols-3 gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            {STEPS.map((s, i) => (
              <div key={s.step} className="flex flex-col items-center gap-1 text-center">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#c9961a]/15 text-xs font-bold text-[#c9961a]">
                  {s.step}
                </span>
                <strong className="text-sm">{s.title}</strong>
                <p className="text-xs text-white/50">{s.desc}</p>
                {i < STEPS.length - 1 && (
                  <span className="hidden" />
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section id="features" className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-2 gap-5 px-4 py-16">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/5 p-6 hover:border-[#c9961a]/40 transition"
            >
              <h3 className="font-semibold text-white">{f.title}</h3>
              <p className="text-sm text-white/60 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </section>

        {/* Pricing */}
        <PricingSection />

        {/* FAQ */}
        <section className="w-full max-w-2xl flex flex-col gap-6 px-4 py-16">
          <h2 className="text-2xl font-semibold text-center">자주 묻는 질문</h2>
          <div className="flex flex-col divide-y divide-white/10">
            {FAQS.map((f) => (
              <div key={f.q} className="py-4 flex flex-col gap-1">
                <p className="font-medium text-white">{f.q}</p>
                <p className="text-sm text-white/60">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="w-full flex flex-col items-center gap-4 px-4 py-20 text-center border-t border-white/10">
          <h2 className="text-2xl font-semibold">지금 바로 시작해보세요</h2>
          <p className="text-white/60 text-sm max-w-md">
            가입하면 50 크레딧을 바로 드립니다. 카드 등록 없이 지금 체험해보세요.
          </p>
          <Link
            href="/signup"
            className="rounded-md bg-[#c9961a] text-[#071a35] px-6 py-3 text-sm font-semibold hover:brightness-110 transition"
          >
            무료 가입하기
          </Link>
        </section>
      </main>

      <footer className="w-full flex flex-col items-center gap-2 border-t border-white/10 px-4 py-10 text-sm text-white/40 text-center">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center rounded bg-white p-1">
            <Image src="/moriva-favicon.png" alt="MORIVA" width={16} height={16} />
          </span>
          <span className="font-semibold text-white/70">{SERVICE_NAME}</span>
        </div>
        <p className="text-xs text-white/30">Better Life, Better Move</p>
        <p className="text-xs">© {new Date().getFullYear()} {SERVICE_NAME}</p>
      </footer>
    </div>
  );
}
