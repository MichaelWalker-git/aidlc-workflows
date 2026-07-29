---
repo_url: https://github.com/MichaelWalker-git/market-intelligence-platform
notable_paths:
  - packages/events/src/envelope.ts
  - packages/events/src/publisher.ts
  - packages/core/src/allocation/computeAllocation.ts
  - packages/core/src/allocation/computeAllocation.test.ts
  - services/agents/investment-committee/src/agent.ts
  - services/agents/risk/src/handler.ts
  - infra/cdk/lib/agents-stack.ts
  - apps/web/tailwind.config.js
---

# Exemplar Profile: Market Intelligence Platform — Crypto Signals Agent Choreography

## Ask / Context

> TODO(interview): partially confirmed — this is an **internal/exemplar
> build**, not a client deliverable (confirmed by the solution architect).
> The rest of this section is inferred from repo analysis only.

An internal/exemplar build: a signals-only crypto intelligence MVP that
surfaces smart-money opportunities before retail, with an absolute
prohibition on automated trading (a non-negotiable in the mission brief,
enforced by the grep-verified absence of any exchange client or signing key).
The mission brief prescribed the stack and style up front: React/TanStack/
Tailwind, Lambda + CDK + EventBridge + DynamoDB + Bedrock, event
*choreography* explicitly forbidding Step Functions, Claude Opus/Sonnet
assigned per agent, and a stated future Kafka/MSK migration requirement.
Auditability of every recommendation was a core concern.

## Architecture & Why

> TODO(interview): inferred from repo analysis only — not yet confirmed by
> the solution architect.

A strict-TypeScript pnpm monorepo in four tiers — pure domain packages,
runtime agent services, CDK infra, React web app — where seven versioned
event types flow agent-to-agent over EventBridge with no orchestrator.

- **Event choreography, no Step Functions, was a stated constraint**: each of
  the eight agents reacts to one event and emits one event; fan-in is solved
  without a workflow engine by an idempotency-guard-as-join (a DynamoDB
  conditional put on a deterministic key — whichever trigger sees both slices
  and wins the claim proceeds).
- **"LLM judges, deterministic code decides" is the load-bearing invariant,
  enforced structurally**: the Investment Committee's Zod output schema has
  no allocation field — position sizing lives in a pure deterministic engine
  (risk-level base sizes plus eight composable guardrails), and a unit test
  pins that the schema cannot express a position size. Defense in depth:
  prompt, schema, test, and grep-verified claims.
- **Migration seams are explicit interfaces**: every vendor touchpoint (event
  bus, LLM, DynamoDB, secrets) sits behind a small interface with an
  in-memory double; the event envelope documents its Kafka field mapping for
  the stated future MSK migration. Agent code never imports the AWS SDK.
- **LLM tiering by stakes**: Opus for risk and committee (low volume, high
  stakes), Sonnet for enrichment, no LLM at all for deterministic compute.
- **Cost engineering is a committed decision log**: HTTP API v2 over REST,
  explicit LogGroups, ARM64, model tiering, PriceClass100 — each with its
  dollar rationale.

## Key Patterns

- Transport-free agent cores with thin harness adapters: business logic takes
  an injected deps object (LLM call, id/clock factories) and returns a typed
  envelope; the Lambda handler only does env plumbing, idempotency claim, and
  publish. Every core tests with a stubbed LLM in pure vitest.
- Pure deterministic engine, property-tested: allocation invariants (bounds,
  monotonicity, guardrail composition) verified with fast-check arbitraries;
  each guardrail returns an applied flag so results carry an auditable
  `guardrailsApplied` list.
- Events package as contract hub: one generic Zod envelope (ULID event id,
  version, idempotency key, correlation id, tenant id) plus per-event detail
  schemas; everything imports from it.
- `makeAgent` CDK factory stamping Lambdas with per-Lambda least-privilege
  roles, model-ARN-scoped Bedrock policy, and dedicated DLQs.
- Secrets presence-only API contract: the endpoint returns configured
  true/false, never values or last-4.
- Honest self-audit copy tone: a real-money-readiness report concludes no-go
  against its own +60% paper-trading result, with quantified reasons; docs
  state what is verified vs deferred.
- Named design language as semantic Tailwind tokens ("Phosphor Desk": warm
  near-black ink, phosphor-green signal, a five-step risk color ramp)
  consumed via small typed presentational primitives in one `ui.tsx`.
- Dev knobs through CDK context flags rather than code edits, documented
  where they are wired.

## Deep-Dive Pointers

The frontmatter carries the repo URL and notable paths. Fetch them when higher
fidelity helps — the envelope/publisher pair, the allocation engine and its
property tests, and the committee agent are the canonical implementations. If
the repo is unreachable, note "deep dive unavailable" and continue from this
profile.