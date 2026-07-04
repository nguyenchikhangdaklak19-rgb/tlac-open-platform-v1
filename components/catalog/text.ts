/**
 * Plain-text paragraph splitting for admin-authored long-form fields
 * (`longDesc`, `examples`). Deliberately not markdown — the task keeps this
 * dependency-free (no new package), so a blank line is the only paragraph
 * boundary we recognize.
 */
export function splitParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);
}
