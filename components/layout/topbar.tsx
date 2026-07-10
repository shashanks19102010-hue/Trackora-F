"use client";

import { useTheme } from "next-themes";
import { Moon, Sun, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/app/(auth)/actions";
import { GhostModeToggle } from "@/components/layout/ghost-mode-toggle";
import { PersonAvatar } from "@/components/avatar/person-avatar";
import type { AvatarConfig } from "@/lib/validation/schemas";

export function Topbar({
  userName,
  avatarUrl,
  avatarConfig,
  ghostModeEnabled,
}: {
  userName: string;
  avatarUrl?: string;
  avatarConfig?: AvatarConfig | null;
  ghostModeEnabled: boolean;
}) {
  const { theme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/70 px-4 backdrop-blur-xl md:px-8">
      <div className="md:hidden font-display font-semibold">TRACKORA</div>
      <div className="hidden md:block" />

      <div className="flex items-center gap-3">
        <GhostModeToggle initialEnabled={ghostModeEnabled} />
        <Button
          variant="ghost"
          size="icon"
          aria-label="Toggle theme"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <Sun className="h-4 w-4 dark:hidden" />
          <Moon className="hidden h-4 w-4 dark:block" />
        </Button>

        <div className="flex items-center gap-2 rounded-full border border-border py-1 pl-1 pr-3">
          <PersonAvatar name={userName} avatarUrl={avatarUrl} avatarConfig={avatarConfig} size={28} />
          <span className="text-sm font-medium">{userName}</span>
        </div>

        <form action={signOutAction}>
          <Button variant="ghost" size="icon" aria-label="Sign out" type="submit">
            <LogOut className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </header>
  );
}
