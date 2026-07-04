import { CapabilityCard, type CapabilityCardProps } from "./capability-card";

export type CapabilityListProps = {
  capabilities: CapabilityCardProps[];
  /** Vietnamese empty-state copy — spec AC uses "Không tìm thấy năng lực". */
  emptyMessage?: string;
};

/** Responsive card grid, or an empty state when a search/filter matches nothing. */
export function CapabilityList({
  capabilities,
  emptyMessage = "Không tìm thấy năng lực",
}: CapabilityListProps) {
  if (capabilities.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-primary-200 bg-primary-50/30 px-6 py-12 text-center">
        <p className="text-base font-medium text-foreground/70">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {capabilities.map((capability) => (
        <CapabilityCard key={capability.slug} {...capability} />
      ))}
    </div>
  );
}
