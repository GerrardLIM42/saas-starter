"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { TOOLS, type ToolDef } from "@/app/(app)/tools/tools-data";
import { getOrderedTools, saveToolOrder } from "@/app/(app)/tools/tool-order";

// 실제 도구 목록 페이지(src/app/(app)/tools/page.tsx)와 동일하지만,
// 카드의 "열기" 링크만 데모 경로(/demo/tools/...)를 가리키도록 복제한 버전.
export default function DemoToolsIndexPage() {
  const [tools, setTools] = useState<ToolDef[]>(TOOLS);
  const [dragSlug, setDragSlug] = useState<string | null>(null);

  useEffect(() => {
    setTools(getOrderedTools());
  }, []);

  function persist(next: ToolDef[]) {
    setTools(next);
    saveToolOrder(next.map((t) => t.slug));
  }

  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= tools.length) return;
    const next = [...tools];
    [next[index], next[target]] = [next[target], next[index]];
    persist(next);
  }

  function handleDrop(targetSlug: string) {
    if (!dragSlug || dragSlug === targetSlug) return;
    const next = [...tools];
    const fromIdx = next.findIndex((t) => t.slug === dragSlug);
    const toIdx = next.findIndex((t) => t.slug === targetSlug);
    if (fromIdx === -1 || toIdx === -1) return;
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    persist(next);
    setDragSlug(null);
  }

  return (
    <div className="flex flex-col gap-6 px-6 py-10 max-w-3xl mx-auto">
      <div>
        <h1 className="text-xl font-semibold text-[#071a35]">도구</h1>
        <p className="text-sm text-gray-500 mt-1">
          쿠팡 셀러 업무에 바로 쓸 수 있는 보조 도구 모음입니다. 카드를 드래그하거나 화살표 버튼으로 순서를 바꿀 수 있어요.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {tools.map((tool, index) => (
          <div
            key={tool.slug}
            draggable
            onDragStart={() => setDragSlug(tool.slug)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(tool.slug)}
            onDragEnd={() => setDragSlug(null)}
            className={`rounded-xl border bg-white p-3 flex items-center gap-3 transition ${
              dragSlug === tool.slug ? "opacity-40 border-[#c9961a]" : "border-gray-200"
            }`}
          >
            <span
              className="cursor-grab select-none text-gray-300 text-lg leading-none px-1"
              title="드래그해서 순서 변경"
              aria-hidden
            >
              ⠿
            </span>
            <div className="flex flex-col">
              <button
                type="button"
                onClick={() => move(index, -1)}
                disabled={index === 0}
                className="text-gray-400 hover:text-[#071a35] disabled:opacity-20 disabled:hover:text-gray-400 leading-none text-xs px-1 py-0.5"
                aria-label={`${tool.title} 위로 이동`}
              >
                ▲
              </button>
              <button
                type="button"
                onClick={() => move(index, 1)}
                disabled={index === tools.length - 1}
                className="text-gray-400 hover:text-[#071a35] disabled:opacity-20 disabled:hover:text-gray-400 leading-none text-xs px-1 py-0.5"
                aria-label={`${tool.title} 아래로 이동`}
              >
                ▼
              </button>
            </div>
            <Link
              href={`/demo/tools/${tool.slug}`}
              className="flex-1 min-w-0 flex items-center gap-4 py-1 hover:opacity-80 transition"
            >
              <span className="text-2xl">{tool.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#071a35]">{tool.title}</p>
                <p className="text-xs text-gray-500">{tool.desc}</p>
              </div>
              <span className="text-sm text-gray-400 whitespace-nowrap">열기 →</span>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
