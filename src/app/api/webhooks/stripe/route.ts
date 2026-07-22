import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { grantCredits } from "@/lib/credits";
import { CreditReason, SubscriptionStatus, BillingInterval } from "@prisma/client";

// 이 라우트는 반드시 Stripe CLI(`stripe listen --forward-to localhost:3000/api/webhooks/stripe`)
// 또는 대시보드 Webhook 설정을 통해서만 호출되어야 한다. signature 검증 없이는 절대 신뢰하지 않는다.
export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "signature missing" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Stripe webhook signature verification failed", err);
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    // 구독 결제 성공(최초 결제 + 매 갱신 결제) → 해당 주기의 크레딧 지급
    // 최초 결제분도 여기서만 지급한다(checkout.session.completed에서는 지급하지 않음 —
    // 두 이벤트가 겹칠 경우 크레딧이 중복 지급되는 것을 막기 위함).
    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = invoice.subscription as string | null;
      if (subscriptionId) {
        await handleSubscriptionRenewed(subscriptionId);
      }
      break;
    }

    // 구독 상태 변경(플랜 변경, 취소 예약 등) → 로컬 Subscription 레코드 동기화
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await syncSubscriptionStatus(subscription);
      break;
    }

    // Checkout 완료: 결제 모드에 따라 분기
    // - "payment": 크레딧 추가 구매
    // - "subscription": 구독 시작 → 로컬 Subscription 레코드 생성 (크레딧 지급은 invoice.paid에서)
    case "checkout.session.completed": {
      const checkoutSession = event.data.object as Stripe.Checkout.Session;
      if (checkoutSession.mode === "payment") {
        await handleCreditPackPurchase(checkoutSession);
      } else if (checkoutSession.mode === "subscription") {
        await handleSubscriptionCheckoutCompleted(checkoutSession);
      }
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}

async function handleSubscriptionRenewed(stripeSubscriptionId: string) {
  const localSub = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId },
    include: { plan: true },
  });
  if (!localSub) return; // 아직 checkout.session.completed 처리로 생성되지 않은 경우 (레이스 컨디션)

  await grantCredits({
    userId: localSub.userId,
    amount: localSub.plan.monthlyCredits,
    reason: CreditReason.SUBSCRIPTION_GRANT,
    metadata: { subscriptionId: stripeSubscriptionId },
  });
}

async function syncSubscriptionStatus(subscription: Stripe.Subscription) {
  const statusMap: Record<string, SubscriptionStatus> = {
    active: SubscriptionStatus.ACTIVE,
    trialing: SubscriptionStatus.TRIALING,
    past_due: SubscriptionStatus.PAST_DUE,
    canceled: SubscriptionStatus.CANCELED,
    incomplete: SubscriptionStatus.INCOMPLETE,
  };

  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: statusMap[subscription.status] ?? SubscriptionStatus.INCOMPLETE,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    },
  });
}

async function handleCreditPackPurchase(checkoutSession: Stripe.Checkout.Session) {
  const userId = checkoutSession.metadata?.userId;
  const creditAmount = Number(checkoutSession.metadata?.creditAmount ?? 0);
  if (!userId || !creditAmount) return;

  await grantCredits({
    userId,
    amount: creditAmount,
    reason: CreditReason.PURCHASE,
    metadata: { checkoutSessionId: checkoutSession.id },
  });
}

async function handleSubscriptionCheckoutCompleted(checkoutSession: Stripe.Checkout.Session) {
  const userId = checkoutSession.metadata?.userId;
  const planId = checkoutSession.metadata?.planId;
  const interval = checkoutSession.metadata?.interval as "monthly" | "yearly" | undefined;
  const stripeSubscriptionId = checkoutSession.subscription as string | null;
  const stripeCustomerId = checkoutSession.customer as string | null;

  if (!userId || !planId || !interval || !stripeSubscriptionId || !stripeCustomerId) return;

  const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);

  await prisma.subscription.upsert({
    where: { stripeSubscriptionId },
    update: {
      status: SubscriptionStatus.ACTIVE,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
    create: {
      userId,
      planId,
      interval: interval === "monthly" ? BillingInterval.MONTHLY : BillingInterval.YEARLY,
      status: SubscriptionStatus.ACTIVE,
      stripeCustomerId,
      stripeSubscriptionId,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    },
  });
}
