/**
 * Graceful parsing of `Capability.toolSchema` (spec section A, detail page).
 *
 * The column is admin-authored JSON text with no enforced shape (CMS is a
 * later task), so this must never throw on `"[]"`, blank, or malformed
 * content — the detail page falls back to
 * "Chưa có tool schema — nội dung do Admin cập nhật" whenever this doesn't
 * resolve to a non-empty array of tool objects.
 */

export type ToolSchemaEntry = {
  name?: unknown;
  description?: unknown;
  input?: unknown;
  output?: unknown;
};

export type ParsedToolSchema =
  | { kind: "empty" }
  | { kind: "invalid" }
  | { kind: "tools"; tools: ToolSchemaEntry[] };

function isToolEntry(value: unknown): value is ToolSchemaEntry {
  return typeof value === "object" && value !== null;
}

/** Never throws — malformed/empty input always resolves to a `ParsedToolSchema`. */
export function parseToolSchema(raw: string | null | undefined): ParsedToolSchema {
  if (!raw || raw.trim() === "") return { kind: "empty" };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { kind: "invalid" };
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    return { kind: "empty" };
  }

  const tools = parsed.filter(isToolEntry);
  if (tools.length === 0) return { kind: "invalid" };

  return { kind: "tools", tools };
}

/** Display label for a tool entry, falling back to a numbered placeholder. */
export function toolLabel(tool: ToolSchemaEntry, index: number): string {
  return typeof tool.name === "string" && tool.name.trim() !== ""
    ? tool.name
    : `Tool ${index + 1}`;
}

/** Display description for a tool entry, or `null` when admin hasn't set one. */
export function toolDescription(tool: ToolSchemaEntry): string | null {
  return typeof tool.description === "string" && tool.description.trim() !== ""
    ? tool.description
    : null;
}

/** Whether a tool entry has an input/output shape worth rendering as JSON. */
export function toolHasIoSchema(tool: ToolSchemaEntry): boolean {
  return tool.input !== undefined || tool.output !== undefined;
}
