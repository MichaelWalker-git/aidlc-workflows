---
name: aidlc-distill
description: >
  Distill an allowlisted org repository into Org BoK knowledge: analyze
  the repo reverse-engineering-style, interview the solution architect
  for the ask and the rationale, then draft an exemplar profile, a
  proposed index entry, and proposed cross-cutting guide additions. The
  human reviews, edits, and commits — the skill drafts, it never
  commits. Writes only BoK drafts; never touches workflow state and
  never emits audit events. Step 0 is a deterministic allowlist check
  (`aidlc-utility.ts distill-check`) — a repo not on the curated
  allowlist is never read.
argument-hint: "<repo-url-or-path>"
user-invocable: true
classification: read-only
---

# AI-DLC Distill — author the Org BoK from a reference repo

## Purpose

Turn one of the organization's reference repositories plus a human
interview into curated Body-of-Knowledge markdown: an exemplar
`profile.md` (the few-shot unit the research agent loads), a proposed
`index.md` entry (the decision-tree row), and proposed additions to the
cross-cutting guides when the repo shows an org-wide convention. Run it
in the fork repo where the BoK is authored. Refresh is a re-run: an
existing profile is updated in place, never duplicated.

## Classification

Read-only **with respect to workflow state**: this skill never advances
a stage pointer, never emits an audit event, and reads no workflow
record. Its only writes are BoK draft files under the knowledge tree
(profile, index row, guide additions) — the git diff is the curation
surface, and the human commits.

## Step 0: Allowlist check — before any repo access

Resolve the target from the invocation argument (ask for it if absent),
then run:

```bash
bun {{HARNESS_DIR}}/tools/aidlc-utility.ts distill-check --target "<target>" --json
```

- Exit 0 (`"allowed": true`) → proceed.
- Exit 1 (`"allowed": false`) → print the tool's denial message — it
  names the curated allowlist file (`knowledge/org-bok/distill-allowlist.md`)
  where a solution architect can add the entry — and **STOP. Do not
  read, clone, fetch, or list the target repo in any way.**

The predicate is deterministic (exact URL/path or glob match against the
allowlist's frontmatter `allowed:` list, fail-closed when the list is
missing or empty). Never re-implement it in prose; the tool's exit code
is the gate.

## Step 1: Analyze the repo

Read the allowed repo reverse-engineering-style, favoring breadth first:
README and docs, the dependency manifest(s), the directory layout, then
the load-bearing code (entry points, the module boundaries, the test
tree, CI workflows, infrastructure code). You are looking for:

- the **architecture** — the real structure and its seams, not the
  aspirational one in stale docs;
- **key patterns** worth imitating (layering, testing discipline,
  provisioning seams, design tokens, copy tone);
- candidate **notable file paths** for deep-dive pointers — the few
  files a downstream agent should fetch for full fidelity (a lint
  config, a canonical component, a reference module);
- **org-wide conventions** — anything you have seen in other exemplars
  or the guides that recurs here, or a practice general enough to
  belong in a guide rather than one profile.

## Step 2: Interview the human

The code cannot tell you the ask or the why — that tacit knowledge is
the whole point of the profile. Ask the solution architect, one focused
question at a time:

1. **The original ask/context** — what did the client ask for, in what
   shape (RFP? feature request?), and what did they care about most?
2. **Why this architecture** — what alternatives were considered, and
   what tipped the decision?
3. Anything the analysis got wrong or over-weighted (offer your reading
   and let them correct it).

Do not skip the interview even when the repo seems self-explanatory.

## Step 3: Draft the exemplar profile

Write the draft to the authored BoK subtree — in the fork repo that is
`core/knowledge/org-bok/exemplars/<slug>/profile.md` (use the packaged
`{{HARNESS_DIR}}/knowledge/org-bok/` tree only when no `core/knowledge/`
exists). Choose a short kebab-case `<slug>` from the repo name. **If the
profile already exists, refresh it in place** — merge new findings,
keep still-valid interview material, never create a sibling file.

The profile must follow the required shape (the shipped
`sample-internal-developer-platform` fixture is the reference):

- Frontmatter: `repo_url:` (the real URL) and `notable_paths:` (the
  repo-relative paths from Step 1 worth fetching in a deep dive).
- Sections, all four present and populated: `## Ask / Context`,
  `## Architecture & Why`, `## Key Patterns`, `## Deep-Dive Pointers`.
- Concise — one file, few-shot loadable. Architecture bullets carry the
  *why* from the interview. UI-relevant patterns (tokens, component
  conventions, copy tone) go in Key Patterns phrased concretely. A
  profile never states its own precedence rule.

## Step 4: Propose the index entry

Edit `index.md` in the same knowledge tree: one table row linking
`exemplars/<slug>/profile.md`, with project-type tags, tech stack, and
"use when…" guidance that names the ask shape (so an RFP-shaped intent
can match it), not just the technology. On a refresh, update the
existing row instead of appending. Remove the shipped fixture row when
this is the first real exemplar.

## Step 5: Propose guide additions

For each org-wide convention found in Step 1, propose an addition to the
matching cross-cutting guide (`guides/architecture-principles.md`,
`guides/code-style.md`, `guides/ui-design-language.md`). A convention is
guide-worthy when it holds across projects, not just this repo — when in
doubt, leave it in the profile and note the doubt. Keep each guide's
existing headings; append under the section it belongs to.

## Step 6: Verify the shape, then hand off to curation

In the fork repo, run the drafted profile through the same shape tests
the shipped fixture passes: regenerate the dist and run the profile
shape suite —

```bash
bun scripts/package.ts && bun test tests/unit/t246-org-bok-guides.test.ts
```

— and fix the draft until green (t246 sweeps every exemplar, the new
draft included). Skip this only when no `tests/` tree exists (a packaged
install rather than the fork).

Then print a summary of everything drafted: the profile path (new or
refreshed), the index row, each guide addition, and any open questions
from the interview. Then stop — **never commit, stage, or push**. Tell
the solution architect to review the git diff, edit freely, and commit
what survives their judgment.
