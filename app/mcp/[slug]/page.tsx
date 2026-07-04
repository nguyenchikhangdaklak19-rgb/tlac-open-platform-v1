import { notFound } from "next/navigation";
import type { Metadata } from "next";
import prisma from "@/lib/db";
import { getSession } from "@/lib/auth";
import { VERTICAL_LABELS } from "@/components/catalog/filter";
import { splitParagraphs } from "@/components/catalog/text";
import {
  parseToolSchema,
  toolDescription,
  toolHasIoSchema,
  toolLabel,
} from "@/components/catalog/tool-schema";
import { ConfigBlock } from "@/components/config-block";

// Capability detail (spec section A, IA: `/mcp/:slug`). Reads a single row
// by slug on every request — required anyway since a HIDDEN row must 404
// immediately after an Admin toggle, so this can't be statically cached.
export const dynamic = "force-dynamic";

type DetailPageParams = { slug: string };

async function loadVisibleCapability(slug: string) {
  const capability = await prisma.capability.findUnique({ where: { slug } });
  // Missing slug OR Admin-hidden both resolve the same way — spec AC:
  // "truy cập thẳng URL trả về 'Năng lực không tồn tại hoặc chưa mở'".
  if (!capability || capability.status === "HIDDEN") return null;
  return capability;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<DetailPageParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const capability = await loadVisibleCapability(slug);
  if (!capability) {
    return { title: "Năng lực không tồn tại | TLAC Open Platform" };
  }
  return {
    title: `${capability.name} | TLAC Open Platform`,
    description: capability.shortDesc,
  };
}

export default async function McpDetailPage({
  params,
}: {
  params: Promise<DetailPageParams>;
}) {
  const { slug } = await params;
  const capability = await loadVisibleCapability(slug);
  if (!capability) {
    notFound();
  }

  const session = await getSession();
  const parsedSchema = parseToolSchema(capability.toolSchema);
  const longDescParagraphs = splitParagraphs(capability.longDesc);
  const exampleParagraphs = splitParagraphs(capability.examples);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6">
      <span className="inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-600">
        {VERTICAL_LABELS[capability.vertical]}
      </span>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        {capability.name}
      </h1>
      <p className="mt-2 text-base text-foreground/70">{capability.shortDesc}</p>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-foreground">Mô tả chi tiết</h2>
        <div className="mt-2 flex flex-col gap-3 text-sm text-foreground/80 sm:text-base">
          {longDescParagraphs.length > 0 ? (
            longDescParagraphs.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))
          ) : (
            <p className="text-foreground/50">
              Chưa có mô tả — nội dung do Admin cập nhật.
            </p>
          )}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-foreground">Tool &amp; schema</h2>
        {parsedSchema.kind === "tools" ? (
          <ul className="mt-3 flex flex-col gap-4">
            {parsedSchema.tools.map((tool, index) => (
              <li
                key={index}
                className="rounded-xl border border-primary-100 bg-white p-4 sm:p-5"
              >
                <h3 className="text-sm font-semibold text-foreground">
                  {toolLabel(tool, index)}
                </h3>
                {toolDescription(tool) ? (
                  <p className="mt-1 text-sm text-foreground/70">
                    {toolDescription(tool)}
                  </p>
                ) : null}
                {toolHasIoSchema(tool) ? (
                  <pre className="mt-3 overflow-x-auto rounded-lg bg-foreground/5 p-3 text-xs text-foreground/80">
                    {JSON.stringify(
                      { input: tool.input, output: tool.output },
                      null,
                      2,
                    )}
                  </pre>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-foreground/50">
            Chưa có tool schema — nội dung do Admin cập nhật.
          </p>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-foreground">Ví dụ gọi</h2>
        <div className="mt-2 flex flex-col gap-3 text-sm text-foreground/80">
          {exampleParagraphs.length > 0 ? (
            exampleParagraphs.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))
          ) : (
            <p className="text-foreground/50">
              Chưa có ví dụ — nội dung do Admin cập nhật.
            </p>
          )}
        </div>
      </section>

      <section className="mt-8">
        <ConfigBlock
          configSnippet={capability.configSnippet}
          isLoggedIn={session !== null}
        />
      </section>
    </div>
  );
}
