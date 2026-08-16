"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "@phosphor-icons/react/ssr";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // The server cannot know the viewer's theme, so the icon is only correct
  // after hydration. Rendering a fixed-size placeholder first keeps the
  // header from shifting when the real icon arrives.
  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={mounted ? `Switch to ${isDark ? "light" : "dark"} theme` : "Switch theme"}
      className="inline-flex size-9 items-center justify-center rounded-md text-plate-foreground/80 transition-colors hover:bg-white/10 hover:text-plate-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-plate"
    >
      {mounted ? (
        isDark ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />
      ) : (
        <span className="size-[18px]" />
      )}
    </button>
  );
}
