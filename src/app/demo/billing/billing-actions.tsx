"use client";

import { DEMO_DISABLED_MESSAGE } from "@/lib/demo";

// 실제 BillingActions(src/app/(app)/billing/billing-actions.tsx)와 화면은 동일하지만,
// Stripe Checkout을 호출하지 않고 데모 안내만 표시한다.
export function DemoBillingActions({ hasSubscription }: { hasSubscription: boolean }) {
  return (
    <div className="w-full flex flex-col gap-3 border border-gray-200 rounded-xl bg-white p-5">
      <p className="text-sm font-medium text-[#071a35]">구독 / 크레딧 구매 (Stripe 테스트 모드)</p>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => alert(DEMO_DISABLED_MESSAGE)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:border-[#c9961a]/60 transition"
        >
          Pro 월간 구독
        </button>
        <button
          onClick={() => alert(DEMO_DISABLED_MESSAGE)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:border-[#c9961a]/60 transition"
        >
          Pro 연간 구독
        </button>
        <button
          onClick={() => alert(DEMO_DISABLED_MESSAGE)}
          className="rounded-md bg-[#071a35] text-white px-3 py-1.5 text-sm hover:bg-[#0d345e] transition"
        >
          크레딧 1,000개 구매
        </button>
        {hasSubscription && (
          <button
            onClick={() => alert(DEMO_DISABLED_MESSAGE)}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:border-[#c9961a]/60 transition"
          >
            구독 관리
          </button>
        )}
      </div>
      <p className="text-xs text-gray-400">
        데모 버전에서는 실제 결제가 진행되지 않습니다.
      </p>
    </div>
  );
}
