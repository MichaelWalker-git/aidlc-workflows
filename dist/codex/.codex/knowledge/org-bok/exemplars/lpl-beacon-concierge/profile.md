---
repo_url: https://github.com/MichaelWalker-git/lpl-beacon-concierge
notable_paths:
  - src/lpl_beacon_concierge/agent/graph.py
  - src/lpl_beacon_concierge/config.py
  - src/lpl_beacon_concierge/agent/registry.py
  - src/lpl_beacon_concierge/observability/audit.py
  - pyproject.toml
  - tests/conftest.py
  - docs/adr/002_TOOL_NODE_SEPARATION.md
  - modules/agentcore/main.tf
---

# Exemplar Profile: LPL Beacon Concierge — Advisor AI Agent Platform Front Door

## Ask / Context

> TODO(interview): inferred from repo analysis only — not yet confirmed by
> the solution architect.

LPL Financial wanted an in-ClientWorks AI assistant: a Chrome-extension
sidebar where financial advisors look up client accounts, holdings, activity,
and orders conversationally instead of navigating the advisor portal. The
bigger ask was a platform, not one bot — the concierge is the router/front
door of a "Beacon agent platform" where future domain agents (trading,
compliance, research) onboard with zero concierge code changes. Users are
regulated financial advisors handling client PII, so compliance posture was a
first-class requirement.

## Architecture & Why

> TODO(interview): inferred from repo analysis only — not yet confirmed by
> the solution architect.

A single Python package with explicit layer seams — FastAPI server → LangGraph
agent → grouped LangChain tools → clients (Neptune, AgentCore, vision) →
storage — deployed as a Bedrock AgentCore HTTP runtime container via Terraform.

- **Registry-driven dynamic delegation won over hardcoded sub-agent wiring**:
  at startup the concierge discovers approved A2A domain agents from the
  AgentCore registry and fabricates one `invoke_<slug>` tool per peer (5-min
  TTL catalog). Onboarding a new domain agent needs no code or prompt change —
  chosen because the agent family was expected to grow without a redeploy per
  agent.
- **LangGraph replaced an earlier Strands-SDK implementation mid-project** to
  align with LPL's org-standard LangGraph starter template — standardization
  across LPL agent teams outweighed the rewrite cost; the migration spec is
  committed.
- **AgentCore HTTP runtime replaced a Lambda + API Gateway architecture** for
  SSE streaming and longer-running tool loops; sub-agent SSE events bubble
  into the concierge stream bracketed by delegation markers.
- **Compliance drove hard constraints**: Bedrock guardrails are mandatory and
  attached at the single model factory (`get_model()`); every Neptune query
  runs through a server-side authorization gate resolving the advisor's
  allowed rep IDs; the structured audit trail emits each event individually so
  partial trails survive crashes.
- **Neptune (SPARQL knowledge graph) is a pre-existing LPL investment** the
  agent consumes, not a store chosen for this project.
- **Terraform is composed from LPL private-registry modules, never raw
  resource blocks**, with a deliberate module seam so shared storage survives
  runtime destroy-and-replace cycles.

## Key Patterns

- Tool-group registry as the extension seam: a new tool is one `@tool`
  function exported into the right group; the graph derives routing tables
  automatically and fails fast on unnamed tools. Per-category ToolNodes give
  observability, error isolation, and per-category timeout/retry (ADR 002).
- Hermetic LLM testing as doctrine: `tests/conftest.py` opens with "tests must
  not hit live Bedrock" and ships a `FakeModel` drop-in; the test tree mirrors
  the package tree; a separate LLM eval tier (LLM-as-judge rubrics, mock data
  by default, `--live` opt-in) is kept out of the unit suite.
- Strict quality gates: ruff with a wide select list, mypy strict, coverage
  floor, `make ci` mirroring the full suite locally, pre-commit with
  detect-secrets.
- Financial-domain prompt safety written as testable prose: never fabricate
  financial data, "substituting entities is a fabrication", numeric formatting
  contracts, concision tied to the physical sidebar UI.
- Correlation-hierarchy audit events (`request_id → invocation_id →
  tool_use_id → query_id`) as a side channel, never the SSE wire.
- Container tagging discipline: immutable `sha-<short>` on every build, semver
  on git tags, `latest` banned.
- ADRs with status/date/issue links where the decision lives; spec-first
  migration docs; domain-scoped AI subagent personas checked in.

## Deep-Dive Pointers

The frontmatter carries the repo URL and notable paths. Fetch them when higher
fidelity helps — the graph module, the registry seam, and the config/model
factory are the canonical implementations. If the repo is unreachable, note
"deep dive unavailable" and continue from this profile.