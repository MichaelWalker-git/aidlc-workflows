---
repo_url: https://github.com/MichaelWalker-git/lpl-beacon-api
notable_paths:
  - README.md
  - docs/architecture.md
  - src/lpl_beacon_api/api/deps.py
  - src/lpl_beacon_api/services/chat_service.py
  - src/lpl_beacon_api/services/sse_translator.py
  - src/lpl_beacon_api/core/config.py
  - tests/test_api_integration.py
  - modules/infra/lambda.tf
---

# Exemplar Profile: LPL Beacon API — UI Adapter Tier for the Concierge Agent

## Ask / Context

> TODO(interview): inferred from repo analysis only — not yet confirmed by
> the solution architect.

Split the UI-facing adapter out of the Beacon Concierge agent Lambda so UI
concerns (auth, CORS, screenshot handling, SSE streaming UX, feedback) ship
without redeploying or destabilizing the agent — the two historically ran as
one Lambda. The forcing function was rich streaming UX: the Chrome-extension
UI needed thinking/tool-use events, but AgentCore's stock A2A executor drops
them, requiring a patched concierge plus this translation tier — which is
why a separate service won over FastAPI-in-AgentCore (the rejected
alternative is documented). Auth was consciously deferred (JWT/ForgeRock
scaffolded but off by default) to hit a demo date; enterprise platform
guardrails (private Terraform registry, Octopus CD, CODEOWNERS) shaped the
infra throughout.

## Architecture & Why

> TODO(interview): inferred from repo analysis only — not yet confirmed by
> the solution architect.

A strictly layered Python FastAPI service: Chrome extension → API Gateway
(SSE-capable REST) → Lambda running FastAPI under the Lambda Web Adapter →
AgentCore via A2A JSON-RPC. Thin route handlers → services (one end-to-end
chat orchestrator) → Protocol-typed clients → Pydantic wire schemas.

- **Lambda + LWA now, containers later**: LWA was chosen over Mangum
  specifically for true SSE streaming; the app is a plain ASGI factory with
  a working Dockerfile, so ECS/EKS migration is a packaging swap, not a
  rewrite — an engineered escape hatch from serverless.
- **Versioned, tolerant wire contracts**: the SSE translator decodes the
  concierge's A2A stream (text parts plus schema-versioned metadata parts
  for thinking/tool events) into UI frames, logging-and-dropping unknown
  versions and degrading to text-only — so API and agent deploy
  independently.
- **Deliberate data-ownership split**: this service owns no stateful
  resources — the S3 bucket and DynamoDB tables belong to the concierge
  stack and are referenced by ARN with narrowly-scoped writes; all
  conversational state lives in AgentCore session memory keyed by a
  deterministic session-ID derivation.
- **Terraform in the org-standard two tiers** (reusable infra module +
  per-env workspaces) built entirely on LPL's private registry modules; CI
  delegates to the org's reusable DevSecOps workflows with Octopus for
  higher environments.

## Key Patterns

- Protocol-based dependency injection as house style: every AWS collaborator
  is a `typing.Protocol` + concrete class wired only in `api/deps.py` with
  `lru_cache` factories; tests swap fakes via dependency overrides, so the
  integration suite runs the full HTTP+SSE stack with zero AWS.
- Two-tier test pyramid with an explicit gated third: fast unit tests, full-
  contract integration tests with fakes ("37 tests, ~1s" advertised in the
  README), and real-AgentCore wire tests behind an env flag, out of CI.
- Settings singleton rule: import `settings`, never `os.environ.get()` —
  stated in docstring and CLAUDE.md alike.
- Docs as decision records: a key-design-decisions table in the README, an
  architecture doc with the rejected alternative and limitations, a real
  incident RCA (VPC endpoint cold-start stall) separating app-side stopgap
  from platform fix, and a pre-implementation spec with numbered confirmed
  assumptions.
- Consistent error envelope with request correlation: domain exceptions stay
  framework-agnostic, one handler installs the translation, and request IDs
  thread through logs and error bodies.
- Self-documenting Makefile as the single command surface.

## Deep-Dive Pointers

The frontmatter carries the repo URL and notable paths. Fetch them when
higher fidelity helps — the DI wiring, the chat orchestrator, and the SSE
translator are the canonical implementations. If the repo is unreachable,
note "deep dive unavailable" and continue from this profile.