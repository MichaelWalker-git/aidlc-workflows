---
repo_url: https://github.com/MichaelWalker-git/DevelopmentPlatform
notable_paths:
  - packages/agents/scripts/run-pipeline.sh
  - packages/agents/.claude/CLAUDE.md
  - packages/infra/lib/stacks/pipeline-stack.ts
  - packages/shared/src/entities/opportunity.ts
  - packages/agents/.claude/skills/anti-slop/SKILL.md
  - packages/poc-template/.interface-design/system.md
  - .github/workflows/deploy-develop.yml
  - docs/container-execution-strategy.md
---

# Exemplar Profile: Development Platform — Autonomous RFP-to-POC Pipeline

## Ask / Context

> TODO(interview): inferred from repo analysis only — not yet confirmed by
> the solution architect.

An internal platform (single account, no prod stage yet): when the BD team
marks a federal RFP opportunity as GO in the upstream auto-rfp system,
automatically produce a live, clickable proof-of-concept web app to attach
to the proposal — within roughly an hour and a few dollars of API cost, with
no engineer in the loop. Cost per POC is a first-class KPI (the business
case is cheap pre-sales demos at volume), and credibility of output matters
as much as automation: the audience is federal evaluators judging vendor
competence, so generated UI must not look AI-generated.

## Architecture & Why

> TODO(interview): inferred from repo analysis only — not yet confirmed by
> the solution architect.

A pnpm monorepo with a hard control-plane/agent-plane seam: deterministic
infrastructure (Lambdas, DynamoDB single-table, HTTP API + Cognito,
EventBridge) is fully separate from the non-deterministic agent work, which
is confined to an ECS Fargate container running Claude Code (via Bedrock).

- **ECS Fargate, not Lambda**, because a Claude Code session doing builds,
  CDK deploys, and Playwright tests needs a long-running container with a
  full toolchain.
- **A deterministic shell owns all state**: the bash orchestrator
  (`run-pipeline.sh`) runs Claude per phase (REQUIREMENTS/BUILD/DEPLOY/TEST)
  with machine-checkable completion criteria (file exists, JSON parses),
  bounded retries that continue rather than restart, a QA↔Dev feedback loop
  capped at 3 rounds, and a global timeout under the platform kill. The LLM
  is explicitly forbidden from writing status — the docs record that a
  single monolithic agent prompt was unreliable and this evolved from it.
- **The pipeline state machine is a shared Zod enum** consumed by the bash
  orchestrator, the Lambdas, and the dashboard alike.
- **Template-as-contract**: generated POCs start from a pinned scaffold
  (React 19/Vite/Tailwind, a hardened static-site CDK stack) so the agent
  fills in a known-good structure instead of inventing infrastructure.
- **The dashboard exists because a no-human-in-the-loop pipeline still needs
  human visibility**: stage tracking, per-run cost, failure reasons, logs,
  QA-round counts.
- **The anti-slop skill is a mechanized taste gate**: an engine emits a
  per-project design system (fixed brand shell, domain-varied interior) and
  a checker scans built output for visual and content slop, failing on
  critical findings.

## Key Patterns

- Deterministic orchestrator around a non-deterministic agent — every LLM
  phase has a concrete completion check; retries append context instead of
  restarting; the model never owns state. The repo's most transferable idea.
- Bounded loops everywhere: per-phase attempt caps, capped QA rounds, global
  timeout with buffer, non-blocking optional phases (a POC still ships if
  tests fail) — graceful degradation designed in.
- CI validates the agent surface, not just code: prompt/rule lint, anti-slop
  fixtures and dry runs, artifact-shape validators, and `bash -n` on the
  orchestrator run alongside tsc and `cdk synth`.
- Shared Zod-first contract package: entities with `z.infer` types,
  `.passthrough()` on foreign event payloads, generic single-table helpers,
  consumed via `workspace:*` by Lambdas and the container alike.
- Prompt-engineering doctrine written down: "Hero Feature First" (one
  3–5-click workflow gets half the effort) and "Document Grounding" (build
  only what the source documents describe; mirror their terminology).
- Per-run cost/duration/turn accounting in DynamoDB with Sentry events from
  bash — agent observability as data.

## Deep-Dive Pointers

The frontmatter carries the repo URL and notable paths. Fetch them when
higher fidelity helps — the orchestrator script, the agent CLAUDE.md, and
the anti-slop skill are the canonical implementations. If the repo is
unreachable, note "deep dive unavailable" and continue from this profile.