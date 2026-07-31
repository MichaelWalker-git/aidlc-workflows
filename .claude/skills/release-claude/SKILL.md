---
name: release-claude
description: >
  Cut a Claude Code-only release of this custom AI-DLC: run the release
  ceremony (version + CHANGELOG + README badge sync, repackage dists, parity
  check, t68 pin), then build a distributable zip of dist/claude/ with a
  generated INSTALL.md for end users. Output lands in release/ (gitignored).
  Never commits or tags without explicit confirmation.
argument-hint: "[version] [--no-bump]"
---

# Release (Claude Code only)

Produce a user-installable archive of the Claude Code distribution. The
archive is what a user downloads, unpacks, and copies into their project —
the same install model as upstream's "copy `dist/claude/` into your
project", minus the need to clone this repo.

## Arguments

- `version` (optional) — the version to release, e.g. `2.7.0`. If omitted,
  use the current `AIDLC_VERSION` from `core/tools/aidlc-version.ts` when it
  is already in sync with CHANGELOG/badge, otherwise ask the user.
- `--no-bump` — skip step 2 entirely; release exactly what is authored now.
  Fails if the sync pin (t68) is red.

## Steps

### 1. Preflight

- Working tree must be clean (`git status --porcelain`). If dirty, stop and
  show the user what's uncommitted — a release must come from committed
  source.
- Read the current version from `core/tools/aidlc-version.ts` and the top
  `## [N.N.N]` heading of `CHANGELOG.md`.

### 2. Version ceremony (skip with `--no-bump`)

Follow the Changelog Policy in `AGENTS.md`. If the requested version is not
already reflected everywhere, in ONE commit's worth of edits:

- Bump `AIDLC_VERSION` in `core/tools/aidlc-version.ts` (the authored
  source — never edit the dist copies).
- Bump the README version badge (`img.shields.io/badge/version-N.N.N-blue`).
- Add a `## [N.N.N] - YYYY-MM-DD` heading to `CHANGELOG.md` with a
  one-paragraph summary (including the upgrade instruction — normally
  "re-copy your `dist/claude/` shell into the project") and a flat bullet
  list of what users actually invoke or see. Draft the bullets from
  `git log` since the previous release heading and show them to the user
  before writing.

### 3. Regenerate and verify

Run, in order, and stop on the first failure:

```bash
bun scripts/package.ts
bun scripts/package.ts --check
bun test tests/unit/t68-version-changelog-sync.test.ts
bash tests/run-tests.sh --level unit
```

(If the user asked for a faster cut, the unit tier may be skipped on their
say-so — but `--check` and t68 are never skipped.)

### 4. Commit and tag — ASK FIRST

Show the user the diff summary, then ask before doing either:

- Commit everything from steps 2–3 as
  `release: vN.N.N (claude)` .
- Tag `vN.N.N` (annotated).

Do NOT push unless the user explicitly asks.

### 5. Build the archive

Output goes to `release/` at the repo root (gitignored — never committed).

1. Generate `release/INSTALL.md` from `INSTALL.template.md` (in this skill's
   directory), substituting `{{VERSION}}` and `{{DATE}}`:

```bash
mkdir -p release
sed -e "s/{{VERSION}}/N.N.N/g" -e "s/{{DATE}}/YYYY-MM-DD/g" \
  .claude/skills/release-claude/INSTALL.template.md > release/INSTALL.md
```
2. Zip from *inside* `dist/claude/` so unpacking lands the dot-directories
   at the target root, excluding the generated `aidlc-docs/`:

```bash
cd dist/claude && zip -r "../../release/aidlc-claude-vN.N.N.zip" . -x "aidlc-docs/*" && cd -
zip -j "release/aidlc-claude-vN.N.N.zip" release/INSTALL.md
```

3. Verify the archive before calling it done:

```bash
unzip -l "release/aidlc-claude-vN.N.N.zip"
```

Confirm it contains `.claude/` (with `settings.json`, `skills/`, `hooks/`,
`agents/`, `tools/`), `aidlc/` (with `spaces/default/memory/`),
`.mcp.json`, `.gitignore`, and `INSTALL.md` — and does NOT contain
`aidlc-docs/`. Hidden-file omissions are the classic zip failure mode; if
`.claude/` is missing, the zip flags were wrong.

### 6. Report

Tell the user: the version released, the archive path and size, the
verification results, and (if they want to publish) the one-liner:

```bash
gh release create vN.N.N release/aidlc-claude-vN.N.N.zip --title "vN.N.N" --notes-file <(awk '/^## \[N.N.N\]/{f=1;next} /^## \[/{f=0} f' CHANGELOG.md)
```

## The installation guide

The user-facing guide is `INSTALL.template.md` in this skill's directory —
the full walkthrough (prerequisites, Bedrock setup, install, verify, first
workflow, upgrade path, troubleshooting). Its content is distilled from
`README.md`'s Claude Code Quick Start and `docs/guide/01-getting-started.md`;
when either of those changes materially (prerequisites, copy steps, doctor
checks, settings), update the template in the same commit.

## Rules of the road

- Never hand-edit anything under `dist/` — step 3's `--check` exists to
  catch exactly that.
- `release/` is gitignored; archives are published as GitHub Release
  assets (or handed over directly), never committed.
- One version, three places, one commit: `aidlc-version.ts`, CHANGELOG
  heading, README badge. t68 is the referee.