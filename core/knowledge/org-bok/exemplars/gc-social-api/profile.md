---
repo_url: https://github.com/MichaelWalker-git/gc-social-api
notable_paths:
  - chanced/composer.json
  - dev/Phpstan/Rules/NoBlockingIndexInMigration.php
  - .husky/pre-commit
  - infra/lib/labels.ts
  - infra/bin/backend.ts
  - infra/lib/base-workers-stack.ts
  - docs/safe-migration-practices.md
  - phpstan.neon.dist
---

# Exemplar Profile: GC Social API — Multi-Brand Social Casino Platform

## Ask / Context

> TODO(interview): inferred from repo analysis only — not yet confirmed by
> the solution architect.

Run two white-label social/sweepstakes casino brands (Chanced, Punt) plus a
back-office admin from one codebase, so features and third-party
integrations (game providers, payments, KYC) ship to both brands at once.
Legal/regulatory pressure is a first-order requirement: sweepstakes-model
casinos must avoid real-gambling terminology, driving a lint-enforced
vocabulary ban and a phased verbiage migration (wager→play,
deposit→purchase, withdrawal→redemption) managed like a refactor backlog.
Production database availability drove heavy migration-safety investment;
scale concerns (game-round/balance event throughput) are live constraints.

## Architecture & Why

> TODO(interview): inferred from repo analysis only — not yet confirmed by
> the solution architect.

A multi-brand Laravel monorepo: three Laravel 12 / PHP 8.4 apps (two brands
plus a Filament admin) over a shared `common/` core of ~985 files, with
TypeScript CDK infrastructure deploying each brand × env to a separate AWS
account (six accounts) as ECS Fargate services plus a declarative Redis
queue-worker fleet.

- **Brand overlay via composer path-mapped namespaces**: each brand's
  composer.json maps `App\*` into `../common/app/*` with array-valued
  mappings so a brand-local file overrides the common one — the cheapest
  multi-brand reuse without package publishing. (The admin app duplicating
  some common classes, guarded only by a pre-commit warning, is accepted
  debt — a seam, not a pattern to copy.)
- **Migration-safety defense in depth**: the same invariant (no blocking
  index inside `Schema::table()`) is enforced at three layers — a runbook, a
  custom PHPStan rule with fixture tests, and a CI grep on new migration
  files. A registry of external schema consumers (ETL exports) documents the
  out-of-band blast radius.
- **Account-per-environment AWS topology** with SOPS + per-account KMS
  secrets, self-mutating CodePipelines per brand × env, and blue/green ECS
  deploys — operators rarely deploy manually.
- **Release flow as executable policy**: a CI enforcer blocks any merge to
  main not coming from staging and requires a Release-titled PR.
- **Queue workers as declarative data**: named workers with artisan command
  and scaling config as typed objects over one base construct — adding a
  queue is a config diff.

## Key Patterns

- Policy-as-lint: operational and compliance invariants encoded as custom
  static-analysis rules with fixture tests (DB safety, banned gambling
  vocabulary) rather than review checklists.
- Pre-commit gate per changed sub-project: Larastan (PHPStan level 5) +
  Pint, plus a common↔admin sync check.
- `Labels` value object for cloud naming/tagging across six accounts —
  org/env/region/app → names, tags, Parameter Store prefixes.
- Env/secret hygiene: SOPS with per-account KMS keys and a script guarding
  that required env keys stay in sync across the brand × env matrix.
- Domain rename as a tracked program: the compliance-driven verbiage
  migration has per-function status tables.
- Ops-first repo culture: pipeline runbook, bastion/DB/ECS toolbox scripts,
  runbooks for safe migrations and schema-change checklists.
- 546 shared PHPUnit tests run per-app against a real Postgres test DB; k6
  and artillery load tests in-repo.
- AI-assisted development institutionalized: per-app AGENTS.md, an AI
  guideline doc with MCP setup, and Cursor skills.

## Deep-Dive Pointers

The frontmatter carries the repo URL and notable paths. Fetch them when
higher fidelity helps — the composer autoload block, the custom PHPStan
rules, and the workers stack are the canonical implementations. If the repo
is unreachable, note "deep dive unavailable" and continue from this profile.