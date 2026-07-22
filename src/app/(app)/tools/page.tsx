import Link from "next/link";
import { TOOLS } from "./tools-data";

export default function ToolsIndexPage() {
  return (
    <div className="flex flex-col gap-6 px-6 py-10 max-w-3xl mx-auto">
      <div>
        <h1 className="text-xl font-semibold text-[#071a35]">도구</h1>
        <p className="text-sm text-gray-500 mt-1">
          쿠팡 셀러 업무에 바로 쓸 수 있는 보조 도구 모음입니다.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {TOOLS.map((tool) => (
          <Link
            key={tool.slug}
            href={`/tools/${tool.slug}`}
            className="rounded-xl border border-gray-200 bg-white p-4 flex items-center gap-4 hover:border-[#c9961a]/50 transition"
          >
            <span className="text-2xl">{tool.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#071a35]">{tool.title}</p>
              <p className="text-xs text-gray-500">{tool.desc}</p>
            </div>
            <span className="text-sm text-gray-400">열기 →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
