import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { DEMO_USER } from "@/lib/demo";
import { DemoSidebarNav } from "./sidebar-nav";
import { ServiceWorkerRegister } from "@/app/sw-register";

// 이 metadata는 /demo 하위 경로에서만 루트 레이아웃 값 위에 병합 적용된다.
// 실제 서비스 페이지(루트 레이아웃)는 전혀 수정하지 않는다.
export const metadata: Metadata = {
  title: "MORIVA 데모 — 로그인 없이 화면 구성 둘러보기",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "MORIVA 데모",
    statusBarStyle: "black-translucent",
  },
};

// 실제 앱 셸(src/app/(app)/layout.tsx)과 같은 느낌의 화면 구성을 로그인/DB 없이 보여주는
// 완전히 독립된 데모 전용 레이아웃. 이 파일 트리 밖의 기존 앱 코드는 건드리지 않는다.
export default function DemoLayout({ children }: { children: React.ReactNode }) {
  const user = DEMO_USER;

  return (
    <div className="min-h-screen w-full flex bg-[#f4f6f7]">
      <ServiceWorkerRegister />
      <div className="fixed top-0 inset-x-0 z-40 h-8 flex items-center justify-center gap-2 bg-[#c9961a] text-[#071a35] text-xs font-medium px-4 text-center">
        <span>데모 버전 — 화면 구성만 확인할 수 있으며 저장·결제·AI 기능은 실제로 동작하지 않습니다.</span>
        <Link href="/" className="underline shrink-0">데모 종료</Link>
      </div>

      {/* Sidebar */}
      <aside className="hidden sm:flex w-60 flex-shrink-0 flex-col justify-between bg-[#071a35] text-white sticky top-8 h-[calc(100vh-2rem)]">
        <div className="flex flex-col gap-6 pt-6">
          <Link href="/demo/dashboard" className="flex items-center gap-2 px-4">
            <span className="flex items-center justify-center rounded-md bg-white p-1">
              <Image src="/moriva-favicon.png" alt="MORIVA" width={22} height={22} />
            </span>
            <span className="font-bold tracking-wide">MORIVA</span>
          </Link>
          <DemoSidebarNav />
        </div>

        <div className="flex flex-col gap-3 px-4 py-5 border-t border-white/10">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-white/40">{user.email}</span>
            <span className="text-sm font-medium text-[#c9961a]">
              보유 크레딧 {user.creditBalance.toLocaleString("ko-KR")}
            </span>
          </div>
          <Link href="/" className="text-left text-xs text-white/50 hover:text-white transition">
            데모 종료
          </Link>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="sm:hidden fixed inset-x-0 top-8 z-30 flex items-center justify-between bg-[#071a35] text-white px-4 py-3">
        <Link href="/demo/dashboard" className="flex items-center gap-2">
          <span className="flex items-center justify-center rounded bg-white p-0.5">
            <Image src="/moriva-favicon.png" alt="MORIVA" width={18} height={18} />
          </span>
          <span className="font-bold text-sm">MORIVA</span>
        </Link>
        <span className="text-xs text-[#c9961a]">크레딧 {user.creditBalance}</span>
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0 pt-[5.5rem] sm:pt-8">
        <main className="min-h-screen">{children}</main>
      </div>
    </div>
  );
}
