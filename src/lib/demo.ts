// 데모 버전(/demo)에서 쓰는 고정 예시 데이터. 로그인/DB 없이 화면 구성만 보여주기 위한 값이며,
// 실제 서비스 코드(로그인, API, DB 조회)는 전혀 건드리지 않는다.
export const DEMO_USER = {
  name: "데모 사용자",
  email: "demo@moriva.app",
  creditBalance: 3200,
  extensionToken: "moriva_ext_demo0000000000000000000000",
};

export const DEMO_PLAN = {
  name: "Pro",
  status: "active",
  cancelAtPeriodEnd: false,
  currentPeriodEnd: new Date(Date.now() + 1000 * 60 * 60 * 24 * 18),
};

export const DEMO_LEDGER = [
  { id: "demo-1", reason: "USAGE", delta: -120, createdAt: new Date(Date.now() - 86400000 * 1) },
  { id: "demo-2", reason: "USAGE", delta: -680, createdAt: new Date(Date.now() - 86400000 * 3) },
  { id: "demo-3", reason: "PURCHASE", delta: 1000, createdAt: new Date(Date.now() - 86400000 * 5) },
  { id: "demo-4", reason: "SUBSCRIPTION_GRANT", delta: 3000, createdAt: new Date(Date.now() - 86400000 * 30) },
];

export const DEMO_DISABLED_MESSAGE = "데모 버전에서는 이 기능이 실제로 동작하지 않습니다.";
