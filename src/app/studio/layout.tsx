import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import "./studio.css";

// MORIVA 쿠팡 콘텐츠 스튜디오 (moriva-coupang-studio에서 이식)
// 원본은 인증 없이 SITE_ACCESS_PASSWORD 하나로만 접근을 막던 개인용 도구였으나,
// 여기서는 saas-starter의 로그인+크레딧 시스템 뒤로 이동시켰다.
export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/signin?callbackUrl=/studio");
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { creditBalance: true },
  });

  return (
    <div className="studio-scope">
      <div className="flex items-center justify-between px-4 py-2 text-xs text-white bg-black/80">
        <Link href="/dashboard" className="underline">
          ← 대시보드로
        </Link>
        <span>보유 크레딧: {user.creditBalance}</span>
      </div>
      {children}
    </div>
  );
}
