import { notFound } from "next/navigation";
import { TOOLS } from "../tools-data";

export function generateStaticParams() {
  return TOOLS.map((t) => ({ slug: t.slug }));
}

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = TOOLS.find((t) => t.slug === slug);
  if (!tool) notFound();

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
