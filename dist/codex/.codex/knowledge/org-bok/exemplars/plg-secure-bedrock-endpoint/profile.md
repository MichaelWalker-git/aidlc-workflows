---
repo_url: https://github.com/MichaelWalker-git/plg-secure-bedrock-endpoint
notable_paths:
  - modules/secure-bedrock-endpoint/iam.tf
  - modules/secure-bedrock-endpoint/outputs.tf
  - tests/plan.tftest.hcl
  - lambda/invoke-handler/lib.mjs
  - docs/ADR.md
  - docs/TRACEABILITY.md
  - GOVERNANCE.md
  - .github/workflows/build.yml
---

# Exemplar Profile: PLG Secure Bedrock Endpoint — Provable-Isolation LLM Gateway

## Ask / Context

> TODO(interview): inferred from repo analysis only — not yet confirmed by
> the solution architect.

Paradise Law Group's Deliverable 1 (SOW #1) — the Phase-1 substrate that
plg-opinion-tool later built on. The client bought one guarantee, not an
app: "prompts and legal documents stay inside our AWS account and are never
used to train a model" — everything exists to make that claim provable to a
law firm. The buyer is a named non-technical principal who wanted simple
API access to Claude with per-request model choice and live cost visibility
(API-key auth was in the SOW; SSO explicitly excluded; a cost-estimate
metric is emitted in-handler). He separately wanted OpenAI models — the
vendor built full multi-provider support but shipped it off-by-default to
protect the signed Claude-only scope. The SOW said CloudFormation; Terraform
was delivered anyway (ADR-001), betting acceptance criteria were
behavior-based and the org's governance stack was worth the divergence.

## Architecture & Why

> TODO(interview): inferred from repo analysis only — not yet confirmed by
> the solution architect.

A single-purpose governed Terraform repo (~2,450 lines): one reusable module
split by concern, wiring API Gateway (API key + usage plan) → a
zero-dependency Node.js Lambda in private subnets → Bedrock via PrivateLink.

- **Internet egress is architecturally impossible, not merely blocked**: no
  IGW, no NAT — every AWS dependency (Bedrock, logs, monitoring, X-Ray) is a
  VPC interface endpoint (ADR-004). No payload logging; CloudTrail data
  events for every invocation.
- **Defense-in-depth model allowlist in three layers** — Lambda IAM role
  (exact model ARNs), the Bedrock VPC-endpoint resource policy, and the
  handler's resolver — all derived from one variable (ADR-005).
- **Credential-free plan-time verification**: the module exposes ~20
  `fact_*` boolean/count outputs as a deliberate testing seam, and native
  `terraform test` runs with a fake-credential provider assert the security
  posture without deploys — correctness had to be provable before funding a
  live environment.
- **Safety rails as code**: the provider pins `allowed_account_ids` to the
  customer account so an apply anywhere else refuses; lifecycle
  preconditions guard region constraints; opt-in scope (OpenAI models ships
  fully built behind empty-list defaults, with ADRs stating that enabling it
  is a scope decision).
- **Lambda split into SDK shell + pure core** (`lib.mjs`: alias resolution,
  per-family request shaping, cost math, a hand-rolled SigV4 signer) so
  `node --test` runs with zero installs.

## Key Patterns

- Requirements traceability matrix: every FR-n/SEC-n maps to the
  implementing resource, the proving test, and the SOW acceptance criterion;
  requirement IDs appear in code comments and test failure messages.
- `fact_*` outputs as a provisioning-test seam — the reference pattern for
  asserting IaC security posture offline.
- ADRs that record verification, not just decisions: ADR-008 documents a
  live SigV4-vs-bearer experiment (exact observed errors) that overturned
  the vendor's own launch-post docs.
- Governed-repo standard (projen-terraform): managed files with `~~ MANAGED`
  headers, dual blocking scanners (checkov + tfsec, every skip justified
  inline), terraform-docs injection, and a self-mutation drift job —
  GOVERNANCE.md honestly documents that the generator was still in design
  and files were hand-authored to its contract.
- Two copy registers: dense claim-driven engineering docs, and a
  plain-language client getting-started guide that assumes no AWS background
  and never prints the API key.
- CLAUDE.md as an invariants list: "never widen the account pin, never add
  NAT — add an endpoint instead, never log prompt bodies."

## Deep-Dive Pointers

The frontmatter carries the repo URL and notable paths. Fetch them when
higher fidelity helps — the IAM allowlist math, the fact outputs, and the
plan-time tests are the canonical implementations. If the repo is
unreachable, note "deep dive unavailable" and continue from this profile.