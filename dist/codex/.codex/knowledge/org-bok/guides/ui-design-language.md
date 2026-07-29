# Org Guide: UI Design Language

This is a cross-cutting Org BoK guide — the organization's visual and UI
design-language defaults distilled across reference projects, not tied to
any single exemplar. It loads as standing Tier-1 knowledge for the design
and developer agents on every project, whether or not the precedent-research
stage ran — the baseline below applies even when no reference brief exists.
Sections marked *Fill in* are placeholders a solution architect completes
when adopting the framework; the structure and the shipped defaults are
real. `/aidlc-distill` proposes additions when it spots org-wide
conventions; a solution architect curates and commits them.

## How to Use This Guide

- Treat every statement here as the organization's default position. Defaults
  are overridden by affirmed memory rules and, on brownfield work, by locally
  discovered affirmed practices (an existing product's design system wins
  over this guide).
- When a reference brief is present, its `## UI Directives` are more specific
  than this guide — apply them first, and use this guide for everything the
  brief does not cover.
- Phrase design output as this guide does: imperatives a mockup or
  code-generation step can execute, not mood-board descriptions.

## Precedence

Stated verbatim: on greenfield work, BoK guidance is the default; on
brownfield work, locally discovered and affirmed practices win — consistency
with the codebase you are in beats org ideals.

## Baseline: Not LLM-Looking

The standing floor for every UI this organization ships, brief or no brief.
Generated UI defaults are recognizable — this section exists to remove them.

- Do not use the stock generated-UI look: purple-to-blue gradients on hero
  sections, oversized rounded cards with drop shadows on everything,
  emoji-as-icons, and center-aligned marketing copy in application screens.
- Use the org's design tokens for every color, spacing, and type value; never
  hardcode a hex value or pixel constant in a component.
- Default to information density appropriate to a working tool: left-aligned
  content, real data in mockups (not "Lorem ipsum" or "John Doe"), tables
  where users compare rows.
- Motion is functional only — no decorative animation; transitions communicate
  state change and complete fast.
- Copy tone: verb-first, no exclamation marks, one idea per sentence.

## Design Tokens

*Fill in: where the org's token source of truth lives (e.g. a TypeScript
token module named in an exemplar profile's deep-dive pointers), the token
categories (color, spacing, type scale, radius, elevation), and the rule for
proposing a new token. Until filled in, the enforceable default is: tokens
are a single importable module, and no component hardcodes a value a token
covers.*

Conventions observed across exemplars:

- The token module names its aesthetic and states a visual-hierarchy rule in
  prose — one restrained palette with a single accent, and one deliberately
  loudest element tied to the product's trust signal (mri-gov-ap's
  "municipal records" theme; plg-opinion-tool's rule that the amber
  placeholder chip stays the loudest element on any page).
- Monospace for figures: money, IDs, GL codes, and other compared-by-eye
  values render in a mono face (mri-gov-ap).
- Semantic token names over raw values — `primary`/`destructive`/`muted`
  mapped to CSS variables or theme entries, never hex in components
  (meeting-crm, mri-gov-ap).
- Commit the design language as an enforceable file in the frontend tree
  (e.g. `.interface-design/system.md`): named tokens, signature rules
  (borders-only depth, tight radii, tabular-nums on data), and copy-paste
  default snippets — so agents and humans imitate one contract instead of
  rediscovering taste per screen (blueprint-checker,
  tennyson-contract-comparison).
- Token names may carry the product's domain metaphor ("Blueprint Navy",
  "Stamp" verdict colors, "Phosphor Desk") — the metaphor builds buyer
  trust; the *practice* of a named, semantic, single-source palette is the
  org-wide part (blueprint-checker, market-intelligence-platform,
  mri-gov-ap).

## Layout & Spacing

*Fill in: the org's grid and spacing conventions — e.g. base spacing unit,
page-level layout patterns, responsive breakpoints, form layout rules.*

## Components

*Fill in: the canonical component library and its non-negotiables — e.g.
"use the shared `Button`/`Table`/`Modal`; never restyle a primitive
per-screen." Name the canonical components an agent should imitate and where
their source lives.*

## Copy & Content

*Fill in: the org's voice and terminology — product names, capitalization,
error-message shape, empty-state copy. The shipped default until then: copy
tone is verb-first, no exclamation marks, one idea per sentence.*
