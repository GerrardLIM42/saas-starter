import { NextResponse } from "next/server";
import crypto from "crypto";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function generateToken() {
  return "moriva_ext_" + crypto.randomBytes(24).toString("hex");
}

// 현재 연결 코드 조회 (없으면 새로 발급)
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { extensionToken: true },
  });

  if (user.extensionToken) {
    return NextResponse.json({ token: user.extensionToken });
  }

  const token = generateToken();
  await prisma.user.update({ where: { id: session.user.id }, data: { extensionToken: token } });
  return NextResponse.json({ token });
}

// 연결 코드 재발급 (기존 코드는 즉시 무효화됨)
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const token = generateToken();
  await prisma.user.update({ where: { id: session.user.id }, data: { extensionToken: token } });
  return NextResponse.json({ token });
}
