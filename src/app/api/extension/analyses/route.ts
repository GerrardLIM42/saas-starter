import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 연결 코드로 인증해 동기화된 분석 기록을 읽어오는 공개 엔드포인트.
// moriva-tools(별도의 정적 GitHub Pages 사이트)의 "분석 기록" 페이지에서
// 이 API를 직접 호출해 saas-starter DB에 저장된 분석 결과를 그대로 보여준다.
// verify/sync와 동일하게 토큰 방식이라 CORS를 모두 열어도 안전하다.
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token") || "";
  if (!token) {
    return NextResponse.json({ ok: false, reason: "invalid" }, { status: 400, headers: CORS_HEADERS });
  }

  const user = await prisma.user.findUnique({
    where: { extensionToken: token },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json({ ok: false, reason: "invalid" }, { status: 200, headers: CORS_HEADERS });
  }

  const rows = await prisma.extensionAnalysis.findMany({
    where: { userId: user.id },
    orderBy: { analyzedAt: "desc" },
  });

  const items = rows.map((row) => ({
    id: row.id,
    productUrl: row.productUrl,
    productTitle: row.productTitle,
    reviewCount: row.reviewCount,
    averageRating: row.averageRating,
    estimatedDailySales: row.estimatedDailySales,
    analyzedAt: row.analyzedAt.toISOString(),
    data: row.data,
  }));

  return NextResponse.json({ ok: true, items }, { status: 200, headers: CORS_HEADERS });
}
