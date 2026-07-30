// text.ts — shared prose-pin normalization for the knowledge-doc test pattern.
//
// The doc-shape tests (t239/t245/t246/t247) assert phrases that legitimately
// wrap across lines in the shipped .md bytes, so every pin runs against a
// whitespace-normalized ("flat") form. One shared helper keeps the
// normalization identical across suites — the same no-drift posture as
// ORG_BOK_PRECEDENCE_RULE in fixtures.ts. The fence-aware heading walker
// (t87/t249) lives here for the same reason.

import { readFileSync } from "node:fs";

/** Collapse every whitespace run to a single space and trim the ends. */
export function flat(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/** Read a file and return its flat form — the common read-then-pin step. */
export function readFlat(path: string): string {
  return flat(readFileSync(path, "utf-8"));
}

/** The code-fence delimiter the fence-aware walkers toggle on. */
export const FENCE = "```";

/**
 * True iff a line EXACTLY equal to `heading` appears outside any triple-backtick
 * fenced block. Originally t87.sh's heading_outside_fence() awk walker, shared
 * here because more than one shape pin needs it (t87's stage compartments,
 * t249's pattern-page sections — whose INDEX.md documents a page template
 * INSIDE a fence, so "the heading exists somewhere in the bytes" is exactly the
 * wrong contract).
 *
 * Toggling `fenced` on every line that starts with the delimiter mirrors the awk
 * rule that flips its flag on a fence line and skips it; whole-line equality
 * mirrors awk's `$0 == h`. The `\r` strip makes a CRLF file compare the way
 * awk's record (sans record separator) would.
 */
export function headingOutsideFence(heading: string, body: string): boolean {
  let fenced = false;
  for (const rawLine of body.split("\n")) {
    const line = rawLine.replace(/\r$/, "");
    if (line.startsWith(FENCE)) {
      fenced = !fenced;
      continue;
    }
    if (!fenced && line === heading) return true;
  }
  return false;
}
