import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

// 크롬 확장 프로그램(chrome-extension://...)에서 직접 호출하는 공개 엔드포인트.
// 로그인 세션 쿠키를 쓸 수 없으므로, 웹사이트 설정 페이지에서 발급한 토큰으로만 인증한다.
// 확장 프로그램 페이지에서의 fetch는 일반 웹페이지와 동일하게 CORS 규칙을 적용받으므로
// 응답에 Access-Control-Allow-* 헤더를 직접 붙여준다. 토큰 방식이라 쿠키를 쓰지 않으므로
// origin을 "*"로 열어도 안전하다.
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const schema = z.object({ token: z.string().min(1) });

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, reason: "invalid" },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const user = await prisma.user.findUnique({
    where: { extensionToken: parsed.data.token },
    select: {
      name: true,
      creditBalance: true,
      subscriptions: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { plan: true },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ ok: false, reason: "invalid" }, { status: 200, headers: CORS_HEADERS });
  }

  const subscription = user.subscriptions[0];
  const hasActiveSubscription =
    !!subscription && (subscription.status === "ACTIVE" || subscription.status === "TRIALING");
  const entitled = hasActiveSubscription || user.creditBalance > 0;

  if (!entitled) {
    return NextResponse.json(
      { ok: false, reason: "inactive", creditBalance: user.creditBalance },
      { status: 200, headers: CORS_HEADERS }
    );
  }

  return NextResponse.json(
    {
      ok: true,
      name: user.name,
      plan: subscription?.plan.name ?? "Free",
      creditBalance: user.creditBalance,
    },
    { status: 200, headers: CORS_HEADERS }
  );
}
