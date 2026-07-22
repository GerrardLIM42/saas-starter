import { CreditReason, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * 크레딧 관련 로직은 반드시 이 파일을 통해서만 수행한다.
 * - 원천 데이터는 CreditLedger(append-only)
 * - User.creditBalance는 조회 성능을 위한 캐시이며 항상 같은 트랜잭션에서 갱신
 */

export class InsufficientCreditsError extends Error {
  constructor() {
    super("크레딧이 부족합니다.");
    this.name = "InsufficientCreditsError";
  }
}

// 크레딧 지급 (구독 갱신, 추가 구매, 관리자 조정, 환불 등)
export async function grantCredits(params: {
  userId: string;
  amount: number; // 양수
  reason: CreditReason;
  metadata?: Prisma.InputJsonValue;
}) {
  const { userId, amount, reason, metadata } = params;
  if (amount <= 0) throw new Error("amount는 0보다 커야 합니다.");

  return prisma.$transaction(async (tx) => {
    await tx.creditLedger.create({
      data: { userId, delta: amount, reason, metadata },
    });
    return tx.user.update({
      where: { id: userId },
      data: { creditBalance: { increment: amount } },
    });
  });
}

// 크레딧 차감 (OpenAI 호출 등 실제 사용량 발생 시).
// 잔액이 부족하면 InsufficientCreditsError를 던지고 아무것도 기록하지 않는다.
export async function deductCredits(params: {
  userId: string;
  amount: number; // 양수
  reason?: CreditReason;
  metadata?: Prisma.InputJsonValue;
}) {
  const { userId, amount, reason = CreditReason.USAGE, metadata } = params;
  if (amount <= 0) throw new Error("amount는 0보다 커야 합니다.");

  return prisma.$transaction(async (tx) => {
    // 동시 요청 경합 방지를 위해 조건부 update로 원자적 차감 시도
    const result = await tx.user.updateMany({
      where: { id: userId, creditBalance: { gte: amount } },
      data: { creditBalance: { decrement: amount } },
    });

    if (result.count === 0) {
      throw new InsufficientCreditsError();
    }

    await tx.creditLedger.create({
      data: { userId, delta: -amount, reason, metadata },
    });

    return tx.user.findUniqueOrThrow({ where: { id: userId } });
  });
}

export async function getCreditBalance(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { creditBalance: true },
  });
  return user.creditBalance;
}
