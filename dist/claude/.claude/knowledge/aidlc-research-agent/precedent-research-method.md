# Precedent Research Method

You are the only agent that reads the Org BoK's index and raw exemplar
profiles. Every other agent receives exemplar content exclusively through the
reference brief you write. Keep it that way: never instruct another agent to
open a profile; put what they need into the brief.

## The Org BoK

The organization's body of knowledge lives at
`.claude/knowledge/org-bok/`:

- `index.md` — the curated decision tree: one row per exemplar with
  project-type tags, tech stack, and "use when…" guidance.
- `exemplars/<slug>/profile.md` — one profile per reference repo: the
  original ask/context, the architecture and why, key patterns, and
  deep-dive pointers (repo URL + notable paths in frontmatter).
- `guides/` — cross-cutting conventions (architecture principles, code
  style, UI design language), when the organization has distilled them.
  Guides are standing Tier-1 knowledge for the targeted agents; you cite
  them in the brief, you do not restate them.

The BoK is deliberately NOT loaded wholesale into your context. Read the
index first; open only the profiles whose "use when…" guidance matches the
captured intent. Context discipline is the point of the index.

## Selection method

1. Read the intent statement. Extract the ask shape (what kind of thing is
   being built), the domain, and any stated technology constraints.
2. Walk the index rows. Match on the "use when…" guidance and project-type
   tags first, tech stack second — an exemplar with the right ask shape and
   a different stack still teaches more than a same-stack project with a
   different shape.
3. Load only the matching profiles (usually one, at most a small handful).
4. If nothing matches, say so. An honest "no precedent matches" brief is
   more useful downstream than a force-fit exemplar — irrelevant patterns
   imitated confidently are worse than none.

## Writing the reference brief

The brief is the single statement of precedent that downstream agents and
humans share. Its consumers — feasibility, rough-mockups, refined-mockups,
application-design, and code-generation — each carry a step that loads it and
follows its exemplar patterns, so the section names below are the contract.
It carries exactly these H2 sections:

- **`## Selected Exemplars & Rationale`** — which profiles you chose and why
  they match this intent.
- **`## Patterns to Follow`** — the key patterns from the selected profiles,
  phrased as instructions for this project, not as history.
- **`## UI Directives`** — concrete, imperative styling instructions (design
  tokens, spacing and layout conventions, component patterns, copy tone)
  for the mockup and code-generation stages. Extract them from the selected
  exemplar and the UI design-language guide when present.
- **`## Precedence Rule`** — state it verbatim so downstream agents don't
  ping-pong: on greenfield work, BoK guidance is the default; on brownfield
  work, locally discovered and affirmed practices win — consistency with
  the codebase you are in beats org ideals.
- **`## Deep-Dive Pointers`** — the selected profiles' repo URLs and notable
  paths, so downstream agents can fetch real files when fidelity helps.

When no exemplar matched, replace the first three sections with a single
`## No Matching Precedent` section: name the index entries you considered and
why none fit, and explicitly instruct downstream agents to design from first
principles and the org guides rather than force-fit an exemplar. Keep
`## Precedence Rule` — it applies with or without a precedent. Omit
`## Deep-Dive Pointers` rather than padding it.

## Deep dives

You MAY fetch the notable files a profile points at, using whatever git
credentials the session already has. When a fetch fails or the repo is
unreachable, write "deep dive unavailable" where the material would have
gone and continue from the profile markdown — a failed fetch is never a
stage failure.
