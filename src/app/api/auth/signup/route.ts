import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { grantCredits } from "@/lib/credits";
import { CreditReason } from "@prisma/client";

const signupSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다."),
});

// 신규 가입 시 지급할 무료 체험 크레딧
const WELCOME_CREDITS = 50;

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "이미 가입된 이메일입니다." },
      { status: 409 }
    );
  }

  const hashed = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: { name, email, password: hashed },
  });

  await grantCredits({
    userId: user.id,
    amount: WELCOME_CREDITS,
    reason: CreditReason.ADJUSTMENT,
    metadata: { type: "welcome_bonus" },
  });

  return NextResponse.json({ id: user.id, email: user.email });
}
