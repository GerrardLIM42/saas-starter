import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { BillingActions } from "./billing-actions";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const session = await auth();
  const userId = session!.user!.id!;
  const { checkout } = await searchParams;

  const [user, subscription] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { creditBalance: true },
    }),
    prisma.subscription.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { plan: true },
    }),
  ]);

  return (
    <div className="flex flex-col gap-6 px-6 py-10 max-w-2xl mx-auto">
      <div>
        <h1 className="text-xl font-semibold text-[#071a35]">구독 / 업그레이드</h1>
        <p className="text-sm text-gray-500 mt-1">플랜을 관리하고 크레딧을 충전하세요.</p>
      </div>

      {checkout === "success" && (
        <div className="rounded-md bg-green-50 text-green-700 text-sm px-4 py-2">
          결제가 완료되었습니다. 웹훅 처리 후 크레딧/구독 상태가 반영됩니다.
        </div>
      )}
      {checkout === "cancelled" && (
        <div className="rounded-md bg-gray-100 text-gray-600 text-sm px-4 py-2">
          결제가 취소되었습니다.
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-5 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400">현재 플랜</p>
          <p className="text-lg font-bold text-[#071a35]">
            {subscription ? subscription.plan.name : "Free"}
          </p>
          {subscription && (
            <p className="text-xs text-gray-500 mt-1">
              {subscription.status}
              {subscription.cancelAtPeriodEnd ? " · 만료 예정" : ""} · 다음 갱신{" "}
              {subscription.currentPeriodEnd.toLocaleDateString("ko-KR")}
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">보유 크레딧</p>
          <p className="text-lg font-bold text-[#c9961a]">
            {user.creditBalance.toLocaleString("ko-KR")}
          </p>
        </div>
      </div>

      <BillingActions hasSubscription={!!subscription} />
    </div>
  );
}
