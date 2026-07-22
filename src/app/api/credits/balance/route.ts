import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getCreditBalance } from "@/lib/credits";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const balance = await getCreditBalance(session.user.id);
  return NextResponse.json({ balance });
}
