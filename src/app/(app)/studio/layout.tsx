import "./studio.css";

// MORIVA 쿠팡 콘텐츠 스튜디오 (moriva-coupang-studio에서 이식)
// 로그인 확인과 크레딧 표시는 상위 (app)/layout.tsx의 사이드바에서 공통으로 처리하므로
// 여기서는 studio 전용 CSS 스코프만 적용한다.
export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return <div className="studio-scope">{children}</div>;
}
