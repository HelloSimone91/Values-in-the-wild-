# Notion To Site Content Model

The site now uses a two-layer content system:

1. `data/Values-en.json`
Base value library. This remains the canonical list of values, categories, tags, and general `inTheWild` copy.

2. `data/ValueSiteContent.json`
Approved website overlay. This file contains only reviewed, site-safe content keyed by value name.

This split is intentional. The Notion sources contain strong ideas, but they also contain weak, off-tone, or mismatched copy. Raw Notion text should not ship directly.

## Runtime Model

Each approved overlay entry maps to `ValueSiteContent` in [stitchData.ts](/Users/simonedeangelis/Downloads/embodied_-values-detective/stitchData.ts).

- `summary`
Short editorial framing for the site. Usually derived from `Blurb`, but only after rewrite.

- `shortDefinition`
One-sentence meaning. Usually derived from `Dictionary Entry`.

- `longDefinition`
Site-safe explanation. Usually derived from `Introduction` or `Long Def`, often heavily rewritten.

- `everydayExamples`
Concrete examples of the value in action. Usually derived from `Everyday Actions` or strong items from `2 - 5 examples`.

- `practiceMoments`
Short, practice-safe observation lines for the Practice surface. These should be concrete enough to anchor checklists and notes without sounding poetic, therapeutic, or generic.

- `misalignment`
What it looks like when the value slips. Usually derived from `Opposing Behavior` or `Character Defect`, but only after review because some source rows are incorrect.

- `habitIdeas`
Actionable practice ideas. Usually derived from `Habits`, rewritten into short bullets.

- `practiceChecklist`
Explicit checklist prompts for the Practice surface. Each item includes:
  - `label`
  - `summary`

This field exists so the site does not have to reverse-engineer prompts from raw source copy.

- `journalPrompts`
Deep reflection prompts. Usually derived from `Journal Prompts`, trimmed into direct questions.

- `conversationStarters`
Social prompts. Usually derived from `Conversation Starters`, trimmed for natural speech.

- `popCultureSpotlight`
Small editorial module with:
  - `title`
  - `summary`
  - `takeaway`

This is usually derived from `Pop Culture History` or from the `Values in the Wild` editorial database.

- `seo`
Optional SEO metadata from `SEO title`, `Meta description`, and `Slug`.

## Mapping Rules

- `Blurb` never ships untouched.
- `Introduction` and `Long Def` are source material, not publish-ready by default.
- `Opposing Behavior` is high risk and must be checked manually before use.
- `Pop Culture History` must be condensed into a grounded `summary + takeaway`.
- `Habits`, `Journal Prompts`, and `Conversation Starters` should be reduced to concise, readable website copy.
- Practice copy should be written explicitly. Do not derive checklist prompts from raw `inTheWild` lines.
- If a field is not clearly good, omit it. The UI is built to handle sparse approved content.

## Current Wiring

- API responses merge `Values-en.json` with `ValueSiteContent.json` in [backend/index.mjs](/Users/simonedeangelis/Downloads/embodied_-values-detective/backend/index.mjs).
- Static frontend fallback merges the same files in [App.tsx](/Users/simonedeangelis/Downloads/embodied_-values-detective/App.tsx).
- Search indexes approved overlay content in [stitchData.ts](/Users/simonedeangelis/Downloads/embodied_-values-detective/stitchData.ts) and [ValuesLibraryView.tsx](/Users/simonedeangelis/Downloads/embodied_-values-detective/components/ValuesLibraryView.tsx).
- Value pages render approved sections only in [ValueDetailView.tsx](/Users/simonedeangelis/Downloads/embodied_-values-detective/components/ValueDetailView.tsx).
- Practice mode now prefers approved `practiceMoments` and `practiceChecklist`, then falls back to `everydayExamples`, `habitIdeas`, and `journalPrompts` in [stitchData.ts](/Users/simonedeangelis/Downloads/embodied_-values-detective/stitchData.ts) and [PracticeView.tsx](/Users/simonedeangelis/Downloads/embodied_-values-detective/components/PracticeView.tsx).

## Workflow

When you want to add a value from Notion:

1. Find the source row in `Value stacks ?` first.
2. Pull only the fields that are strong.
3. Rewrite them into grounded site language.
4. Add the approved result to `data/ValueSiteContent.json`.
5. Leave weak source fields out entirely.
