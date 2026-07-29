---
repo_url: https://github.com/MichaelWalker-git/horus-technologies
notable_paths:
  - CLAUDE.md
  - CONTEXT.md
  - _data/pricing.js
  - .github/workflows/claude-review.yml
  - docs/calculator-qa-agent-prompt.md
  - .eleventy.js
  - amplify.yml
  - _includes/head-common.html
---

# Exemplar Profile: Horus Technologies — Vendor Marketing Site

## Ask / Context

> TODO(interview): inferred from repo analysis only — not yet confirmed by
> the solution architect.

The vendor's own storefront (`www.horustech.dev` — the Horus Technology
consulting firm whose client work fills this BoK): build and continuously
evolve the public marketing site — SEO-optimized service/landing pages, a
case-study blog, and an interactive OCR/IDP cost calculator as a lead-gen
tool that demonstrates the firm's expertise — cheaply, fast, and safely
editable primarily through AI-assisted sessions by a solo owner. SEO is the
explicit growth channel (keyword strategy and competitor tables live in
CLAUDE.md).

## Architecture & Why

> TODO(interview): inferred from repo analysis only — not yet confirmed by
> the solution architect.

A static Eleventy v2 site (Nunjucks-processed flat HTML + shared partials)
with exactly two dev dependencies (Eleventy, Tailwind), vanilla JS only,
deployed hands-free by AWS Amplify on push to main.

- **A two-dependency static site maximizes Lighthouse scores** (core to the
  SEO channel) and minimizes attack/maintenance surface for a firm whose
  engineering hours belong to clients.
- **Flat `.html` permalinks preserve pre-Eleventy URLs** — SEO continuity is
  stated in the config comment.
- **Live-with-committed-fallback build data**: the calculator's pricing
  module fetches live AWS Textract/Bedrock prices from the Price List API
  at build time and falls back to dated, hand-refreshed defaults on any
  failure — live prices give the tool credibility; the fallback guarantees
  the site can never fail to build over a third-party API.
- **The repo's guardrails ARE the team process**: with a solo owner
  maintaining the site through AI sessions, CLAUDE.md (Always/Never rule
  tables, page checklist, brand tokens, infra IDs, captured learnings),
  CONTEXT.md, and the AI PR reviewer substitute for a team.

## Key Patterns

- CONTEXT.md "claim discipline": a canonical domain glossary plus an
  explicit boundary — only defensible, artifact-backed, owner-cleared facts
  may appear in marketing copy; "do not invent metrics beyond these." A
  portable editorial convention for any vendor's public content.
- Self-hosted AI PR reviewer in CI: Claude via Bedrock reviewing every PR
  diff with a strict JSON verdict, inline comments, dismiss-previous
  idempotency, diff truncation disclosure, and a three-layer JSON-recovery
  fallback ending in graceful "manual review required."
- Agent-QA prompts as committed artifacts instead of test code: a phased
  test plan ("build → serve → run real JS headless → assert DOM against
  ground truth") with the instruction "the code is the source of truth, not
  this prompt," plus a findings handoff doc recording stale findings.
- Performance discipline on a static site: inlined critical CSS, self-hosted
  preloaded fonts (CLS), async icon fonts, LCP preload, WebGL gated on
  low-power detection and `prefers-reduced-motion`.
- `llms.txt` for AI crawlers alongside robots.txt/sitemap.
- Deploy config carries security headers (HSTS, X-Frame-Options).

## Deep-Dive Pointers

The frontmatter carries the repo URL and notable paths. Fetch them when
higher fidelity helps — CLAUDE.md, the pricing data module, and the AI
review workflow are the canonical artifacts. If the repo is unreachable,
note "deep dive unavailable" and continue from this profile.