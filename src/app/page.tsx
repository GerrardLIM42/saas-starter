import Link from "next/link";
import { PricingSection } from "@/components/pricing-section";

// TODO: 서비스명/태그라인은 아직 확정되지 않아 임시 값입니다. 확정되면 교체하세요.
const SERVICE_NAME = "AIFlow";
const TAGLINE = "쓴 만큼만 내는 AI 크레딧 플랫폼";

const FEATURES = [
  {
    title: "구독 + 크레딧 하이브리드",
    desc: "월간/연간 구독으로 매달 크레딧을 받고, 부족하면 언제든 추가 구매할 수 있어요.",
  },
  {
    title: "등급별 기능 제한",
    desc: "플랜에 따라 사용 가능한 AI 모델과 동시 요청 수가 달라집니다.",
  },
  {
    title: "OpenAI 기반 AI 기능",
    desc: "실제 사용한 토큰만큼만 크레딧이 차감되어 투명하게 비용을 관리할 수 있어요.",
  },
];

const FAQS = [
  {
    q: "크레딧은 이월되나요?",
    desc: "TODO: 이월 정책을 정한 뒤 이 답변을 채워주세요. (예: 구독 중에는 이월, 해지 시 소멸 등)",
  },
  {
    q: "환불이 가능한가요?",
    desc: "TODO: 환불 정책을 정한 뒤 이 답변을 채워주세요.",
  },
  {
    q: "플랜은 언제든 변경할 수 있나요?",
    desc: "네, 대시보드에서 언제든 업그레이드/다운그레이드할 수 있습니다. (Stripe Customer Portal 연동 예정)",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col items-center">
      <nav className="w-full max-w-5xl flex items-center justify-between px-4 py-6">
        <span className="font-semibold">{SERVICE_NAME}</span>
        <div className="flex items-center gap-4 text-sm">
          <Link href="#pricing" className="text-gray-500 hover:text-black">
            요금제
          </Link>
          <Link href="/signin" className="text-gray-500 hover:text-black">
            로그인
          </Link>
          <Link
            href="/signup"
            className="rounded-md bg-black text-white px-3 py-1.5"
          >
            무료로 시작하기
          </Link>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center w-full">
        {/* Hero */}
        <section className="flex flex-col items-center text-center gap-6 px-4 py-20 max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight">{TAGLINE}</h1>
          <p className="text-gray-500 max-w-md">
            월간/연간 구독으로 기본 크레딧을 받고, 필요할 때 추가로 충전하세요.
            사용한 만큼만 정확하게 차감됩니다.
          </p>
          <div className="flex gap-3">
            <Link
              href="/signup"
              className="rounded-md bg-black text-white px-5 py-2.5 text-sm font-medium"
            >
              무료로 시작하기
            </Link>
            <Link
              href="#pricing"
              className="rounded-md border border-gray-300 px-5 py-2.5 text-sm font-medium"
            >
              요금제 보기
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-3 gap-6 px-4 py-12">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex flex-col gap-2 rounded-xl border border-gray-200 p-6">
              <h3 className="font-medium">{f.title}</h3>
              <p className="text-sm text-gray-500">{f.desc}</p>
            </div>
          ))}
        </section>

        {/* Pricing */}
        <PricingSection />

        {/* FAQ */}
        <section className="w-full max-w-2xl flex flex-col gap-6 px-4 py-16">
          <h2 className="text-2xl font-semibold text-center">자주 묻는 질문</h2>
          <div className="flex flex-col divide-y divide-gray-200">
            {FAQS.map((f) => (
              <div key={f.q} className="py-4 flex flex-col gap-1">
                <p className="font-medium">{f.q}</p>
                <p className="text-sm text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="w-full flex flex-col items-center gap-4 px-4 py-16 text-center">
          <h2 className="text-xl font-semibold">지금 바로 시작해보세요</h2>
          <Link
            href="/signup"
            className="rounded-md bg-black text-white px-5 py-2.5 text-sm font-medium"
          >
            무료 가입하기
          </Link>
        </section>
      </main>

      <footer className="w-full max-w-5xl px-4 py-8 text-sm text-gray-400 text-center">
        © {new Date().getFullYear()} {SERVICE_NAME}
      </footer>
    </div>
  );
}
