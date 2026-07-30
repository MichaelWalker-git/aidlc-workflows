// covers: file:knowledge/org-bok/patterns/INDEX.md
// covers: file:agents/aidlc-architect-agent.md, file:agents/aidlc-aws-platform-agent.md, file:agents/aidlc-devsecops-agent.md, file:agents/aidlc-operations-agent.md
//
// t249 — the org patterns-KB shape contract (patterns ADR-001/002/003/004,
// ticket .scratch/patterns-kb/issues/02). Five pinned surfaces:
//
//   1. STRUCTURE — the patterns tree ships in EVERY harness dist: an INDEX.md
//      plus the nine ADR-001 class subdirectories, projected by the existing
//      packager (no new distribution mechanism).
//   2. PAGE SHAPE — every pattern page (every patterns/**/*.md except the
//      INDEX) carries the three ADR-003 frontmatter fields with valid values
//      (`status` ∈ draft|blessed|deprecated, `reviewed` a real YYYY-MM-DD date,
//      `owner` non-empty), the five ADR-004 section headings OUTSIDE fenced
//      code blocks, and the ADR-002 standing precedence header — which must be
//      an actual header (a blockquote run ABOVE the first section), not the
//      right phrases scattered through the body prose.
//   3. TEMPLATE HONESTY — the page template documented in INDEX.md itself
//      passes the very validators this file applies to real pages (the t248
//      posture: what the authoring surface tells you to write is what the pin
//      accepts). It kept the pin non-vacuous while the KB was empty of
//      content, and it is what makes each content ticket genuinely "add one
//      file and one index row" — the template an author copies is pinned to
//      the same rules their page will be judged by.
//   4. INDEX↔FILE CONSISTENCY, both directions — every INDEX row resolves to
//      an existing file, every pattern file appears in EXACTLY one row, and
//      each row's Status cell equals that file's frontmatter `status:`. The
//      index is the whole retrieval layer (ADR-004 rejected a search agent),
//      so it is also the single point of drift; both halves are asserted.
//   5. AGENT WIRING — EXACTLY the four ADR-004 agents (architect,
//      aws-platform, devsecops, operations) carry the patterns-INDEX
//      activation line, PROJECTED (the harness dir substituted, not the raw
//      {{HARNESS_DIR}} token) in every harness's dist. The negative half is
//      load-bearing: developer and architecture-reviewer wiring is DEFERRED to
//      v2, so their appearance here is a regression, not an improvement.
//
// Mechanism: none. Pure reads of the shipped dist bytes (the same trees the
// sibling structural pins t15/t87/t246 read) — no spawns, no LLM, zero tokens.
// Asserting over dist rather than core/ exercises the packager projection for
// free: a patterns tree that failed to ship, or a {{HARNESS_DIR}} token that
// failed to substitute, reds here.
//
// Conventions borrowed: t87's fence-aware whole-line heading walker (a heading
// buried in a code fence is documentation, not a section — and INDEX.md's own
// template block proves that distinction matters here), t246's dist-bytes
// prose-pin style, and fixtures.ts's one-copy constant posture
// (ORG_BOK_PATTERN_* — the shape lives in ONE place so this pin and the
// INDEX.md template cannot drift apart).
//
// FAULT INJECTION. EVERY shape rule — including the agent-wiring rule — is a
// pure function driven by a final "guards" block against synthetic faulty
// input, so each is demonstrably FAIL-CAPABLE and not merely
// satisfied-by-luck: a missing frontmatter field, an invalid status, a
// placeholder date, a missing section, a section that exists only inside a
// fence, a precedence header that is only body prose, an index row with no
// file, a file with no row, a status mismatch, a dropped wiring line, and a
// deferred agent wired early each red their own assertion.

import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  AIDLC_MEMORY_SRC,
  AIDLC_SRC,
  ORG_BOK_PATTERN_CLASSES,
  ORG_BOK_PATTERN_PRECEDENCE_PHRASES,
  ORG_BOK_PATTERN_SECTIONS,
  ORG_BOK_PATTERN_STATUSES,
} from "../harness/fixtures.ts";
import { HARNESS_MATRIX } from "../harness/harness-matrix.ts";
import { FENCE, flat, headingOutsideFence } from "../harness/text.ts";

// The patterns tree inside a harness's engine root (dist/<h>/<harnessDir>).
const patternsDir = (engineRoot: string): string =>
  join(engineRoot, "knowledge", "org-bok", "patterns");

// AIDLC_SRC === dist/claude/.claude — the canonical tree the page-shape and
// index-consistency assertions read (structure + wiring run across all five).
const PATTERNS_DIR = patternsDir(AIDLC_SRC);
const INDEX_PATH = join(PATTERNS_DIR, "INDEX.md");

// ---------------------------------------------------------------------------
// Pure shape rules. Every assertion below routes through one of these, and the
// "guards" block drives each with synthetic faulty input. The fence-aware
// heading walker itself is shared (tests/harness/text.ts) with t87, which
// originated it: INDEX.md documents the page template inside a fence, so "the
// heading exists somewhere in the bytes" is NOT the contract here either.
// ---------------------------------------------------------------------------

/** The raw YAML text of a leading `---` frontmatter block, or null if absent. */
function frontmatterBlock(body: string): string | null {
  const m = body.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  return m ? m[1] : null;
}

/** A `YYYY-MM-DD` that is also a real calendar date (rejects the template placeholder). */
function isRealDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

interface FrontmatterVerdict {
  status: string | null;
  reviewed: string | null;
  owner: string | null;
  problems: string[];
}

const DATE_PLACEHOLDER = "YYYY-MM-DD";

/**
 * ADR-003's frontmatter contract: `status` ∈ draft|blessed|deprecated,
 * `reviewed` a real date, `owner` non-empty. This is the rule for a real page;
 * `checkTemplateFrontmatter` below is the rule for the INDEX.md template block.
 */
function checkFrontmatter(body: string): FrontmatterVerdict {
  return checkFrontmatterFields(body, false);
}

/**
 * The same contract, relaxed on ONE point: the template's
 * `reviewed: YYYY-MM-DD` is a deliberate placeholder an author replaces, so it
 * is accepted here and nowhere else. Two named functions rather than a boolean
 * flag, because these are two rules over two different artifacts.
 */
function checkTemplateFrontmatter(body: string): FrontmatterVerdict {
  return checkFrontmatterFields(body, true);
}

function checkFrontmatterFields(body: string, allowDatePlaceholder: boolean): FrontmatterVerdict {
  const problems: string[] = [];
  const fm = frontmatterBlock(body);
  if (fm === null) {
    return { status: null, reviewed: null, owner: null, problems: ["no leading frontmatter block"] };
  }
  const field = (key: string): string | null => {
    const m = fm.match(new RegExp(`^${key}:[ \\t]*(.*)$`, "m"));
    return m ? m[1].trim() : null;
  };
  const status = field("status");
  const reviewed = field("reviewed");
  const owner = field("owner");

  if (status === null) problems.push("missing frontmatter field: status");
  else if (!ORG_BOK_PATTERN_STATUSES.includes(status)) {
    problems.push(`status "${status}" is not one of ${ORG_BOK_PATTERN_STATUSES.join("|")}`);
  }

  if (reviewed === null) problems.push("missing frontmatter field: reviewed");
  else if (!isRealDate(reviewed) && !(allowDatePlaceholder && reviewed === DATE_PLACEHOLDER)) {
    problems.push(`reviewed "${reviewed}" is not a ${DATE_PLACEHOLDER} date`);
  }

  if (owner === null) problems.push("missing frontmatter field: owner");
  else if (owner.length === 0) problems.push("frontmatter field owner is empty");

  return { status, reviewed, owner, problems };
}

/** The five ADR-004 section headings absent as REAL sections (outside fences). */
function missingSections(body: string): string[] {
  return ORG_BOK_PATTERN_SECTIONS.filter((h) => !headingOutsideFence(h, body));
}

/**
 * The ADR-002 standing header: the first contiguous run of blockquote lines
 * that appears BEFORE the first `## ` section, outside any fence. Returns null
 * when there is no such block.
 *
 * Position is load-bearing, not decorative. ADR-002 decision 3 wants a STANDING
 * header "so an agent reading a pattern in isolation knows to check the active
 * space's memory" — an agent that reads the top of a page must meet it there. A
 * whole-file substring scan would accept the same phrases scattered through
 * `## Our approach` and `## Gotchas` with no header at all, which is exactly the
 * page ADR-002 rejects.
 */
function precedenceHeaderBlock(body: string): string | null {
  const afterFrontmatter = body.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "");
  const quoted: string[] = [];
  let fenced = false;
  for (const rawLine of afterFrontmatter.split("\n")) {
    const line = rawLine.replace(/\r$/, "");
    if (line.startsWith(FENCE)) {
      fenced = !fenced;
      continue;
    }
    if (fenced) continue;
    if (line.startsWith("## ")) break; // a section began — the header's window closed.
    if (line.startsWith(">")) quoted.push(line);
    else if (quoted.length > 0) break; // the run ended.
  }
  return quoted.length > 0 ? quoted.join("\n") : null;
}

/** The ADR-002 precedence phrases absent from a page's STANDING header. */
function missingPrecedencePhrases(body: string): string[] {
  const header = precedenceHeaderBlock(body);
  if (header === null) return [...ORG_BOK_PATTERN_PRECEDENCE_PHRASES];
  const normalized = flat(header);
  return ORG_BOK_PATTERN_PRECEDENCE_PHRASES.filter((p) => !normalized.includes(p));
}

interface IndexRow {
  keywords: string;
  title: string;
  /** Link target, relative to INDEX.md: `<class>/<slug>.md`. */
  path: string;
  status: string;
}

// A Pattern cell: `[Title](<class>/<slug>.md)`, the class being one of the nine.
const LINK_CELL = new RegExp(
  `^\\[([^\\]]+)\\]\\(((?:${ORG_BOK_PATTERN_CLASSES.join("|")})/[a-z0-9-]+\\.md)\\)$`,
);

/**
 * Parse the INDEX's pattern rows: fence-aware (the template block is fenced),
 * and keyed off the Pattern cell's link so the table header, the `|---|`
 * separator, and the Classification table (whose cells are backticked
 * directory names, not links) are all skipped. Shape: keywords | link | status.
 */
function parseIndexRows(body: string): IndexRow[] {
  const rows: IndexRow[] = [];
  let fenced = false;
  for (const rawLine of body.split("\n")) {
    const line = rawLine.replace(/\r$/, "");
    if (line.startsWith(FENCE)) {
      fenced = !fenced;
      continue;
    }
    if (fenced || !line.startsWith("|")) continue;
    // "| a | b | c |" -> ["", "a", "b", "c", ""] -> the three content cells.
    const cells = line.split("|").map((c) => c.trim());
    const linkAt = cells.findIndex((c) => LINK_CELL.test(c));
    if (linkAt === -1) continue;
    const m = cells[linkAt].match(LINK_CELL);
    if (!m) continue;
    rows.push({
      keywords: cells[linkAt - 1] ?? "",
      title: m[1],
      path: m[2],
      status: cells[linkAt + 1] ?? "",
    });
  }
  return rows;
}

/**
 * Bidirectional INDEX↔file consistency. `statusOf` resolves a row's path to
 * that page's frontmatter status (null = the file does not exist), and
 * `pageePaths` is the set of pattern pages discovered on disk. Returns one
 * problem string per violation — empty means consistent.
 */
function indexConsistencyProblems(
  rows: IndexRow[],
  pagePaths: readonly string[],
  statusOf: (path: string) => string | null,
): string[] {
  const problems: string[] = [];
  const seen = new Map<string, number>();
  for (const row of rows) {
    seen.set(row.path, (seen.get(row.path) ?? 0) + 1);
    const fileStatus = statusOf(row.path);
    if (fileStatus === null) {
      problems.push(`INDEX row "${row.title}" points at ${row.path}, which does not exist`);
      continue;
    }
    if (row.status !== fileStatus) {
      problems.push(
        `INDEX row for ${row.path} says status "${row.status}" but the file's frontmatter says "${fileStatus}"`,
      );
    }
  }
  for (const [path, count] of seen) {
    if (count > 1) problems.push(`${path} appears in ${count} INDEX rows (expected exactly 1)`);
  }
  const indexed = new Set(rows.map((r) => r.path));
  for (const path of pagePaths) {
    if (!indexed.has(path)) {
      problems.push(`${path} ships but has no INDEX row — no agent will ever read it`);
    }
  }
  return problems;
}

/** Discover pattern pages under a patterns dir: every *.md except the root INDEX.md. */
function discoverPatternPages(dir: string): { rel: string; path: string }[] {
  const out: { rel: string; path: string }[] = [];
  const walk = (current: string, prefix: string): void => {
    for (const entry of readdirSync(current).sort()) {
      const full = join(current, entry);
      const rel = prefix ? `${prefix}/${entry}` : entry;
      if (statSync(full).isDirectory()) walk(full, rel);
      else if (entry.endsWith(".md") && rel !== "INDEX.md") out.push({ rel, path: full });
    }
  };
  walk(dir, "");
  return out;
}

/** The first ```md fenced block in a body — INDEX.md's page template. */
function fencedMdBlock(body: string): string | null {
  const m = body.match(/^```md\r?\n([\s\S]*?)^```/m);
  return m ? m[1] : null;
}

/**
 * The sorted names of the personas that carry the patterns-KB activation line.
 * A pure function over a name→body map so the wiring rule is driven by the
 * guards block with synthetic personas, exactly like the page-shape rules —
 * rather than being asserted only against the live tree, where "the rule can
 * fail" would be a claim by construction.
 */
function patternsReaders(personas: ReadonlyMap<string, string>): string[] {
  return [...personas.entries()]
    .filter(([, body]) => body.includes("org-bok/patterns"))
    .map(([name]) => name)
    .sort();
}

const INDEX_BODY = readFileSync(INDEX_PATH, "utf-8");
const PATTERN_PAGES = discoverPatternPages(PATTERNS_DIR);

// ---------------------------------------------------------------------------
// 1. Structure — the tree ships in every harness dist.
// ---------------------------------------------------------------------------
describe("t249 patterns KB structure — shipped by the packager to every harness", () => {
  for (const harness of HARNESS_MATRIX) {
    const dir = patternsDir(harness.engineRoot);

    test(`${harness.name}: ships knowledge/org-bok/patterns/INDEX.md`, () => {
      expect(existsSync(join(dir, "INDEX.md")), `${dir}/INDEX.md missing`).toBe(true);
    });

    test(`${harness.name}: ships EXACTLY the 9 ADR-001 class subdirectories`, () => {
      const subdirs = readdirSync(dir, { withFileTypes: true })
        .filter((e) => e.isDirectory())
        .map((e) => e.name)
        .sort();
      expect(subdirs).toEqual([...ORG_BOK_PATTERN_CLASSES].sort());
    });
  }

  test("the INDEX documents the row format and the admission rule in place", () => {
    // The INDEX is the authoring surface as well as the retrieval layer: an
    // author must find the row format and the admission rule where the rows
    // live, not only in docs/.
    const normalized = flat(INDEX_BODY);
    expect(normalized).toContain("One row per pattern page, one page per row");
    expect(normalized).toContain("Topic admission rule");
    // The status column is what lets an agent calibrate trust BEFORE opening a
    // file (ADR-003), so the header must carry it.
    const header = INDEX_BODY.split("\n").find((l) => l.startsWith("| Trigger keywords |"));
    expect(header).toBeDefined();
    expect(header).toContain("Pattern");
    expect(header).toContain("Status");
  });
});

// ---------------------------------------------------------------------------
// 2. Page shape — frontmatter, five sections, precedence header.
// ---------------------------------------------------------------------------
describe("t249 pattern pages — frontmatter, required sections, precedence header", () => {
  // Driven by whatever pages ship (the TEMPLATE block below independently
  // exercises the same rules, so this stayed honest while the KB was empty).
  // Pin the discovery so a page that ships is never silently skipped.
  test("every discovered pattern page is under one of the nine classes", () => {
    for (const { rel } of PATTERN_PAGES) {
      const cls = rel.split("/")[0];
      expect(ORG_BOK_PATTERN_CLASSES, `${rel} is not under a known class dir`).toContain(cls);
      expect(rel.split("/").length, `${rel} is nested deeper than <class>/<slug>.md`).toBe(2);
    }
  });

  for (const { rel, path } of PATTERN_PAGES) {
    const body = readFileSync(path, "utf-8");

    test(`${rel}: frontmatter carries valid status / reviewed / owner`, () => {
      expect(checkFrontmatter(body).problems).toEqual([]);
    });

    test(`${rel}: carries the five required sections outside fenced code`, () => {
      expect(missingSections(body)).toEqual([]);
    });

    test(`${rel}: carries the standing precedence header`, () => {
      expect(missingPrecedencePhrases(body)).toEqual([]);
    });
  }
});

// ---------------------------------------------------------------------------
// 3. Template honesty — INDEX.md's own template passes the page validators.
// ---------------------------------------------------------------------------
describe("t249 page template — what INDEX.md tells authors to write, this pin accepts", () => {
  const template = fencedMdBlock(INDEX_BODY);

  test("INDEX.md ships a fenced page template", () => {
    expect(template, "no ```md template block found in INDEX.md").not.toBeNull();
  });

  test("the template's frontmatter is valid (its reviewed: date is a declared placeholder)", () => {
    expect(checkTemplateFrontmatter(template as string).problems).toEqual([]);
  });

  test("the template's reviewed: placeholder is NOT accepted as a real date", () => {
    // Proves the date rule is real rather than trivially satisfied: the same
    // template that passes WITH the placeholder allowance fails without it.
    const problems = checkFrontmatter(template as string).problems;
    expect(problems).toEqual(['reviewed "YYYY-MM-DD" is not a YYYY-MM-DD date']);
  });

  test("the template carries all five sections and the precedence header", () => {
    expect(missingSections(template as string)).toEqual([]);
    expect(missingPrecedencePhrases(template as string)).toEqual([]);
  });

  test("the template's sections are fenced inside INDEX.md, so INDEX.md is not itself a page", () => {
    // The five headings appear in INDEX.md's bytes only inside the template
    // fence. If a future edit unfences them, INDEX.md starts reading as a
    // pattern page — this is the t87 fence-guard invariant, applied here.
    for (const heading of ORG_BOK_PATTERN_SECTIONS) {
      expect(INDEX_BODY, `${heading} should be documented in INDEX.md`).toContain(heading);
      expect(
        headingOutsideFence(heading, INDEX_BODY),
        `${heading} must stay inside the template fence in INDEX.md`,
      ).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------
// 4. INDEX ↔ file consistency, both directions.
// ---------------------------------------------------------------------------
describe("t249 INDEX ↔ file consistency — every row has a file, every file has a row", () => {
  const rows = parseIndexRows(INDEX_BODY);
  const statusOf = (rel: string): string | null => {
    const full = join(PATTERNS_DIR, rel);
    if (!existsSync(full)) return null;
    return checkFrontmatter(readFileSync(full, "utf-8")).status;
  };

  test("no drift in either direction (row→file, file→row, status agreement)", () => {
    expect(
      indexConsistencyProblems(
        rows,
        PATTERN_PAGES.map((p) => p.rel),
        statusOf,
      ),
    ).toEqual([]);
  });

  test("every row carries non-empty trigger keywords and a valid status", () => {
    for (const row of rows) {
      expect(row.keywords.length, `${row.path}: empty trigger keywords`).toBeGreaterThan(0);
      expect(ORG_BOK_PATTERN_STATUSES, `${row.path}: status "${row.status}"`).toContain(row.status);
    }
  });

  test("the row parser skips the classification table and the fenced template", () => {
    // Both live in INDEX.md today; a parser that swallowed either would make
    // the consistency check above lie. Assert the parsed SET, not just the
    // count: a count alone would accept a parser that dropped a real row and
    // gained a phantom one in the same pass. The guards block drives this same
    // parser with synthetic classification/fenced/unknown-class rows.
    expect(rows.map((r) => r.path).sort()).toEqual(PATTERN_PAGES.map((p) => p.rel).sort());
  });
});

// ---------------------------------------------------------------------------
// 5. Agent wiring — exactly four agents, projected in every harness.
// ---------------------------------------------------------------------------
const WIRED_AGENTS = [
  "aidlc-architect-agent",
  "aidlc-aws-platform-agent",
  "aidlc-devsecops-agent",
  "aidlc-operations-agent",
] as const;

// ADR-004 defers these two to v2 — they have no v1 content to consume, and
// wiring them costs standing context for nothing.
const DEFERRED_AGENTS = ["aidlc-developer-agent", "aidlc-architecture-reviewer-agent"] as const;

describe("t249 agent wiring — exactly the four ADR-004 agents read the patterns INDEX", () => {
  for (const harness of HARNESS_MATRIX) {
    const agentsDir = join(harness.engineRoot, "agents");
    const personas = new Map(
      readdirSync(agentsDir)
        .filter((f) => f.startsWith("aidlc-") && f.endsWith(".md"))
        .map((f) => [f.replace(/\.md$/, ""), readFileSync(join(agentsDir, f), "utf-8")]),
    );

    test(`${harness.name}: EXACTLY the 4 wired agents reference org-bok/patterns`, () => {
      expect(patternsReaders(personas)).toEqual([...WIRED_AGENTS].sort());
    });

    test(`${harness.name}: developer + architecture-reviewer stay UNWIRED (v2)`, () => {
      for (const name of DEFERRED_AGENTS) {
        const body = personas.get(name);
        expect(body, `${name}.md missing from ${agentsDir}`).toBeDefined();
        expect(
          (body as string).includes("org-bok/patterns"),
          `${name} must not read the patterns KB until v2`,
        ).toBe(false);
      }
    });

    test(`${harness.name}: the activation line is PROJECTED, not the raw token`, () => {
      for (const name of WIRED_AGENTS) {
        const body = personas.get(name) as string;
        // The path carries this harness's dir, substituted by the packager.
        expect(body, `${name}: unprojected path`).toContain(
          `${harness.manifest.harnessDir}/knowledge/org-bok/patterns/INDEX.md`,
        );
        // ...and no {{HARNESS_DIR}} token survived anywhere in the file.
        expect(body.includes("{{HARNESS_DIR}}"), `${name}: raw token shipped`).toBe(false);
      }
    });

    test(`${harness.name}: the line instructs INDEX-first, task-relevant opening`, () => {
      for (const name of WIRED_AGENTS) {
        const normalized = flat(personas.get(name) as string);
        // The whole point of ADR-004's "no search agent": read the small index,
        // then open ONLY what the task matches — never the whole directory.
        expect(normalized, `${name}: no relevance instruction`).toContain(
          "open only the pattern files relevant to the current task",
        );
        // Trust calibration travels with the line (ADR-003): draft is advisory.
        expect(normalized, `${name}: no draft/blessed calibration`).toContain(
          "a `draft` pattern is advisory",
        );
      }
    });
  }

  test("org.md delegates architecture-patterns authority to the KB (ADR-002)", () => {
    // The rule layer names the KB as the authority without duplicating it —
    // the same delegation shape as the existing Code Style pointer, including
    // the affirmed-memory-overrides exception semantics.
    const orgMd = join(AIDLC_MEMORY_SRC, "spaces", "default", "memory", "org.md");
    const normalized = flat(readFileSync(orgMd, "utf-8"));
    expect(normalized).toContain("## Architecture Patterns");
    expect(normalized).toContain("knowledge/org-bok/patterns/INDEX.md");
    expect(normalized).toContain("Affirmed memory rules override the KB");
    expect(normalized).toContain("documented exception");
  });
});

// ---------------------------------------------------------------------------
// Guards — each rule is demonstrably FAIL-CAPABLE (fault injection).
// ---------------------------------------------------------------------------
describe("t249 guards — every shape rule rejects its own violation", () => {
  const GOOD_PAGE = [
    "---",
    "status: blessed",
    "reviewed: 2026-07-30",
    "owner: p.lysanets",
    "---",
    "",
    "# Connection pooling",
    "",
    "> **Precedence:** this pattern is the org-wide default for the decision it",
    "> covers. An affirmed rule overrides it as a documented exception. `blessed`",
    "> binds; `draft` is advisory, so verify before relying on it.",
    "",
    ...ORG_BOK_PATTERN_SECTIONS.flatMap((h) => [h, "", "Prose.", ""]),
  ].join("\n");

  test("the synthetic good page passes every rule (the control)", () => {
    expect(checkFrontmatter(GOOD_PAGE).problems).toEqual([]);
    expect(missingSections(GOOD_PAGE)).toEqual([]);
    expect(missingPrecedencePhrases(GOOD_PAGE)).toEqual([]);
  });

  test("a missing frontmatter field is rejected", () => {
    for (const field of ["status", "reviewed", "owner"]) {
      const broken = GOOD_PAGE.replace(new RegExp(`^${field}:.*\n`, "m"), "");
      expect(checkFrontmatter(broken).problems).toContain(`missing frontmatter field: ${field}`);
    }
  });

  test("a missing frontmatter BLOCK is rejected", () => {
    const broken = GOOD_PAGE.split("---").slice(2).join("---");
    expect(checkFrontmatter(broken).problems).toEqual(["no leading frontmatter block"]);
  });

  test("an unknown status value is rejected", () => {
    const broken = GOOD_PAGE.replace("status: blessed", "status: probably-fine");
    expect(checkFrontmatter(broken).problems).toEqual([
      'status "probably-fine" is not one of draft|blessed|deprecated',
    ]);
  });

  test("a non-date reviewed value is rejected (incl. the copied placeholder)", () => {
    for (const bad of ["YYYY-MM-DD", "soon", "2026-13-45", "30-07-2026"]) {
      const broken = GOOD_PAGE.replace("reviewed: 2026-07-30", `reviewed: ${bad}`);
      expect(checkFrontmatter(broken).problems).toEqual([
        `reviewed "${bad}" is not a YYYY-MM-DD date`,
      ]);
    }
  });

  test("an empty owner is rejected", () => {
    const broken = GOOD_PAGE.replace("owner: p.lysanets", "owner:");
    expect(checkFrontmatter(broken).problems).toEqual(["frontmatter field owner is empty"]);
  });

  test("a missing section is rejected, naming which one", () => {
    for (const heading of ORG_BOK_PATTERN_SECTIONS) {
      const broken = GOOD_PAGE.replace(`${heading}\n`, "");
      expect(missingSections(broken)).toEqual([heading]);
    }
  });

  test("a section that exists ONLY inside a code fence does not count", () => {
    const fencedOnly = [
      GOOD_PAGE.replace("## Gotchas\n", ""),
      `${FENCE}md`,
      "## Gotchas",
      FENCE,
    ].join("\n");
    expect(missingSections(fencedOnly)).toEqual(["## Gotchas"]);
    // Whole-line equality, as in t87: a heading with trailing text is not it.
    const trailing = GOOD_PAGE.replace("## Gotchas", "## Gotchas and scars");
    expect(missingSections(trailing)).toEqual(["## Gotchas"]);
  });

  test("a page without the precedence header is rejected", () => {
    const broken = GOOD_PAGE.split("\n")
      .filter((l) => !l.startsWith(">"))
      .join("\n");
    expect(precedenceHeaderBlock(broken)).toBeNull();
    expect(missingPrecedencePhrases(broken)).toEqual([...ORG_BOK_PATTERN_PRECEDENCE_PHRASES]);
  });

  test("the precedence phrases scattered in BODY prose do not count as a header", () => {
    // ADR-002 decision 3 wants a STANDING header an agent meets at the top of
    // the page. A page that says all the right words halfway down `## Gotchas`
    // — and nowhere above the first section — has not carried it.
    const scattered = GOOD_PAGE.split("\n")
      .filter((l) => !l.startsWith(">"))
      .join("\n")
      .replace(
        "## Gotchas",
        "## Gotchas\n\nThis is the org-wide default; a documented exception may deviate, and draft is advisory.",
      );
    expect(precedenceHeaderBlock(scattered)).toBeNull();
    expect(missingPrecedencePhrases(scattered)).toEqual([...ORG_BOK_PATTERN_PRECEDENCE_PHRASES]);
  });

  test("a quote block BELOW the first section is not the standing header", () => {
    const late = GOOD_PAGE.split("\n")
      .filter((l) => !l.startsWith(">"))
      .join("\n")
      .replace("## Gotchas", "## Gotchas\n\n> the org-wide default, a documented exception, advisory");
    expect(precedenceHeaderBlock(late)).toBeNull();
  });

  test("a header missing ONE phrase is rejected, naming that phrase", () => {
    for (const phrase of ORG_BOK_PATTERN_PRECEDENCE_PHRASES) {
      const broken = GOOD_PAGE.replace(phrase, "REDACTED");
      expect(missingPrecedencePhrases(broken)).toEqual([phrase]);
    }
  });

  test("an INDEX row with no file is rejected", () => {
    const rows = parseIndexRows(
      "| pool, RDS Proxy | [Pooling](data-layer/connection-pooling.md) | blessed |",
    );
    expect(rows.length).toBe(1);
    expect(indexConsistencyProblems(rows, [], () => null)).toEqual([
      "INDEX row \"Pooling\" points at data-layer/connection-pooling.md, which does not exist",
    ]);
  });

  test("a pattern file with no INDEX row is rejected", () => {
    expect(indexConsistencyProblems([], ["data-layer/read-replicas.md"], () => "blessed")).toEqual([
      "data-layer/read-replicas.md ships but has no INDEX row — no agent will ever read it",
    ]);
  });

  test("a status mismatch between row and frontmatter is rejected", () => {
    const rows = parseIndexRows(
      "| jwt, tenant | [JWT tenant isolation](multi-tenancy/jwt-tenant-isolation.md) | blessed |",
    );
    expect(
      indexConsistencyProblems(rows, ["multi-tenancy/jwt-tenant-isolation.md"], () => "draft"),
    ).toEqual([
      'INDEX row for multi-tenancy/jwt-tenant-isolation.md says status "blessed" but the file\'s frontmatter says "draft"',
    ]);
  });

  test("a file indexed twice is rejected", () => {
    const row = "| a | [Pooling](data-layer/connection-pooling.md) | blessed |";
    const rows = parseIndexRows([row, row].join("\n"));
    expect(rows.length).toBe(2);
    expect(
      indexConsistencyProblems(rows, ["data-layer/connection-pooling.md"], () => "blessed"),
    ).toContain("data-layer/connection-pooling.md appears in 2 INDEX rows (expected exactly 1)");
  });

  test("the row parser ignores non-pattern table rows and fenced rows", () => {
    const body = [
      "| Trigger keywords | Pattern | Status |",
      "|------------------|---------|--------|",
      "| `data-layer/` | Relational access |", // the classification table
      "| x | [Exemplar](../../exemplars/foo/profile.md) | blessed |", // not a pattern link
      "| y | [Nope](unknown-class/thing.md) | blessed |", // class not in the nine
      `${FENCE}md`,
      "| fenced | [Pooling](data-layer/connection-pooling.md) | blessed |",
      FENCE,
      "| real | [Replicas](data-layer/read-replicas.md) | draft |",
    ].join("\n");
    const rows = parseIndexRows(body);
    expect(rows.map((r) => r.path)).toEqual(["data-layer/read-replicas.md"]);
    expect(rows[0]).toEqual({
      keywords: "real",
      title: "Replicas",
      path: "data-layer/read-replicas.md",
      status: "draft",
    });
  });

  // The wiring rule, driven by patternsReaders() over synthetic personas — the
  // same function the live assertions use, so "a missing wiring line reds" is
  // demonstrated rather than asserted by construction.
  const WIRING_LINE = "Also read `.claude/knowledge/org-bok/patterns/INDEX.md` (if exists) and ...";
  const GUIDES_ONLY = "Also read `.claude/knowledge/org-bok/guides/code-style.md` ...";
  const syntheticPersonas = (wired: readonly string[]): Map<string, string> =>
    new Map(
      [...WIRED_AGENTS, ...DEFERRED_AGENTS, "aidlc-product-agent"].map((name) => [
        name,
        wired.includes(name) ? WIRING_LINE : GUIDES_ONLY,
      ]),
    );

  test("the wiring predicate accepts exactly the four wired personas (the control)", () => {
    expect(patternsReaders(syntheticPersonas(WIRED_AGENTS))).toEqual([...WIRED_AGENTS].sort());
  });

  test("a MISSING wiring line on any of the four reds the wiring rule", () => {
    for (const dropped of WIRED_AGENTS) {
      const personas = syntheticPersonas(WIRED_AGENTS.filter((n) => n !== dropped));
      expect(patternsReaders(personas), `dropping ${dropped} must red`).not.toEqual([
        ...WIRED_AGENTS,
      ].sort());
    }
  });

  test("an EXTRA wiring line on a deferred persona reds the wiring rule", () => {
    for (const added of DEFERRED_AGENTS) {
      const personas = syntheticPersonas([...WIRED_AGENTS, added]);
      expect(patternsReaders(personas), `wiring ${added} early must red`).not.toEqual([
        ...WIRED_AGENTS,
      ].sort());
    }
  });
});