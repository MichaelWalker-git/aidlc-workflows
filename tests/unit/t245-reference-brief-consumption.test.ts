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
import { AIDLC_SRC, ORG_BOK_PRECEDENCE_RULE } from "../harness/fixtures.ts";
import { flat, readFlat } from "../harness/text.ts";

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
  function shippedGrids(): Record<string, { stages: Record<string, string> }> {
    return JSON.parse(
      readFileSync(join(AIDLC_SRC, "tools", "data", "scope-grid.json"), "utf-8"),
    ) as Record<string, { stages: Record<string, string> }>;
  }

  function gridFor(scope: string): Record<string, string> {
    return { ...shippedGrids()[scope].stages };
  }

  test("feature grid with precedent-research EXECUTE passes lenient AND strict validation", () => {
    const grid = gridFor("feature");
    expect(grid["precedent-research"]).toBe("EXECUTE");
    for (const opts of [{}, { strict: true }]) {
      const r = validateGrid(grid, opts);
      expect(r.errors).toEqual([]);
      expect(r.valid).toBe(true);
    }
  });

  test("feature grid with precedent-research SKIPped still passes lenient AND strict validation (optional edges stay silent)", () => {
    const grid = { ...gridFor("feature"), "precedent-research": "SKIP" };
    for (const opts of [{}, { strict: true }]) {
      const r = validateGrid(grid, opts);
      expect(r.errors).toEqual([]);
      expect(r.valid).toBe(true);
    }
  });

  // The rows that actually ship a consumer EXECUTE against a SKIPped
  // producer are the interesting ones — mvp and workshop do this by
  // default, so they exercise the optional-edge contract with no test
  // mutation at all. Sweep every shipped row so a future scope can't
  // reintroduce a starved reference-brief edge unnoticed.
  //
  // Scoped to reference-brief on purpose: the lean scopes deliberately
  // skip producers of REQUIRED artifacts (bugfix runs code-generation
  // without units-generation, workshop runs refined-mockups without
  // rough-mockups), so several shipped rows carry pre-existing strict-mode
  // errors by design — strict is the recompose gate, not a shipped-row
  // invariant. What must hold for this feature is that no row ever
  // starves on the brief.
  test("no shipped scope grid starves on reference-brief, lenient or strict", () => {
    for (const [scope, row] of Object.entries(shippedGrids())) {
      if (!row?.stages) continue;
      for (const opts of [{}, { strict: true }]) {
        const offending = validateGrid({ ...row.stages }, opts).errors.filter(
          (e) => e.includes("reference-brief"),
        );
        expect(offending, `${scope} grid, ${JSON.stringify(opts)}`).toEqual([]);
      }
    }
  });

  test("mvp and workshop ship consumers EXECUTE while the producer is SKIPped — the real conditional case", () => {
    const grids = shippedGrids();
    for (const scope of ["mvp", "workshop"]) {
      const stages = grids[scope].stages;
      expect(stages["precedent-research"], `${scope} skips the producer`).toBe(
        "SKIP",
      );
      const executing = consumersOf("reference-brief")
        .map((s) => s.slug)
        .filter((slug) => stages[slug] === "EXECUTE");
      expect(
        executing.length,
        `${scope} runs at least one brief consumer`,
      ).toBeGreaterThan(0);
    }
  });
});

// The two same-phase edges (feasibility, rough-mockups) are role-2
// presentation-order edges per docs/reference/15-stage-definition.md, not
// data dependencies. The three cross-phase consumers deliberately carry no
// edge: the phase boundary already sequences them, and an edge on an
// optional consume whose producer is CONDITIONAL would assert a dependency
// that does not hold when the producer is skipped. t65 only checks
// transitive reachability, so this convention needs its own pin.
describe("t245 requires_stage — same-phase ordering edges only", () => {
  const SAME_PHASE = new Set(["feasibility", "rough-mockups"]);

  test("same-phase consumers carry the precedent-research ordering edge", () => {
    for (const stage of consumersOf("reference-brief")) {
      if (!SAME_PHASE.has(stage.slug)) continue;
      expect(
        stage.requires_stage ?? [],
        `${stage.slug} orders after precedent-research`,
      ).toContain("precedent-research");
    }
  });

  test("cross-phase consumers carry no precedent-research edge (the phase boundary sequences them)", () => {
    for (const stage of consumersOf("reference-brief")) {
      if (SAME_PHASE.has(stage.slug)) continue;
      expect(
        stage.requires_stage ?? [],
        `${stage.slug} relies on the phase boundary, not an edge`,
      ).not.toContain("precedent-research");
    }
  });

  test("the same-phase edges are ordering-only — precedent-research stays in ideation with its consumers", () => {
    const producer = producersOf("reference-brief")[0];
    expect(producer.phase).toBe("ideation");
    for (const stage of consumersOf("reference-brief")) {
      if (SAME_PHASE.has(stage.slug)) expect(stage.phase).toBe("ideation");
      else expect(stage.phase).not.toBe("ideation");
    }
  });
});

// Issue 02: "the contract ... reflected in the fixture exemplar's expected
// output shape". The fixture is the only worked example an SA sees before
// authoring their own, so its section-to-brief mapping has to name the real
// contract sections.
describe("t245 the fixture exemplar profile maps its sections onto the contract", () => {
  const profile = readFileSync(
    join(
      AIDLC_SRC,
      "knowledge",
      "org-bok",
      "exemplars",
      "sample-internal-developer-platform",
      "profile.md",
    ),
    "utf-8",
  );

  test("it names the brief sections its own sections feed", () => {
    for (const heading of [
      "## Selected Exemplars & Rationale",
      "## Patterns to Follow",
      "## UI Directives",
      "## Deep-Dive Pointers",
    ]) {
      expect(profile, `fixture maps onto "${heading}"`).toContain(heading);
    }
  });

  test("it states that the precedence rule is the agent's, not the profile's", () => {
    expect(flat(profile)).toMatch(/never states its own precedence/);
  });

  test("the sections the mapping cites actually exist in the profile", () => {
    for (const own of [
      "## Ask / Context",
      "## Architecture & Why",
      "## Key Patterns",
      "## Deep-Dive Pointers",
    ]) {
      expect(profile, `fixture has "${own}"`).toContain(own);
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
      // ADR-008's rule only lands downstream if each consumer defers to
      // it; a step that says "follow the exemplar" with no precedence
      // clause invites BoK-vs-local churn on brownfield.
      expect(src, `${slug} defers to the precedence rule`).toContain(
        "precedence rule",
      );
    });
  }

  // upstream-coverage reads `consumes:` and checks the stage's OWN
  // deliverables cite each upstream artifact. Adding the edge without a
  // "cite it" instruction hands the agent an obligation nobody stated —
  // an advisory SENSOR_FAILED on every BoK-enabled run. Stages that don't
  // import the sensor (code-generation runs linter/type-check) are exempt.
  test("every consumer whose sensors include upstream-coverage also instructs the citation", () => {
    for (const [slug, phase] of CONSUMERS) {
      const src = stageSource(slug, phase);
      const importsSensor = /^\s+- upstream-coverage$/m.test(src);
      if (!importsSensor) continue;
      expect(src, `${slug} instructs citing the brief`).toMatch(
        /[Cc]ite the brief explicitly/,
      );
    }
  });

  // Required-first ordering: `consumes:` feeds the human-facing `inputs:`
  // string, so an optional edge spliced ahead of the required ones makes
  // a stage advertise an optional input first.
  test("no consumer lists the optional reference-brief edge ahead of a required edge", () => {
    for (const stage of consumersOf("reference-brief")) {
      const edges = stage.consumes ?? [];
      const briefIdx = edges.findIndex((c) => c.artifact === "reference-brief");
      const lastRequiredIdx = edges.reduce(
        (acc, c, i) => (c.required ? i : acc),
        -1,
      );
      expect(
        briefIdx,
        `${stage.slug} lists reference-brief after every required edge`,
      ).toBeGreaterThan(lastRequiredIdx);
    }
  });

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

  const CONTRACT_SECTIONS = [
    "## Selected Exemplars & Rationale",
    "## Patterns to Follow",
    "## UI Directives",
    "## Precedence Rule",
    "## Deep-Dive Pointers",
  ];

  // ADR-008's rule, verbatim — the shared pin (see fixtures.ts) that also
  // holds the Org BoK guides (t246) to the same sentence.
  const PRECEDENCE_RULE = ORG_BOK_PRECEDENCE_RULE;

  test("the brief-writing step names every contract section as an H2 the brief must carry", () => {
    for (const heading of CONTRACT_SECTIONS) {
      expect(src, `brief carries "${heading}"`).toContain(heading);
    }
  });

  test("the contract is exactly five sections — no sixth slips in unpinned", () => {
    // Every `## `-prefixed backticked/plain heading the step names, minus
    // the no-match alternative, must be one of the five.
    const named = [...src.matchAll(/`(## [A-Z][^`]*)`/g)].map((m) => m[1]);
    const allowed = new Set([...CONTRACT_SECTIONS, "## No Matching Precedent"]);
    for (const heading of new Set(named)) {
      expect(allowed.has(heading), `unexpected brief section "${heading}"`).toBe(
        true,
      );
    }
    expect(new Set(named).size).toBe(allowed.size);
  });

  test("the precedence rule is stated verbatim — both halves and the trailing clause", () => {
    // Normalize whitespace so line wrapping in the .md doesn't matter.
    expect(flat(src)).toContain(PRECEDENCE_RULE);
  });

  test("the no-matching-precedent form is specified — downstream agents are told not to force-fit", () => {
    expect(src).toContain("No Matching Precedent");
    expect(src).toContain("force-fit");
    // The honest form still instructs downstream agents explicitly.
    // Normalized: the phrase legitimately wraps across lines in the .md.
    expect(flat(src)).toContain("first principles");
  });

  // ADR-006 §3: the UI directives come from the exemplar AND the org's UI
  // design-language guide. The guide is a standing org default that does
  // not depend on an exemplar match, so the no-match form must keep the
  // section rather than dropping it — that omission is how generic LLM
  // styling gets back in.
  test("the no-match form drops only the exemplar-dependent sections, keeping UI Directives and Precedence Rule", () => {
    const flatSrc = flat(src);
    expect(flatSrc).toMatch(
      /replace `## Selected Exemplars & Rationale` and `## Patterns to Follow`/,
    );
    expect(flatSrc).toMatch(/[Kk]eep `## UI Directives`/);
    expect(flatSrc).toMatch(/`## Precedence Rule`, which applies with or without/);
  });

  // The contract is restated in the agent persona and the method knowledge
  // doc as well. Unpinned, those copies drift out of agreement with the
  // stage prose the agent actually executes.
  describe("the contract's other statements agree with the producer's prose", () => {
    const PERSONA = join(AIDLC_SRC, "agents", "aidlc-research-agent.md");
    const METHOD = join(
      AIDLC_SRC,
      "knowledge",
      "aidlc-research-agent",
      "precedent-research-method.md",
    );

    test("the method doc names all five contract sections", () => {
      const method = readFileSync(METHOD, "utf-8");
      for (const heading of CONTRACT_SECTIONS) {
        expect(method, `method doc carries "${heading}"`).toContain(heading);
      }
    });

    test("all three statements carry the precedence rule verbatim", () => {
      for (const path of [PERSONA, METHOD]) {
        expect(readFlat(path), `${path} states the rule verbatim`).toContain(
          PRECEDENCE_RULE,
        );
      }
    });

    test("all three statements keep UI Directives in the no-match form", () => {
      for (const path of [PERSONA, METHOD]) {
        expect(readFlat(path), `${path} keeps the UI directives`).toMatch(
          /UI [Dd]irectives|design-language guide/,
        );
      }
    });
  });
});
