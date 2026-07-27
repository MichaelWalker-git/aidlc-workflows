// covers: function:producersOf, function:consumersOf, function:validateGrid,
// covers: file:aidlc-common/stages/ideation/precedent-research.md, file:aidlc-common/stages/ideation/feasibility.md, file:aidlc-common/stages/ideation/rough-mockups.md, file:aidlc-common/stages/inception/refined-mockups.md, file:aidlc-common/stages/inception/application-design.md, file:aidlc-common/stages/construction/code-generation.md
//
// t245 — downstream consumption of the reference brief (org-bok issue #02,
// ADR-006/ADR-008). The five downstream stages — feasibility, rough-mockups,
// refined-mockups, application-design, code-generation — declare a
// `reference-brief` consumes edge and carry the prose step that makes agents
// act on it; the brief contract itself (sections, UI directives, precedence
// rule, honest no-match form) is pinned in the producer's stage prose.
//
// Mechanism: none. Pure reads of the shipped compiled graph (via the
// dist graph library) and the shipped stage .md bytes — no spawns, no LLM.
//
// The conditional shape pinned here: the producer (precedent-research) is
// CONDITIONAL (skipped whenever the install ships no usable Org BoK), so
// every consumer declares `required: false` — the same optional-consume
// shape market-research's artifacts use. A required:true edge would starve
// under strict (recompose) grid validation in any grid that skips the
// producer; required:false is silent by validateGrid's contract
// ("optional consumes missing producers is a first-class valid state").

import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  consumersOf,
  producersOf,
  validateGrid,
} from "../../dist/claude/.claude/tools/aidlc-graph.ts";
import { AIDLC_SRC } from "../harness/fixtures.ts";

const STAGES_DIR = join(AIDLC_SRC, "aidlc-common", "stages");

// slug -> phase dir, for the five downstream consumers.
const CONSUMERS: Array<[string, string]> = [
  ["feasibility", "ideation"],
  ["rough-mockups", "ideation"],
  ["refined-mockups", "inception"],
  ["application-design", "inception"],
  ["code-generation", "construction"],
];

function stageSource(slug: string, phase: string): string {
  return readFileSync(join(STAGES_DIR, phase, `${slug}.md`), "utf-8");
}

describe("t245 reference-brief edges in the compiled graph", () => {
  test("producersOf(reference-brief) is exactly precedent-research", () => {
    expect(producersOf("reference-brief").map((s) => s.slug)).toEqual([
      "precedent-research",
    ]);
  });

  test("consumersOf(reference-brief) is exactly the five downstream stages", () => {
    const actual = consumersOf("reference-brief")
      .map((s) => s.slug)
      .sort();
    expect(actual).toEqual(CONSUMERS.map(([slug]) => slug).sort());
  });

  test("every consumer declares the optional-consume shape (required: false — the CONDITIONAL-producer contract)", () => {
    for (const stage of consumersOf("reference-brief")) {
      const edge = (stage.consumes ?? []).find(
        (c) => c.artifact === "reference-brief",
      );
      expect(edge, `${stage.slug} has the edge`).toBeDefined();
      expect(edge?.required, `${stage.slug} edge is optional`).toBe(false);
    }
  });
});

describe("t245 grid validation — the CONDITIONAL producer never starves a consumer", () => {
  function featureGrid(): Record<string, string> {
    const shipped = JSON.parse(
      readFileSync(join(AIDLC_SRC, "tools", "data", "scope-grid.json"), "utf-8"),
    ) as Record<string, { stages: Record<string, string> }>;
    return { ...shipped.feature.stages };
  }

  test("feature grid with precedent-research EXECUTE passes lenient AND strict validation", () => {
    const grid = featureGrid();
    expect(grid["precedent-research"]).toBe("EXECUTE");
    for (const opts of [{}, { strict: true }]) {
      const r = validateGrid(grid, opts);
      expect(r.errors).toEqual([]);
      expect(r.valid).toBe(true);
    }
  });

  test("feature grid with precedent-research SKIPped still passes lenient AND strict validation (optional edges stay silent)", () => {
    const grid = { ...featureGrid(), "precedent-research": "SKIP" };
    for (const opts of [{}, { strict: true }]) {
      const r = validateGrid(grid, opts);
      expect(r.errors).toEqual([]);
      expect(r.valid).toBe(true);
    }
  });
});

describe("t245 downstream prose — the step that makes agents act (ADR-006)", () => {
  for (const [slug, phase] of CONSUMERS) {
    test(`${slug} loads the brief and tolerates its absence`, () => {
      const src = stageSource(slug, phase);
      // The load instruction names the producing stage's record dir.
      expect(src).toContain("ideation/precedent-research/");
      // The directive: follow the brief's exemplar patterns.
      expect(src.toLowerCase()).toContain("exemplar patterns");
      // Absence tolerance: proceed without it, no hunting, no failure.
      expect(src).toContain("proceed without");
    });
  }

  // ADR-006 point 3: the UI directives are addressed to the mockup and
  // code-generation stages specifically.
  test("the mockup and code-generation stages are directed at the brief's UI directives", () => {
    for (const [slug, phase] of CONSUMERS) {
      if (slug === "feasibility" || slug === "application-design") continue;
      const src = stageSource(slug, phase);
      expect(src, `${slug} names the UI directives`).toContain("UI directives");
    }
  });
});

describe("t245 the reference-brief contract in the producer's stage prose", () => {
  const src = stageSource("precedent-research", "ideation");

  test("the brief-writing step names every contract section as an H2 the brief must carry", () => {
    for (const heading of [
      "## Selected Exemplars & Rationale",
      "## Patterns to Follow",
      "## UI Directives",
      "## Precedence Rule",
      "## Deep-Dive Pointers",
    ]) {
      expect(src, `brief carries "${heading}"`).toContain(heading);
    }
  });

  test("the precedence rule is stated (brownfield: local affirmed practices win)", () => {
    expect(src).toContain("locally discovered and affirmed practices win");
  });

  test("the no-matching-precedent form is specified — downstream agents are told not to force-fit", () => {
    expect(src).toContain("No Matching Precedent");
    expect(src).toContain("force-fit");
    // The honest form still instructs downstream agents explicitly.
    expect(src).toContain("first principles");
  });
});
