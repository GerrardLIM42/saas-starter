export type ToolDef = {
  slug: string;
  file?: string; // public/tools 아래 파일명 (iframe 방식 도구만 사용)
  internalHref?: string; // 서버 API가 필요한 도구는 iframe 대신 실제 Next.js 라우트로 연결
  navLabel: string; // 사이드바에 표시할 짧은 이름
  title: string;
  desc: string;
  icon: string;
};

// 개인 프로젝트에서 만들어둔 독립형(client-side) HTML 도구들을 그대로 이식.
// 각 도구는 자체적으로 사용자의 AI API 키를 입력받아 브라우저에서 직접 호출하므로
// saas-starter의 크레딧 시스템과는 별개로 동작한다 (원본 그대로 iframe에 포함).
export const TOOLS: ToolDef[] = [
  {
    slug: "product-name-generator",
    file: "product-name-generator.html",
    navLabel: "상품명 생성기",
    title: "상품명 생성기",
    desc: "상위노출 상품명 스크린샷을 분석해 5단어 상품명 5가지를 제안합니다.",
    icon: "🏷️",
  },
  {
    slug: "pricing-setter",
    file: "pricing-setter.html",
    navLabel: "가격 세팅 도구",
    title: "로켓그로스 가격 세팅 도구",
    desc: "최종소비자가 기준으로 판매가·즉시할인·다운할인·정상가를 자동 계산합니다.",
    icon: "💰",
  },
  {
    slug: "preview-tool",
    file: "preview-tool.html",
    navLabel: "상세페이지 미리보기",
    title: "쿠팡 상품페이지 미리보기 툴",
    desc: "썸네일·상세페이지 이미지를 실제 쿠팡 화면처럼 모바일/PC로 미리 볼 수 있습니다.",
    icon: "🛒",
  },
  {
    slug: "kc-label-navigator",
    file: "kc-label-navigator.html",
    navLabel: "KC 표시사항 내비게이터",
    title: "KC 표시사항 내비게이터",
    desc: "제품 카테고리에 맞는 KC 인증·표시사항 체크리스트와 라벨 문구를 안내합니다.",
    icon: "📋",
  },
  {
    slug: "margin-calculator",
    file: "margin-calculator.html",
    navLabel: "마진 계산기",
    title: "쿠팡 마진 계산기",
    desc: "중국 직소싱 상품의 수입원가·관부가세·판매비를 반영해 마진율과 적정 판매가를 계산합니다.",
    icon: "🧮",
  },
  {
    slug: "sourcing-manifest",
    file: "sourcing-manifest.html",
    navLabel: "소싱 매니페스트",
    title: "소싱 매니페스트 — 1688 → 쿠팡그로스",
    desc: "1688 사입 후보를 링크·이미지와 함께 등록해 카테고리별 수수료·묶음상품·폴더 단위로 비교 검토합니다.",
    icon: "🗂️",
  },
  {
    slug: "keyword-trends",
    internalHref: "/tools/keyword-trends",
    navLabel: "키워드 분석",
    title: "네이버 키워드 분석",
    desc: "네이버 데이터랩으로 검색어 트렌드·연관 키워드·쇼핑인사이트(연령/성별/기기)를 조회합니다. (본인 네이버 API 키 필요)",
    icon: "🔍",
  },
];
