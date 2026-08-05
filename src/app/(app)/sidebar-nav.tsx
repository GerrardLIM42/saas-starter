"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { TOOLS, type ToolDef } from "./tools/tools-data";
import { getOrderedTools, TOOL_ORDER_EVENT } from "./tools/tool-order";

const NAV_ITEMS = [
  { href: "/dashboard", label: "대시보드", icon: "🏠" },
  { href: "/studio", label: "스튜디오", icon: "🎨" },
  { href: "/analyses", label: "분석 기록", icon: "📊" },
  { href: "/credits", label: "크레딧", icon: "💳" },
  { href: "/billing", label: "구독", icon: "⭐" },
  { href: "/settings", label: "설정", icon: "⚙️" },
];

function NavLink({ href, label, icon }: { href: string; label: string; icon: string }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + "/");
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
        active
          ? "bg-[#c9961a]/15 text-[#c9961a]"
          : "text-white/60 hover:bg-white/5 hover:text-white"
      }`}
    >
      <span aria-hidden>{icon}</span>
      {label}
    </Link>
  );
}

export function SidebarNav() {
  // /tools 페이지에서 사용자가 순서를 바꾸면 이 사이드바에도 즉시 반영되도록
  // localStorage + 커스텀 이벤트로 동기화한다. 서버 렌더링 시점엔 항상 기본 순서(TOOLS)를
  // 사용해 하이드레이션이 어긋나지 않게 하고, 마운트 후에만 저장된 순서로 갱신한다.
  const [tools, setTools] = useState<ToolDef[]>(TOOLS);

  useEffect(() => {
    const sync = () => setTools(getOrderedTools());
    sync();
    window.addEventListener(TOOL_ORDER_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(TOOL_ORDER_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return (
    <nav className="flex flex-col gap-1 px-3">
      {NAV_ITEMS.map((item) => (
        <NavLink key={item.href} {...item} />
      ))}

      <Link
        href="/tools"
        className="mt-4 mb-1 px-3 flex items-center justify-between group"
      >
        <span className="text-[10px] font-semibold tracking-wider text-white/30 group-hover:text-white/50">
          도구
        </span>
        <span className="text-[9px] text-white/20 group-hover:text-[#c9961a] transition">
          순서 변경 ↗
        </span>
      </Link>
      {tools.map((tool) => (
        <NavLink
          key={tool.slug}
          href={tool.internalHref ?? `/tools/${tool.slug}`}
          label={tool.navLabel}
          icon={tool.icon}
        />
      ))}
    </nav>
  );
}
