---
allowed:
  - https://github.com/MichaelWalker-git/mri-gov-ap
  - https://github.com/MichaelWalker-git/vrc-idp
  - https://github.com/MichaelWalker-git/plg-opinion-tool
  - https://github.com/MichaelWalker-git/aws_mirror_site
  - https://github.com/MichaelWalker-git/meeting-crm
  - https://github.com/MichaelWalker-git/lpl-beacon-concierge
  - https://github.com/MichaelWalker-git/LabCorp-Compendium-Agent
  - https://github.com/MichaelWalker-git/tennyson-contract-comparison
  - https://github.com/MichaelWalker-git/pod-staffing-planner
  - https://github.com/MichaelWalker-git/blueprint-checker
  - https://github.com/MichaelWalker-git/LabCorp-IDP
  - https://github.com/MichaelWalker-git/market-intelligence-platform
  - https://github.com/MichaelWalker-git/idp-human-validation
  - https://github.com/MichaelWalker-git/vrc-roi-validation
  - https://github.com/MichaelWalker-git/idp-portal
  - https://github.com/MichaelWalker-git/ai-document-processor-cdk
  - https://github.com/MichaelWalker-git/DevelopmentPlatform
  - https://github.com/MichaelWalker-git/main_records
  - https://github.com/MichaelWalker-git/gc-social-api
  - https://github.com/MichaelWalker-git/translation-Indigenous-languages
  - https://github.com/MichaelWalker-git/genai-cdk-claude
  - https://github.com/MichaelWalker-git/simba-platform
  - https://github.com/MichaelWalker-git/curriculum-management
  - https://github.com/MichaelWalker-git/land_coverage
  - https://github.com/MichaelWalker-git/aws-agents
  - https://github.com/MichaelWalker-git/idp-module
  - https://github.com/MichaelWalker-git/lpl-beacon-api
  - https://github.com/MichaelWalker-git/plg-secure-bedrock-endpoint
  - https://github.com/MichaelWalker-git/terraform-progen-prompt
  - https://github.com/MichaelWalker-git/idp-cdk-constructs
  - https://github.com/MichaelWalker-git/textract-mail-scanning
  - https://github.com/MichaelWalker-git/medical_document_processing
  - https://github.com/MichaelWalker-git/genai-classification
  - https://github.com/MichaelWalker-git/fax-ingestion
  - https://github.com/MichaelWalker-git/deepseek_ocr
  - https://github.com/MichaelWalker-git/agent-data
  - https://github.com/MichaelWalker-git/eba-project
  - https://github.com/MichaelWalker-git/idp-course-validation-amplify
  - https://github.com/MichaelWalker-git/idp-pdf-prefill
  - https://github.com/MichaelWalker-git/aws-marketplace-integration
  - https://github.com/MichaelWalker-git/personalized-messaging-marketing
  - https://github.com/MichaelWalker-git/otter-notion-integration
  - https://github.com/MichaelWalker-git/call-terraform-registry
  - https://github.com/MichaelWalker-git/horus-technologies
  - https://github.com/MichaelWalker-git/ChancedRepos
  - https://github.com/MichaelWalker-git/service-delivery-platform-backend
  - https://github.com/MichaelWalker-git/service-delivery-platform-terraform
---

# Org BoK — Distill Allowlist

The curated list of repositories `/aidlc-distill` may analyze. The skill's
step 0 checks the target against the frontmatter `allowed:` list with a
deterministic predicate (`aidlc-utility distill-check`) BEFORE any repo
access; a target not on the list stops the session and the repo is never
read.

Curation is a human responsibility, like `index.md`: a solution architect
adds an entry here, commits it, and only then can the repo be distilled.
This keeps the BoK sourced from vetted reference projects rather than
whatever a session happens to be pointed at.

## Entry format

- One `- <entry>` per line under the frontmatter `allowed:` key.
- An entry is an exact repo URL or local path. Comparison normalizes
  backslashes to forward slashes and ignores a trailing `/` or `.git`
  suffix, so `https://host/org/repo`, `https://host/org/repo/`, and
  `https://host/org/repo.git` all name the same target.
- Glob entries are permitted: `*` matches any run of characters within one
  path segment (it never crosses `/`), so `https://git.example.com/org/*`
  allows every repo directly under the org namespace but not nested paths.
  Prefer exact entries — a glob trades curation precision for convenience.
- An empty or missing list denies every target (fail-closed).

## Maintaining this list

The shipped entries are the organization's KB pattern sources — the merged
all-years long list (2024–2026) of authored, non-fork repositories with
usable pattern value. Add a repo when it becomes a distillation candidate;
remove it when it no longer represents how the organization builds.
Removing an entry does not remove an already-distilled exemplar — retire
those separately in `index.md`.
