import type { City } from "@/lib/listings";

/**
 * Companion art for the city picker: a compact signpost against a city
 * panorama.
 *
 * The viewBox is deliberately WIDE and SHORT (760x250, near 3:1). An SVG
 * scales both axes together, so aspect ratio is the only thing controlling how
 * tall this gets in a flexible column — a squarer board sitting beside six
 * short tiles towers over them no matter what width it is given. Everything
 * here is composed to live inside a strip: the post carries three plates
 * rather than six, and the remaining width is spent on a skyline instead of on
 * height.
 *
 * The post is on-direction — "metro directional boards, Indian highway
 * signage" — and is the honest metaphor for the section: the fork in the road
 * where the product narrows to one city. It is illustrative, not a control;
 * the tiles beside it are the authoritative list, which is why showing three
 * plates rather than all six is fine.
 *
 * Inline SVG, so it inherits the theme tokens and adds no request.
 */

const POST_X = 168;
const HORIZON = 214;

/** One directional plate. `dir` 1 points right, -1 points left. */
function Plate({
  y,
  width,
  dir,
  label,
}: {
  y: number;
  width: number;
  dir: 1 | -1;
  label: string;
}) {
  const H = 28;
  const TIP = 15;

  // Built from the post outward, then mirrored by a transform, so the two
  // directions cannot drift apart as the geometry is tweaked.
  const d = `M0 0 H${width - TIP} L${width} ${H / 2} L${width - TIP} ${H} H0 Z`;

  return (
    <g transform={`translate(${POST_X}, ${y}) scale(${dir}, 1)`}>
      <path d={d} fill="var(--card)" stroke="var(--border)" strokeWidth={1.5} />
      {/* Brass end-cap: the arrow is the meaning, so it carries the accent. */}
      <path
        d={`M${width - TIP} 0 L${width} ${H / 2} L${width - TIP} ${H} Z`}
        fill="var(--primary)"
        opacity={0.92}
      />
      <text
        // Counter-scaled so the label reads left-to-right on both sides.
        transform={`scale(${dir}, 1)`}
        x={dir === 1 ? 13 : -(width - 21)}
        y={H / 2 + 3.5}
        className="font-mono"
        fontSize={11}
        letterSpacing={1.5}
        fill="var(--foreground)"
      >
        {label.toUpperCase()}
      </text>
    </g>
  );
}

/** Panorama filling the width the short composition frees up. */
function Skyline() {
  const blocks = [
    { x: 306, w: 46, h: 74 },
    { x: 358, w: 34, h: 112 },
    { x: 398, w: 54, h: 92 },
    { x: 458, w: 40, h: 134 },
    { x: 504, w: 58, h: 100 },
    { x: 568, w: 36, h: 148 },
    { x: 610, w: 50, h: 86 },
    { x: 666, w: 42, h: 118 },
    { x: 714, w: 32, h: 70 },
  ];

  return (
    <g opacity={0.45}>
      {blocks.map((b) => (
        <g key={b.x}>
          <rect
            x={b.x}
            y={HORIZON - b.h}
            width={b.w}
            height={b.h}
            rx={2}
            fill="var(--secondary)"
            stroke="var(--border)"
            strokeWidth={1}
          />
          <rect
            x={b.x + 7}
            y={HORIZON - b.h + 11}
            width={7}
            height={5}
            fill="var(--primary)"
            opacity={0.8}
          />
          <rect
            x={b.x + b.w - 15}
            y={HORIZON - b.h + 30}
            width={7}
            height={5}
            fill="var(--primary)"
            opacity={0.45}
          />
        </g>
      ))}
    </g>
  );
}

export function CityArt({
  cities,
  className,
}: {
  cities: City[];
  className?: string;
}) {
  // Three plates only — the strip has no room for six, and the tiles beside
  // this are the real list. Alternating sides so it reads as a signpost.
  const layout: { width: number; dir: 1 | -1 }[] = [
    { width: 138, dir: 1 },
    { width: 118, dir: -1 },
    { width: 152, dir: 1 },
  ];

  const plates = cities.slice(0, layout.length);

  return (
    <svg
      viewBox="0 0 760 250"
      className={className}
      role="img"
      aria-label={`Illustration of a signpost against a city skyline, pointing towards ${plates
        .map((c) => c.name)
        .join(", ")}`}
    >
      <Skyline />

      <line
        x1="24"
        y1={HORIZON}
        x2="748"
        y2={HORIZON}
        stroke="var(--border)"
        strokeWidth={1.5}
      />
      <ellipse
        cx={POST_X + 9}
        cy={HORIZON + 15}
        rx="66"
        ry="8"
        fill="var(--muted)"
        opacity={0.5}
      />

      <rect
        x={POST_X}
        y="34"
        width="18"
        height={HORIZON + 14 - 34}
        rx="3"
        fill="var(--secondary)"
        stroke="var(--border)"
        strokeWidth={1.5}
      />
      {/* Finial */}
      <rect
        x={POST_X - 7}
        y="24"
        width="32"
        height="13"
        rx="3"
        fill="var(--card)"
        stroke="var(--border)"
        strokeWidth={1.5}
      />

      {plates.map((city, i) => (
        <Plate
          key={city.slug}
          y={54 + i * 44}
          width={layout[i]!.width}
          dir={layout[i]!.dir}
          label={city.name}
        />
      ))}
    </svg>
  );
}
