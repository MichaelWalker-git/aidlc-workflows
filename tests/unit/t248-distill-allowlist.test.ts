// covers: function:isDistillTargetAllowed, function:distillAllowlistPath, subcommand:aidlc-utility:distill-check
//
// t248 — the deterministic distill-allowlist match predicate for the
// /aidlc-distill session skill's step 0.
//
// Mechanism: none for the predicate itself (pure function, driven in-process
// via the AIDLC_DISTILL_ALLOWLIST env seam — the same posture as t244's
// AIDLC_ORG_BOK_INDEX), cli for the skill-facing wiring (the spawned
// `aidlc-utility distill-check` is the seam the SKILL.md's step 0 invokes;
// its exit code is what gates repo access).
//
// The predicate contract (aidlc-lib.ts isDistillTargetAllowed): true iff the
// curated allowlist file EXISTS, carries a frontmatter `allowed:` list, and an
// entry matches the target after normalization (backslashes → `/`, trailing
// `/` and `.git` dropped). Entries may be exact URLs/paths or `*` globs.
// Fail-closed: missing file, no frontmatter, or an empty list denies every
// target. The seams pinned per ticket 05:
//   1. missing allowlist file              -> false
//   2. allowlist present, empty list       -> false
//   3. exact-URL match                     -> true (incl. .git// normalization)
//   4. glob match                          -> true
//   5. non-matching target                 -> false
// Plus the shipped-tree default: the packaged allowlist carries the curated
// org repo entries, so a listed repo is TRUE against the shipped bytes.
//
// The wiring proof spawns the REAL `aidlc-utility distill-check` against a
// fixture allowlist and asserts the exit-code + message contract the skill's
// step 0 depends on: exit 0 for an allowed target, exit 1 plus a pointer at
// the allowlist file for a denied one.

import { afterEach, describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  distillAllowlistPath,
  isDistillTargetAllowed,
} from "../../core/tools/aidlc-lib.ts";
import { AIDLC_SRC, ORG_BOK_PROFILE_SECTIONS } from "../harness/fixtures.ts";

const BUN = process.execPath;
const UTILITY = join(AIDLC_SRC, "tools", "aidlc-utility.ts");
const DISTILL_SKILL = join(AIDLC_SRC, "skills", "aidlc-distill", "SKILL.md");

let tmp: string | null = null;

afterEach(() => {
  if (tmp) rmSync(tmp, { recursive: true, force: true });
  tmp = null;
  delete process.env.AIDLC_DISTILL_ALLOWLIST;
});

/** Write a fixture allowlist under a fresh temp dir and point the env seam at it. */
function seedAllowlist(content: string): string {
  tmp = mkdtempSync(join(tmpdir(), "distill-allow-"));
  const file = join(tmp, "distill-allowlist.md");
  writeFileSync(file, content, "utf-8");
  process.env.AIDLC_DISTILL_ALLOWLIST = file;
  return file;
}

const WELL_FORMED = [
  "---",
  "allowed:",
  "  - https://git.example.com/org/repo-a",
  "  - https://git.example.com/acme/*",
  "  - /home/sa/repos/local-exemplar",
  "---",
  "",
  "# Org BoK — Distill Allowlist",
  "",
].join("\n");

describe("t248 isDistillTargetAllowed — the predicate seams (mechanism: none)", () => {
  test("1: missing allowlist file -> false", () => {
    tmp = mkdtempSync(join(tmpdir(), "distill-allow-"));
    process.env.AIDLC_DISTILL_ALLOWLIST = join(tmp, "does-not-exist.md");
    expect(isDistillTargetAllowed("https://git.example.com/org/repo-a")).toBe(
      false,
    );
  });

  test("2a: allowlist with no frontmatter -> false", () => {
    seedAllowlist("# Distill Allowlist\n\nNo entries yet.\n");
    expect(isDistillTargetAllowed("https://git.example.com/org/repo-a")).toBe(
      false,
    );
  });

  test("2b: allowlist with frontmatter but empty allowed: list -> false", () => {
    seedAllowlist("---\nallowed:\n---\n\n# Distill Allowlist\n");
    expect(isDistillTargetAllowed("https://git.example.com/org/repo-a")).toBe(
      false,
    );
  });

  test("3a: exact-URL match -> true", () => {
    seedAllowlist(WELL_FORMED);
    expect(isDistillTargetAllowed("https://git.example.com/org/repo-a")).toBe(
      true,
    );
  });

  test("3b: exact match tolerates trailing slash / .git clone suffix / backslashes", () => {
    seedAllowlist(WELL_FORMED);
    expect(
      isDistillTargetAllowed("https://git.example.com/org/repo-a.git"),
    ).toBe(true);
    expect(isDistillTargetAllowed("https://git.example.com/org/repo-a/")).toBe(
      true,
    );
    expect(isDistillTargetAllowed("\\home\\sa\\repos\\local-exemplar")).toBe(
      true,
    );
  });

  test("4: glob entry matches every repo under its namespace", () => {
    seedAllowlist(WELL_FORMED);
    expect(
      isDistillTargetAllowed("https://git.example.com/acme/new-portal"),
    ).toBe(true);
    // The glob is anchored to its own namespace — a cousin org stays denied.
    expect(
      isDistillTargetAllowed("https://git.example.com/other/new-portal"),
    ).toBe(false);
  });

  test("5: non-matching target -> false (and the empty target is always denied)", () => {
    seedAllowlist(WELL_FORMED);
    expect(
      isDistillTargetAllowed("https://git.example.com/org/repo-b"),
    ).toBe(false);
    expect(isDistillTargetAllowed("")).toBe(false);
    expect(isDistillTargetAllowed("   ")).toBe(false);
  });

  test("6: the shipped dist carries a gate-satisfying allowlist (curated org entries)", () => {
    // No env seam: resolves against the packaged tree via the test runner's
    // default harness-root resolution — the shipped list's FIRST curated entry
    // must pass on a stock install (derived, not hardcoded: SAs add/remove
    // entries freely), and an unlisted repo must stay denied.
    const shippedPath = distillAllowlistPath();
    expect(shippedPath.includes("org-bok")).toBe(true);
    const firstEntry = readFileSync(shippedPath, "utf-8").match(
      /^\s*-\s+(\S+)/m,
    )?.[1];
    expect(firstEntry).toBeDefined();
    expect(isDistillTargetAllowed(firstEntry ?? "")).toBe(true);
    expect(
      isDistillTargetAllowed("https://github.com/somewhere-else/not-listed"),
    ).toBe(false);
  });
});

describe("t248 distill-check wiring — the skill's step-0 spawn (mechanism: cli)", () => {
  function check(target: string, extraEnv: Record<string, string>): {
    status: number | null;
    stdout: string;
    stderr: string;
  } {
    const res = spawnSync(
      BUN,
      [UTILITY, "distill-check", "--target", target],
      {
        encoding: "utf-8",
        env: { ...process.env, ...extraEnv },
      },
    );
    return {
      status: res.status,
      stdout: res.stdout ?? "",
      stderr: res.stderr ?? "",
    };
  }

  test("allowed target -> exit 0 with an allowed: verdict", () => {
    const file = seedAllowlist(WELL_FORMED);
    const res = check("https://git.example.com/org/repo-a", {
      AIDLC_DISTILL_ALLOWLIST: file,
    });
    expect(res.status).toBe(0);
    expect(res.stdout).toContain("allowed: https://git.example.com/org/repo-a");
  });

  test("denied target -> exit 1 with a pointer at the allowlist file (repo never read)", () => {
    const file = seedAllowlist(WELL_FORMED);
    const res = check("https://git.example.com/org/repo-b", {
      AIDLC_DISTILL_ALLOWLIST: file,
    });
    expect(res.status).toBe(1);
    expect(res.stdout).toContain("denied:");
    expect(res.stdout).toContain(file);
  });

  test("--json emits the {target, allowed, allowlist} triple", () => {
    const file = seedAllowlist(WELL_FORMED);
    const res = spawnSync(
      BUN,
      [
        UTILITY,
        "distill-check",
        "--target",
        "https://git.example.com/acme/new-portal",
        "--json",
      ],
      {
        encoding: "utf-8",
        env: { ...process.env, AIDLC_DISTILL_ALLOWLIST: file },
      },
    );
    const parsed = JSON.parse(res.stdout ?? "") as {
      target: string;
      allowed: boolean;
      allowlist: string;
    };
    expect(parsed.allowed).toBe(true);
    expect(parsed.target).toBe("https://git.example.com/acme/new-portal");
    expect(parsed.allowlist).toBe(file);
    expect(res.status).toBe(0);
  });

  test("missing --target -> loud usage error, non-zero exit", () => {
    const res = check("", {});
    expect(res.status).not.toBe(0);
    expect(`${res.stdout}${res.stderr}`).toContain(
      "Usage: aidlc-utility distill-check --target",
    );
  });
});

describe("t248 distill skill ↔ profile shape — the drafting spec pins the fixture's shape (mechanism: none)", () => {
  // Ticket 05: "drafted profiles conform to the content-shape required
  // sections (verified against the same shape tests as the fixture)". A
  // drafted profile's shape can't be tested at authoring time (an LLM writes
  // it), so pin the deterministic half: the SKILL.md's drafting instructions
  // name EXACTLY the sections and frontmatter keys t246 requires of every
  // shipped profile (via the shared ORG_BOK_PROFILE_SECTIONS constant). A
  // shape change that forgets either side reds here or in t246.
  test("the distill SKILL.md names every required profile section and frontmatter key", () => {
    const skill = readFileSync(DISTILL_SKILL, "utf-8");
    for (const heading of ORG_BOK_PROFILE_SECTIONS) {
      expect(skill).toContain(heading);
    }
    expect(skill).toContain("repo_url:");
    expect(skill).toContain("notable_paths:");
    // The refresh contract: re-run updates in place, never duplicates.
    expect(skill).toContain("refresh it in place");
  });

  test("the shipped allowlist is a valid predicate input on the packaged tree", () => {
    // The dist copy the predicate resolves by default must parse: frontmatter
    // present, ≥1 allowed entry (fail-closed would deny everything and the
    // skill would ship dead).
    const shipped = readFileSync(
      join(AIDLC_SRC, "knowledge", "org-bok", "distill-allowlist.md"),
      "utf-8",
    );
    expect(shipped.startsWith("---\n")).toBe(true);
    expect(shipped).toContain("allowed:");
    expect(shipped).toMatch(/allowed:\s*\n(\s*-\s*\S+)/);
  });
});