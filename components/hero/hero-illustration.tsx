import Image from "next/image";

/**
 * The 4 v1 verticals (spec IA table), shown as floating nodes around the
 * mascot pedestal. Labels only — no schema/endpoint content (anti-fabrication
 * lives entirely on `/mcp/:slug`, this is a purely decorative map of what
 * the single MCP endpoint already exposes).
 */
const CAPABILITY_NODES = [
  { glyph: "✈️", label: "Travel", position: "left-0 top-2 sm:-left-2 sm:top-4" },
  { glyph: "🎬", label: "Phim", position: "right-0 top-2 sm:-right-2 sm:top-4" },
  { glyph: "☕", label: "F&B", position: "left-2 bottom-0 sm:left-0 sm:bottom-2" },
  { glyph: "🎟️", label: "Voucher", position: "right-2 bottom-0 sm:right-0 sm:bottom-2" },
] as const;

/**
 * Self-built illustration inspired by the Luckin MCP landing layout (mascot
 * on a central pedestal, connected to floating capability nodes) — no
 * external images or fabricated screenshots, just the real TLAC mascot plus
 * SVG lines and CSS-only nodes. Animation is opt-in via
 * `prefers-reduced-motion: no-preference` so motion-sensitive users see a
 * static illustration.
 */
export function HeroIllustration() {
  return (
    <div className="relative mx-auto flex h-72 w-full max-w-sm items-center justify-center sm:h-80">
      <style>{`
        @keyframes tlac-hero-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes tlac-hero-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.45; }
        }
        @media (prefers-reduced-motion: no-preference) {
          .tlac-hero-float { animation: tlac-hero-float 4s ease-in-out infinite; }
          .tlac-hero-float-delayed { animation: tlac-hero-float 4s ease-in-out infinite; animation-delay: 1s; }
          .tlac-hero-pulse-line { animation: tlac-hero-pulse 3s ease-in-out infinite; }
        }
      `}</style>

      {/* Connecting lines from the pedestal to each capability node. */}
      <svg
        aria-hidden="true"
        viewBox="0 0 300 300"
        className="tlac-hero-pulse-line pointer-events-none absolute inset-0 h-full w-full"
      >
        <line x1="150" y1="150" x2="45" y2="60" stroke="var(--color-primary-200)" strokeWidth="2" />
        <line x1="150" y1="150" x2="255" y2="60" stroke="var(--color-primary-200)" strokeWidth="2" />
        <line x1="150" y1="150" x2="55" y2="245" stroke="var(--color-primary-200)" strokeWidth="2" />
        <line x1="150" y1="150" x2="245" y2="245" stroke="var(--color-primary-200)" strokeWidth="2" />
      </svg>

      {/* Central pedestal card. */}
      <div className="tlac-hero-float relative z-10 flex flex-col items-center gap-2 rounded-2xl border border-primary-100 bg-white p-5 shadow-lg">
        <Image
          src="/tlac-icon.png"
          alt="Trợ Lý Ăn Chơi"
          width={64}
          height={64}
          className="h-16 w-16 rounded-xl"
        />
        <span className="rounded-full bg-primary-500 px-3 py-1 text-xs font-semibold tracking-wide text-white">
          MCP
        </span>
      </div>

      {/* Floating capability nodes. */}
      {CAPABILITY_NODES.map((node, index) => (
        <div
          key={node.label}
          className={`tlac-hero-float-delayed absolute z-10 flex items-center gap-1.5 rounded-xl border border-primary-50 bg-white px-3 py-2 text-sm font-medium text-foreground shadow-md ${node.position}`}
          style={{ animationDelay: `${index * 0.4}s` }}
        >
          <span aria-hidden="true">{node.glyph}</span>
          <span>{node.label}</span>
        </div>
      ))}
    </div>
  );
}
