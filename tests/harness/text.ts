// text.ts — shared prose-pin normalization for the knowledge-doc test pattern.
//
// The doc-shape tests (t239/t245/t246/t247) assert phrases that legitimately
// wrap across lines in the shipped .md bytes, so every pin runs against a
// whitespace-normalized ("flat") form. One shared helper keeps the
// normalization identical across suites — the same no-drift posture as
// ORG_BOK_PRECEDENCE_RULE in fixtures.ts.

import { readFileSync } from "node:fs";

/** Collapse every whitespace run to a single space and trim the ends. */
export function flat(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/** Read a file and return its flat form — the common read-then-pin step. */
export function readFlat(path: string): string {
  return flat(readFileSync(path, "utf-8"));
}
