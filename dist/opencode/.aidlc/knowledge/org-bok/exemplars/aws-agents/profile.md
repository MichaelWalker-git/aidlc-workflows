---
repo_url: https://github.com/MichaelWalker-git/aws-agents
notable_paths:
  - CLAUDE.md
  - lib/stacks/agents-platform-stack.ts
  - lib/constructs/database-construct.ts
  - test/constructs/database-construct.test.ts
  - polymarket/main.py
  - polymarket/shared/schemas.py
  - polymarket/watchers/base.py
  - docs/polymarket-strategy-context.md
---

# Exemplar Profile: AWS Agents — Multi-Framework Agent Platform Bake-Off

## Ask / Context

> TODO(interview): inferred from repo analysis only — not yet confirmed by
> the solution architect.

A self-directed learning/portfolio project, not client work: compare agent
frameworks (Strands, LangGraph, CrewAI, AutoGen — deliberately one per
agent) on one realistic AWS substrate mirroring the LPL Financial
architecture, cheaply. The Polymarket half evolved from demo toward a
genuine attempt at profitable prediction-market auto-trading — its strategy
doc brutally diagnoses "no alpha calculation" in early flows and the safety
layer (kill switch, circuit breakers, real USDC budgets) goes far beyond
demo needs. Heavy test investment (~736 Python tests, 63 CDK tests) was the
chosen safety net in lieu of CI/staging, especially for money-moving paths.

## Architecture & Why

> TODO(interview): inferred from repo analysis only — not yet confirmed by
> the solution architect.

A three-language monorepo — TypeScript CDK, Python FastAPI agent backends,
React SPA — deploying two Fargate services from one CDK app (the agents
platform and the Polymarket bot), sharing VPC/cluster/user pool via
cross-stack props.

- **"One container, many agents"**: every agent is a FastAPI router mounted
  at a path prefix in a single image — adding an agent is a new folder plus
  a router mount, zero CDK change. A deliberate design goal to keep
  experiment iteration fast.
- **Explicit dependency injection at startup**: all service clients are
  constructed once in the FastAPI lifespan and injected into each agent's
  router via `init_<agent>_router(...)` functions — no globals at import, no
  framework magic, every agent testable with stubs.
- **Pydantic schemas as the only inter-agent contract**
  (`MarketCandidate → SignalResult → RiskVerdict → OrderResult`): "no raw
  dicts cross boundaries" is stated in CLAUDE.md and actually observed.
- **Defense in depth for money-moving code**: a `SafetyGuard` centralizes
  pre-trade checks (kill switch, per-strategy circuit breaker, drawdown
  pause), dual paper/live executors route per user, and watchers carry
  per-mode daily USDC budgets — all as small separately-tested components.
- **CDK layering**: six thin single-purpose constructs with typed props and
  public readonly resources; stacks compose only; each construct has a
  mirrored assertion test.

## Key Patterns

- CLAUDE.md as a working operator's manual: build/test/deploy commands
  including single-test invocation, an agent→infrastructure mapping table
  with status, and explicit conventions.
- Abstract async WebSocket watcher base (heartbeat, reconnect with backoff,
  cooldowns, budgets, activity log) under concrete market/price/bond
  watchers, default-off and started via API.
- Strategy-scoped configuration objects: named guardrail constants with
  inline threshold rationale instead of scattered magic numbers.
- Honest self-diagnosis docs with decision tables, plus dated spec/plan docs
  before implementation.
- System prompts as documented tool contracts: per-tool when-to-use
  guidance, anti-fabrication rules, and an escalation path.
- shadcn-style CSS-variable design tokens with Inter/JetBrains Mono.
- Deployment maturity deliberately deferred: no CI, manual `cdk deploy` —
  velocity over process for an experimental platform.

## Deep-Dive Pointers

The frontmatter carries the repo URL and notable paths. Fetch them when
higher fidelity helps — the platform stack, the DI wiring in `main.py`, and
the watcher base are the canonical implementations. If the repo is
unreachable, note "deep dive unavailable" and continue from this profile.