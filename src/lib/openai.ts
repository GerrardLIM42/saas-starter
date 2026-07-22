import OpenAI from "openai";

// OPENAI_API_KEY가 아직 설정되지 않았어도 빌드/다른 페이지가 전부 죽지 않도록
// 더미 값으로 폴백한다. 실제 채팅 라우트를 호출할 때만 OpenAI가 인증 오류를
// 반환하며, 그 경우는 해당 API 라우트 자체에서 처리된다.
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "sk-not-configured",
});

// 모델별 "1,000 토큰당 크레딧" 환산 비율. OpenAI 원가 + 마진을 고려해 직접 책정한다.
// 실제 운영 시에는 OpenAI 공식 가격표를 기준으로 주기적으로 재계산해야 한다.
export const MODEL_CREDIT_RATE: Record<string, number> = {
  "gpt-4o-mini": 1,
  "gpt-4o": 10,
};

export const DEFAULT_MODEL = "gpt-4o-mini";

// 실제 사용된 토큰(usage)을 기준으로 차감할 크레딧을 계산한다.
// 호출 "전" 예상치가 아니라 호출 "후" 실사용량으로 정산하는 것이 원칙.
export function calculateCreditCost(model: string, totalTokens: number): number {
  const rate = MODEL_CREDIT_RATE[model] ?? MODEL_CREDIT_RATE[DEFAULT_MODEL];
  return Math.max(1, Math.ceil((totalTokens / 1000) * rate));
}
