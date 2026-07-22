import { redirect } from "next/navigation";
import Link from "next/link";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ChatWidget } from "./chat-widget";
import { BillingActions } from "./billing-actions";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/signin");
  }

  const { checkout } = await searchParams;

  const [user, subscription] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: session.user.id },
      select: { name: true, email: true, creditBalance: true },
    }),
    prisma.subscription.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: { plan: true },
    }),
  ]);

  return (
    <main className="flex-1 flex flex-col items-center gap-8 px-4 py-12">
      <div className="w-full max-w-lg flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{user.name ?? user.email}</h1>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button className="text-sm underline text-gray-500">로그아웃</button>
        </form>
      </div>

      {checkout === "success" && (
        <div className="w-full max-w-lg rounded-md bg-green-50 text-green-700 text-sm px-4 py-2">
          결제가 완료되었습니다. 웹훅 처리 후 크레딧/구독 상태가 반영됩니다.
        </div>
      )}
      {checkout === "cancelled" && (
        <div className="w-full max-w-lg rounded-md bg-gray-100 text-gray-600 text-sm px-4 py-2">
          결제가 취소되었습니다.
        </div>
      )}

      {subscription && (
        <div className="w-full max-w-lg text-sm text-gray-500">
          현재 플랜: <span className="font-medium text-gray-700">{subscription.plan.name}</span>{" "}
          ({subscription.status}
          {subscription.cancelAtPeriodEnd ? ", 만료 예정" : ""})
        </div>
      )}

      <BillingActions hasSubscription={!!subscription} />

      <Link
        href="/studio"
        className="w-full max-w-lg rounded-xl border border-gray-200 p-4 flex items-center justify-between hover:border-gray-400 transition"
      >
        <div>
          <p className="text-sm font-medium">MORIVA 쿠팡 콘텐츠 스튜디오</p>
          <p className="text-xs text-gray-500">제품/경쟁사/리뷰 이미지로 쿠팡 썸네일·상세페이지 프롬프트 생성</p>
        </div>
        <span className="text-sm text-gray-400">열기 →</span>
      </Link>

      <ChatWidget initialBalance={user.creditBalance} />
    </main>
  );
}
