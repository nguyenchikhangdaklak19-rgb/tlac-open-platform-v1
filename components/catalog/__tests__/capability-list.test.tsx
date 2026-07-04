import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CapabilityList } from "../capability-list";
import type { CapabilityCardProps } from "../capability-card";

// Fakes the 6 v1 capabilities (spec IA table) — this is what "landing
// renders 6 cards from a fake list" exercises, since app/page.tsx itself is
// an async Server Component (DB read) that renderToStaticMarkup can't drive
// directly; CapabilityList is the presentational piece it composes.
const SIX_FAKE_CAPABILITIES: CapabilityCardProps[] = [
  { name: "Đặt vé máy bay", slug: "dat-ve-may-bay", vertical: "TRAVEL", shortDesc: "..." },
  { name: "Đặt vé tàu", slug: "dat-ve-tau", vertical: "TRAVEL", shortDesc: "..." },
  { name: "Đặt vé xe khách", slug: "dat-ve-xe-khach", vertical: "TRAVEL", shortDesc: "..." },
  { name: "Đặt vé xem phim", slug: "dat-ve-xem-phim", vertical: "PHIM", shortDesc: "..." },
  { name: "Order Highlands", slug: "order-highlands", vertical: "FNB", shortDesc: "..." },
  { name: "Tìm kiếm voucher", slug: "tim-kiem-voucher", vertical: "PROMOTION", shortDesc: "..." },
];

describe("CapabilityList", () => {
  it("renders a card link for each of the 6 fake capabilities", () => {
    const html = renderToStaticMarkup(
      <CapabilityList capabilities={SIX_FAKE_CAPABILITIES} />,
    );
    for (const capability of SIX_FAKE_CAPABILITIES) {
      expect(html).toContain(`href="/mcp/${capability.slug}"`);
      expect(html).toContain(capability.name);
    }
  });

  it("shows the status badge only when a status is provided", () => {
    const html = renderToStaticMarkup(
      <CapabilityList
        capabilities={[
          { ...SIX_FAKE_CAPABILITIES[0], status: "VISIBLE" },
        ]}
      />,
    );
    expect(html).toContain("Hiển thị");
  });

  it("shows the Vietnamese empty state when there are no capabilities", () => {
    const html = renderToStaticMarkup(<CapabilityList capabilities={[]} />);
    expect(html).toContain("Không tìm thấy năng lực");
  });
});
