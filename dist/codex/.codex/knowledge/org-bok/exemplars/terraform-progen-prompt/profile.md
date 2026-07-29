---
repo_url: https://github.com/MichaelWalker-git/terraform-progen-prompt
notable_paths:
  - src/terraform-project.ts
  - src/options.ts
  - src/hcl/versions.ts
  - src/workflows/index.ts
  - src/scaffold/index.ts
  - test/terraform-project.test.ts
  - .projenrc.ts
  - aidlc-docs/inception/requirements/requirements.md
---

# Exemplar Profile: Terraform Projen — Governed-Repo Generator for Raw HCL

## Ask / Context

> TODO(interview): inferred from repo analysis only — not yet confirmed by
> the solution architect.

The org maintains a fleet of projen-governed CDK TypeScript repos and a
separate set of hand-wired raw-HCL Terraform repos that had drifted apart;
the ask was "give our Terraform repos the same projen governance — managed
files, self-mutation CI, nightly upgrades, blocking scanners — without
forcing CDKTF or rewriting infra in TypeScript." Raw HCL was an explicit
constraint (CDKTF and terragrunt on a do-not-use list). The deliverable is a
repo generator (a projen project type consumed via `npx projen new --from`),
with the success metric "new compliant Terraform repo in under 5 minutes,
zero hand-edited governance files." Security/compliance reviewers were a
first-class stakeholder. The project doubled as an AI-DLC proving run — the
full design record ships in-repo, npmignored from the published artifact.

## Architecture & Why

> TODO(interview): inferred from repo analysis only — not yet confirmed by
> the solution architect.

A TypeScript library defining a `TerraformProject` projen project type that
synthesizes fully-governed Terraform repos: tflint, blocking tfsec +
checkov, terraform-docs, native `terraform test` scaffolding, and a
three-workflow GitHub Actions suite — all regenerated from a consumer's
`.projenrc.ts`.

- **Self-hosting**: the library builds itself with projen — the
  single-source-of-truth model it sells is the model it lives by.
- **Pure render / effectful assemble split**: HCL generation is pure string
  functions (sorted keys, no timestamps) deliberately separated from the
  side-effecting projen components, so determinism and idempotency are
  directly testable.
- **Two-tier file ownership**: governance config is regenerated `TextFile`s
  carrying a MANAGED header; scaffold files (`main.tf`, README) are
  write-once `SampleFile`s users own. The ownership decision is documented
  per file.
- **The generated CI trio mirrors the org's CDK repos**: build with
  self-mutation (drift → patch artifact → isolated write job), nightly
  dependency-upgrade PRs, and semantic PR-title lint — with least-privilege
  `permissions:` on every generated job.
- **Supply-chain pinning as a typed option**: a `ToolVersions` interface
  with pinned defaults ("never `latest`") threaded into both projen tasks
  and generated CI; consumers can override but cannot accidentally float.
- **Init-safe scaffolds**: the backend file is emitted fully commented so
  `terraform init` never fails on placeholders; tests assert the
  commented-ness.

## Key Patterns

- Synthesis-test discipline: a `Testing.synth` helper asserts emitted file
  sets per option combination, rendered HCL content, least-privilege
  permissions in generated workflows, and `synth() === synth()` determinism
  — behavior assertions, not snapshots.
- Options contract: a public interface where every field is optional with
  `@default` JSDoc, resolved by a pure function — "defaults are the
  product"; the zero-config call yields a complete governed repo.
- Requirement-ID traceability in code comments (`SECURITY-10`, `NFR-2`)
  linking implementation lines to the committed requirements doc.
- Composition root calling ordered add-component functions, one directory
  per concern (config/scaffold/tasks/workflows/tests/hcl).
- Copy tone: short why-comments ("commented so `terraform init` does not
  fail before the team fills in real values"); README leads with what you
  get and a defaults table.

## Deep-Dive Pointers

The frontmatter carries the repo URL and notable paths. Fetch them when
higher fidelity helps — the composition root, the options contract, and the
synthesis tests are the canonical implementations. If the repo is
unreachable, note "deep dive unavailable" and continue from this profile.