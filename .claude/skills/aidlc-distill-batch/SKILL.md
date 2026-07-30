---
name: aidlc-distill-batch
description: >
  Batch-run the /aidlc-distill flow over every repo on the curated Org BoK
  distill allowlist, in chunks. Per chunk: gate each target with
  distill-check, clone shallow, analyze repos in parallel, then run ONE
  consolidated interview so the human answers the ask/why questions for the
  whole chunk in a single pass, then draft profiles + index rows + guide
  additions and verify the shape suite. Never commits — the human curates
  each chunk's git diff. Run in the fork repo only.
argument-hint: "[chunk-size] [chunks=<n>] [from=<chunk>]"
---

# AI-DLC Distill Batch — chunked, interview-preserved BoK authoring

This skill orchestrates `/aidlc-distill` across the whole allowlist. The
per-repo rules (analysis depth, profile shape, index row, guide-worthiness,
refresh-in-place, never-commit) are NOT restated here — read
`core/skills/aidlc-distill/SKILL.md` first and follow its steps 1 and 3–6
verbatim for every repo. This file only adds the batch mechanics and the
consolidated interview.

## Arguments

- Bare number → **chunk size** (repos per chunk). Default: **5**.
- `chunks=<n>` → number of chunks instead; chunk size becomes
  `ceil(roster / n)`. Ignore if a bare number was also given.
- `from=<chunk>` → resume: skip chunks before this 1-based index. The
  roster order is the allowlist order, so chunk boundaries are stable
  across runs as long as the allowlist and chunk size are unchanged.

## Step 0: Build the roster

1. Read the frontmatter `allowed:` list from
   `core/knowledge/org-bok/distill-allowlist.md` (this is the authored
   source in the fork; if no `core/` tree exists you are in a packaged
   install — stop, this skill is fork-only).
2. Drop glob entries (`*`) from the roster — a glob cannot be enumerated;
   report each one dropped so the human can add exact entries.
3. Derive each repo's `<slug>`: repo name, lowercased, kebab-case
   (`LabCorp-IDP` → `labcorp-idp`). Note which slugs already exist under
   `core/knowledge/org-bok/exemplars/` — those are refreshes, not new.
4. Split into chunks per the arguments and print the plan: chunk count,
   chunk size, which chunks are refresh-heavy, and where `from=` starts.

## Per chunk, in order

### 1. Gate (deterministic, per target)

For every repo in the chunk run, from the fork root:

```bash
AIDLC_DISTILL_ALLOWLIST=core/knowledge/org-bok/distill-allowlist.md \
  bun core/tools/aidlc-utility.ts distill-check --target "<url>" --json
```

Exit 1 → that repo is skipped (record why), never read. Never
re-implement the predicate in prose, even though the roster came from the
same file — the tool's exit code is the gate.

### 2. Clone and analyze (parallel)

- Shallow-clone each allowed repo to `/tmp/aidlc-distill-batch/<slug>`
  (`git clone --depth 1`; reuse an existing clone after `git pull` fails
  gracefully — a stale clone is acceptable for analysis).
- A clone failure (auth, missing repo) marks the repo **skipped**, not
  fatal — record the error and continue the chunk.
- Analyze each cloned repo per the core skill's Step 1. Fan out one
  subagent per repo in the chunk when the Agent tool is available;
  otherwise analyze sequentially. Each analysis must come back with:
  architecture summary, key patterns, candidate `notable_paths`,
  org-wide-convention candidates, and — for the interview — the analyst's
  **best inferred reading of the ask and the why**, phrased as a claim the
  human can cheaply confirm or correct.

### 3. Consolidated interview (the point of this skill)

Ask the human ONCE per chunk, one message covering every analyzed repo:
for each repo, present the inferred ask/context and the inferred
architecture rationale, then ask (a) what the client actually asked for
and cared about, (b) why this architecture won and what alternatives
lost, (c) what the analysis got wrong. Accept terse corrections —
"reading is right" is a complete answer.

Never write an interview-derived section from inference alone: if the
human skips a repo, draft it with `> TODO(interview): …` markers in
`## Ask / Context` and `## Architecture & Why` and carry it into the
summary as an open item.

### 4. Draft

Per repo, follow the core skill's Steps 3–5 exactly (profile to
`core/knowledge/org-bok/exemplars/<slug>/profile.md`, refresh in place;
one `index.md` row, updated not appended on refresh; remove the shipped
`sample-internal-developer-platform` fixture row when drafting the first
real exemplar). One batch-level addition: **dedupe guide additions across
the whole run** — a convention seen in several repos is proposed once,
citing the repos that exhibit it, not once per repo.

### 5. Verify and hand off the chunk

```bash
bun scripts/package.ts && bun test tests/unit/t246-org-bok-guides.test.ts
```

Fix drafts until green. Then print the chunk summary — profiles drafted
(new vs refreshed), index rows, guide additions, skipped repos with
reasons, open `TODO(interview)` items — and **STOP for the human**:
continue to the next chunk, pause (they can commit the reviewed diff
between chunks; resume later with `from=<next-chunk>`), or adjust chunk
size.

## Final report and cleanup

After the last chunk: totals (drafted / refreshed / skipped), every
dropped glob entry, all open interview TODOs, and a reminder that nothing
was committed. Remove `/tmp/aidlc-distill-batch/` when the run completes
cleanly; leave it in place on a pause so a resume reuses the clones.

## Guardrails

Everything the core skill forbids stays forbidden: never commit, stage,
or push; write only under `core/knowledge/org-bok/` plus the regenerated
`dist/` trees the packager owns; no workflow state, no audit events.