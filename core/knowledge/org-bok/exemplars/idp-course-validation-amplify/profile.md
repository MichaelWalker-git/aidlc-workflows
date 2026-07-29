---
repo_url: https://github.com/MichaelWalker-git/idp-course-validation-amplify
notable_paths:
  - CLAUDE.md
  - .clinerules/rules.md
  - src/App.tsx
  - src/hooks/useAsyncFetch.ts
  - src/config/api-gateway.ts
  - src/contexts/AuthContext.tsx
  - src/services/catalogService.ts
  - src/components/accuracy-evaluation/
---

# Exemplar Profile: IDP Course Validation UI — Human-Review Console

## Ask / Context

> TODO(interview): inferred from repo analysis only — not yet confirmed by
> the solution architect.

The human-in-the-loop validation frontend for the university course-catalog
IDP pipeline (the UI tier of the idp-human-validation / genai-cdk-claude
system): reviewers correct LLM-extracted courses at each pipeline stage
(pre-processing, processing review, reprocessing), while admins manage
reviewers, run accuracy evaluations against datasets, tune per-catalog
extraction prompts, and inspect "Agentic Judge" before/after/evidence
corrections. A two-role (Admin/Reviewer) internal tool shipped fast against
an existing backend.

## Architecture & Why

> TODO(interview): inferred from repo analysis only — not yet confirmed by
> the solution architect.

A frontend-only React 18 + Vite SPA (the Amplify-starter backend directory
is vestigial): pages → feature folders with colocated hooks/helpers →
service-per-backend-domain modules → one Amplify REST endpoint.

- **The Amplify starter won on speed**: instant Cognito auth, REST wiring,
  and hosting for a small team shipping a review console against an
  existing API Gateway backend.
- **A plain SPA suffices** because all state of record lives behind the
  API — no local persistence, no SSR; the multi-stage pipeline is mirrored
  directly in a `CatalogStatus` enum and the route structure.
- **Role gating via a single Cognito custom claim** keeps authorization
  trivially simple: two nested `ProtectedRoute` layout blocks in `App.tsx`
  make the whole permission matrix legible in one file.
- **A hand-rolled 40-line `useAsyncFetch<T>` hook** (uniform
  data/loading/error/refetch semantics) over react-query kept the dependency
  surface minimal for read-mostly screens.
- **Centralized bearer-token injection** via the Amplify REST global headers
  hook — no per-call token plumbing.

## Key Patterns

- Agent-harness governance shipped with the repo: a detailed CLAUDE.md plus
  `.clinerules/rules.md` publishing the same convention corpus for two
  different AI coding harnesses ("inspect similar features first", "place
  files where similar files live", "don't refactor unrelated code").
- Feature-folder colocation: each feature owns components/hooks/helpers/
  constants; global hooks only when genuinely cross-feature.
- Service-per-domain modules with typed request/response interfaces exported
  beside the functions and errors rewrapped with context.
- Strict lint contract: `eslint --max-warnings 0` in the build script,
  consistent-type-imports, import ordering, jsx-a11y.
- An explicit state-management escalation ladder written into the
  conventions: useState → custom hook → context → external lib only if
  needed.
- Honest gap: the "components under 100 lines, logic in hooks" rule is
  stated but violated by legacy components (700+ lines) — newer feature
  folders follow it; the rules arrived mid-project and govern new code.
- Anti-patterns flagged, not imitated: hardcoded staging Cognito/API
  fallbacks in config, console.log in services, no tests or CI.

## Deep-Dive Pointers

The frontmatter carries the repo URL and notable paths. Fetch them when
higher fidelity helps — CLAUDE.md, the async-fetch hook, and the
accuracy-evaluation feature folder are the canonical artifacts. If the repo
is unreachable, note "deep dive unavailable" and continue from this profile.