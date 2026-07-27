// covers: function:hasOrgBokPrecedent, subcommand:aidlc-utility:intent-birth
//
// t244 — the deterministic Org BoK gate predicate for precedent-research.
//
// Mechanism: none for the predicate itself (pure function, driven in-process
// via the AIDLC_ORG_BOK_INDEX env seam), cli for the routing wiring (the
// intent-birth spawn is the seam where the predicate pre-marks the stage
// SKIP; mirrors t61's per-project spawn posture).
//
// The predicate contract (aidlc-lib.ts hasOrgBokPrecedent): true iff the
// curated index file EXISTS and links at least one exemplar profile
// (`exemplars/<slug>/profile.md`). Three boolean seams pinned per the spec:
//   1. no index file at all            -> false
//   2. index present, no exemplar link -> false
//   3. well-formed index (>=1 link)    -> true
// Plus the shipped-tree default: the packaged dist carries the fixture
// exemplar, so the predicate is TRUE against the shipped bytes.
//
// The wiring proof drives the REAL intent-birth on two temp projects (BoK
// present / BoK stripped) and asserts the state file's precedent-research
// suffix flips EXECUTE/SKIP — the same observable the orchestrate-next
// routing walks (nextInScopeStage honours the suffix), so the directive-path
// behavior is pinned at its deterministic source.

import { afterEach, describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { hasOrgBokPrecedent } from "../../core/tools/aidlc-lib.ts";
import { setupIntegrationProject } from "../harness/fixtures.ts";

// The state file of the intent birth just created: the record dir under
// aidlc/spaces/default/intents/ that carries an aidlc-state.md. The seeded
// fixture record (fixture-<id8>) ships empty, and readdirSync order is
// filesystem-dependent, so filter on the state file rather than taking the
// first directory.
function bornStateFile(proj: string): string {
  const intentsDir = join(proj, "aidlc", "spaces", "default", "intents");
  const record = readdirSync(intentsDir, { withFileTypes: true }).find(
    (e) =>
      e.isDirectory() &&
      existsSync(join(intentsDir, e.name, "aidlc-state.md")),
  );
  expect(record).toBeDefined();
  return readFileSync(
    join(intentsDir, record?.name ?? "", "aidlc-state.md"),
    "utf-8",
  );
}

const BUN = process.execPath;

let tmp: string | null = null;
const projects: string[] = [];

afterEach(() => {
  if (tmp) rmSync(tmp, { recursive: true, force: true });
  tmp = null;
  delete process.env.AIDLC_ORG_BOK_INDEX;
  for (const p of projects.splice(0)) rmSync(p, { recursive: true, force: true });
});

describe("t244 hasOrgBokPrecedent — the three predicate seams (mechanism: none)", () => {
  test("1: missing index file -> false", () => {
    tmp = mkdtempSync(join(tmpdir(), "bok-gate-"));
    process.env.AIDLC_ORG_BOK_INDEX = join(tmp, "does-not-exist.md");
    expect(hasOrgBokPrecedent()).toBe(false);
  });

  test("2a: empty index file -> false", () => {
    tmp = mkdtempSync(join(tmpdir(), "bok-gate-"));
    const index = join(tmp, "index.md");
    writeFileSync(index, "", "utf-8");
    process.env.AIDLC_ORG_BOK_INDEX = index;
    expect(hasOrgBokPrecedent()).toBe(false);
  });

  test("2b: index with prose but no exemplar profile link -> false", () => {
    tmp = mkdtempSync(join(tmpdir(), "bok-gate-"));
    const index = join(tmp, "index.md");
    writeFileSync(
      index,
      "# Org BoK — Exemplar Index\n\nNo exemplars distilled yet.\n\n| Exemplar | Use when… |\n|---|---|\n",
      "utf-8",
    );
    process.env.AIDLC_ORG_BOK_INDEX = index;
    expect(hasOrgBokPrecedent()).toBe(false);
  });

  test("2c: index whose prose quotes the literal `exemplars/<slug>/profile.md` placeholder -> false", () => {
    // The shipped index's "Maintaining this index" section quotes the link
    // shape verbatim; only a real markdown-link target may satisfy the gate.
    tmp = mkdtempSync(join(tmpdir(), "bok-gate-"));
    const index = join(tmp, "index.md");
    writeFileSync(
      index,
      "# Org BoK — Exemplar Index\n\nOne row per exemplar; the first column links `exemplars/<slug>/profile.md`.\n\n| Exemplar | Use when… |\n|---|---|\n",
      "utf-8",
    );
    process.env.AIDLC_ORG_BOK_INDEX = index;
    expect(hasOrgBokPrecedent()).toBe(false);
  });

  test("3: well-formed index with one exemplar profile link -> true", () => {
    tmp = mkdtempSync(join(tmpdir(), "bok-gate-"));
    const index = join(tmp, "index.md");
    writeFileSync(
      index,
      "# Org BoK — Exemplar Index\n\n| Exemplar | Use when… |\n|---|---|\n| [idp](exemplars/idp/profile.md) | IDP asks |\n",
      "utf-8",
    );
    process.env.AIDLC_ORG_BOK_INDEX = index;
    expect(hasOrgBokPrecedent()).toBe(true);
  });

  test("4: the shipped dist carries a gate-satisfying index (fixture exemplar)", () => {
    // No env seam: resolves against the packaged tree via the test runner's
    // default harness-root resolution — the shipped skeleton must keep the
    // stage live on a stock install.
    expect(hasOrgBokPrecedent()).toBe(true);
  });
});

describe("t244 intent-birth wiring — the gate pre-marks the plan (mechanism: cli)", () => {
  // Drive the REAL per-project intent-birth so the predicate runs inside the
  // spawned tool against that project's .claude/knowledge tree (per-project
  // resolution, same posture as t61's consumer proofs).
  function birth(proj: string): void {
    const res = spawnSync(
      BUN,
      [
        join(proj, ".claude", "tools", "aidlc-utility.ts"),
        "intent-birth",
        "--scope",
        "enterprise",
        "--arguments",
        "org-bok gate wiring test",
      ],
      { encoding: "utf-8", cwd: proj },
    );
    expect(res.status).toBe(0);
  }

  test("BoK present -> precedent-research stays EXECUTE and is the stage after intent-capture", () => {
    const proj = setupIntegrationProject();
    projects.push(proj);
    birth(proj);
    const state = bornStateFile(proj);
    expect(state).toMatch(/^- \[ \] precedent-research — EXECUTE$/m);
    expect(state).toContain("**Next Stage**: precedent-research");
  });

  test("BoK absent -> precedent-research pre-marked SKIP with the no-index annotation", () => {
    const proj = setupIntegrationProject();
    projects.push(proj);
    rmSync(join(proj, ".claude", "knowledge", "org-bok"), {
      recursive: true,
      force: true,
    });
    birth(proj);
    const state = bornStateFile(proj);
    expect(state).toMatch(/^- \[ \] precedent-research — SKIP$/m);
    expect(state).toContain("(precedent-research — no org-bok index)");
    // Routing proceeds past the gated stage: the plan's next stage after
    // intent-capture is market-research, not the skipped precedent stage.
    expect(state).not.toContain("**Next Stage**: precedent-research");
  });

  test("BoK index without exemplar entries -> precedent-research pre-marked SKIP", () => {
    const proj = setupIntegrationProject();
    projects.push(proj);
    const index = join(proj, ".claude", "knowledge", "org-bok", "index.md");
    writeFileSync(index, "# Org BoK — Exemplar Index\n\nNo exemplars yet.\n", "utf-8");
    rmSync(join(proj, ".claude", "knowledge", "org-bok", "exemplars"), {
      recursive: true,
      force: true,
    });
    birth(proj);
    const state = bornStateFile(proj);
    expect(state).toMatch(/^- \[ \] precedent-research — SKIP$/m);
  });
});

describe("t244 orchestrator-directive seam — both gate paths through `next` (mechanism: cli)", () => {
  // Complete intent-capture in the born state, then drive the REAL
  // orchestrate-next engine: the emitted run-stage directive is the routing
  // observable (mirrors t114's directive-table posture).
  function completeIntentCapture(proj: string): void {
    const intentsDir = join(proj, "aidlc", "spaces", "default", "intents");
    const record = readdirSync(intentsDir, { withFileTypes: true }).find((e) =>
      e.isDirectory(),
    );
    expect(record).toBeDefined();
    const statePath = join(intentsDir, record?.name ?? "", "aidlc-state.md");
    const flipped = readFileSync(statePath, "utf-8").replace(
      "- [-] intent-capture — EXECUTE",
      "- [x] intent-capture — EXECUTE",
    );
    writeFileSync(statePath, flipped, "utf-8");
  }

  function runNext(proj: string): string {
    const res = spawnSync(
      BUN,
      [
        join(proj, ".claude", "tools", "aidlc-orchestrate.ts"),
        "next",
        "--project-dir",
        proj,
      ],
      { encoding: "utf-8", cwd: proj },
    );
    return `${res.stdout ?? ""}${res.stderr ?? ""}`;
  }

  function birthEnterprise(proj: string): void {
    const res = spawnSync(
      BUN,
      [
        join(proj, ".claude", "tools", "aidlc-utility.ts"),
        "intent-birth",
        "--scope",
        "enterprise",
        "--arguments",
        "org-bok directive test",
      ],
      { encoding: "utf-8", cwd: proj },
    );
    expect(res.status).toBe(0);
  }

  test("BoK present: directive after intent-capture is run-stage precedent-research led by the research agent", () => {
    const proj = setupIntegrationProject();
    projects.push(proj);
    birthEnterprise(proj);
    completeIntentCapture(proj);
    const out = runNext(proj);
    expect(out).toContain('"kind":"run-stage"');
    expect(out).toContain('"stage":"precedent-research"');
    expect(out).toContain('"lead_agent":"aidlc-research-agent"');
  });

  test("BoK absent: directive after intent-capture skips to market-research", () => {
    const proj = setupIntegrationProject();
    projects.push(proj);
    rmSync(join(proj, ".claude", "knowledge", "org-bok"), {
      recursive: true,
      force: true,
    });
    birthEnterprise(proj);
    completeIntentCapture(proj);
    const out = runNext(proj);
    expect(out).toContain('"kind":"run-stage"');
    expect(out).toContain('"stage":"market-research"');
    expect(out).not.toContain('"stage":"precedent-research"');
  });
});