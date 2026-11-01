/* eslint-disable @next/next/no-img-element -- tiny pre-sized brand PNGs;
   next/image would add a resize round trip for no gain. */
import { cn } from "@/lib/utils";

/**
 * Brand assets live in /public/brand, cut from the Lelo.Rent logo:
 *   wordmark-light.png  original colours, for light backgrounds
 *   wordmark-dark.png   "Lelo" in white, for dark backgrounds
 *   mark.png            the white circle badge, for square slots
 *
 * Both wordmarks are rendered and CSS shows the right one. The `dark:`
 * variant follows the nearest `.dark` ancestor, so sections that force the
 * dark look (hero, footer) get the white version regardless of site theme.
 */
const WORDMARK = { width: 606, height: 123 };

export function Logo({
  className,
  imgClassName,
}: {
  className?: string;
  /** Height utility for the wordmark, e.g. "h-7". Width follows. */
  imgClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center", className)}>
      <img
        src="/brand/wordmark-light.png"
        alt="Lelo.Rent"
        width={WORDMARK.width}
        height={WORDMARK.height}
        className={cn("h-7 w-auto dark:hidden", imgClassName)}
      />
      <img
        src="/brand/wordmark-dark.png"
        alt="Lelo.Rent"
        width={WORDMARK.width}
        height={WORDMARK.height}
        className={cn("hidden h-7 w-auto dark:block", imgClassName)}
      />
    </span>
  );
}

/** The circle badge on its own. Decorative unless given a label. */
export function LogoMark({
  className,
  label,
}: {
  className?: string;
  label?: string;
}) {
  return (
    <img
      src="/brand/mark.png"
      alt={label ?? ""}
      aria-hidden={label ? undefined : true}
      width={256}
      height={256}
      className={cn("size-9 shrink-0 rounded-full", className)}
    />
  );
}
