import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

// 로그인/가입 없이 moriva-tools(별도 정적 사이트)에서 바로 호출해 새 연결 코드를
// 발급하는 공개 엔드포인트. saas-starter 계정을 따로 만들 필요 없이, 코드 하나로
// 크롬 확장 프로그램과 moriva-tools를 서로 연결해 쓸 수 있게 하기 위한 것이다.
// 호출될 때마다 이름/이메일 없는 익명 User 행을 하나 만들고 그 행에 딸린
// extensionToken만 돌려준다 — 이후 모든 동기화는 이 토큰으로만 식별된다.
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function generateToken() {
  return "moriva_ext_" + crypto.randomBytes(24).toString("hex");
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST() {
  const token = generateToken();
  const user = await prisma.user.create({
    data: { extensionToken: token },
    select: { extensionToken: true },
  });

  return NextResponse.json({ ok: true, token: user.extensionToken }, { status: 200, headers: CORS_HEADERS });
}
