import { cn } from "@/lib/utils";

/**
 * Brand mark: a house outline with a keyhole — renting, straight from the
 * person holding the key. Drawn in currentColor for the outline and
 * --primary for the fill, so it follows the theme.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      aria-hidden="true"
      className={cn("size-9 shrink-0", className)}
    >
      <rect x="1" y="1" width="38" height="38" rx="10" className="fill-primary" />
      {/* House */}
      <path
        d="M11 19.5 20 12l9 7.5V29a1 1 0 0 1-1 1H12a1 1 0 0 1-1-1z"
        fill="none"
        strokeWidth="2.4"
        strokeLinejoin="round"
        className="stroke-primary-foreground"
      />
      {/* Keyhole */}
      <circle cx="20" cy="21" r="2.6" className="fill-primary-foreground" />
      <path d="M18.9 22.5h2.2l.7 4.3h-3.6z" className="fill-primary-foreground" />
    </svg>
  );
}

/** Mark + wordmark. */
export function Logo({
  className,
  markClassName,
  wordClassName,
}: {
  className?: string;
  markClassName?: string;
  wordClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className={markClassName} />
      <span
        className={cn(
          "text-lg font-semibold tracking-tight text-foreground",
          wordClassName,
        )}
      >
        lelorent<span className="text-primary">.</span>
      </span>
    </span>
  );
}
