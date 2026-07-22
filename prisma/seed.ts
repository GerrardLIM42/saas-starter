import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.plan.upsert({
    where: { key: "free" },
    update: {},
    create: {
      key: "free",
      name: "Free",
      description: "무료 체험 등급",
      monthlyCredits: 0, // 별도 지급 없음 (가입 시 웰컴 크레딧만)
      features: { models: ["gpt-4o-mini"], maxConcurrentRequests: 1 },
    },
  });

  await prisma.plan.upsert({
    where: { key: "pro" },
    update: {},
    create: {
      key: "pro",
      name: "Pro",
      description: "월/연 구독 등급",
      monthlyCredits: 2000,
      stripePriceIdMonthly: process.env.STRIPE_PRICE_PRO_MONTHLY,
      stripePriceIdYearly: process.env.STRIPE_PRICE_PRO_YEARLY,
      features: { models: ["gpt-4o-mini", "gpt-4o"], maxConcurrentRequests: 5 },
    },
  });

  console.log("Seed complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
