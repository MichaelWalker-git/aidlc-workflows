---
repo_url: https://github.com/MichaelWalker-git/LabCorp-IDP
notable_paths:
  - libs/base_agent/agent.py
  - libs/types/envelopes.py
  - libs/bedrock_client/strands_runner.py
  - runtimes/specialists/physician/
  - runtimes/orchestrator/src/fanout.py
  - config/prompts/physician.system.md
  - infra/terraform/modules/agentcore-specialist/main.tf
  - pyproject.toml
---

# Exemplar Profile: LabCorp IDP — Requisition Research Lane on AgentCore

## Ask / Context

> TODO(interview): partially confirmed — the engagement is at **pilot**
> stage (confirmed by the solution architect). The rest of this section is
> inferred from repo analysis only.

LabCorp engaged the delivery team to build a research lane that auto-resolves
the ~20% of nightly requisitions the existing fast lane (Textract + Haiku)
leaves at low confidence — handwritten or ambiguous medical requisition forms
— before a 7 AM operational deadline, targeting ≥95% accuracy and ≤30% manual
QA rate. Sub-threshold cases route to a human-in-the-loop queue. A fast
3-week PoC-to-pilot timeline is visible in the code's staged-scope markers.
Current status: pilot.

## Architecture & Why

> TODO(interview): inferred from repo analysis only — not yet confirmed by
> the solution architect.

A Python 3.12 monorepo: one orchestrator runtime, six field-specialist agents
(diagnosis, physician, patient, payer, billcode, productline), shared tool
runtimes (ICD, NPI, and friends), and an installable shared library layer —
deployed as Bedrock AgentCore runtimes via Terraform across three AWS
accounts. Ingress S3 → EventBridge → SQS → trigger Lambda; egress EventBridge
plus an HITL queue.

- **AgentCore was client-mandated**: LabCorp leadership required Bedrock
  AgentCore Runtime as the orchestration platform; a Step Functions
  alternative was evaluated and explicitly rejected by the client. The
  architecture is platform-constrained, not greenfield-optimal.
- **Six specialists mirror the six low-confidence fields**; ICD and NPI tools
  were deliberately packaged as reusable runtimes for reuse across LabCorp
  assets.
- **The LLM never self-reports confidence**: specialists emit only prefixed
  evidence strings (a six-prefix taxonomy: EXACT/FUZZY/CONTEXT/INFER/
  TOOL_FAIL/EMPTY) and resolved values; a deterministic YAML-weighted
  confidence policy computes the score post-hoc. This separates probabilistic
  reasoning from auditable scoring — driven by healthcare compliance.
- **Strands adopted mid-build behind a Protocol as risk management**: two
  swappable `AgentRunner` implementations (direct Bedrock Converse and a thin
  Strands adapter) satisfy the same Protocol; the base agent imports no SDK,
  so tests inject fakes and the substrate can change without domain changes.
- **PHI defense-in-depth**: a dedicated redactor library, prompt-level PHI
  invariants, and a defensive re-scrub in the aggregator before egress.

## Key Patterns

- Canonical specialist lifecycle as an ABC: subclasses override only the
  prompt-rendering step; the 11-step lifecycle is shared.
- Config-as-validated-data outside code: per-specialist confidence weights in
  YAML validated against Pydantic schemas by a script gate; system prompts as
  markdown files with numbered, testable hard constraints ("no guessing —
  prefer degraded status").
- Fail-safe orchestration: threaded fan-out isolates specialist exceptions
  into failed-status outputs via an injected factory; the trigger Lambda
  enforces idempotency with a DynamoDB conditional write.
- Testing discipline: 731 tests with a 95% coverage gate; layered per-runtime
  test kinds (contract round-trips, policy, prompt, fixture replay) plus
  repo-guard tests that grep sources to ban forbidden imports.
- Staged-scope honesty: docstrings state exactly which business rules are in
  this slice and which are follow-ups, so partial implementations are
  self-documenting.
- Requirement-ID traceability: modules and tests cite business-rule IDs, task
  IDs, and design-doc sections throughout.
- Terraform layout: backend-setup bootstrap → per-env backend configs →
  reusable modules + deployment stacks; AgentCore runtimes provisioned via a
  documented CLI workaround pending native provider support.
- Claude as automated PR reviewer in CI (Bedrock-backed, review dismissal,
  diff-size gating).

## Deep-Dive Pointers

The frontmatter carries the repo URL and notable paths. Fetch them when higher
fidelity helps — the base agent ABC, the envelopes module, and the physician
specialist (the most complete exemplar) are the canonical implementations. If
the repo is unreachable, note "deep dive unavailable" and continue from this
profile.