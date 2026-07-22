// 크레딧 추가 구매 팩 정의. 실제 Stripe Price ID는 .env의 STRIPE_PRICE_CREDITS_1000에서 가져온다.
// 팩을 더 추가하려면 여기에 항목을 늘리고, Stripe 대시보드에서 Price를 만든 뒤 .env에 연결하세요.
export const CREDIT_PACKS = [
  {
    key: "credits_1000",
    credits: 1000,
    priceId: process.env.STRIPE_PRICE_CREDITS_1000,
  },
] as const;
