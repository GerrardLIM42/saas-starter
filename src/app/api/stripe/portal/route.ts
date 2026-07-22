import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

// 기존 구독자가 결제 수단 변경/취소/플랜 변경을 할 수 있는 Stripe Customer Portal 세션 생성
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const subscription = await prisma.subscription.findFirst({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  if (!subscription) {
    return NextResponse.json({ error: "구독 내역이 없습니다." }, { status: 404 });
  }

  const origin = req.headers.get("origin") ?? process.env.AUTH_URL ?? "http://localhost:3000";

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: `${origin}/billing`,
  });

  return NextResponse.json({ url: portalSession.url });
}
