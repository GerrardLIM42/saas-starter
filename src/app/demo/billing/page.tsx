import { DEMO_USER, DEMO_PLAN } from "@/lib/demo";
import { DemoBillingActions } from "./billing-actions";

// 실제 구독 페이지(src/app/(app)/billing/page.tsx)와 동일한 화면 구성을 로그인/DB 없이 보여준다.
export default function DemoBillingPage() {
  const user = DEMO_USER;
  const subscription = DEMO_PLAN;

  return (
    <div className="flex flex-col gap-6 px-6 py-10 max-w-2xl mx-auto">
      <div>
        <h1 className="text-xl font-semibold text-[#071a35]">구독 / 업그레이드</h1>
        <p className="text-sm text-gray-500 mt-1">플랜을 관리하고 크레딧을 충전하세요.</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400">현재 플랜</p>
          <p className="text-lg font-bold text-[#071a35]">{subscription.name}</p>
          <p className="text-xs text-gray-500 mt-1">
            {subscription.status}
            {subscription.cancelAtPeriodEnd ? " · 만료 예정" : ""} · 다음 갱신{" "}
            {subscription.currentPeriodEnd.toLocaleDateString("ko-KR")}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">보유 크레딧</p>
          <p className="text-lg font-bold text-[#c9961a]">
            {user.creditBalance.toLocaleString("ko-KR")}
          </p>
        </div>
      </div>

      <DemoBillingActions hasSubscription />
    </div>
  );
}
