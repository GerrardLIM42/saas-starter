import { notFound, redirect } from "next/navigation";
import { TOOLS } from "../tools-data";

// internalHref가 있는 도구(서버 API가 필요해 실제 Next.js 라우트로 동작하는 도구)는
// 정적 iframe 페이지를 만들 필요가 없다 — 그 라우트 자체가 이미 실제 페이지이기 때문에
// generateStaticParams에서도 제외한다.
export function generateStaticParams() {
  return TOOLS.filter((t) => t.file).map((t) => ({ slug: t.slug }));
}

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = TOOLS.find((t) => t.slug === slug);
  if (!tool) notFound();

  // 방어적 처리: internalHref 도구의 slug로 이 동적 라우트가 직접 호출된 경우
  // (보통은 실제 라우트가 우선 매칭되어 여기까지 오지 않는다) 실제 페이지로 보낸다.
  if (tool.internalHref) redirect(tool.internalHref);
  if (!tool.file) notFound();

  return (
    <div className="flex flex-col h-screen">
      <div className="border-b border-gray-200 bg-white px-6 py-3">
        <p className="text-sm font-medium text-[#071a35]">{tool.title}</p>
        <p className="text-xs text-gray-500">{tool.desc}</p>
      </div>
      <iframe
        src={`/tools/${tool.file}`}
        title={tool.title}
        className="flex-1 w-full border-0"
      />
    </div>
  );
}
