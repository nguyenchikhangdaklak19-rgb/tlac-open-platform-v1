const FEATURES = [
  { icon: "🔌", label: "Một endpoint MCP duy nhất" },
  { icon: "🧭", label: "4 vertical năng lực" },
  { icon: "📋", label: "Copy config là chạy" },
  { icon: "✉️", label: "Đăng ký email miễn phí" },
] as const;

/**
 * 4-item feature strip under the hero (Luckin-inspired), each claim traces
 * back to the spec: 1 MCP endpoint serves all verticals, the 4 verticals in
 * the IA table, copy-paste config (module C), and free email registration
 * (module B) — no invented numbers.
 */
export function FeatureStrip() {
  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
      {FEATURES.map((feature) => (
        <li
          key={feature.label}
          className="flex flex-col items-center gap-2 rounded-xl border border-primary-50 bg-white px-3 py-4 text-center sm:flex-row sm:items-center sm:gap-3 sm:text-left"
        >
          <span
            aria-hidden="true"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-50 text-lg"
          >
            {feature.icon}
          </span>
          <span className="text-sm font-medium text-foreground/80">
            {feature.label}
          </span>
        </li>
      ))}
    </ul>
  );
}
