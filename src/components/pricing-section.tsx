"use client";

import { useState } from "react";
import Link from "next/link";

// TODO: 실제 요금/크레딧 정책이 확정되면 이 값들을 교체하세요.
// Stripe Price와 맞추려면 prisma/seed.ts의 Plan.monthlyCredits, 가격도 함께 수정해야 합니다.
const PLANS = [
  {
    key: "free",
    name: "Free",
    monthly: 0,
    yearly: 0,
    credits: "가입 시 50 크레딧 (1회)",
    features: ["스튜디오 분석 체험", "동시 요청 1개", "커뮤니티 지원"],
    cta: "무료로 시작하기",
    highlighted: false,
  },
  {
    key: "pro",
    name: "Pro",
    monthly: 19000,
    yearly: 190000,
    credits: "매월 2,000 크레딧 자동 지급",
    features: ["스튜디오 무제한 분석", "동시 요청 5개", "이메일 지원", "크레딧 추가 구매 가능"],
    cta: "Pro 시작하기",
    highlighted: true,
  },
];

const CREDIT_PACK = { credits: 1000, price: 10000 };

function formatWon(amount: number) {
  if (amount === 0) return "무료";
  return `₩${amount.toLocaleString("ko-KR")}`;
}

export function PricingSection() {
  const [interval, setInterval] = useState<"monthly" | "yearly">("monthly");

  return (
    <section id="pricing" className="w-full max-w-4xl flex flex-col items-center gap-8 px-4 py-16">
      <div className="text-center flex flex-col gap-2">
        <h2 className="text-2xl font-semibold text-white">요금제</h2>
        <p className="text-sm text-white/50">
          구독으로 매달 기본 크레딧을 받고, 부족하면 언제든 추가 구매하세요.
        </p>
      </div>

      <div className="inline-flex items-center rounded-full border border-white/15 bg-white/5 p-1 text-sm">
        <button
          onClick={() => setInterval("monthly")}
          className={`rounded-full px-4 py-1.5 transition ${
            interval === "monthly" ? "bg-[#c9961a] text-[#071a35] font-semibold" : "text-white/60"
          }`}
        >
          월간 결제
        </button>
        <button
          onClick={() => setInterval("yearly")}
          className={`rounded-full px-4 py-1.5 transition ${
            interval === "yearly" ? "bg-[#c9961a] text-[#071a35] font-semibold" : "text-white/60"
          }`}
        >
          연간 결제 <span className="text-xs opacity-70">(2개월 무료)</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
        {PLANS.map((plan) => {
          const price = interval === "monthly" ? plan.monthly : plan.yearly;
          return (
            <div
              key={plan.key}
              className={`rounded-xl border p-6 flex flex-col gap-4 ${
                plan.highlighted
                  ? "border-[#c9961a]/60 bg-white/[0.06] shadow-[0_0_40px_rgba(201,150,26,0.12)]"
                  : "border-white/10 bg-white/[0.03]"
              }`}
            >
              <div>
                <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                <p className="text-sm text-white/50">{plan.credits}</p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-white">{formatWon(price)}</span>
                {price > 0 && (
                  <span className="text-sm text-white/50">
                    / {interval === "monthly" ? "월" : "년"}
                  </span>
                )}
              </div>

              <ul className="flex flex-col gap-2 text-sm text-white/70">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <span aria-hidden className="text-[#c9961a]">✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href="/signup"
                className={`mt-auto text-center rounded-md px-4 py-2 text-sm font-medium transition ${
                  plan.highlighted
                    ? "bg-[#c9961a] text-[#071a35] hover:brightness-110"
                    : "border border-white/20 text-white hover:bg-white/10"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          );
        })}
      </div>

      <div className="w-full rounded-xl border border-dashed border-white/15 p-6 text-center flex flex-col gap-1">
        <p className="text-sm font-medium text-white">크레딧이 더 필요하신가요?</p>
        <p className="text-sm text-white/50">
          {CREDIT_PACK.credits.toLocaleString("ko-KR")} 크레딧 = {formatWon(CREDIT_PACK.price)} (구독과 별도로 언제든 추가 구매)
        </p>
      </div>
    </section>
  );
}
