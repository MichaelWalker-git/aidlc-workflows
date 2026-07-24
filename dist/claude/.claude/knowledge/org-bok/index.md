# Org BoK — Exemplar Index

This is the curated decision tree over the organization's exemplar projects.
The research agent (aidlc-research-agent) reads this index during the
`precedent-research` stage, reasons about the captured intent, and loads only
the matching exemplar profiles — never the whole library.

Curation is a human responsibility: `/aidlc-distill` proposes entries, a
solution architect reviews and commits them. Each entry names the exemplar,
its project-type tags, its tech stack, and "use when…" guidance, and links
the profile the research agent should load when the entry matches.

The deterministic routing gate counts the profile links in this file: the
`precedent-research` stage runs only when at least one
`exemplars/<slug>/profile.md` link is present. An index with prose but no
profile links reads as empty and the stage is skipped.

## Exemplars

| Exemplar | Project-type tags | Tech stack | Use when… |
|----------|-------------------|------------|-----------|
| [sample-internal-developer-platform](exemplars/sample-internal-developer-platform/profile.md) | internal-developer-platform, portal, self-service | TypeScript, React, Node.js, Terraform, AWS | The ask is an internal developer platform, service catalog, or self-service portal for engineering teams. This is the shipped fixture entry — replace it with your organization's first distilled exemplar. |

## Maintaining this index

- One row per exemplar; the first column links `exemplars/<slug>/profile.md`.
- Keep "use when…" guidance concrete enough that an RFP-shaped intent can be
  matched against it — name the ask shape, not the technology.
- Remove the fixture row once real exemplars are distilled; the gate only
  needs one profile link to keep the stage active.
