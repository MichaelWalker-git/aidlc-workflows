---
repo_url: https://github.com/MichaelWalker-git/curriculum-management
notable_paths:
  - CLAUDE.md
  - packages/backend/src/index.ts
  - packages/backend/src/plugins/college-scope.ts
  - packages/backend/src/db/schema/courses.ts
  - packages/frontend/src/components/ui/Button.tsx
  - packages/frontend/tests/helpers/test-utils.ts
  - .github/workflows/deploy.yml
  - infrastructure/terraform/main.tf
---

# Exemplar Profile: Curriculum Management — Community College District RFP Demo

## Ask / Context

> TODO(interview): inferred from repo analysis only — not yet confirmed by
> the solution architect.

An RFP response demo on a ~2-week deadline clock (RFP 86985, San Mateo
County Community College District): a working multi-tenant curriculum
management platform for three colleges. The buyer's core requirements were
the RFP's compliance surface — 3-college tenancy, 7-role approval workflows,
course versioning and audit trail, catalog publishing/PDF, articulation and
equivalency (C-ID, Cal-GETC, AB 1111 common course numbering), and Banner
SIS integration. JSONB-everywhere extensibility (configurable fields,
JSON-defined per-college workflows) exists because RFP answers were still
pending. AI course-equivalency analysis (Bedrock Claude Haiku) was a bid
differentiator, not an RFP requirement — hence careful cost controls.

## Architecture & Why

> TODO(interview): inferred from repo analysis only — not yet confirmed by
> the solution architect.

A pnpm workspace monorepo — React 18/Vite frontend, Fastify 4 + Drizzle +
PostgreSQL backend, and a shared pure-types package that both sides import —
on a deliberately cost-minimal AWS footprint (one EC2 t4g.micro with
self-managed Postgres, S3 + two CloudFront distributions, Terraform).

- **Single EC2 + self-managed Postgres won on demo budget and speed**, not
  ops posture; a parallel Docker/ECR path coexists as a transition artifact.
  (README says Express; the code is Fastify — CLAUDE.md is the accurate
  doc.)
- **Shared types as the API contract**: frontend and backend import the same
  workspace package, so client/server type drift is structurally impossible;
  Zod plus Fastify JSON-schema validate at runtime.
- **Multi-tenancy is a convention with one seam**: every table carries
  `collegeId`, and a 20-line Fastify plugin decorates requests with
  `collegeScope()` (undefined for admins = all-college view) — enforcement
  is per-route discipline, not RLS.
- **The heavy E2E investment substitutes for unit coverage as the
  demo-confidence mechanism**: ~26 phase-numbered Puppeteer suites (257
  tests) run in CI against a seeded ephemeral Postgres and are re-targetable
  at production via an env var.
- **Mock-to-real integration seam**: a Banner SIS mock/real/transformer
  triple lets the demo run on mocks while the real adapter slots in later;
  passwordless mock-JWT seed users (7 roles × 3 colleges) make the demo
  self-service.
- **AI call hygiene**: Bedrock results cached by content hash with a
  per-user rate limit and a force-refresh escape hatch.

## Key Patterns

- Fastify plugin-per-cross-cutting-concern: auth, tenant scoping, rate
  limiting, Sentry, and Swagger each isolated in a plugin; routes stay pure
  domain code.
- Full E2E in CI with a real seeded DB, health-check wait loops, and failure
  screenshots uploaded as artifacts.
- Change-aware deploys: per-package path filters plus git-diff migration
  detection gate which deploy jobs run; OIDC role assumption, no stored AWS
  keys.
- Tailwind semantic token scales with annotated UI primitives: inline design
  rules ("6px radius, borders-only, 150ms transitions, 4px grid") and
  explicit WCAG affordances in the component source.
- Security hardening on a demo timeline: httpOnly-cookie JWT with refresh
  mutex, security-headers hook, request-ID tracing, fail-fast on missing
  JWT secret.
- An honest incident write-up documenting a CI/CD-vs-infra mismatch (the
  pipeline deployed to S3 while traffic was served by an EC2 nginx) with
  root cause and remediation.

## Deep-Dive Pointers

The frontmatter carries the repo URL and notable paths. Fetch them when
higher fidelity helps — the composition root, the college-scope plugin, and
the courses schema are the canonical implementations. If the repo is
unreachable, note "deep dive unavailable" and continue from this profile.