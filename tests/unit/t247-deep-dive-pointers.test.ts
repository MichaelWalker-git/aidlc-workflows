// covers: file:aidlc-common/stages/ideation/precedent-research.md, file:agents/aidlc-research-agent.md, file:knowledge/aidlc-research-agent/precedent-research-method.md, file:knowledge/org-bok/exemplars/sample-internal-developer-platform/profile.md
// covers: file:aidlc-common/stages/ideation/feasibility.md, file:aidlc-common/stages/ideation/rough-mockups.md, file:aidlc-common/stages/inception/refined-mockups.md, file:aidlc-common/stages/inception/application-design.md, file:aidlc-common/stages/construction/code-generation.md
// covers: stage:ideation/precedent-research, stage:ideation/feasibility, stage:ideation/rough-mockups, stage:inception/refined-mockups, stage:inception/application-design, stage:construction/code-generation
//
// t247 — deep-dive pointers with graceful degradation (org-bok issue #04,
// ADR-007). Markdown-first, deep dive opt-in: profiles carry the exemplar
// repo's git URL + notable paths in frontmatter; the research agent MAY
// consult them while composing the brief; downstream consumers MAY fetch a
// pointed-at file when the brief's deep-dive pointers say it helps — with the
// session's ambient git credentials, no new auth machinery. A failed fetch
// degrades to a "deep dive unavailable" note and is NEVER a stage failure.
//
// Three pinned surfaces:
//
//   1. The pointer fields flow end to end: the fixture profile's frontmatter
//      carries repo_url + notable_paths (field shape is t246's pin; here we
//      pin that the paths are repo-relative, not URLs), and the producer's
//      brief contract states that `## Deep-Dive Pointers` carries the repo
//      URLs and notable file paths through to consumers.
//
//   2. Every statement of the deep dive on the PRODUCER side — the stage's
//      Step 5, the research-agent persona, the method doc, and the fixture
//      profile's own Deep-Dive Pointers section — carries the full
//      degradation triad: ambient/session git credentials (no new auth),
//      the "deep dive unavailable" note, and "never a stage failure".
//
//   3. Every downstream consumer of the brief (the five spliced steps from
//      issue #02) carries the OPT-IN fetch guidance ("MAY fetch", advisory)
//      plus the same degradation triad — so no consumer can read the
//      pointers as a hard dependency.
//
// Explicitly NOT tested: fetching from a real credentialed repo (out of
// deterministic scope per the spec — behavior varies with session git
// access). Mechanism: none. Pure reads of the shipped dist bytes — no
// spawns, no network, no LLM.

import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { AIDLC_SRC } from "../harness/fixtures.ts";

const STAGES_DIR = join(AIDLC_SRC, "aidlc-common", "stages");

/** Read a shipped file and return its whitespace-normalized form. */
function flat(path: string): string {
  return readFileSync(path, "utf-8").replace(/\s+/g, " ");
}

// The degradation triad every deep-dive statement must carry (ADR-007):
// opt-in fetch with the session's existing git credentials, the note wording,
// and the never-a-stage-failure invariant.
const DEGRADE_NOTE = /["“]deep dive unavailable["”]/i;
const NEVER_FAILS = /never a stage failure/i;
const AMBIENT_CREDS = /(ambient git credentials|git credentials the session already has)/i;

const FIXTURE_PROFILE = join(
  AIDLC_SRC,
  "knowledge",
  "org-bok",
  "exemplars",
  "sample-internal-developer-platform",
  "profile.md",
);

// Producer-side statements of the deep dive.
const PRODUCER_SURFACES: Array<[string, string]> = [
  [
    "precedent-research stage (Step 5)",
    join(STAGES_DIR, "ideation", "precedent-research.md"),
  ],
  ["research-agent persona", join(AIDLC_SRC, "agents", "aidlc-research-agent.md")],
  [
    "precedent-research method doc",
    join(AIDLC_SRC, "knowledge", "aidlc-research-agent", "precedent-research-method.md"),
  ],
  ["fixture exemplar profile", FIXTURE_PROFILE],
];

// The five downstream consumers (issue #02's spliced steps) — slug, phase.
const CONSUMERS: Array<[string, string]> = [
  ["feasibility", "ideation"],
  ["rough-mockups", "ideation"],
  ["refined-mockups", "inception"],
  ["application-design", "inception"],
  ["code-generation", "construction"],
];

describe("t247 pointer fields flow end to end (mechanism: none)", () => {
  test("the fixture profile's notable_paths are repo-relative paths, not URLs (the repo_url is the single fetch root)", () => {
    const raw = readFileSync(FIXTURE_PROFILE, "utf-8");
    const fm = raw.split("---")[1] ?? "";
    // Scope the scrape to the notable_paths block: list items until the next
    // top-level key, so a future second list field can't leak in.
    const block = fm.match(/notable_paths:\s*\n((?:\s+-\s*\S+\s*\n?)+)/)?.[1] ?? "";
    const paths = [...block.matchAll(/^\s*-\s*(\S+)\s*$/gm)].map((m) => m[1]);
    expect(paths.length).toBeGreaterThan(0);
    for (const p of paths) {
      expect(p, `notable path "${p}" is repo-relative`).not.toMatch(
        /^[a-z]+:\/\//i,
      );
      expect(p, `notable path "${p}" is not absolute`).not.toMatch(/^\//);
    }
  });

  test("the brief contract carries the repo URLs and notable file paths through to consumers", () => {
    const src = flat(join(STAGES_DIR, "ideation", "precedent-research.md"));
    // The `## Deep-Dive Pointers` contract bullet names both halves of the
    // pointer — this is what makes the pointers reach consumers who never
    // read raw profiles.
    expect(src).toMatch(
      /`## Deep-Dive Pointers`[^`]*repo URLs and notable file paths/,
    );
  });
});

describe("t247 producer-side degradation wording (ADR-007 triad)", () => {
  for (const [label, path] of PRODUCER_SURFACES) {
    test(`${label} carries the full triad: opt-in creds, the note, never-a-failure`, () => {
      const src = flat(path);
      expect(src, `${label}: ambient-credentials wording`).toMatch(
        AMBIENT_CREDS,
      );
      expect(src, `${label}: the degradation note`).toMatch(DEGRADE_NOTE);
      expect(src, `${label}: never a stage failure`).toMatch(NEVER_FAILS);
    });
  }
});

describe("t247 consumer-side opt-in fetch guidance + degradation (never a hard dependency)", () => {
  for (const [slug, phase] of CONSUMERS) {
    const src = flat(join(STAGES_DIR, phase, `${slug}.md`));

    test(`${slug} names the brief's deep-dive pointers and frames the fetch as opt-in (MAY)`, () => {
      expect(src.toLowerCase()).toContain("deep-dive pointers");
      // Advisory, RFC-style opt-in — a "fetch the files" imperative would
      // turn the pointers into the hard dependency ADR-007 rejects.
      expect(src).toMatch(/MAY fetch/);
    });

    test(`${slug} carries the degradation triad`, () => {
      expect(src, `${slug}: ambient-credentials wording`).toMatch(
        AMBIENT_CREDS,
      );
      expect(src, `${slug}: the degradation note`).toMatch(DEGRADE_NOTE);
      expect(src, `${slug}: never a stage failure`).toMatch(NEVER_FAILS);
    });
  }

  test("code-generation forwards the deep-dive pointers into the developer-subagent delegation prompt", () => {
    const src = flat(join(STAGES_DIR, "construction", "code-generation.md"));
    // The subagent generates the code; pointers it never receives are
    // pointers nobody fetches. Same conditional shape as the UI directives:
    // omitted when precedent-research was skipped.
    expect(src).toMatch(/delegation prompt.*deep-dive pointers/i);
  });
});
