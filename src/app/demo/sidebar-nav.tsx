"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { TOOLS, type ToolDef } from "@/app/(app)/tools/tools-data";
import { getOrderedTools, TOOL_ORDER_EVENT } from "@/app/(app)/tools/tool-order";

const NAV_ITEMS = [
  { href: "/demo/dashboard", label: "대시보드", icon: "🏠" },
  { href: "/demo/studio", label: "스튜디오", icon: "🎨" },
  { href: "/demo/credits", label: "크레딧", icon: "💳" },
  { href: "/demo/billing", label: "구독", icon: "⭐" },
  { href: "/demo/settings", label: "설정", icon: "⚙️" },
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

// 실제 앱의 SidebarNav(src/app/(app)/sidebar-nav.tsx)를 데모 경로(/demo/...)용으로 그대로 복제한 것.
// 원본 파일은 건드리지 않고 별도의 데모 셸에서만 사용한다.
export function DemoSidebarNav() {
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
        href="/demo/tools"
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
        <NavLink key={tool.slug} href={`/demo/tools/${tool.slug}`} label={tool.navLabel} icon={tool.icon} />
      ))}
    </nav>
  );
}
