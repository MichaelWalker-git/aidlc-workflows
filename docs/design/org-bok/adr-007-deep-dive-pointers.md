# ADR-007: Markdown-first; opt-in deep dives via repo URL + notable paths with ambient git auth

**Status:** Accepted (2026-07-23)

## Context

The SA wants agents to avoid crawling the whole repo library, yet to "know
which repos to look at." Distilled markdown alone risks stale embedded
snippets and long profiles; always cloning selected exemplars reintroduces
the crawl cost and demands credentials on every run.

## Decision

**Markdown first, deep dive opt-in.** Each `profile.md` carries frontmatter
with the repo's git URL and a short list of *notable file paths* (e.g. the
real ESLint config, a canonical component, design tokens). The reference
brief must be fully usable from distilled markdown alone. Downstream stages
MAY fetch the pointed-at files when higher fidelity helps (copying a real
lint config, imitating a real component), using whatever **ambient git
credentials** the session already has — no new auth machinery. When auth
fails or the repo is unreachable, the agent notes "deep dive unavailable" in
its output and continues from the markdown; a failed fetch is never a stage
failure.

Rejected: markdown-only (stale snippet risk, bloated profiles), always-clone
(slow, credential-dependent, crawl-cost regression), and embedding key files
as assets at distill time (viable v2 refinement — "embed critical, point for
the rest" — but adds distillation logic and a staleness policy v1 doesn't
need).

## Consequences

- Profiles stay short; fidelity is available on demand.
- Behavior varies with the session's git access; graceful-degradation wording
  must appear in both the research agent's steps and the spliced consumer
  steps (ADR-006).