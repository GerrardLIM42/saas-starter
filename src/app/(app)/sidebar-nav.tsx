"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", label: "대시보드", icon: "🏠" },
  { href: "/studio", label: "스튜디오", icon: "🎨" },
  { href: "/credits", label: "크레딧", icon: "💳" },
  { href: "/billing", label: "구독", icon: "⭐" },
  { href: "/settings", label: "설정", icon: "⚙️" },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 px-3">
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              active
                ? "bg-[#c9961a]/15 text-[#c9961a]"
                : "text-white/60 hover:bg-white/5 hover:text-white"
            }`}
          >
            <span aria-hidden>{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
