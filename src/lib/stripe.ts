import Stripe from "stripe";

// STRIPE_SECRET_KEY가 아직 설정되지 않았어도(예: Stripe 연동 전) 빌드/다른 페이지가
// 전부 죽지 않도록 더미 값으로 폴백한다. 실제 결제 라우트를 호출할 때만 Stripe가
// 인증 오류를 반환하며, 그 경우는 해당 API 라우트 자체에서 처리된다.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_not_configured", {
  apiVersion: "2025-02-24.acacia",
});
