---
repo_url: https://github.com/MichaelWalker-git/ChancedRepos
notable_paths:
  - social-api/config/database.php
  - social-api/config/sentry.php
  - social-api/app/Exceptions/Handler.php
  - social-api/app/Http/Kernel.php
  - social-api/app/ModelLocking.php
  - social-api/app/Http/Middleware/Idempotency.php
  - social-api/app/Balance/BalanceService.php
  - social-api/config/horizon.php
  - social-api/app/Game/SecureNumberGenerator.php
  - social-api/buildspec.yml
  - social-frontend/src/lib/utils.js
  - social-frontend/src/lib/echo.js
---

# Exemplar Profile: ChancedRepos — Punt/Chanced Real-Money Gaming Platform

## Ask / Context

> TODO(interview): inferred from repo analysis only — not yet confirmed by
> the solution architect.

Punt/Chanced (Chanced Insurance Ltd) run an online social-casino /
sweepstakes gaming platform — real-money gaming with in-house provably-fair
games plus aggregated third-party casino providers (Pragmatic, Relax,
Softswiss, TVBet), fiat/crypto payments (AptPay, Paysafe, CoinsPaid),
KYC/fraud tooling (Veriff, Twilio, geo-blocking), and a Laravel Nova back
office. The monorepo (evolved from an earlier "runebet"/RSGP codebase)
holds the Laravel API, the Vue SPA, and a self-hosted soketi
(Pusher-protocol) websocket layer. Shipped by a small team prioritizing
feature velocity; balance correctness is the existential requirement.

## Architecture & Why

> TODO(interview): inferred from repo analysis only — not yet confirmed by
> the solution architect.

A single Laravel 9 monolith (`social-api/`) with domain folders directly
under `app/` (`Game/`, `Balance/`, `AntiFraud/`, `Sports/`, per-provider
integration folders), a Vue 3 + Vite SPA on Netlify, and a soketi
websocket container. Deploys are CodeBuild → ECR → ECS force-redeploy,
with `.env` pulled from S3 at build time.

- **One monolith because one small team owns the whole money path**: Redis
  distributed model locks + txid-keyed idempotency middleware + per-queue
  workers are far easier to reason about in-process than across services.
- **Correctness bought with runtime guards, not tests**: locks,
  idempotency, rate limits, geo blocks — the test tree is effectively
  empty. Trust the guards, don't imitate the coverage.
- **Defense-in-depth request gauntlet** in `app/Http/Kernel.php`:
  TrustProxies → IP filter → Cloudflare-header geo-block (HTTP 451) →
  reCAPTCHA → Redis throttle → idempotency.
- **Named-queue isolation**: financial concerns (`balances`, `bet-result`,
  `chargeback-doc`) each get dedicated Horizon/supervisord workers with
  tuned timeouts and retry counts, never the shared default queue.
- **Auth is Laravel Sanctum opaque tokens with scoped abilities**
  (`manage`, `chip-trader`), *not* JWT — do not cite this repo for JWT
  tenant isolation. Brand separation is a CORS allowlist plus per-app
  soketi credentials, not real multi-tenancy.
- **No read-replica routing and no connection-pool tuning exist here**: no
  read/write host arrays, no sticky config, no persistent PDO, no
  PgBouncer/RDS Proxy. If replicas or pooling exist in production, they
  live at the infrastructure layer, outside this repo.
- Config says MySQL by default but the image installs only `pdo_pgsql` and
  `BalanceService` uses `ON CONFLICT DO NOTHING` — production is
  Postgres-family; trust the code, not the config default.

## Key Patterns

- Two-tier Sentry with user-scoped context: backend `sentry/sentry-laravel`
  enriches scope with the authenticated user and launders error messages
  (any "SQL"/"model" text replaced) before clients see them; frontend
  `@sentry/vue` sets the user on login and joins distributed traces via
  `tracePropagationTargets` naming the API domains. SQL bindings off by
  default (PII-conscious). Datadog statsd coexists for counters — Sentry
  owns errors/traces, Datadog owns metrics.
- Money-mutation trio: Redis model lock (`withLock`) + idempotency
  middleware keyed on client `txid` (15-min response cache) + Postgres
  `INSERT ... ON CONFLICT DO NOTHING` — the answer to double-spend under
  retry.
- Provably-fair game-engine seam: `ServerSeed`/`SeedStateManager`/
  `SecureNumberGenerator` plus per-game `*Seed`/`*Game`/`*Setting` model
  triples — a repeatable template per casino game.
- One `config/<provider>.php` per third-party integration; provider code
  in its own `app/<Provider>/` folder.
- Geo-compliance at the edge-header level: trust Cloudflare
  `CF-IPCountry`, return HTTP 451, DB-backed country blocklist.
- Login hardening: Redis rate-limiter lockout per username, TOTP 2FA with
  Twilio SMS fallback, failed-attempt audit model.
- Nova admin extensions as composer path repositories — private packages
  without a registry.
- Anti-patterns to note, not imitate: tokens in localStorage on the
  frontend, committed secrets in `soketi/config.json`, near-zero test
  coverage.

## Deep-Dive Pointers

The frontmatter carries the repo URL and notable paths. Fetch them when
higher fidelity helps — the Sentry wiring (`config/sentry.php` +
`Exceptions/Handler.php` + frontend `utils.js`), the money-safety trio,
and the queue topology (`config/horizon.php`, `supervisord.conf`) are the
canonical implementations. If the repo is unreachable, note "deep dive
unavailable" and continue from this profile.