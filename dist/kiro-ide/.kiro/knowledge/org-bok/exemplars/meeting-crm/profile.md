---
repo_url: https://github.com/MichaelWalker-git/meeting-crm
notable_paths:
  - src/nested_stacks/http_route_helper.ts
  - src/helpers/claude_client.ts
  - CLAUDE.md
  - src/MeetingCrmStack.ts
  - src/nested_stacks/ProcessingNestedStack.ts
  - src/helpers/http_event.ts
  - frontend/CLAUDE.md
  - tests/helpers/access_control.test.ts
---

# Exemplar Profile: Meeting CRM — AI Meeting-Transcript CRM

## Ask / Context

An internal AI-powered CRM for a very small team (1–2 users, single tenant):
turn meeting transcripts — manual upload, Otter.ai sync, Google Calendar —
into business-development intelligence: signals, action items, contact/deal/
opportunity tracking, account health, campaigns, and daily digests. Cost was
the top-ranked constraint (~$1/month idle target). It is also a methodology
showcase: the repo was substantially built by agent loops (an autonomous
PRD-to-commit runner, Claude as PR reviewer, AIDLC-style rule layering), and
the scope grew organically from a 3-account/20-transcript MVP to 26 Lambda
domains and 22 database tables.

## Architecture & Why

A serverless AWS monorepo: a CDK app of nested stacks, 174 Lambda handlers
organized by domain, and a React SPA hosted on Amplify, with an AI processing
pipeline as a Step Functions state machine (S3 upload → prepare → Map-state
parallel chunk processing through Claude → merge → contact enrichment).

- **Serverless-everything won on cost**: near-zero idle spend mattered more
  than latency or scale — Aurora Serverless v2 at the 0.5 ACU floor, on-demand
  DynamoDB, static Amplify hosting, env-gated removal policies.
- **Nested-stack-per-domain topology** was an explicit refactor to escape the
  CloudFormation 500-resource limit: each nested stack registers its own
  routes on one shared HTTP API via a route helper, with the rationale
  documented at the seam itself.
- **Claude via API key only**: an unlimited Anthropic plan made model calls
  effectively free, and a real IAM-Bedrock billing surprise hardened the rule
  — the single gated client throws rather than silently falling back to a
  billing-dangerous path.
- **One environment by decision**: with a single stakeholder and an internal
  tool, `meeting-crm-dev` IS production; prod scaffolding is kept hypothetical
  and the fact is documented where agents will read it.
- **Dual data layer**: Aurora PostgreSQL via the RDS Data API with Drizzle ORM
  as the mandatory access path (committed SQL migrations), plus DynamoDB for
  time-series events and signals.

## Key Patterns

- CLAUDE.md as operational memory: rules written as postmortems with mechanism
  ("this gate evaluated false in prod and the Lambda never ran"), a "do not
  fix these blindly" carve-out, per-directory scoping (root for backend, a
  960-line frontend/CLAUDE.md for the SPA), thin AGENTS.md pointers.
- Thin-handler / shared-helper layering: handlers parse, validate, delegate,
  and respond through a shared `createResponse()`; business logic lives in
  ~66 flat helpers. An event-shape adapter isolates handlers from API Gateway
  payload-version differences.
- Fail-loud configuration guards: a deploy guard asserts secrets are present
  so a manual deploy cannot silently blank live values (with an explicit
  escape hatch for synth/diff).
- Structured JSON logging contract: one mandatory logger, level semantics and
  required entity-ID metadata spelled out as convention.
- Uniform failure alerting: helper-applied CloudWatch alarms per Lambda and
  state machine → SNS → Slack, with human-oriented alarm descriptions.
- Frontend layering discipline: a single `request()` for all backend calls,
  React Query hooks with centralized query-key factories, aggregation hooks
  keeping pages purely presentational.
- Testing discipline: 240 backend Vitest files mirroring the source tree, a
  reusable thenable-chain Drizzle mock, `aws-sdk-client-mock`, MSW on the
  frontend.
- shadcn-style CSS-variable design tokens on Tailwind: semantic names mapped
  to `hsl(var(--x) / <alpha-value>)`, named breakpoints, legacy hex aliases
  kept deliberately during migration.
- CI trio: typecheck+test PR gate, OIDC push-to-main CDK deploy with path
  filters, and Claude as an automated PR reviewer.

## Deep-Dive Pointers

The frontmatter carries the repo URL and notable paths. Fetch them when higher
fidelity helps — the route helper, the gated Claude client, and the two
CLAUDE.md files are the canonical artifacts to imitate. If the repo is
unreachable, note "deep dive unavailable" and continue from this profile.