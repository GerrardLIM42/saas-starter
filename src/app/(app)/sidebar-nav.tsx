"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TOOLS } from "./tools/tools-data";

const NAV_ITEMS = [
  { href: "/dashboard", label: "대시보드", icon: "🏠" },
  { href: "/studio", label: "스튜디오", icon: "🎨" },
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
  return (
    <nav className="flex flex-col gap-1 px-3">
      {NAV_ITEMS.map((item) => (
        <NavLink key={item.href} {...item} />
      ))}

      <p className="mt-4 mb-1 px-3 text-[10px] font-semibold tracking-wider text-white/30">
        도구
      </p>
      {TOOLS.map((tool) => (
        <NavLink key={tool.slug} href={`/tools/${tool.slug}`} label={tool.navLabel} icon={tool.icon} />
      ))}
    </nav>
  );
}
