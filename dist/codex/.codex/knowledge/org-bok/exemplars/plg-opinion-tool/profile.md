---
repo_url: https://github.com/MichaelWalker-git/plg-opinion-tool
notable_paths:
  - services/platform-common/src/plg_platform_common/guard/
  - services/platform-common/src/plg_platform_common/pipeline/pipeline.py
  - infra/modules/vpc/tests/vpc.tftest.hcl
  - infra/migrations/README.md
  - frontend/src/components/GuardedFieldView.tsx
  - frontend/src/theme.ts
  - services/ingestion-versioning/tests/test_import_isolation.py
  - services/platform-common/pyproject.toml
---

# Exemplar Profile: PLG Opinion Tool — Legal Opinion Drafting Platform

## Ask / Context

Paradise Law Group, a California real-estate law firm, wanted to cut an 8–12
hour manual opinion-letter process — extraction from deal documents, schedule
drafting, draft review — with one hard constraint dominating everything: a
fabricated fact in a legal document is unacceptable. Every asserted fact must
trace to a source document or be visibly missing. The engagement was staged as
fixed, reviewable deliverables (D2–D6) with milestone demo gates, extending a
prior deliverable (D1, a secure zero-retention Bedrock endpoint). PoC posture
(API-key auth, single dev environment, no CI pipeline yet) was a deliberate
speed-to-demo choice, with real auth and CI as documented follow-ups.

## Architecture & Why

A monorepo with three planes — Terraform + Alembic under `infra/`, five Python
`src`-layout service packages under `services/`, and a React SPA — turning deal
documents into an auditable "deal understanding graph" in Aurora PostgreSQL,
then drafting and reviewing opinion schedules from it.

- **Graph-as-tables won over RAG** because legal defensibility requires
  deterministic, citable, diffable answers — a vector-store answer cannot be
  cited or diffed. A 13-table relational graph with first-class temporal
  versioning (current vs superseded) is the source of truth; pgvector is
  demoted to similarity/dedup only.
- **The four-layer "never hallucinate" Guard is the centerpiece**: every
  asserted field is either value + resolved citation XOR a typed placeholder,
  enforced as (1) a frozen-dataclass constructor invariant, (2) a runtime
  Guard on every LLM output path, (3) a Postgres CHECK constraint, and (4) a
  fail-closed React component that renders exactly one branch. The loud amber
  placeholder chip is the UX face of the same guarantee.
- **Platform/domain split is the load-bearing seam**: one platform-common
  package owns all mechanism (the only Bedrock client, the only DB access,
  document store, eventing, observability); domain services own logic only and
  reach infrastructure through dependency-inverted `Protocol` ports, so every
  domain test runs fully offline.
- **Private-only AWS + Bedrock via PrivateLink** (no IGW/NAT) because the
  documents are attorney-client privileged. Terraform was chosen to match the
  D1 as-built, overriding the SOW's CloudFormation text.
- **Async job backbone**: API POSTs return `202 {operation_id}` backed by a
  fail-closed, forward-only operation state machine polled by the frontend.

## Key Patterns

- Ports-and-adapters at package granularity: narrow `Protocol` ports ship with
  an in-memory fake so consumers and tests land before the real adapter, with
  zero change when it arrives.
- Fail-closed everywhere: a resolver that raises means unresolved means
  placeholder; unknown decode shapes render the placeholder branch; a checksum
  mismatch halts migrations.
- Property-based testing as the intended blocking gate: Hypothesis in every
  Python package with shared strategy modules, fast-check in the frontend,
  named properties traced to business-rule IDs, and derandomized CI profiles
  already defined — wired to block once the follow-up CI pipeline lands.
- Import-isolation tests: a subprocess asserts that importing a pure surface
  leaks no boto3/SQLAlchemy — the layering rule is executable. Heavy deps live
  in optional extras with exact pins everywhere (no floating ranges, Python
  and npm alike).
- Terraform module-per-concern with colocated `*.tftest.hcl` mock-provider
  tests proving security invariants offline ("no 0.0.0.0/0 route") at zero
  cloud spend; environments compose modules.
- Migrations are a hardened single-owner schema: Alembic with a SHA-256
  checksum ledger that refuses tampered already-applied migrations; test
  fixtures reuse the real migrations rather than duplicating DDL.
- Requirement-ID citations in docstrings and comments link code greppably to
  the design corpus.
- Frontend token discipline: one `theme.ts` with a named semantic palette and
  an explicit hierarchy rule — color stays restrained so the amber placeholder
  chip remains the loudest element on any page.

## Deep-Dive Pointers

The frontmatter carries the repo URL and notable paths. Fetch them when higher
fidelity helps — the Guard module, the pipeline substrate, and a `tftest.hcl`
are the canonical implementations to imitate. If the repo is unreachable, note
"deep dive unavailable" and continue from this profile.