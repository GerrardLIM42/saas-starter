import "../../(app)/studio/studio.css";

// 실제 스튜디오(src/app/(app)/studio/layout.tsx)와 동일하게 전용 CSS 스코프만 적용한다.
export default function DemoStudioLayout({ children }: { children: React.ReactNode }) {
  return <div className="studio-scope">{children}</div>;
}
