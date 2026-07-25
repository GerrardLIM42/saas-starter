import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SidebarNav } from "./sidebar-nav";

// 로그인한 사용자만 볼 수 있는 영역 전체(대시보드/스튜디오/크레딧/구독/설정)의 공통 셸.
// 좌측 사이드바에서 기능을 선택하고, 우측에 각 페이지 내용이 표시된다.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/signin");
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { name: true, email: true, creditBalance: true },
  });

  return (
    <div className="min-h-screen w-full flex bg-[#f4f6f7]">
      {/* Sidebar
          h-screen + overflow-hidden으로 사이드바 자체를 뷰포트 높이에 고정하고,
          내비게이션 목록만 자체 스크롤(overflow-y-auto)되게 분리했다.
          예전에는 도구 목록이 늘어나 사이드바 내용이 뷰포트보다 길어지면
          그 넘친 만큼 문서 전체가 스크롤돼서, 페이지를 스크롤할 때 사이드바와
          본문이 함께 움직이는 것처럼 보였다(사이드바가 자체 스크롤 영역이 아니었음). */}
      <aside className="hidden sm:flex w-60 flex-shrink-0 flex-col bg-[#071a35] text-white sticky top-0 h-screen overflow-hidden">
        <div className="flex flex-col gap-6 pt-6 flex-1 min-h-0 overflow-y-auto">
          <Link href="/dashboard" className="flex items-center gap-2 px-4">
            <span className="flex items-center justify-center rounded-md bg-white p-1">
              <Image src="/moriva-favicon.png" alt="MORIVA" width={22} height={22} />
            </span>
            <span className="font-bold tracking-wide">MORIVA</span>
          </Link>
          <SidebarNav />
        </div>

        <div className="flex flex-col gap-3 px-4 py-5 border-t border-white/10 flex-shrink-0">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-white/40">{user.email}</span>
            <span className="text-sm font-medium text-[#c9961a]">
              보유 크레딧 {user.creditBalance.toLocaleString("ko-KR")}
            </span>
          </div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button className="w-full text-left text-xs text-white/50 hover:text-white transition">
              로그아웃
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile top bar (sidebar hidden below sm) */}
      <div className="sm:hidden fixed top-0 inset-x-0 z-30 flex items-center justify-between bg-[#071a35] text-white px-4 py-3">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="flex items-center justify-center rounded bg-white p-0.5">
            <Image src="/moriva-favicon.png" alt="MORIVA" width={18} height={18} />
          </span>
          <span className="font-bold text-sm">MORIVA</span>
        </Link>
        <span className="text-xs text-[#c9961a]">크레딧 {user.creditBalance}</span>
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0 sm:pt-0 pt-14">
        <main className="min-h-screen">{children}</main>
      </div>
    </div>
  );
}
