---
repo_url: https://github.com/MichaelWalker-git/idp-pdf-prefill
notable_paths:
  - src/main.ts
  - .projenrc.ts
  - lambdas/documentExtractionPipeline/extract_data_from_html.ts
  - lambdas/pdfFillerLambda/lambda.py
  - lambdas/documentExtractionPipeline/store_to_db.ts
  - src/entities/interfaces.ts
  - lambdas/documentExtractionPipeline/convertPdfToHtml/Dockerfile
---

# Exemplar Profile: IDP PDF Prefill — Inspection-to-Permit Pipeline

## Ask / Context

> TODO(interview): inferred from repo analysis only — not yet confirmed by
> the solution architect.

An intelligent-document-processing demo/accelerator, likely a facilities/
EHS safety-compliance PoC: ingest scanned Safety Inspection Checklist PDFs,
extract 48 checklist items plus header fields via an LLM, store per
inspector, then auto-prefill a Hot Work Permit PDF for a given inspector on
request. Single-commit prototype with a placeholder README — harvest its
patterns selectively; it is not a finished exemplar.

## Architecture & Why

> TODO(interview): inferred from repo analysis only — not yet confirmed by
> the solution architect.

A projen-managed single-stack CDK app with two data paths sharing one S3
bucket and one DynamoDB table: an event-driven ingest (S3 `input/*.pdf` →
Step Functions: PDF-to-HTML → Bedrock extraction → DynamoDB with TTL) and a
request-driven serve path (REST `GET /fill-pdf` → Python Lambda fills the
permit template and returns a presigned URL).

- **PDF→HTML intermediate over vision extraction**: PyMuPDF HTML preserves
  table/layout structure as text the LLM can read, avoiding image-token
  cost.
- **Bedrock Claude over Textract-style form parsing** because the checklist
  is semi-structured prose with checkboxes and free text — prompt-driven
  extraction to a fixed JSON schema is faster to build and layout-tolerant.
- **Polyglot Lambdas split by capability**: PDF manipulation (PyMuPDF native
  deps) in Python Docker-image functions; glue/LLM/DB logic in esbuild-
  bundled ARM64 Node functions.
- **S3 prefix as router**: `input/`, `html/`, `templates/`, `filled/` —
  one bucket, folder-scoped stages, event filters preventing loops.
- **Shared type contract across the seam**: one interfaces module is
  imported by every pipeline stage, so extraction output and storage input
  share a single definition.

## Key Patterns

- Bedrock JSON-extraction hardening recipe: temperature 0.1, "raw JSON
  only" instruction, then defense in depth — strip code fences, regex-match
  brace boundaries, parse, and coerce field-by-field into a typed interface
  with defaults.
- PDF filling with graceful fallback: try AcroForm widget fill first; fall
  back to a coordinate map with text boxes when no form fields exist.
- Service-class organization inside a single Python Lambda file (DB, field
  mapper, PDF, S3 classes + thin handler) — testable seams without a
  package structure.
- API Gateway request validation at the edge with explicit method responses
  and a structured response helper.
- `${prefix}-${envName}-` naming with env-conditional lifecycle (prod
  retains, dev destroys) and S3 lifecycle expiry on temp prefixes.
- Anti-patterns flagged, not imitated: the pass-through event envelope with
  a `status` field instead of Step Functions Choice/error states (failures
  return `status: 'error'` and the chain keeps running), a broken scaffold
  snapshot test, one broad shared IAM role with wildcard resources, ~360
  lines of commented-out prior code, and empty nested-stack files.

## Deep-Dive Pointers

The frontmatter carries the repo URL and notable paths. Fetch them when
higher fidelity helps — the main stack, the extraction Lambda, and the PDF
filler are the canonical implementations. If the repo is unreachable, note
"deep dive unavailable" and continue from this profile.