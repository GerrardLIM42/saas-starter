import Link from "next/link";
import { DEMO_USER, DEMO_LEDGER } from "@/lib/demo";

const REASON_LABEL: Record<string, string> = {
  SUBSCRIPTION_GRANT: "구독 지급",
  PURCHASE: "크레딧 구매",
  USAGE: "사용",
  ADJUSTMENT: "조정",
  REFUND: "환불",
};

// 실제 크레딧 페이지(src/app/(app)/credits/page.tsx)와 동일한 화면 구성을 로그인/DB 없이 보여준다.
export default function DemoCreditsPage() {
  const user = DEMO_USER;
  const ledger = DEMO_LEDGER;

  return (
    <div className="flex flex-col gap-6 px-6 py-10 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#071a35]">크레딧</h1>
          <p className="text-sm text-gray-500 mt-1">충전 및 사용 내역입니다. (데모 예시 데이터)</p>
        </div>
        <Link
          href="/demo/billing"
          className="rounded-md bg-[#c9961a] text-[#071a35] px-4 py-2 text-sm font-semibold hover:brightness-110 transition whitespace-nowrap"
        >
          충전하기
        </Link>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <p className="text-xs text-gray-400">현재 보유 크레딧</p>
        <p className="text-3xl font-bold text-[#071a35] mt-1">
          {user.creditBalance.toLocaleString("ko-KR")}
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs text-gray-400">
              <th className="px-4 py-3 font-medium">날짜</th>
              <th className="px-4 py-3 font-medium">사유</th>
              <th className="px-4 py-3 font-medium text-right">변동</th>
            </tr>
          </thead>
          <tbody>
            {ledger.map((row) => (
              <tr key={row.id} className="border-b border-gray-50 last:border-0">
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                  {row.createdAt.toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" })}
                </td>
                <td className="px-4 py-3 text-[#071a35]">
                  {REASON_LABEL[row.reason] ?? row.reason}
                </td>
                <td
                  className={`px-4 py-3 text-right font-medium whitespace-nowrap ${
                    row.delta >= 0 ? "text-green-600" : "text-gray-600"
                  }`}
                >
                  {row.delta >= 0 ? "+" : ""}
                  {row.delta.toLocaleString("ko-KR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
