---
repo_url: https://github.com/MichaelWalker-git/aws_mirror_site
notable_paths:
  - eslint.config.mjs
  - packages/core/src/keys.ts
  - packages/core/src/stores/page-store.ts
  - packages/core/src/stores/test-helpers.ts
  - infra-sandbox/lib/sandbox-stack.ts
  - infra/lib/alarm-pack.ts
  - infra/lib/ci-stack.ts
  - docs/runbook.md
---

# Exemplar Profile: AWS Mirror Site — Verified AWS Reference (Solo-Ops SaaS)

## Ask / Context

A solo-founder product, not a client engagement: a paid, subscription-gated
"verified AWS reference" site — a fast-to-search alternative to AWS docs where
every guide is proven against a real AWS account by an agent pipeline that
makes verification cheap. The repo doubles as a dogfood exemplar for AI-DLC
itself: the full AIDLC workspace and audit trail are committed, and provenance
lives in that record rather than git history. The founder's constraints were
legal/IP safety (never mirror AWS prose), safety of autonomous provisioning,
and one-person operability at near-zero idle cost.

## Architecture & Why

A TypeScript pnpm monorepo — shared library packages, a Next.js 15 App Router
site on OpenNext (CloudFront + Lambda + S3), and separate CDK apps for the
site account and a sandbox account — with a Step Functions verification
pipeline and a Bedrock content-generation pipeline.

- **Legal safety drove the strangest constraint**: all content must be
  original and test-derived, never mirrored from AWS docs. The generation path
  is structurally forbidden from reaching the network by scoped ESLint
  `no-restricted-imports`/`no-restricted-globals` rules — the draft assembler
  can only see harness findings and evidence, so it cannot plagiarize.
- **Two-account topology because agents provision real AWS resources**: the
  sandbox account isolates blast radius with an IAM permission boundary, a
  resource allowlist, a budget guard whose breach fail-stops but still runs
  teardown, and a TTL sweeper. One named cross-account role, scoped to
  evidence writes, is the only seam back to the site account.
- **AWS-native CI (CodePipeline) over GitHub Actions**, keeping all compute
  and credentials inside the AWS accounts — GitHub stays source-only, with a
  founder-gated manual approval before production deploy.
- **Serverless-everything on solo-ops economics**: DynamoDB single-table,
  on-demand billing, one ops SNS topic, and alarms whose descriptions are
  one-line runbook actions — sized for one person operating the whole thing.
- **Product honesty over launch optics**: content shipped before the pipeline
  verified it carries a deliberately weaker amber "Reviewed" badge instead of
  a false "Verified" — recorded as a committed decision note.

## Key Patterns

- Constraints enforced by lint, not convention: the no-network rule on the
  generation path is the reference example of encoding an architectural (here,
  legal) moat as a lint rule.
- `Result<T, E>` with typed error unions at every store/service boundary; no
  exceptions cross module seams.
- All AWS SDK clients dependency-injected — including the clock and ID
  generator — with hand-rolled mock clients dispatching on command name; no
  mock library. Coverage thresholds enforced only on the business-logic
  package; UI and CDK tested pragmatically.
- Fixture-fallback local dev: with no cloud env set, every reader falls back
  to bundled fixtures, so dev, SSG, e2e, and CI need zero AWS/Stripe
  credentials; unconfigured services answer 503 gracefully.
- Hand-emitted CloudWatch EMF metrics from a dependency-free module —
  "analytics must never break a request" — paired with an `AlarmPack`
  construct and a runbook table with real account IDs.
- Requirement-ID traceability: business-rule IDs from the design corpus are
  cited in doc-comments, test names, lint config, and CDK constructs.
- `data-testid` vocabulary as an explicit UI/e2e contract, with a `test.fixme`
  protocol for components being rebuilt concurrently.
- Minimal modern tokens: a Tailwind 4 `@theme` block with a single oklch
  accent — no token system heavier than the product needs.

## Deep-Dive Pointers

The frontmatter carries the repo URL and notable paths. Fetch them when higher
fidelity helps — the lint config, the reference store, and the sandbox stack
are the canonical implementations to imitate. If the repo is unreachable, note
"deep dive unavailable" and continue from this profile.