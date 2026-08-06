import Link from "next/link";
import { DEMO_USER, DEMO_PLAN } from "@/lib/demo";
import { DemoChatWidget } from "./chat-widget";

const QUICK_LINKS = [
  {
    href: "/demo/studio",
    title: "MORIVA 쿠팡 콘텐츠 스튜디오",
    desc: "제품/경쟁사/리뷰 이미지로 쿠팡 썸네일·상세페이지 프롬프트 생성",
    icon: "🎨",
  },
  {
    href: "/demo/tools",
    title: "도구 모음",
    desc: "상품명 생성기, 가격 세팅, 상세페이지 미리보기, KC 표시사항 내비게이터",
    icon: "🧰",
  },
  {
    href: "/demo/credits",
    title: "크레딧 내역",
    desc: "충전/사용 내역을 확인하세요",
    icon: "💳",
  },
  {
    href: "/demo/billing",
    title: "구독 / 업그레이드",
    desc: "플랜을 변경하거나 크레딧을 추가 구매하세요",
    icon: "⭐",
  },
];

// 실제 대시보드(src/app/(app)/dashboard/page.tsx)와 동일한 화면 구성을 로그인/DB 없이 보여준다.
export default function DemoDashboardPage() {
  const user = DEMO_USER;
  const subscription = DEMO_PLAN;

  return (
    <div className="flex flex-col gap-8 px-6 py-10 max-w-3xl mx-auto">
      <div>
        <h1 className="text-xl font-semibold text-[#071a35]">
          안녕하세요, {user.name} 님
        </h1>
        <p className="text-sm text-gray-500 mt-1">{user.email}</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-xs text-gray-400">보유 크레딧</p>
          <p className="mt-1 text-2xl font-bold text-[#071a35]">
            {user.creditBalance.toLocaleString("ko-KR")}
          </p>
          <Link href="/demo/billing" className="mt-3 inline-block text-xs text-[#c9961a] font-medium hover:underline">
            크레딧 충전하기 →
          </Link>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-xs text-gray-400">현재 플랜</p>
          <p className="mt-1 text-2xl font-bold text-[#071a35]">{subscription.name}</p>
          <p className="mt-1 text-xs text-gray-500">
            {subscription.status}
            {subscription.cancelAtPeriodEnd ? " · 만료 예정" : ""}
          </p>
          <Link href="/demo/billing" className="mt-3 inline-block text-xs text-[#c9961a] font-medium hover:underline">
            구독 관리 →
          </Link>
        </div>
      </div>

      {/* Quick links */}
      <div className="flex flex-col gap-3">
        {QUICK_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-xl border border-gray-200 bg-white p-4 flex items-center gap-4 hover:border-[#c9961a]/50 transition"
          >
            <span className="text-2xl">{link.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#071a35]">{link.title}</p>
              <p className="text-xs text-gray-500">{link.desc}</p>
            </div>
            <span className="text-sm text-gray-400">열기 →</span>
          </Link>
        ))}
      </div>

      {/* AI chat demo */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <p className="text-sm font-medium text-[#071a35] mb-3">AI 챗봇 체험 (크레딧 차감 데모)</p>
        <DemoChatWidget initialBalance={user.creditBalance} />
      </div>
    </div>
  );
}
