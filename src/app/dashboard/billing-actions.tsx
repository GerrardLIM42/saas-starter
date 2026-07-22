"use client";

import { useState } from "react";

async function startCheckout(path: string, body: object) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    alert(data.error ?? "요청에 실패했습니다.");
    return;
  }
  window.location.href = data.url;
}

export function BillingActions({ hasSubscription }: { hasSubscription: boolean }) {
  const [loading, setLoading] = useState<string | null>(null);

  async function handle(key: string, path: string, body: object) {
    setLoading(key);
    await startCheckout(path, body);
    setLoading(null);
  }

  return (
    <div className="w-full max-w-lg flex flex-col gap-3 border border-gray-200 rounded-xl p-4">
      <p className="text-sm font-medium">구독 / 크레딧 구매 (Stripe 테스트 모드)</p>
      <div className="flex flex-wrap gap-2">
        <button
          disabled={loading !== null}
          onClick={() =>
            handle("pro-monthly", "/api/stripe/checkout/subscription", {
              planKey: "pro",
              interval: "monthly",
            })
          }
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-50"
        >
          {loading === "pro-monthly" ? "이동 중..." : "Pro 월간 구독"}
        </button>
        <button
          disabled={loading !== null}
          onClick={() =>
            handle("pro-yearly", "/api/stripe/checkout/subscription", {
              planKey: "pro",
              interval: "yearly",
            })
          }
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-50"
        >
          {loading === "pro-yearly" ? "이동 중..." : "Pro 연간 구독"}
        </button>
        <button
          disabled={loading !== null}
          onClick={() =>
            handle("credits", "/api/stripe/checkout/credits", {
              packKey: "credits_1000",
            })
          }
          className="rounded-md bg-black text-white px-3 py-1.5 text-sm disabled:opacity-50"
        >
          {loading === "credits" ? "이동 중..." : "크레딧 1,000개 구매"}
        </button>
        {hasSubscription && (
          <button
            disabled={loading !== null}
            onClick={() => handle("portal", "/api/stripe/portal", {})}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-50"
          >
            {loading === "portal" ? "이동 중..." : "구독 관리"}
          </button>
        )}
      </div>
      <p className="text-xs text-gray-400">
        테스트 카드번호: 4242 4242 4242 4242 (아무 미래 날짜 / 아무 CVC)
      </p>
    </div>
  );
}
