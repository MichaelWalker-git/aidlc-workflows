# Org Guide: Code Style

This is a cross-cutting Org BoK guide — organization-wide code style and
engineering-practice defaults distilled across reference projects, not tied
to any single exemplar. It loads as standing Tier-1 knowledge for the
developer and quality agents on every project, whether or not the
precedent-research stage ran. Sections marked *Fill in* are placeholders a
solution architect completes when adopting the framework; the structure and
the shipped defaults are real. `/aidlc-distill` proposes additions when it
spots org-wide conventions; a solution architect curates and commits them.

## How to Use This Guide

- Treat every statement here as the organization's default position. Defaults
  are overridden by affirmed memory rules (the `## Code Style` section of
  `org.md`/`team.md`/`project.md` always wins) and, on brownfield work, by
  locally discovered affirmed practices.
- When a reference brief is present, its patterns-to-follow are more specific
  than this guide — apply them first, and use this guide for everything the
  brief does not cover.
- For the quality agent: these defaults are review criteria — flag deviations
  in generated code, but flag them as style findings, never as functional
  defects.

## Precedence

Stated verbatim: on greenfield work, BoK guidance is the default; on
brownfield work, locally discovered and affirmed practices win — consistency
with the codebase you are in beats org ideals.

## Naming & Structure

Org-wide defaults for how code is named and laid out.

- Names state intent at the call site: functions are verb-first, booleans
  read as predicates (`isReady`, `hasProfile`), and abbreviations are
  avoided unless they are domain vocabulary.
- One concept per file; the file name matches the exported concept.
- Infrastructure and handler logic live behind a hard seam: handler/service
  packages carry no IaC dependency (no `aws-cdk-lib` import in a Lambda
  package); the infra app owns every resource and points at handlers by
  path. Handlers stay thin — parse, validate, delegate to shared
  helpers/services, respond through a shared response helper. (Seen in
  mri-gov-ap, plg-opinion-tool's platform/domain split, meeting-crm.)
- The alternative house layout co-locates them per function: a domain folder
  holding `index.ts` (the CDK function factory with a shared typed
  signature and default props) beside `handler.ts` (runtime) and optional
  `helpers.ts`, with numbered prefixes making Step Functions order legible
  in the tree. Pick one seam per repo and keep it uniform. (Seen in
  idp-portal's ~140 handlers, idp-module, ai-document-processor-cdk,
  idp-human-validation.)
- Stage-scoped deterministic naming: one helper builds every construct ID,
  resource name, and cross-stack export key from STAGE/app-name env vars and
  fails fast when STAGE is unset — convention-driven wiring instead of
  string-scattered names. (Seen in idp-module, idp-portal,
  ai-document-processor-cdk, vrc-roi-validation, idp-human-validation.)
- Requirement-ID traceability: code that implements a rule from the design
  corpus cites the rule's ID in its docstring/comment/test name, so code is
  greppably linked to the design documents. (Seen in plg-opinion-tool,
  aws-mirror-site, mri-gov-ap.)
- *Fill in: org-specific layout conventions — e.g. package/module topology,
  test-file placement, barrel-file policy.*

## Formatting & Linting

- Formatting is a tool's job, never a review comment: every repo carries a
  committed formatter and linter config, and CI enforces both.
- TypeScript baseline is strict-plus: `strict` with `noUncheckedIndexedAccess`
  and `noImplicitOverride`, ESM (`"type": "module"`), flat ESLint config.
  (Seen in mri-gov-ap and aws-mirror-site; adopt for new TS repos.)
- Dependencies are exact-pinned with committed lockfiles — no floating
  ranges, Python and npm alike. (Stated as a security rule in
  plg-opinion-tool; aws-mirror-site pins via corepack.)
- *Fill in: the org's canonical formatter/linter configs and where to copy
  them from — e.g. a shared config package, or a reference repo's config
  named in an exemplar profile's deep-dive pointers.*

## Errors & Logging

- Validate inputs at the boundary and fail fast with meaningful errors;
  never swallow exceptions silently.
- Logging is structured JSON through one mandatory logger module, with level
  semantics and required entity-ID metadata (the domain IDs a responder
  needs) spelled out as convention — built for log-insights querying, not
  console reading. (Seen in meeting-crm, aws-mirror-site's EMF metrics.)
- A failed dependency degrades to an explicit, safe state (a 503, a held
  work item, a typed error), never to a silent fallback — especially when
  the fallback has billing or correctness consequences. (Seen in
  meeting-crm's Claude client, plg-opinion-tool's fail-closed posture.)
- *Fill in: org error-handling and logging conventions — e.g. structured
  logging shape, error-type taxonomy, retry/backoff defaults.*

## Testing Practices

- Every behavior change ships with a test that fails without it; every fixed
  defect gets a regression test first.
- Tests are independent — no execution-order or shared-state coupling.
- Keep domain cores pure so they test offline: business logic takes injected
  clients/ports (no AWS, no I/O in the core), and the test tree mirrors the
  source tree. (Seen in mri-gov-ap's routing engine, plg-opinion-tool's
  Protocol ports, aws-mirror-site's injected clients.)
- LLM tests are hermetic by doctrine: the unit suite never hits a live model
  — a fake runner/model double ships beside the port, and LLM evals live in
  a separate opt-in tier with their own harness. (Seen in
  lpl-beacon-concierge's FakeModel + evals tier, labcorp-idp's FakeRunner,
  market-intelligence-platform's stubbed judges.)
- Layering rules are executable, not aspirational: enforce them with
  import-linter contracts, subprocess import-leak tests, or repo-guard tests
  that grep for banned imports. (Seen in pod-staffing-planner,
  plg-opinion-tool, labcorp-idp, labcorp-compendium-agent's public-surface
  contract tests.)
- LLM behavior is regression-tested like code: known production regressions
  become permanent eval cases, prompts are versioned files (diffable
  history, never overwritten strings), and accuracy gates guard promotion
  where extraction quality is the contract. (vrc-idp is the reference
  implementation — promptfoo suites, golden datasets, QA replay gate.)
- Harden every structured-LLM-output path the same way: low temperature, an
  explicit "JSON only"/tagged-output instruction with the schema (and
  few-shot examples) in the prompt, then defense-in-depth parsing — strip
  code fences, regex-match the outermost braces/tags, parse, coerce
  field-by-field into a typed interface with defaults — and log the raw
  model text on failure before rethrowing. A self-healing retry (re-prompt
  the model to fix its own invalid JSON) is an acceptable last layer. (Seen
  in idp-pdf-prefill, textract-mail-scanning, otter-notion-integration,
  idp-cdk-constructs, personalized-messaging-marketing.)
- Property-based tests guard round-trip and invariant-shaped contracts
  (serialize/parse, idempotence), with named properties traced to the rule
  they prove. (Seen in mri-gov-ap's ERP batch serializer,
  plg-opinion-tool's blocking Hypothesis/fast-check gates,
  market-intelligence-platform's allocation invariants,
  pod-staffing-planner's engine properties.)
- Where a client-supplied reference artifact exists (a spreadsheet, a golden
  dataset), commit it and gate on reproducing it — a correctness gate
  against the client's own numbers beats any synthetic fixture. (Seen in
  pod-staffing-planner's CSV correctness gate, vrc-idp's golden datasets,
  idp-human-validation's holdout sets.)
- Experiment and readiness claims are ledgers, not marketing: record each
  experiment or go/no-go call with its cost, result, and failure autopsy,
  and let a negative result reverse the bet. (Seen in idp-human-validation's
  experiment index and fine-tuning reversal, market-intelligence-platform's
  real-money readiness no-go, aws-mirror-site's reviewed-vs-verified badge.)
- Pin operational scar tissue as tests: when an incident fix lands in
  infrastructure code (a scaling expression, an alarm setting), add a test
  asserting the load-bearing string/value with a comment naming the incident
  — cheap guards encoding hard-won lessons. (Seen in vrc-roi-validation's
  alarm tests, gc-social-api's three-layer migration-safety enforcement.)
- Secrets never land in the repo: no live keys in eval configs, no demo
  passwords in docs, no default credentials in source — Secrets
  Manager/SOPS only. Committed-credential findings in older repos
  (genai-cdk-claude's promptfoo config, main-records' docs) are the
  anti-pattern this rule exists to prevent.
- *Fill in: org testing conventions — e.g. test naming, fixture policy,
  coverage stance beyond the memory layer's `## Testing Posture`.*

## Review Checklist

What the quality agent checks generated code against, beyond functional
correctness. *Fill in: the org's review checklist — the shipped entries are
format examples a solution architect extends.*

- [ ] Names read as intent at the call site
- [ ] No formatting or lint deviations from the committed configs
- [ ] Errors carry enough context to debug without a reproduction
