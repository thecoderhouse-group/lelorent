import type { Metadata, Viewport } from "next";
import { Archivo, JetBrains_Mono } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

/**
 * Archivo: a grotesque with a width axis and genuinely good numerals, which is
 * what the signage direction and the rupee figures both need. Chosen over the
 * usual Inter/Geist reach so the product does not read as another dark SaaS
 * template.
 */
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  display: "swap",
  axes: ["wdth"],
});

/**
 * Mono carries every price, every filter label, every spec value. Keeping
 * figures in one monospaced face is what stops a column of rents from
 * shifting width as the user filters.
 */
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Lelorent — rent a flat without the broker theatre",
    template: "%s · Lelorent",
  },
  description:
    "Search flats, PGs and shared rooms across Pune, Mumbai, Bengaluru, Hyderabad, Delhi and Gurugram. Filter by rent, food preference, pets and tenant type. Listed by owners.",
};

export const viewport: Viewport = {
  // The two --background values, so the phone's status bar blends into the
  // page instead of banding it. Update these whenever the ground moves.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f6f2" },
    { media: "(prefers-color-scheme: dark)", color: "#191714" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      // next-themes sets the class on <html> before paint; without this React
      // warns about the server/client mismatch it deliberately creates.
      suppressHydrationWarning
      className={`${archivo.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {/* Dark is the product, so it is the default rather than something a
            viewer has to opt into. Not "system": that hands the decision to
            the OS and means half the audience never sees the designed default.
            Light stays fully supported through the toggle.

            storageKey is deliberately NOT the default "theme". A stored
            preference always beats defaultTheme, so browsers that had already
            visited kept an old value and never picked up a change of default.
            Naming an app-specific key retired those entries once. */}
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
          storageKey="lelorent-theme"
        >
          <NuqsAdapter>{children}</NuqsAdapter>
        </ThemeProvider>
      </body>
    </html>
  );
}
