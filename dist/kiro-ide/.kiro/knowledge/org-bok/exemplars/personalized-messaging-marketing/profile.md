---
repo_url: https://github.com/MichaelWalker-git/personalized-messaging-marketing
notable_paths:
  - README.md
  - src/scrapper/slack/messages.ts
  - src/services/claudeAI.ts
  - src/services/slack.ts
  - src/utils/parser.ts
  - src/config/index.ts
---

# Exemplar Profile: Personalized Messaging — Slack Outreach Prototype

## Ask / Context

> TODO(interview): inferred from repo analysis only — not yet confirmed by
> the solution architect.

A hackathon/prototype-grade internal tool (AWS "PACE team"/"Builder's Fair"
context is baked into the prompt): automate personalized speaker outreach —
scrape a Slack channel's recent messages about tech sessions, have Claude
generate a per-speaker personalized pitch (name + keyword summary + warm
outreach text), and pre-stage those as Slack DM drafts for human review
before sending. Drafts-not-sends kept a human in the loop for marketing
messages.

## Architecture & Why

> TODO(interview): inferred from repo analysis only — not yet confirmed by
> the solution architect.

A three-stage local CLI pipeline — scrape → summarize → draft — with one
thin entry file per stage wired by npm scripts, and the filesystem as the
inter-stage bus (JSON artifacts under `data/<TEAM_ID>/<CHANNEL_ID>/`).

- **Puppeteer session-riding over the official API**: the target data
  (private channel history, DM drafts) had no available bot-token path for
  this user, so the scraper logs into Slack via Puppeteer, intercepts the
  web client's own internal API calls, and replays them with axios using
  the browser's cookies and token — the pragmatic unblock where no official
  API surface exists.
- **Local JSON files made a prototype debuggable stage by stage**:
  pretty-printed, tenant-keyed, inspectable, replayable intermediates.
- **One LLM service function**: a single Claude call with the output schema
  embedded in the system prompt (inline few-shot examples per field), and a
  parser that logs the raw model text before rethrowing on invalid JSON —
  good failure forensics for structured output.
- **Draft creation is UI automation too**: Puppeteer drives Slack's
  composer via DOM manipulation, since draft creation has no API.

## Key Patterns

- Thin entry / fat service layering (`config`–`services`–`utils`) with one
  npm script per pipeline stage.
- Centralized dotenv config module with typed exports; the README documents
  the exact `.env` keys.
- Strict TS + a detailed lint profile carried between this author's repos.
- DynamoDB batch writer respecting the 25-item limit (present though
  unused — an abandoned earlier iteration).
- Anti-patterns flagged, not imitated: a hardcoded Slack bot token committed
  in source (leaked credential — rotate), an unrelated projen CDK
  playground vendored under `src/`, dead code from earlier iterations, and
  zero tests. The session-riding scraper itself is a use-with-judgment
  pattern: it depends on the operator's own authenticated session and
  Slack's internal API stability.

## Deep-Dive Pointers

The frontmatter carries the repo URL and notable paths. Fetch them when
higher fidelity helps — the request-interception scraper and the Claude
service are the canonical implementations. If the repo is unreachable, note
"deep dive unavailable" and continue from this profile.