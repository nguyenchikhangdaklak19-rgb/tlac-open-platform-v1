import Link from "next/link";
import { HeroIllustration } from "./hero-illustration";
import { FeatureStrip } from "./feature-strip";

/**
 * Landing hero — two-column layout inspired by Luckin Coffee's MCP landing
 * page (badge, headline, subcopy, two CTAs on the left; mascot-on-a-pedestal
 * illustration on the right), restyled in MoMo pink.
 *
 * The primary CTA keeps the existing label/href ("Khám phá năng lực MCP" →
 * `/mcp`) on purpose: `e2e/g-responsive.spec.ts` asserts this exact
 * accessible name renders with `background-color: rgb(235, 47, 150)`
 * (MoMo pink `#eb2f96`) on the landing page, so the label is a fixed contract
 * with that test, not just hero copy.
 */
export function Hero() {
  return (
    <>
      <section className="border-b border-primary-100 bg-gradient-to-b from-primary-50/60 to-white">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-10 px-4 py-16 sm:px-6 sm:py-20 md:grid-cols-2 md:gap-8">
          <div className="flex flex-col items-center gap-6 text-center md:items-start md:text-left">
            <span className="inline-flex items-center rounded-full border border-primary-200 bg-primary-50 px-4 py-1.5 text-sm font-medium text-primary-600">
              MCP · Model Context Protocol
            </span>
            <h1 className="max-w-xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Trợ Lý Ăn Chơi <span className="text-primary-500">MCP</span>
            </h1>
            <p className="max-w-xl text-base text-foreground/70 sm:text-lg">
              Để AI đặt vé máy bay, tàu, xe khách, vé phim, order Highlands và
              săn voucher cho bạn — qua một MCP server duy nhất.
            </p>
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row md:justify-start">
              <Link
                href="/mcp"
                className="inline-flex items-center justify-center rounded-full bg-primary-500 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-600"
              >
                Khám phá năng lực MCP
              </Link>
              <Link
                href="/docs"
                className="inline-flex items-center justify-center rounded-full border border-primary-200 px-6 py-2.5 text-sm font-medium text-primary-600 transition-colors hover:bg-primary-50"
              >
                Xem tài liệu
              </Link>
            </div>
          </div>

          <div className="order-first md:order-last">
            <HeroIllustration />
          </div>
        </div>
      </section>

      <section className="border-b border-primary-100 bg-primary-50/10">
        <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
          <FeatureStrip />
        </div>
      </section>
    </>
  );
}
