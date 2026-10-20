"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

/**
 * Thin client wrapper so the root layout can stay a Server Component.
 * next-themes writes the `dark` class onto <html>, which is what the
 * `@custom-variant dark` rule in globals.css keys off.
 */
export function ThemeProvider({
  children,
  ...props
}: ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      // next-themes renders an inline <script> that sets the theme class
      // before paint. It does its job from the server HTML; when React renders
      // it again on the client, React 19 warns that client scripts never run.
      // Marking the client copy as non-JS silences that without changing
      // behaviour (the element already has suppressHydrationWarning).
      scriptProps={{
        type: typeof window === "undefined" ? undefined : "application/json",
      }}
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
