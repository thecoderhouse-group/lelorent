/**
 * Hero banner art — an Indian mid-rise skyline, drawn rather than photographed.
 *
 * Inline SVG on purpose. A stock photo of a foreign glass tower is the single
 * most generic thing a rental site can put here, and a remote placeholder host
 * is a request that can fail on the page that matters most. This ships in the
 * document, costs no round trip, and inherits the theme tokens, so it is
 * correct on paper and on ink without a second asset.
 *
 * Every colour comes from a token via currentColor or var(), so the art tracks
 * the palette instead of pinning hexes that would drift from it.
 */

/** One building. Windows are generated on a grid, some lit with the accent. */
function Block({
  x,
  y,
  width,
  height,
  cols,
  rows,
  lit,
  tank,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  cols: number;
  rows: number;
  /** Indices of windows that carry the accent colour. */
  lit: number[];
  tank?: boolean;
}) {
  const pad = 7;
  const cellW = (width - pad * 2) / cols;
  const cellH = 13;
  const windows: React.ReactElement[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const index = r * cols + c;
      const wx = x + pad + c * cellW + cellW * 0.16;
      const wy = y + 16 + r * cellH;
      if (wy + 7 > y + height - 4) continue;

      windows.push(
        <rect
          key={index}
          x={wx}
          y={wy}
          width={cellW * 0.66}
          height={7}
          rx={1}
          className={lit.includes(index) ? "text-primary" : "text-border"}
          fill="currentColor"
          opacity={lit.includes(index) ? 0.85 : 0.55}
        />,
      );
    }
  }

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={2}
        fill="var(--card)"
        stroke="var(--border)"
        strokeWidth={1.5}
      />
      {/* Roof parapet — the lip every Indian terrace has. */}
      <rect x={x - 3} y={y - 4} width={width + 6} height={5} rx={1} fill="var(--border)" />
      {/* Overhead water tank, the detail that makes the skyline read as here
          rather than anywhere. */}
      {tank && (
        <>
          <rect x={x + width * 0.55} y={y - 17} width={17} height={12} rx={2} fill="var(--border)" />
          <rect x={x + width * 0.55 + 4} y={y - 22} width={3} height={6} fill="var(--border)" />
          <rect x={x + width * 0.55 + 10} y={y - 22} width={3} height={6} fill="var(--border)" />
        </>
      )}
      {windows}
    </g>
  );
}

export function HeroArt({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 520 400"
      className={className}
      role="img"
      aria-label="Illustration of a row of low-rise apartment buildings with rooftop water tanks"
    >
      <defs>
        {/* Fades the base of the skyline into the page instead of cutting it
            off on a hard line. */}
        <linearGradient id="hero-art-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="55%" stopColor="#fff" stopOpacity="1" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id="hero-art-mask">
          <rect x="0" y="0" width="520" height="400" fill="url(#hero-art-fade)" />
        </mask>
      </defs>

      <g mask="url(#hero-art-mask)">
        {/* Back row, faded, to give the skyline depth without detail noise. */}
        <g opacity={0.45}>
          <Block x={18} y={150} width={78} height={250} cols={3} rows={16} lit={[4, 11]} />
          <Block x={392} y={128} width={92} height={272} cols={3} rows={18} lit={[2, 15]} tank />
        </g>

        {/* Front row. */}
        <Block x={86} y={96} width={112} height={304} cols={4} rows={20} lit={[5, 9, 18, 26]} tank />
        <Block x={196} y={168} width={98} height={232} cols={3} rows={15} lit={[3, 13]} />
        <Block x={292} y={118} width={108} height={282} cols={4} rows={19} lit={[6, 15, 24]} tank />
      </g>
    </svg>
  );
}
