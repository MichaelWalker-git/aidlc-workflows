---
repo_url: https://github.com/MichaelWalker-git/land_coverage
notable_paths:
  - .projenrc.ts
  - src/types/dynamodb-schema.ts
  - src/lib/stacks/api-stack-dynamodb.ts
  - src/main.ts
  - src/handlers/listings-handler.ts
  - src/integrations/trpa-client.ts
  - src/frontend/styles/design-system.css
  - .github/workflows/deploy.yml
---

# Exemplar Profile: Land Coverage — TRPA Rights Marketplace MVP

## Ask / Context

> TODO(interview): inferred from repo analysis only — not yet confirmed by
> the solution architect. Open question: are the TRPA/CTC/Nevada Land Bank
> integrations real APIs or aspirational stubs, and is the retained
> Aurora/TypeORM code rollback insurance or uncleaned debt?

A first-mover two-sided marketplace for TRPA land-coverage rights in the
Lake Tahoe basin — a regulatory-compliance-driven asset class with no
existing digital marketplace; the build is an MVP validating that gap. Cost
was a binding constraint ("run this near-free until liquidity appears"), SEO
and organic acquisition were a primary go-to-market channel (the page
inventory is dominated by content marketing), and trust/compliance signaling
drove the design — transacting regulatory rights requires perceived
legitimacy. A solo/very-small-team build leaning on AI coding agents with
process guardrails substituting for team review.

## Architecture & Why

> TODO(interview): inferred from repo analysis only — not yet confirmed by
> the solution architect.

A single projen-managed package holding three deployables — React 19 +
Mantine SPA, Lambda backend, CDK infra — deployed as four stacks (DynamoDB,
Cognito, API Gateway + Lambdas, S3/CloudFront).

- **Aurora → DynamoDB single-table migration cut costs ~90%**; the repo
  visibly carries both generations, with new implementations in `*-dynamodb`
  suffixed files beside the old ones, keeping rollback cheap.
- **Access-pattern-first data modeling**: all composite-key construction
  lives in one typed module (key factories, item-type enum, GSI constants) —
  services never hand-assemble key strings.
- **Serverless production-grade auth/infra at hobby-scale cost**: Cognito,
  CloudFront, ARM64 Lambdas with `@aws-sdk/*` externalized, no-VPC — a push
  to main is the whole release process, via OIDC-only CI credentials.
- **Resilience trio for external regulatory APIs**: every third-party client
  composes retry + circuit breaker + TTL cache + audit logging behind one
  config object.
- **SEO surface as architecture**: blog, glossary, calculator, coverage
  guides, sitemap, and an SEO component are first-class pages, with Vite
  vendor chunking and terser tuning for production bundles.

## Key Patterns

- Projen as the single config authority with CI self-mutation — edit
  `.projenrc.ts` only; generated files carry banners.
- Typed error classes mapped to HTTP statuses in handlers; Sentry
  `wrapHandler` on every Lambda and breadcrumbed axios interceptors on the
  client — symmetric observability across the wire.
- Testing split cleanly by runner: Jest unit/integration mirroring `src/`,
  CDK snapshot tests, and Playwright E2E against the deployed site with
  credential-gated auth tests that self-skip.
- Shared Lambda prop/env spread objects with per-function overrides — one
  place to tune runtime, memory, and tracing.
- Design-token CSS layer with a written direction statement
  ("Sophistication & Trust"), full 50–900 color ramps, and a 4px spacing
  base sitting above Mantine rather than fighting it.
- AI-agent working agreements checked in: CLAUDE.md, workflow rules,
  spec-driven change docs, ticket-before-code discipline.

## Deep-Dive Pointers

The frontmatter carries the repo URL and notable paths. Fetch them when
higher fidelity helps — the schema module, the resilient client, and the
projen config are the canonical implementations. If the repo is unreachable,
note "deep dive unavailable" and continue from this profile.