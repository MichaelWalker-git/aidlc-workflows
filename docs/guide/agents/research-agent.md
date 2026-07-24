# Research Agent

> **Agent deep dive** · [User Guide](../00-introduction.md) › [Agents](../06-agents.md) › [deep dives](README.md) · Technical reference: [research-agent](../../reference/agents/research-agent.md)

The aidlc-research-agent is your organizational-precedent researcher. It connects a newly captured intent to what the organization has already built: it walks the Org BoK's curated exemplar index, reasons about which past projects match the ask, loads only the matching exemplar profiles, and distills them into a reference brief downstream agents can act on. When no precedent matches, it says so honestly rather than force-fit an exemplar.

The aidlc-research-agent leads one stage and supports none. It is the only agent that reads the Org BoK index and raw exemplar profiles — every other agent receives precedent exclusively through its reference brief, so the brief must stand alone.

## Stages Led

| Stage | Phase | Description |
|-------|-------|-------------|
| 1.2 Precedent Research | Ideation | Matches the captured intent against the Org BoK and writes the reference brief |

## Stages Supported

None — the stage runs inline with the research persona alone.

## What to Expect

When the aidlc-research-agent is active, it names the selected exemplars and the rationale for each match, translates their key patterns into patterns-to-follow for this project, and extracts concrete UI directives (design tokens, spacing/layout conventions, component patterns, copy tone) phrased as imperatives for the mockup and code-generation stages. It states the precedence rule explicitly — greenfield defaults to BoK guidance; brownfield lets locally discovered, affirmed practices win — and carries each selected profile's deep-dive pointers (repo URL + notable paths) forward. The stage only runs on installs that ship an Org BoK with at least one exemplar; otherwise it is skipped automatically.

## How It Collaborates

The aidlc-research-agent receives the intent statement from the aidlc-product-agent. Its reference brief is handed off to the aidlc-architect-agent (exemplar architecture and rationale for feasibility and application design), the aidlc-design-agent (UI directives for mockups), and the aidlc-developer-agent (patterns and deep-dive pointers for code generation).

## Key Principles

- Index first, profiles second — read the curated index before opening any profile, and open only what matches
- Honest non-matches — "no precedent matches" is a valid, useful brief; a force-fit exemplar poisons every downstream stage that imitates it
- The brief stands alone — downstream agents never read raw profiles
- Imperatives, not background — directives are written as instructions for this project, not descriptions of another project
- Fidelity on demand — prefer the distilled markdown; deep-dive into real repos only when a real file beats a description, and never let a failed fetch fail the stage