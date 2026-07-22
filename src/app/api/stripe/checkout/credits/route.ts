import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { stripe } from "@/lib/stripe";
import { CREDIT_PACKS } from "@/lib/stripe-plans";

const schema = z.object({ packKey: z.string() });

// 크레딧 추가 구매(1회성 결제)를 위한 Stripe Checkout Session 생성
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

  const pack = CREDIT_PACKS.find((p) => p.key === parsed.data.packKey);
  if (!pack || !pack.priceId) {
    return NextResponse.json(
      { error: "이 크레딧 팩의 Stripe Price가 아직 설정되지 않았습니다. .env를 확인하세요." },
      { status: 400 }
    );
  }

  const origin = req.headers.get("origin") ?? process.env.AUTH_URL ?? "http://localhost:3000";

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: session.user.email ?? undefined,
    line_items: [{ price: pack.priceId, quantity: 1 }],
    success_url: `${origin}/billing?checkout=success`,
    cancel_url: `${origin}/billing?checkout=cancelled`,
    metadata: {
      userId: session.user.id,
      creditAmount: String(pack.credits),
    },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
