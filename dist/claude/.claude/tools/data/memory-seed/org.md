# Org-Level Rules

> Framework defaults. Read with `team.md` and `project.md` from the active
> space. The resolver loads every applicable layer; narrower layers add
> specialisation and must not contradict broader policy.

## Way of Working

We use **trunk-based development**: all work reaches `main` via
short-lived branches that squash-merge back to `main`. A branch lives as
long as its Bolt — typically hours, at most two days; work that cannot
merge within two days is split into smaller units. Long-lived branches
accumulate merge debt; we avoid them.

No one — human or agent — pushes directly to `main`. Bolt branches
merge only after their **gate approval**, which is the merge approval of
record. Two structural rules bind every gate:
- Where the team has more than one member, the gate approver is not the
  person who initiated the Bolt — self-approval is not review.
- Any change that weakens CI — deleted or skipped tests, lowered
  coverage thresholds, silenced failures — is an automatic blocker,
  regardless of everything else being green.

For Construction worktrees, the worktree base branch is `main` and the
merge target is `main`.

If our project requires multiple environments (staging, production), we
still keep one `main` and gate releases via tags or environment-specific
deployment configs — not via long-lived release branches.

We **squash-merge** Bolt branches into `main` by default. Each Bolt
becomes one commit on `main`, named by the Bolt slug; the audit log
preserves the full Bolt event sequence after the worktree is discarded.
Teams that prefer merge commits may affirm that in `team.md`.

## Walking Skeleton

When practices are scope-dependent, we run the walking-skeleton Bolt
**first** only when the active scope file declares `skeleton: on`. Bolt 1
is solo, gated, and the user explicitly approves before remaining Bolts
run.

We **skip the skeleton ceremony** when the active scope file declares
`skeleton: off`. The first Bolt runs like any other — there's nothing to
bootstrap.

After Bolt 1 ships (when it runs), the orchestrator fires the **ladder
prompt**: "How should the remaining Bolts run?" Options: continue
autonomously, gate every Bolt. The team picks per project. The choice
persists as `Construction Autonomy Mode` in `aidlc-state.md`.

## Testing Posture

We treat tests as a first-class deliverable in every Bolt. Specific
methodology — TDD, BDD, ATDD, or classic test-after — is captured by the
testing-strategy stage when it ships.

Until then, our default per scope is:
- `mvp`, `enterprise`, `feature`, `infra` → tests written alongside
  code; minimum 80% line coverage; tests run in CI before merge. In
  addition, every critical user journey named in the approved user
  stories has at least one **end-to-end test** executed in CI against a
  deployed (prod-like) environment before production promotion — unit
  tests alone do not satisfy the testing floor for these scopes.
- `bugfix`, `security-patch` → regression test for the specific
  bug/vulnerability; existing test suite must remain green; add an
  end-to-end regression when the defect was user-facing.
- `poc`, `refactor`, `workshop` → existing test suite remains green;
  no new test floor required.

End-to-end tooling is a team choice recorded in `team.md` (or the
code-style knowledge guide); the org mandates the journey coverage, not
the tool.

Affirm a stricter posture in `team.md` if the team commits to one.

## Deployment

We **deploy on merge**: every merge to `main` deploys automatically to
staging, and production promotion gates on automated checks — the
end-to-end suite green against staging plus post-deploy health — not on
a standing manual sign-off. The Bolt gate approval is the human
production approval of record; a second human at the deploy button
duplicates that review and degrades into rubber-stamping under volume.
Teams that need a named-person production approval (compliance mandate
or a declared transition posture) affirm it in `team.md`, time-boxed
where possible.

Each release is one immutable artifact built once by CI and promoted
through the project's environment chain verified by digest; environment
config and secrets are injected at deploy time — rebuilding for a
target environment invalidates the release.

Every production deploy runs an automated post-deploy smoke check and
emits a deploy event (version, commit SHA, deployer — human or agent)
to monitoring.

Deploy and release are decoupled: user-visible or risky changes ship
dark behind a feature flag, so release timing is a product decision
made by flag, not a deploy gate; every flag carries an owner and a
removal date at creation.

## Code Style

Every repo carries exactly one auto-formatter and one linter per
language, pinned, with config committed to the repo (`pyproject.toml`,
`biome.json`, `.golangci.yml`, etc.); CI runs both in check mode and
any failure blocks the Bolt gate. Lint findings are errors or the rule
is off — no accumulating warnings; a rule the team routinely
suppresses gets removed, not silenced inline. Currently blessed tools
per language live in the org-bok guide `guides/code-style.md`, so this
file survives tool churn; affirmed memory rules override the guide.

The repo's formatter/linter config is the style source of truth:
agents read it before making any code-style suggestion and never
restate or debate what it already enforces. Naming follows the
language's official conventions; teams may affirm stricter naming
rules in `team.md`.

For authored code, human or agent:
- Match the surrounding codebase — naming, module layout, error
  handling; when in doubt, copy the pattern of the nearest similar
  file.
- Comments describe the current state and purpose of code, never the
  change just made or the session ("now uses X" belongs in the commit
  message). Keep comments that explain a non-obvious why.
- A change that supersedes code deletes the superseded code in the
  same change — no orphaned functions, unused exports, or
  commented-out blocks; reuse an existing helper over writing a
  near-duplicate.
- AI provenance lives in commit trailers, never as attribution
  comments or markers in source files.

## UI Standards

Universal rules for anything with a user interface — web, mobile, or
desktop. Read together with `## Anti-Slop Branding`: that section says
what a UI must never look like; this one says what every UI must
structurally be. Concrete tools (component library, a11y linter, state
library) are team choices in `team.md`; the brand values themselves
(colors, type pairing, icon set) live in `project.md`.

**Design tokens are the single source of truth.** Colors, typography
scale, spacing, radii, shadows, and layout dimensions are defined once
in a theme/tokens module and consumed everywhere by reference. Raw
color and size literals in feature code are review findings, not
style. Semantic colors ship as scales (light→dark stops plus contrast
text), not single values; interaction states (hover, selected,
disabled, focus) derive from the token ramp — never fresh ad-hoc
values. Tokens are defined for every color mode the platform supports,
even when only one ships initially.

**Restyle at the theme layer, not the call site.** When a project uses
a component library, brand restyling lives in the theme/override
layer — one place per component — so every usage is on-brand by
default. New visual variants extend the library through its supported
extension mechanism; per-usage restyling of library components is the
smell that precedes visual drift.

**Layered architecture.** UI code keeps three layers with one-way
dependencies: tokens/theme → shared primitives (app-agnostic
components, hooks, API clients) → feature modules. Feature modules
never import from sibling features; primitives never know about
domains. Shared primitives forward refs, styling props, and rest
props, and extend the underlying library's types. Icons route through
a single wrapper primitive so sizing, color, and the icon source stay
uniform and swappable.

**Every async surface designs all four states.** Loading (skeletons or
pending controls sized to the content they replace), empty (dedicated
component with helpful copy and a call to action — never a blank
region), error (visible, human-readable, recoverable), and success.
One shared implementation each for tables/lists, empty states, and
notifications — features supply content, not new mechanisms. A single
app-wide notification system reports mutation success and failure
consistently.

**Accessibility floor: WCAG 2.1 AA.** Interactive elements are
keyboard-operable with visible focus; semantics come from native
elements first, ARIA second; text and controls meet contrast ratios;
images and icon-only controls carry meaningful labels. Automated a11y
checks run in CI and block the Bolt gate like any other lint failure.
Prefer library primitives with accessibility built in over hand-rolled
widgets.

**Structural defaults.**
- Forms are schema-first: one validation schema per form, owning the
  user-facing messages and the inferred types; submit controls show
  pending state; errors surface at the field.
- Server state flows through a query/cache layer, not hand-rolled
  fetch-and-set; in-flight operations get per-item pending UI.
- Routes, breakpoints, and layout dimensions are named constants;
  non-critical routes are code-split.
- Typography uses relative units on a responsive scale defined once;
  supported viewport range is declared per project in `project.md`
  and every screen is designed for it — not desktop-only with
  accidental mobile.
- User-facing strings are separable from code (no concatenated
  sentence fragments) so localization is a config change, not a
  rewrite; dates and numbers format through the platform's locale
  APIs.
- Motion is systemized: named variants with shared timing tokens, no
  one-off animations in feature code (see Anti-Slop for what motion
  must earn).

Gate check: the Bolt gate reviewer of any UI change verifies token
usage, the four async states, and the accessibility floor alongside
the Anti-Slop checklist. Teams affirm their component library, lint
tooling, and any stricter posture in `team.md`.

## Anti-Slop Branding

Everything user-facing we ship — product UI, marketing pages, copy,
imagery — must read as deliberately designed, never as AI-generated.
The root smell is stacked defaults: LLMs emit the statistical median
of their training data, so a page built entirely from framework
defaults signals "nobody made a decision here". Any single pattern
below is innocent in isolation; three or more together on one surface
is slop and blocks the Bolt gate like any other review finding.

**Brand-first rule.** Before any UI work, the project records a
minimal brand identity in `project.md`: one dominant brand color, a
heading/body type pairing, and a single icon set. Stock defaults
(Inter everywhere, Tailwind indigo, unthemed shadcn) are a starting
point to deviate from, never the shipped look. The name-swap test is
the acceptance bar: if a competitor's name can replace ours and every
screen still reads correctly, the branding is not done.

Visual smells — off by default; using one requires an affirmed brand
rationale in `project.md`:
- Purple/indigo-to-blue gradient washes, gradient headline text, and
  gradient CTA buttons.
- Glassmorphism (frosted-blur cards), neon glows, oversized tinted
  box-shadows, floating gradient blobs or aurora backgrounds.
- Sparkle ✨ motifs and emoji used as icons, bullets, or nav items.
- Uniform oversized border-radius on every element; pick a radius and
  shadow scale per component role, deliberately.
- Decorative status dots, pulsing "Live"/"New" pills, and colored
  accent bars that map to no real state or hierarchy.

Layout and motion smells:
- No reflexive landing-page rhythm: centered hero + badge above the
  H1 + two generic CTAs + three-column icon/title/blurb card grid,
  repeated per section. Each section's layout follows its content.
- Motion carries feedback or hierarchy or it doesn't ship: no
  scale-on-hover everywhere, identical fade-in scroll reveals,
  confetti, or scroll-jacking. Conversely, real interaction states
  are mandatory — hover, focus, error, empty, and loading states are
  designed, not defaulted.

Copy smells:
- Banned in user-facing copy: *seamless, elevate, unlock,
  supercharge, empower, effortless, game-changer, cutting-edge,
  transformative, delve, "in today's fast-paced world"* and kin.
  Headlines state what the product concretely does.
- Banned constructions: "It's not just X, it's Y" reframes,
  adjective triads ("Fast. Simple. Secure."), em-dash chains, emoji
  in headings or bullets, exclamation-mark enthusiasm, hedging
  ("may help you") around claims we won't commit to.
- CTAs use task-specific verbs, not "Learn more"/"Get Started"
  stacked three per section.

Content and imagery smells — these are Forbidden-tier, no exception
path:
- No invented social proof: no fabricated user counts, star ratings,
  testimonials with stock names or gradient avatars, or "trusted by"
  logo strips for companies that are not real customers.
- No hallucinated features: marketing and UI describe only
  capabilities the product actually has.
- No lorem ipsum, "Company Name", or placeholder assets in anything
  that reaches staging or beyond.
- AI-generated imagery ships only when it is brand-consistent and
  free of generation artifacts; icon sets never mix styles or
  weights within one product.

Gate check: the Bolt gate reviewer of any user-facing change applies
this section as a checklist; three or more smells on one surface is
an automatic blocker. Teams may affirm a stricter posture or a
project-specific slop lint in `team.md`.

## Tech Stack

These are the org defaults for all greenfield work: deviating from any
row requires an ADR and a `## Tech Stack` entry in `project.md`;
brownfield projects keep their existing stack.

| Capability         | Default                                            | Use something else when…                                        |
|--------------------|----------------------------------------------------|-----------------------------------------------------------------|
| Language & runtime | TypeScript on Node.js                              | data/ML workloads → Python; compute-bound with a profiling case |
| Frontend           | React                                              | —                                                               |
| Database           | PostgreSQL; DynamoDB for key-value access at scale | neither relational nor key-value fits (graph, time-series, …)   |
| Cache              | Redis/Valkey (ElastiCache)                         | per-request memoization suffices → in-process cache             |
| Messaging          | SQS + SNS/EventBridge                              | streaming, replay, or strict ordering at scale → Kafka (MSK)    |
| API protocol       | REST + OpenAPI                                     | client-driven aggregation → GraphQL; internal RPC → gRPC        |
| Auth / identity    | AWS Cognito                                        | complex B2B SSO or enterprise federation → dedicated IdP        |
| Cloud              | AWS                                                | client contract dictates otherwise                              |
| Compute            | ECS Fargate (images in ECR)                        | K8s ecosystem or multi-cloud → EKS; spiky event-driven → Lambda |
| IaC                | Terraform                                          | — (mandated, see below)                                         |
| CI/CD              | GitHub Actions                                     | repo is hosted elsewhere or client mandates a platform          |
| Observability      | CloudWatch + Sentry (errors)                       | org-wide APM or multi-account visibility → dedicated vendor     |
| Testing            | Vitest (unit) + Playwright (E2E)                   | non-TypeScript stack → the language's standard (e.g. pytest)    |
| AI / LLM           | Claude on Amazon Bedrock                           | model or feature only on a direct API → provider SDK            |
| Secrets            | AWS Secrets Manager                                | non-secret runtime config → SSM Parameter Store                 |

In-language tooling below this table (ORM, package manager, monorepo
tooling, lint/format tools) is a team choice recorded in `team.md`.
Capabilities not listed (search, CDN, mobile, …) are project decisions
recorded with an ADR in `project.md` when they arise.

## API Standards

Every API is designed **contract-first**: its machine-readable contract
(OpenAPI, GraphQL SDL, protobuf, AsyncAPI — per the project's protocol
choice in `project.md`) is written and reviewed before implementation
and is the contract of record, not documentation generated after the
fact.

- Evolve APIs additively; never break existing clients within a
  version. A breaking change requires a new major version **and** a
  published deprecation path — announced, marked in the contract, with
  a migration window. The versioning mechanism (URI, header, query) is
  a project choice recorded in `project.md`.
- HTTP errors are RFC 9457 Problem Details with a stable
  machine-readable type and the request's correlation ID; never leak
  stack traces or internal identifiers. Projects with an entrenched
  legacy error contract may affirm it in `project.md`.
- Collection endpoints paginate from the first release — retrofitting
  pagination is itself a breaking change; unbounded list responses
  need an affirmed exception.
- Every API enforces rate limits and signals them to clients (`429`
  plus `Retry-After`).
- Contracts pass automated lint against org rules in CI and are
  registered in the org API catalog — no shadow APIs. Lint tooling is
  a team choice in `team.md`.

## Observability

- Logs are structured (JSON), carry a correlation/request ID, and flow
  to the centralized log service.
- Every deployable unit ships with metrics, at least one availability
  alarm, and a health endpoint before it reaches production.
- Dashboards and alarm routing are defined in IaC alongside the service,
  not hand-built in the console.

## Environments & Naming

- The default environment set is `dev`, `staging`, `prod`, defined as
  code and promoting the same artifact in that order; a project that
  needs a different set affirms it in `project.md`.
- Cloud resources follow the org naming pattern
  `<project>-<environment>-<resource>` (kebab-case) wherever the
  platform's naming constraints allow. Names encode only immutable
  information and never secrets or PII; anything that can change
  belongs in the mandatory tag set, not the name. Teams may specialise
  the pattern in `team.md`.
- Resources provisioned by an agent carry provenance metadata — a
  `managed-by` tag plus an attributable agent identity — so an audit
  can trace what an agent created.
- Each project deploys to a single primary region/location, chosen at
  design time and recorded in the design artifact; deviating requires
  documented data-residency, latency, or resilience grounds.

## Forbidden

- NEVER hardcode credentials, API keys, tokens, or other secrets in
  code, IaC, or any file committed to the repository.
- NEVER create publicly readable object storage or `0.0.0.0/0` ingress
  rules without an exception affirmed in `project.md`.
- NEVER create or mutate cloud resources outside the project's IaC
  (Terraform) — no console changes, no ad-hoc CLI provisioning.
- NEVER store Terraform state locally or commit state files to the
  repository; state lives in the remote backend.
- NEVER write PII, credentials, or session tokens to logs.
- NEVER copy production data into dev/test environments without an
  affirmed anonymization step.

## Mandated

- ALWAYS enable encryption at rest and TLS 1.2+ in transit for every
  data store and network endpoint.
- ALWAYS source runtime secrets from a managed secret store (e.g. AWS
  Secrets Manager or SSM Parameter Store) — never from files in the
  repository.
- ALWAYS tag every cloud resource with the org tag set: `owner`,
  `project`, `environment`, `cost-center`.
- ALWAYS pin Terraform module and provider versions.
- ALWAYS record architecture decisions and deviations from org defaults
  as an ADR in the stage's decision artifact.
- ALWAYS express APIs and schema changes as versioned, reviewed
  artifacts (OpenAPI specs, migration files) — never as untracked
  changes.
- ALWAYS classify data stores for PII at design time and record the
  classification in the design artifact.

## Corrections

<!-- Self-learning loop appends here. -->
<!-- Use team.md to record team-wide additions and project.md for
     project-specific specialisation. The loader resolves org → team →
     project at session start and retains every applicable rule. -->