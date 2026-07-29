# Org Guide: Architecture Principles

This is a cross-cutting Org BoK guide — organization-wide architecture
defaults distilled across reference projects, not tied to any single
exemplar. It loads as standing Tier-1 knowledge for the architect agent on
every project, whether or not the precedent-research stage ran. Sections
marked *Fill in* are placeholders a solution architect completes when
adopting the framework; the structure and the shipped defaults are real.
`/aidlc-distill` proposes additions when it spots org-wide conventions; a
solution architect curates and commits them.

## How to Use This Guide

- Treat every statement here as the organization's default position, not a
  hard rule. Defaults are overridden by affirmed memory rules (`org.md`,
  `team.md`, `project.md`) and, on brownfield work, by locally discovered
  affirmed practices.
- When a reference brief is present, its exemplar-specific patterns are more
  specific than this guide — apply them first, and use this guide for
  everything the brief does not cover.
- When you deviate from a default, record the deviation and its rationale in
  the stage's decision artifact (ADR or equivalent) — silent deviation is the
  failure mode this guide exists to prevent.

## Precedence

Stated verbatim: on greenfield work, BoK guidance is the default; on
brownfield work, locally discovered and affirmed practices win — consistency
with the codebase you are in beats org ideals.

## Principles

The organization's standing architecture defaults. Each principle carries its
rationale so an agent can judge when a project genuinely falls outside it.

1. **Start with the simplest topology that has an ownership boundary to
   justify it.** A modular monolith owned by one team beats microservices
   owned by nobody. Split services only along real team-ownership seams.
2. **Boundaries first, internals second.** Component boundaries and the
   contracts between them are the architecture; internal structure is
   refactorable detail.
3. **Version-controlled contracts at every seam.** Provisioning, APIs, and
   schemas are expressed as reviewed, versioned artifacts (IaC modules,
   OpenAPI specs, migration files) — never as ad-hoc console or API calls.
4. **Design for auditability.** Every state-changing action should leave a
   reviewable trail (pull request, audit event, migration history). If an
   action cannot be audited, redesign the seam so it can.
5. **LLM access goes through one sealed chokepoint.** A single wrapper
   package/module is the only path to the model provider — no service imports
   the provider SDK directly. The chokepoint owns auth modes, model tiering,
   timeout budgets, and retry policy, so switching providers, accounts, or
   billing paths is a one-module change. (Seen in mri-gov-ap's
   `llm-http-client`, plg-opinion-tool's platform-common LLM client, and
   meeting-crm's gated Claude client.)
6. **Fail closed, and fail loud on configuration.** Uncertainty routes to
   human review, an unavailable dependency holds work rather than approving
   it, and a missing secret or unconfigured path throws at deploy/startup
   instead of silently falling back. Errors degrade to the safe branch, never
   to acceptance. (Seen in mri-gov-ap's confidence gate and validation holds,
   plg-opinion-tool's Guard and checksum-gated migrations, meeting-crm's
   deploy guard, and aws-mirror-site's budget fail-stop-with-teardown.)
7. **Serverless-first, with the cost posture written down.** Default to
   near-zero-idle serverless topologies (Lambda, on-demand DynamoDB, Aurora
   Serverless at the ACU floor) and record the cost guardrails in a committed
   document, not tribal knowledge. Reach for always-on compute only when the
   workload proves it (e.g. self-hosted GPU inference under PHI constraints
   in vrc-idp). (Cost posture documents: mri-gov-ap's `COST.md`,
   meeting-crm's ~$1/month target.)
8. **Compliance and structural constraints run as code on every build.**
   cdk-nag (plus domain packs like HIPAA) runs on every synth and an
   unsuppressed finding fails it; suppressions are co-located with a written
   reason. Where a rule is architectural rather than infrastructural, encode
   it as a scoped lint rule (aws-mirror-site forbids network access in its
   generation path via ESLint). (Seen in mri-gov-ap, vrc-idp,
   aws-mirror-site.)
9. **Agent-context files are operational memory.** CLAUDE.md/AGENTS.md and
   dated decision comments in code are first-class engineering artifacts:
   rules written as postmortems with mechanism, per-directory scoping, and
   named, dated decisions at the seam they explain. The repo should explain
   its own architecture. (Seen in meeting-crm's postmortem-grade CLAUDE.md,
   mri-gov-ap's decision commentary, vrc-idp's assistant-facing build rules.)
10. **Transport-free cores behind thin harness adapters.** Business logic
    takes injected dependencies (clients, LLM runners, clocks, id factories)
    through small interfaces/Protocols and never imports the SDK or the
    transport; the Lambda/HTTP handler only does plumbing. This is what
    makes domain logic testable offline and substrates swappable — the same
    seam absorbed a Strands→direct-Converse swap (LabCorp-IDP), an
    EventBridge→Kafka migration path (market-intelligence-platform), and a
    GCP→Azure identity-provider migration (pod-staffing-planner).
11. **The LLM judges; deterministic code decides.** Where an AI system takes
    consequential actions (position sizing, confidence scoring, severity
    classification), the LLM emits judgment material only — evidence,
    rationale, candidates — and a pure, tested function computes the
    decision. Enforce it structurally when possible: an output schema that
    cannot express the decision, pinned by a test. (Seen in
    market-intelligence-platform's allocation engine, labcorp-idp's
    post-hoc confidence policy, blueprint-checker's published severity
    formula, mri-gov-ap's deterministic totals reconciliation.)
12. **Contested concurrent work is claimed atomically.** Reviewer
    assignment, fan-in joins, and idempotency all reduce to a conditional
    write on a deterministic key (with a timeout where a claim can be
    abandoned) — no locks, no workflow engine. (Seen in blueprint-checker's
    reviewer claiming, market-intelligence-platform's idempotency-guard
    join, labcorp-idp's trigger idempotency.)
13. **Generated repo governance with a drift guard.** Tooling config
    (package manifests, lint, CI workflows) is declared once in a generator
    (projen for CDK/TS repos, the projen-terraform project type for raw-HCL
    repos) and regenerated; CI self-mutation fails or patches any hand-edit
    of generated files. Edit the source of truth, never the output.
    (terraform-progen-prompt is the org's generator; consumed in
    plg-secure-bedrock-endpoint, idp-module, ai-document-processor-cdk,
    genai-cdk-claude, land-coverage, blueprint-checker,
    tennyson-contract-comparison.)
14. **In client or demo AWS accounts, inference bills the vendor's key.**
    Bedrock is invoked via HTTPS with a bearer API key — never the host
    account's IAM — and every AI code path fails fast when the key is
    missing, so a deployment can never silently bill the host account.
    (Stated as cross-project doctrine in main-records, mirroring
    meeting-crm, vrc-idp, and blueprint-checker.) The boundary: platforms
    where the client owns inference spend (lpl-beacon-concierge, labcorp-idp)
    use the platform-native IAM path instead.
15. **A deterministic orchestrator owns state around a non-deterministic
    agent.** In agent pipelines, plain code (a script, a state machine)
    owns status transitions and verifies each LLM phase against concrete,
    machine-checkable criteria; the model only produces artifacts. Bound
    every loop: per-phase attempt caps, a global timeout under the platform
    kill, non-blocking optional phases. (Seen in developmentplatform's
    phase orchestrator and labcorp-compendium-agent's deterministic
    cascade.)
16. **RFP/demo builds: full-build what is scored, stub the plumbing with a
    named upgrade path.** The AI features and workflows the evaluation
    scores get real implementations; enterprise plumbing (SSO, WAF, SIEM,
    managed search) is replaced by cheaper equivalents or omitted stacks
    kept in source — and every such cut is documented with its production
    replacement named. (Seen in main-records' narrated cost decisions,
    curriculum-management's JSONB extensibility on a demo budget,
    translation-indigenous-languages' offline demo mode.)
17. **Retrieval shortlists; the LLM adjudicates.** When routing or
    classifying against a known set (projects, document types), embed and
    kNN-shortlist first (top-K, trimmed fields), then let a low-temperature
    LLM pick from the shortlist with a strict-JSON verdict — pure kNN is
    too fuzzy for a final decision, pure LLM over the full set doesn't
    cost-bound. (Seen in otter-notion-integration's transcript router,
    genai-classification's document-type vote, labcorp-compendium-agent's
    tiered cascade.)
18. *Fill in: additional org principles, one numbered entry each — statement
    in bold, then the rationale and the boundary where it stops applying.*

## Technology Defaults

The org's default picks for common capability decisions. *Fill in each row —
the shipped rows are format examples a solution architect replaces.*

| Capability | Default | Use something else when… |
|------------|---------|--------------------------|
| *Fill in: e.g. service runtime* | *e.g. Node.js + TypeScript* | *e.g. compute-bound workloads with a profiling case* |
| *Fill in: e.g. infrastructure* | *e.g. Terraform modules from the platform catalog* | *e.g. the capability has no catalog module yet* |
| *Fill in: e.g. persistence* | *e.g. PostgreSQL* | *e.g. access pattern is genuinely key-value at scale* |

## Deviation Process

*Fill in: where architecture deviations are recorded and who affirms them —
e.g. "an ADR in the project record, affirmed by the platform architecture
guild." Until filled in, the default is: record the deviation as an ADR in
the stage's decision artifact and surface it at the next human checkpoint.*
