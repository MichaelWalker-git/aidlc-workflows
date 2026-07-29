---
repo_url: https://github.com/MichaelWalker-git/textract-mail-scanning
notable_paths:
  - lib/mail-processing-stack.ts
  - lib/lambda/handler/bedrock-service.ts
  - lib/lambda/handler/mail-service.ts
  - lib/lambda/trigger.ts
  - lib/lambda/handler/puppeteer-service.ts
  - README.md
---

# Exemplar Profile: Textract Mail Scanning — Sweepstakes Postcard Automation

## Ask / Context

> TODO(interview): inferred from repo analysis only — not yet confirmed by
> the solution architect.

Fully automate a daily back-office loop: collect scanned sweepstakes
postcards from a virtual-mailbox provider (Anytime Mailbox, which has no
API), read the handwritten entry details, validate authenticity, submit
valid entries to the Chanced sweepstakes API, and shred processed mail —
replacing manual data entry. A working single-developer internal automation
tool (single environment, no CI/tests), not a productized service. Despite
the repo name, the shipped extraction path is Bedrock Claude vision — the
merge history shows a deliberate migration from Textract OCR to an LLM
vision model, because the fields are handwritten free-form entries needing
semantic extraction and AI-handwriting detection.

## Architecture & Why

> TODO(interview): inferred from repo analysis only — not yet confirmed by
> the solution architect.

A single-stack CDK app whose backbone is a Step Functions state machine:
mail fetcher (Puppeteer + headless Chromium, 2Captcha for reCAPTCHA) →
pagination Choice/Wait loop → distributed Map (concurrency 10) over
rotate-image → extract → validate → call-API → completion, triggered by a
nightly EventBridge cron and an API endpoint.

- **Serverless + distributed Map won** because the workload is a bursty
  once-daily batch with per-image parallelism and multi-step failure
  isolation, at zero idle cost with a 24-hour execution ceiling.
- **Session threading avoids repeated CAPTCHA solves**: the trigger Lambda
  mints one authenticated session (cookie) via 2Captcha, and
  `$$.Execution.Input` forwarding carries it through every state alongside
  each step's payload.
- **Static egress IPs without NAT**: a public-subnet VPC plus an
  AwsCustomResource that associates Elastic IPs with the Lambda ENIs, so
  the scraper presents stable source IPs to the mail site.
- **The LLM proposes, code disposes**: extraction prompts demand JSON in XML
  tags parsed by a generic typed helper at temperature 0.1; a deterministic
  validation step then applies Levenshtein similarity (80% threshold)
  against the expected statement plus format checks, persisting an
  `{is_valid, reason}` verdict.

## Key Patterns

- Headless-browser-in-Lambda recipe: `@sparticuz/chromium` layer, cookie
  session reuse, heavy native deps shipped as pre-built zip layers.
- DynamoDB repository module with retry-with-backoff on throughput
  exceptions and pagination loops behind typed functions.
- Uniform Slack-shaped SNS error alerting from every handler's catch block.
- Shared env object spread into each Lambda with per-function memory/timeout
  tuned to workload (15 min/1 GB for Puppeteer, 2 min for Bedrock).
- Purpose-built separate prompts per concern (field extraction vs rotation
  detection) with post-parse per-field sanitization regexes.
- Anti-patterns flagged, not imitated: credentials seeded via
  `SecretValue.unsafePlainText` (now in git history — rotate), hardcoded
  account ID, wildcard SNS/states policies, single-partition DynamoDB
  design scanned with filters, no CI or tests.

## Deep-Dive Pointers

The frontmatter carries the repo URL and notable paths. Fetch them when
higher fidelity helps — the stack file, the Bedrock service, and the
validation step are the canonical implementations. If the repo is
unreachable, note "deep dive unavailable" and continue from this profile.