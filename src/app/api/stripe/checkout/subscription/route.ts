import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  planKey: z.string(),
  interval: z.enum(["monthly", "yearly"]),
});

// 구독(월간/연간) 결제를 위한 Stripe Checkout Session 생성
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { planKey, interval } = parsed.data;

  const plan = await prisma.plan.findUnique({ where: { key: planKey } });
  if (!plan) {
    return NextResponse.json({ error: "존재하지 않는 플랜입니다." }, { status: 404 });
  }

  const priceId =
    interval === "monthly" ? plan.stripePriceIdMonthly : plan.stripePriceIdYearly;
  if (!priceId) {
    return NextResponse.json(
      { error: "이 플랜의 Stripe Price가 아직 설정되지 않았습니다. .env를 확인하세요." },
      { status: 400 }
    );
  }

  const origin = req.headers.get("origin") ?? process.env.AUTH_URL ?? "http://localhost:3000";

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: session.user.email ?? undefined,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/dashboard?checkout=success`,
    cancel_url: `${origin}/dashboard?checkout=cancelled`,
    // metadata는 checkout.session.completed에서, subscription_data.metadata는
    // customer.subscription.* 이벤트에서 각각 참조하기 위해 둘 다 채워둔다.
    metadata: {
      userId: session.user.id,
      planId: plan.id,
      interval,
    },
    subscription_data: {
      metadata: {
        userId: session.user.id,
        planId: plan.id,
        interval,
      },
    },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
