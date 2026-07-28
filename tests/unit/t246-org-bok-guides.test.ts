// covers: file:knowledge/org-bok/index.md, file:knowledge/org-bok/exemplars/sample-internal-developer-platform/profile.md, file:knowledge/org-bok/guides/architecture-principles.md, file:knowledge/org-bok/guides/code-style.md, file:knowledge/org-bok/guides/ui-design-language.md
// covers: file:agents/aidlc-architect-agent.md, file:agents/aidlc-developer-agent.md, file:agents/aidlc-quality-agent.md, file:agents/aidlc-design-agent.md, file:agents/aidlc-research-agent.md
//
// t246 — Org BoK content shape + guide wiring (org-bok issue #03, ADR-003 /
// ADR-008). Three pinned surfaces:
//
//   1. Content shape of the shipped BoK artifacts (the knowledge-doc
//      prose-check pattern, as in t70/t245): the curated index carries the
//      required per-exemplar fields (tags, stack, "use when…") and one
//      profile link per row; the fixture exemplar profile carries the four
//      required H2 sections plus a non-empty repo URL and notable paths in
//      frontmatter; each of the three cross-cutting guides carries its
//      expected top-level headings and is non-trivially sized.
//
//   2. The ADR-008 wiring table, exactly: architecture-principles → architect
//      only; code-style → developer + quality only; ui-design-language →
//      design + developer only; index + exemplars → research agent only. The
//      negative half is the point — a guide leaking into aidlc-shared/ or an
//      unlisted agent's Knowledge Loading section is the context bloat
//      ADR-008 rejected, and an org-bok reference appearing in any agent
//      outside the table (compliance, operations, …) reds here.
//
//   3. Precedence-rule consistency: every guide states the same verbatim
//      greenfield/brownfield rule the reference-brief contract pins (t245's
//      PRECEDENCE_RULE), so guides and briefs can never drift apart.
//
// Mechanism: none. Pure reads of the shipped dist bytes via AIDLC_SRC — no
// spawns, no LLM, zero tokens. Assertions are whitespace-normalized where a
// phrase may wrap (house pattern from t245).

import { describe, expect, test } from "bun:test";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import {
  AIDLC_SRC,
  ORG_BOK_PRECEDENCE_RULE as PRECEDENCE_RULE,
  ORG_BOK_PROFILE_SECTIONS,
} from "../harness/fixtures.ts";
import { flat } from "../harness/text.ts";

const BOK_DIR = join(AIDLC_SRC, "knowledge", "org-bok");
const AGENTS_DIR = join(AIDLC_SRC, "agents");

/** Read a shipped file and return [raw, whitespace-normalized] forms. */
function readBoth(path: string): [string, string] {
  const raw = readFileSync(path, "utf-8");
  return [raw, flat(raw)];
}

// ADR-008 wiring table: guide file → the exact set of agents that load it.
const GUIDE_WIRING: ReadonlyArray<readonly [string, ReadonlyArray<string>]> = [
  ["architecture-principles.md", ["aidlc-architect-agent"]],
  ["code-style.md", ["aidlc-developer-agent", "aidlc-quality-agent"]],
  ["ui-design-language.md", ["aidlc-design-agent", "aidlc-developer-agent"]],
];

// Expected H2 headings per guide (ADR-003 shape; the "Fill in" placeholders
// live under these headings, so the headings are the stable contract).
const GUIDE_HEADINGS: Readonly<Record<string, ReadonlyArray<string>>> = {
  "architecture-principles.md": [
    "## How to Use This Guide",
    "## Precedence",
    "## Principles",
    "## Technology Defaults",
    "## Deviation Process",
  ],
  "code-style.md": [
    "## How to Use This Guide",
    "## Precedence",
    "## Naming & Structure",
    "## Formatting & Linting",
    "## Errors & Logging",
    "## Testing Practices",
    "## Review Checklist",
  ],
  "ui-design-language.md": [
    "## How to Use This Guide",
    "## Precedence",
    "## Baseline: Not LLM-Looking",
    "## Design Tokens",
    "## Layout & Spacing",
    "## Components",
    "## Copy & Content",
  ],
};

describe("t246 org-bok index — required per-exemplar fields (mechanism: none)", () => {
  const [index] = readBoth(join(BOK_DIR, "index.md"));
  const indexLines = index.split("\n");

  test("index table header carries the tags / stack / use-when columns", () => {
    const header = indexLines.find((l) => l.startsWith("| Exemplar |"));
    expect(header).toBeDefined();
    expect(header).toContain("Project-type tags");
    expect(header).toContain("Tech stack");
    expect(header).toContain("Use when…");
  });

  test("every exemplar row links a profile and fills all four fields", () => {
    // Data rows: pipe-delimited lines below the header, excluding the
    // header itself and the |---| separator.
    const rows = indexLines.filter(
      (l) => l.startsWith("| [") && l.includes("profile.md"),
    );
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      // First cell links exemplars/<slug>/profile.md (the gate counts these).
      expect(row).toMatch(/\| \[[^\]]+\]\(exemplars\/[^)]+\/profile\.md\)/);
      // All four cells non-empty: split yields ["", c1, c2, c3, c4, ""].
      const cells = row.split("|").map((c) => c.trim());
      expect(cells.length).toBe(6);
      for (const cell of cells.slice(1, 5)) {
        expect(cell.length).toBeGreaterThan(0);
      }
    }
  });
});

describe("t246 exemplar profiles — required sections + repo URL frontmatter", () => {
  const exemplarsDir = join(BOK_DIR, "exemplars");
  const slugs = readdirSync(exemplarsDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);

  test("at least one exemplar profile ships", () => {
    expect(slugs.length).toBeGreaterThan(0);
  });

  for (const slug of slugs) {
    test(`${slug}/profile.md has the required sections and non-empty repo_url frontmatter`, () => {
      const [raw] = readBoth(join(exemplarsDir, slug, "profile.md"));
      // Frontmatter: a non-empty repo_url value and at least one notable path.
      const fm = raw.split("---")[1] ?? "";
      expect(fm).toMatch(/repo_url:\s*\S+/);
      expect(fm).toContain("notable_paths:");
      expect(fm).toMatch(/notable_paths:\s*\n(\s*-\s*\S+)/);
      // The four required H2 sections (ask/context, architecture + why,
      // patterns, pointers — ADR-003's profile shape, shared with t248's
      // distill-skill drafting pin via ORG_BOK_PROFILE_SECTIONS).
      for (const heading of ORG_BOK_PROFILE_SECTIONS) {
        expect(raw).toContain(heading);
      }
    });
  }
});

describe("t246 cross-cutting guides — expected headings, substance, precedence rule", () => {
  for (const [guide, headings] of Object.entries(GUIDE_HEADINGS)) {
    const path = join(BOK_DIR, "guides", guide);
    const [raw, flat] = readBoth(path);

    test(`${guide} carries its expected top-level headings`, () => {
      for (const heading of headings) {
        expect(raw).toContain(`\n${heading}\n`);
      }
    });

    test(`${guide} is substantive (not a stub)`, () => {
      // "Non-empty" per the ticket, strengthened: a heading skeleton with no
      // guidance would pass an existsSync check; require real prose.
      expect(raw.length).toBeGreaterThan(1500);
    });

    test(`${guide} states the precedence rule verbatim (t245 wording)`, () => {
      expect(flat).toContain(PRECEDENCE_RULE);
    });
  }
});

describe("t246 ADR-008 wiring — targeted Tier-1 placement, exactly", () => {
  // Read every shipped agent persona once; wiring is asserted over the full
  // roster so the negative half (agent NOT in the table sees nothing) holds.
  const agentFiles = readdirSync(AGENTS_DIR).filter(
    (f) => f.startsWith("aidlc-") && f.endsWith(".md"),
  );
  const personas = new Map(
    agentFiles.map((f) => [
      f.replace(/\.md$/, ""),
      readFileSync(join(AGENTS_DIR, f), "utf-8"),
    ]),
  );

  for (const [guide, wiredAgents] of GUIDE_WIRING) {
    test(`guides/${guide} is loaded by EXACTLY ${wiredAgents.join(" + ")}`, () => {
      const loaders = [...personas.entries()]
        .filter(([, body]) => body.includes(`org-bok/guides/${guide}`))
        .map(([name]) => name)
        .sort();
      expect(loaders).toEqual([...wiredAgents].sort());
    });
  }

  test("index + exemplar profiles stay research-agent-only", () => {
    const indexLoaders = [...personas.entries()]
      .filter(([, body]) => body.includes("org-bok/index.md"))
      .map(([name]) => name);
    expect(indexLoaders).toEqual(["aidlc-research-agent"]);
    // No persona besides the research agent references the exemplars subtree.
    const exemplarLoaders = [...personas.entries()]
      .filter(([, body]) => body.includes("org-bok/exemplars"))
      .map(([name]) => name);
    for (const name of exemplarLoaders) {
      expect(name).toBe("aidlc-research-agent");
    }
  });

  test("agents outside the wiring table carry NO org-bok reference (no context bloat)", () => {
    const allowed = new Set([
      ...GUIDE_WIRING.flatMap(([, agents]) => agents),
      "aidlc-research-agent",
    ]);
    for (const [name, body] of personas) {
      if (!allowed.has(name)) {
        expect(body.includes("org-bok"), `${name} must not load org-bok`).toBe(
          false,
        );
      }
    }
  });

  test("no guide lands in the all-agents shared area", () => {
    const shared = readdirSync(join(AIDLC_SRC, "knowledge", "aidlc-shared"));
    for (const [guide] of GUIDE_WIRING) {
      expect(shared).not.toContain(guide);
    }
  });
});
