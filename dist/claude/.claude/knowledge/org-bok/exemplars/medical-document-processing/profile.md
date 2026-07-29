---
repo_url: https://github.com/MichaelWalker-git/medical_document_processing
notable_paths:
  - app/services/llm_service.py
  - app/services/extraction_service.py
  - app/utils/clinical_parser.py
  - app/services/fhir_service.py
  - app/core/config.py
  - app/main.py
  - docker-compose.yml
  - scripts/test_e2e.py
---

# Exemplar Profile: Medical Document Processing — Clinical Extraction Backend

## Ask / Context

> TODO(interview): inferred from repo analysis only — not yet confirmed by
> the solution architect.

An AI-engineer take-home submission (the spec is committed as
`instructions.md`): build in ~4 hours a dockerized FastAPI backend that
stores medical documents, summarizes via LLM, does RAG over pgvector,
extracts structured clinical data, and emits FHIR-shaped output — graded on
robustness to messy real-world notes and on model-agnosticism. Valuable to
the BoK less as a client engagement than as a compact reference for the
LLM-backend service shape done under time pressure, with an unusually honest
STATUS.md separating "tested & verified" from "coded but untested."

## Architecture & Why

> TODO(interview): inferred from repo analysis only — not yet confirmed by
> the solution architect.

A single FastAPI monolith with a strict five-layer layout (api / schemas /
services / models+utils / core) over PostgreSQL + pgvector in one database.

- **Provider-agnostic LLM facade**: one service dispatches to OpenAI or
  Bedrock based on a single env var; embeddings follow the same seam. All
  model IDs, temperatures, and timeouts live in typed settings, never in
  code — model-agnosticism was a graded requirement.
- **Deterministic-first, LLM-second extraction**: regex clinical parsers
  with per-field confidence handle the predictable majority; LLM calls are
  reserved for summarization and RAG — cheaper, testable, and auditable for
  medical data.
- **Edge cases are an enumerated API surface**: seven named quality flags
  (OCR errors, vague medication, provisional diagnosis, missing vitals,
  code-lookup failure, …) return with every extraction instead of silent
  degradation.
- **Standards library over hand-rolled JSON**: extraction maps to typed
  `fhir.resources` R4 objects (Patient, Condition, MedicationRequest, …)
  assembled into a validated Bundle.
- **One-command reviewer setup**: compose health-check chaining (postgres
  healthy → API starts → container HEALTHCHECK on `/health`).

## Key Patterns

- Live NIH terminology enrichment (ICD-10, RxNorm) with in-memory caching
  and graceful `no_match`/failure statuses rather than raised errors.
- tenacity retry with exponential backoff on every third-party client class.
- structlog event-style logging (snake_case event names + kwargs) with
  request-ID correlation middleware and a custom exception hierarchy mapped
  to handlers.
- Typed pydantic-settings config with validators and environment properties;
  `.env.example` documents every knob.
- Verification via a real e2e harness (async httpx over ten committed SOAP
  fixtures emitting a JSON report) — the pytest tree is scaffolding only, an
  honest time-boxing trade recorded in the worklog.
- Anti-patterns flagged, not imitated: empty pytest tiers behind full pytest
  config, and drifted dual dependency lists (requirements.txt vs
  pyproject).

## Deep-Dive Pointers

The frontmatter carries the repo URL and notable paths. Fetch them when
higher fidelity helps — the LLM facade, the extraction orchestrator, and the
clinical parser are the canonical implementations. If the repo is
unreachable, note "deep dive unavailable" and continue from this profile.