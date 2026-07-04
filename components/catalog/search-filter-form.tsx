import { VERTICALS, VERTICAL_LABELS } from "./filter";

export type SearchFilterFormProps = {
  q: string;
  vertical: string;
};

/**
 * Search + vertical filter for `/mcp`. Plain `GET` form to `/mcp` — filtering
 * happens server-side by reading `?q=&vertical=` in `app/mcp/page.tsx`, so
 * this works even with JavaScript disabled (no client component needed).
 */
export function SearchFilterForm({ q, vertical }: SearchFilterFormProps) {
  return (
    <form
      method="GET"
      action="/mcp"
      className="flex flex-col gap-3 sm:flex-row sm:items-center"
    >
      <label className="sr-only" htmlFor="mcp-search-q">
        Tìm theo tên hoặc mô tả
      </label>
      <input
        id="mcp-search-q"
        type="search"
        name="q"
        defaultValue={q}
        placeholder="Tìm theo tên hoặc mô tả..."
        className="w-full rounded-full border border-primary-200 px-4 py-2 text-sm text-foreground focus:border-primary-400 focus:outline-none sm:max-w-xs"
      />

      <label className="sr-only" htmlFor="mcp-vertical">
        Lọc theo vertical
      </label>
      <select
        id="mcp-vertical"
        name="vertical"
        defaultValue={vertical}
        className="w-full rounded-full border border-primary-200 px-4 py-2 text-sm text-foreground focus:border-primary-400 focus:outline-none sm:w-auto"
      >
        <option value="">Tất cả vertical</option>
        {VERTICALS.map((v) => (
          <option key={v} value={v}>
            {VERTICAL_LABELS[v]}
          </option>
        ))}
      </select>

      <button
        type="submit"
        className="inline-flex items-center justify-center rounded-full bg-primary-500 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600"
      >
        Lọc năng lực
      </button>
    </form>
  );
}
