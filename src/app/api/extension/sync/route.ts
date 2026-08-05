import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// 크롬 확장 프로그램(MORIVA 쿠팡 리뷰 분석기)에서 리뷰 분석이 끝날 때마다 호출하는
// 공개 엔드포인트. 로그인 세션 쿠키를 쓸 수 없으므로 설정 페이지에서 발급한
// 연결 코드(extensionToken)로만 인증한다. verify와 동일하게 CORS를 모두 열어둔다
// (토큰 방식이라 쿠키를 쓰지 않으므로 origin을 "*"로 열어도 안전하다).
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const schema = z.object({
  token: z.string().min(1),
  productUrl: z.string().min(1),
  productTitle: z.string().optional().nullable(),
  reviewCount: z.number().optional().default(0),
  averageRating: z.number().optional().default(0),
  estimatedDailySales: z.number().optional().nullable(),
  analyzedAt: z.string().optional(),
  // 확장 프로그램의 원본 payload / analytics.js 분석 결과. 형태가 자주 바뀔 수 있어
  // 느슨하게 받아서 그대로 저장한다.
  payload: z.record(z.string(), z.unknown()).optional().default({}),
  analysis: z.record(z.string(), z.unknown()).optional().default({}),
});

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, reason: "invalid", issues: parsed.error.issues.map((i) => i.message) },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const user = await prisma.user.findUnique({
    where: { extensionToken: parsed.data.token },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json({ ok: false, reason: "invalid" }, { status: 200, headers: CORS_HEADERS });
  }

  const analyzedAt = parsed.data.analyzedAt ? new Date(parsed.data.analyzedAt) : new Date();

  const saved = await prisma.extensionAnalysis.upsert({
    where: { userId_productUrl: { userId: user.id, productUrl: parsed.data.productUrl } },
    create: {
      userId: user.id,
      productUrl: parsed.data.productUrl,
      productTitle: parsed.data.productTitle ?? null,
      reviewCount: parsed.data.reviewCount,
      averageRating: parsed.data.averageRating,
      estimatedDailySales: parsed.data.estimatedDailySales ?? null,
      analyzedAt: Number.isNaN(analyzedAt.getTime()) ? new Date() : analyzedAt,
      data: { payload: parsed.data.payload, analysis: parsed.data.analysis } as Prisma.InputJsonValue,
    },
    update: {
      productTitle: parsed.data.productTitle ?? null,
      reviewCount: parsed.data.reviewCount,
      averageRating: parsed.data.averageRating,
      estimatedDailySales: parsed.data.estimatedDailySales ?? null,
      analyzedAt: Number.isNaN(analyzedAt.getTime()) ? new Date() : analyzedAt,
      data: { payload: parsed.data.payload, analysis: parsed.data.analysis } as Prisma.InputJsonValue,
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, id: saved.id }, { status: 200, headers: CORS_HEADERS });
}
