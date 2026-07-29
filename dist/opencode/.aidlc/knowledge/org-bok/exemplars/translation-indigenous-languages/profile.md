---
repo_url: https://github.com/MichaelWalker-git/translation-Indigenous-languages
notable_paths:
  - packages/domain/src/tenant/request.ts
  - packages/domain/src/tenant/visibility.ts
  - packages/api/src/lib/authz.ts
  - packages/pipeline/src/provider.ts
  - packages/infra/src/stack.ts
  - packages/api/src/requirements-coverage.test.ts
  - packages/api/src/lib/logSafe.ts
  - packages/web/src/styles.css
---

# Exemplar Profile: Indigenous Languages Translation — Government Bid Marketplace

## Ask / Context

> TODO(interview): inferred from repo analysis only — not yet confirmed by
> the solution architect.

A government bid deliverable (California ALRB IFB 7300-26-012): a
multi-tenant platform connecting agencies needing indigenous-language
interpretation/translation (Mixteco, Zapotec, Triqui, Tzotzil ↔ EN/ES) with
vetted human translators, plus AI document translation via Bedrock and
live-interpreted video calls. The offline demo mode was a first-class
requirement — the SPA must be fully explorable in all three tenant roles
with zero AWS. The IFB's GenAI-disclosure clause drove a pipeline-level
`usedGenAI` flag, and the translation engine was deliberately built
domain-agnostic to be resold across future government RFPs — the ALRB app is
customer #1. Human-in-the-loop translation is the trust anchor: AI
accelerates, but a human deliverable path remains.

## Architecture & Why

> TODO(interview): inferred from repo analysis only — not yet confirmed by
> the solution architect.

An npm-workspaces monorepo with strict inward-pointing dependencies: a
dependency-free domain package (zod + pure logic) and a domain-agnostic
pipeline engine, consumed by thin Lambda API adapters and a React SPA, all
provisioned by one CDK stack.

- **Business rules live in the pure domain package**: the tenant request
  lifecycle is a literal transition table throwing on illegal transitions,
  and authorization is deny-by-default predicates — a single spec, testable
  without AWS.
- **The HTTP layer only translates verdicts**: 404-masking for cross-tenant
  reads (responses never confirm another tenant's resource exists), 403 only
  when the resource is visible but the action forbidden.
- **The provider seam carries the compliance rule without knowing it**: one
  `TranslationProvider` interface (echo, human-review, LLM) whose
  `usesGenAI` flag propagates to the job's `usedGenAI` field so the app
  satisfies the disclosure obligation.
- **Serverless single-stack won on bid-budget economics** — DynamoDB
  single-table, Lambda, Step Functions doc pipeline (Choice by ingest kind →
  Map over OCR pages/segments), two WebSocket APIs for signaling and live
  translate. (Note: a stack comment mentions ECS Fargate for Gemini Live but
  no ECS constructs exist — aspirational or moved.)
- **The security baseline was contractual**: every CDK resource carries a
  SECURITY-NN annotation mapping to the enforced baseline (encryption, log
  retention, OAC, least privilege).

## Key Patterns

- Requirements-traceability test suite: one test per requirement ID doubling
  as a living coverage matrix, with removed requirements documented and
  deferred work as `it.todo` with rationale.
- Compile-time log hygiene: a TypeScript union allowlist of loggable field
  names makes logging document content a type error; Bedrock SDK error
  messages are scrubbed to coded strings while preserving retry matching.
- Cassette-backed LLM tests: recorded model responses plus an injectable
  client for deterministic Bedrock vision tests without network.
- Property-based testing (fast-check) on the invariant-rich core: transition
  legality, engine determinism, coverage.
- Offline mock backend behind one API-client seam: with no API base set, the
  SPA runs against an in-memory backend with a role/identity switcher.
- Operational landmines documented at the point of use: the one-GSI-per-
  deploy DynamoDB limit handled via a context knob with rollout notes; a
  Docker/Lambda OCI incompatibility fixed and explained inside the deploy
  script.
- Named design-token theme ("Fieldwork": calm, grounded, deliberately not
  blue-SaaS; Public Sans) as plain CSS custom properties.

## Deep-Dive Pointers

The frontmatter carries the repo URL and notable paths. Fetch them when
higher fidelity helps — the transition table, the visibility predicates, and
the provider seam are the canonical implementations. If the repo is
unreachable, note "deep dive unavailable" and continue from this profile.