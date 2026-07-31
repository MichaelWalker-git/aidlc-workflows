---
status: draft
reviewed: 2026-07-31
owner: p.lysanets
---

# Sentry — errors, traces, and the incident loop

> **Precedence:** this pattern is the org-wide default for the decision it
> covers. An affirmed `team.md` or `project.md` rule in the active space
> overrides it as a documented exception that names this pattern and the
> reason. Absent such a rule, `blessed` binds; `draft` is advisory, so verify
> before relying on it.

## When to use

You are wiring error tracking into a service — a Lambda backend, a container
API, a SPA, or even a bash orchestrator — and have to decide what reports
errors, with how much context, at what sample rates, and what happens after
an alert fires.

In scope: SDK init and the wrapper module every service carries; environment,
release, and user/tenant context; sampling defaults; PII posture (including
session replay on sensitive data); sourcemap upload; the Sentry→Slack alert
path and the org's scheduled triage bot that answers in-thread.

Out of scope: metrics and dashboards — Sentry owns errors and traces here;
where a project needs counters/metrics, a separate system carries them
(chancedrepos pairs Sentry with Datadog statsd; service-delivery-platform
uses Prometheus). Log aggregation and CloudWatch alarm design are also not
this page.

## Our approach

**Every service funnels Sentry through one wrapper module, initialized once
at module scope, and a missing DSN degrades to a clean no-op.** vrc-idp,
land-coverage, and curriculum-management all ship the same shape: a single
`sentry.ts` (or Fastify plugin) owning `init`, `wrapHandler`/hook
registration, and `captureException`; handlers import the wrapper, never the
SDK. No `SENTRY_DSN` in the environment means the wrapper returns the
original handler (vrc-idp), logs "error tracking disabled" and registers
nothing (curriculum-management) — local dev and forks run without a DSN and
without noise.

The defaults we ship:

- **`environment` is the deploy stage, always.** `STAGE`/`NODE_ENV`/build-time
  `__BUILD_ENV__` — every exemplar tags it, and the entire triage flow keys on
  it (see the first scar). A frontend build stamps environment and release at
  build time (vrc-idp's `VITE_BUILD_ENV`/`VITE_BUILD_COMMIT` defines), not at
  runtime guess.
- **Errors sample at 100%; traces sample at 0.1–0.2 in prod and 1.0
  everywhere else.** vrc-idp backend (`tracesSampleRate: STAGE === 'prod' ?
  0.1 : 1.0`, `sampleRate: 1.0`), curriculum-management (0.1 prod), and
  land-coverage (0.2 prod) all converge on the same posture: never drop an
  error, keep prod trace volume cheap, keep non-prod fully visible.
- **`release` is the git commit.** vrc-idp passes the commit hash into the
  build; sourcemap upload and issue regression detection both hang off it.
  Never default the release to a timestamp — see Gotchas.
- **User and tenant context are set at the auth seam on BOTH tiers.**
  chancedrepos scopes the Laravel handler's report with the authenticated
  user and sets the user on frontend login; vrc-idp sets user + role tag on
  auth and a document/facility context when one is open; land-coverage lifts
  the Cognito authorizer claims into `setUser` inside its `wrapHandler`.
  Filterable IDs (facility, tenant, role) go in as **tags**, prose context as
  `setContext`.
- **PII posture is deliberate, and stricter when the domain demands it.**
  Baseline everywhere: `send_default_pii: false` and SQL bindings off
  (chancedrepos ships both, in breadcrumbs and tracing), secrets/auth headers
  redacted before they ride along (land-coverage's `sanitizeHeaders`/
  `sanitizeBody`). On PHI (vrc-idp): session replay runs `maskAllText: true,
  blockAllMedia: true`, replays sample at 0.1 of sessions and 1.0 of
  error-sessions.
- **`ignoreErrors` is a curated list where each entry names where that error
  IS handled.** vrc-idp's list is the exemplar: auth-token errors ("handled
  by useAuthUser hook"), chunk-load errors ("handled by ChunkErrorBoundary"),
  a benign PDF.js worker rejection with its ticket ID. An ignore entry
  without a "handled by" note is suppression, not hygiene. Server-side,
  expected typed errors (`ValidationError`, `NotFoundError`, …) are ignored
  the same way (land-coverage), matching chancedrepos' `$dontReport`.
- **Sourcemaps upload to Sentry and never ship publicly.** vrc-idp's Vite
  config: `sourcemap: true` + `@sentry/vite-plugin` with
  `filesToDeleteAfterUpload: ['./dist/**/*.map']`, gated on
  `SENTRY_AUTH_TOKEN` so local builds skip the upload. Two tokens, two
  scopes: the org:ci token uploads sourcemaps in the deploy pipeline; the
  triage bot reads with a dedicated `event:read` token — never share one
  token across both.
- **The alert path is Sentry → one Slack channel per project → the triage
  bot.** The org runs a scheduled read-only bot (vrc-idp's minion,
  `.github/scripts/minion-triage.mjs`, every 10 minutes) that resolves each
  Sentry link posted in the alerts channel, pulls the issue + latest event,
  and replies in-thread with severity (P1/P2/P3/noise), likely root cause,
  where to look, and whether the bug is reproducible-in-test. Its prompt
  encodes org operational knowledge — check the environment tag FIRST, known
  infra flaps are noise — and its `reproducible-in-test` verdict is the entry
  ticket to the write-capable fix bot, which is human-triggered only and
  opens PRs to the development branch only. New projects follow the
  developmentplatform setup runbook (`docs/sentry-setup.md`: DSN, Slack
  integration, alert rules with an action interval).
- **Anything that can't carry the SDK still reports.** developmentplatform's
  bash orchestrator posts to the Sentry store API directly (`report_sentry`
  in `run-pipeline.sh`) with the run's ID as a tag, fire-and-forget — a
  pipeline timeout or a parked human-triage case lands in the same Sentry
  project as SDK errors.

## Exemplars

- [vrc-idp](../../exemplars/vrc-idp/profile.md) — the fullest wiring we have,
  on PHI: shared no-op-safe wrapper for Lambdas, build-stamped
  environment/release, masked session replay + feedback widget, the
  named-handler `ignoreErrors` list, sourcemap upload with map deletion, the
  two-token split, and both bots (scheduled read-only triage, human-triggered
  fix) with their honest-limit statements.
- [chancedrepos](../../exemplars/chancedrepos/profile.md) — two-tier Sentry
  with user-scoped context on a real-money platform: Laravel backend +
  `@sentry/vue` frontend joined by `tracePropagationTargets`, PII-conscious
  defaults (`send_default_pii` false, SQL bindings off), error-message
  laundering before clients see anything, and the Sentry-owns-errors /
  Datadog-owns-metrics split.
- [land-coverage](../../exemplars/land-coverage/profile.md) — symmetric
  observability on serverless: `wrapHandler` on every Lambda with timeout
  warnings captured before Lambda kills the function, Cognito claims lifted
  into user context, header/body redaction, and breadcrumbed axios
  interceptors on the client mirroring the server.
- [curriculum-management](../../exemplars/curriculum-management/profile.md)
  — the container baseline: Sentry as one isolated Fastify plugin (routes
  stay pure), route/method tags + user on the `onError` hook, and
  `Sentry.close(2000)` on shutdown so the last events flush.
- [developmentplatform](../../exemplars/developmentplatform/profile.md) —
  observability for a no-human-in-the-loop pipeline: Sentry events emitted
  from bash via the store API, Slack alert rules on message content, and the
  org's written setup runbook for wiring a new project.

Do **not** cite for Sentry:
[service-delivery-platform-terraform](../../exemplars/service-delivery-platform-terraform/profile.md)
(Sentry env vars are plumbed into the containers but tracing is switched off
in both envs — its profile says so explicitly) or
[service-delivery-platform-backend](../../exemplars/service-delivery-platform-backend/profile.md)
(no Sentry; its observability is Prometheus + structured logs).

## Gotchas

- **An alert rule that does not filter environment turns dev noise into
  prod-shaped incidents.** The vrc-idp Slack alert rule forwards every
  environment into the alerts channel, and dev/qa GPU endpoints flap with
  502/503/504 — so the channel routinely escalated non-incidents that looked
  like production. The org paid for this long enough that the triage bot's
  prompt now carries it as standing knowledge: *check the environment tag
  FIRST; dev/qa errors are not production incidents; call out that the alert
  rule does not filter environment.* Filter at the alert rule when you can;
  when you can't, the env tag is the first thing your triage reads.
- **A timestamp fallback release shreds issue grouping.** land-coverage
  defaults `release` to `` `tahoe-marketplace-api@${Date.now()}` `` when
  `SENTRY_RELEASE` is unset — every cold start becomes a brand-new "release",
  so regression detection and release health are meaningless exactly when the
  env var is forgotten. Prefer vrc-idp's posture: release = git commit,
  stamped at build time, `undefined` when local.
- **Raw exception messages are an information leak; Sentry is where the
  detail belongs.** chancedrepos launders any client-facing message
  containing "SQL" or "model" into a generic "Can not process request" while
  the full exception still goes to Sentry. The failure mode for a first-timer
  is the inverse: returning `error.message` to the client and wondering why
  table names show up in the UI.
- **Reactions are not a reliable idempotency marker in Slack.** The triage
  bot originally marked handled alerts with a reaction — and
  `conversations.history` omits reactions, so the bot double-posted. The
  fix in the shipped bot: its own threaded reply IS the marker, and it
  re-checks the thread immediately before posting. If you build any
  bot on the alerts channel, inherit this.
- **Init-time flags evaluated at event time lie.** land-coverage's
  `beforeSend` tags `cold_start: !initialized ? 'true' : 'false'` — but
  `initialized` is already `true` by the time any event fires, so the tag is
  always `false`. Capture cold-start state into a local constant at module
  load if you want it on events.
- **A loaded integration with zero sample rates is bundle cost for nothing.**
  chancedrepos ships the Replay integration with
  `replaysSessionSampleRate: 0, replaysOnErrorSampleRate: 0` — the replay
  code is downloaded by every client and records nothing. Decide replay
  on/off, not half-on.
- **The write-capable bot's limits are the design, not an oversight.** The
  fix bot is human-triggered per issue, targets the development branch only,
  and its PR text states what CI does and does not prove ("green means the
  code does what the test says" — a human confirms the test captures the real
  bug). A future automation that relaxes any of those three is a different,
  bigger decision — record it before you make it.

## References

- vrc-idp `.github/workflows/minion-triage.yml` +
  `.github/scripts/minion-triage.mjs` — the org triage bot: schedule,
  idempotency, the severity/reproducibility taxonomy, and the org-knowledge
  prompt. `.github/workflows/minion-fix.yml` — the guarded fix bot.
- developmentplatform `docs/sentry-setup.md` — the org's new-project
  runbook: DSN creation, Slack integration, alert rules.
- chancedrepos `social-api/config/sentry.php` — the fully env-driven Laravel
  config the PII defaults above are read from.
- [Sentry configuration options](https://docs.sentry.io/platforms/javascript/configuration/options/)
  — sampling, `ignoreErrors`, `beforeSend`.
- [Sentry AWS Serverless SDK](https://docs.sentry.io/platforms/javascript/guides/aws-lambda/)
  — `wrapHandler`, timeout warnings, flushing before freeze.
- [Session Replay privacy](https://docs.sentry.io/platforms/javascript/session-replay/privacy/)
  — masking and blocking, the knobs the PHI posture above sets.
- [Sentry Vite plugin](https://docs.sentry.io/platforms/javascript/sourcemaps/uploading/vite/)
  — sourcemap upload and `filesToDeleteAfterUpload`.