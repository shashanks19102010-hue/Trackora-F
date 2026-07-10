"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Map, Users, Smartphone, Bell, BarChart3, Settings, Sparkles, UserCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/layout/logo";

const NAV_ITEMS = [
  { href: "/map", label: "Map", icon: Map },
  { href: "/people", label: "People", icon: Users },
  { href: "/devices", label: "Devices", icon: Smartphone },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/assistant", label: "ORI", icon: Sparkles },
  { href: "/avatar", label: "Avatar", icon: UserCircle2 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-card/60 backdrop-blur-xl md:flex">
      <div className="flex h-16 items-center gap-2 px-6">
        <Logo size={22} />
        <span className="font-display text-lg font-semibold tracking-tight">TRACKORA</span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname?.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors focus-ring",
                active ? "text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              )}
            >
              {active && (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-xl bg-signal/15 ring-1 ring-signal/30"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <Icon className="relative h-4 w-4" />
              <span className="relative">{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mono-readout border-t border-border px-6 py-4">
        <p>SIGNAL: STABLE</p>
      </div>
    </aside>
  );
}
