---
repo_url: https://github.com/MichaelWalker-git/LabCorp-Compendium-Agent
notable_paths:
  - compendium_core/types.py
  - compendium_orchestrator/core.py
  - compendium_aggregator/aggregate.py
  - compendium_core/logging/phi.py
  - tests/unit/contract/test_public_surface.py
  - Makefile
  - terraform/envs/sandbox/main.tf
  - pyproject.toml
---

# Exemplar Profile: LabCorp Compendium Agent — Test-Matching Research Lane

## Ask / Context

> TODO(interview): inferred from repo analysis only — not yet confirmed by
> the solution architect.

LabCorp asked for an automated "research lane" to resolve the ~20% of hospital
test-compendium matches their existing production LLM+RAG fast lane cannot
resolve confidently. It wakes on low-confidence matches, assembles a
reliability-scored evidence packet from a tool cascade, and hands it to the
same human-reviewer UI asynchronously — a 10–15 minute SLA was acceptable.
Enterprise ARB approval and service-count discipline shaped the engagement:
the design was consolidated from 10 to 7 AWS services after ARB reviews
(Redis dropped for DynamoDB TTL, Bedrock KB deferred, no API Gateway), and
demo-ability was a first-class deliverable.

## Architecture & Why

> TODO(interview): inferred from repo analysis only — not yet confirmed by
> the solution architect.

A Python monorepo of seven sibling Lambda packages over one shared core:
SQS → trigger (DynamoDB dedup) → orchestrator → sequential tool cascade
(Historical Aurora SQL → Component/OpenSearch → allowlisted web search) →
weighted-reliability aggregator → evidence packets in DynamoDB (30-day TTL)
→ SNS ready-for-review. Terraform modules mirror the code layout.

- **A sequential cascade with early-stop won over parallel fan-out**: query
  the cheapest, most-trusted source first and stop when a per-tier
  SSM-configured confidence threshold is met — cost per query and
  explainability (citations plus a reliability score for a human reviewer)
  mattered more than latency.
- **Deterministic cascade, LLM at the edges**: the orchestrator's tier order,
  thresholds, and per-tier error flags are plain tested Python; a
  Strands/AgentCore agent wrapper exists but is thin and swappable — a hedge
  while the enterprise agent-runtime direction awaited ARB approval.
- **Contract-first data model**: frozen, `extra="forbid"` Pydantic models
  with cross-field validators enforce business rules in the type layer
  (confidence must equal max candidate confidence; web citations must carry
  an allowlist ID); JSON Schema is generated from the models, never
  hand-written.
- **"No PHI" was confirmed, but defense-in-depth stayed**: PHI regex
  redaction in-process plus a CloudWatch redactor Lambda whose patterns are
  exported from the same Python source, VPC-only Lambdas, KMS, and a
  fail-closed five-host web-search allowlist with a build gate that fails on
  zero entries — a compliance trust signal to enterprise architecture.

## Key Patterns

- Public-surface contract tests: per-package snapshots of exported symbols
  fail on any removal or rename — a cheap API-stability gate for a shared
  core consumed by seven sibling packages.
- Underscore-private I/O seam modules (`_aws.py`, `_db.py`, `_search.py`)
  isolate clients with tight timeout/retry configs; pure logic modules stay
  import-clean. The coverage `omit` list makes the seam explicit policy —
  pure logic is gated at 80% per unit, thin glue is not counted.
- Per-unit Makefile vertical slices: every unit gets `-lint`, `-test` (scoped
  coverage gate), and `-package` (cross-compiled Lambda zip into its
  Terraform module) — coverage enforced per unit, not diluted repo-wide.
- Five-tier test taxonomy with an explicit cost gradient: unit, Hypothesis
  property, moto/testcontainers integration, mocked e2e, and real-AWS
  e2e/perf gated behind env flags so the default suite stays hermetic.
- Single-source cross-layer constants: PHI regexes defined once in Python and
  exported to JSON for the Terraform-deployed redactor; thresholds in SSM
  with validated load and a cache-reset hook for tests.
- Hash-pinned pip-compile lockfiles with a `verify-lock` drift check; mypy
  strict repo-wide; ruff; Python 3.12.
- Decision provenance in-repo: ARB briefs and meeting transcripts that drove
  decisions are committed alongside the design corpus.
- Runbook-grade demo docs: a click-through console demo with exact resource
  names and prepared cases; `.env.example` documents the secrets
  architecture, not just variable names.

## Deep-Dive Pointers

The frontmatter carries the repo URL and notable paths. Fetch them when higher
fidelity helps — the types module, the cascade core, and the Makefile are the
canonical implementations. If the repo is unreachable, note "deep dive
unavailable" and continue from this profile.