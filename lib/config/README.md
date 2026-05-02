# lib/config — the editability layer

If you are not an engineer and you want to change something user-facing or AI-facing, this folder is where you do it. Open the relevant file, edit the value, save. Do NOT touch any other folder.

## What's in here

- `rubrics.ts` — every rubric label, color, and tooltip help text. To rename "Definitional" to something else, edit the `label` field. The label string is also stored in the database, so renaming requires a one-time backfill (see CHANGELOG.md).
- `ui-copy.ts` — every user-facing string on the analysis page (section titles, button labels, flag wording).
- `limits.ts` — token budgets, output caps, retry counts. Bigger budgets cost more. Smaller caps mean truncation.
- `../pipeline/prompts/*.txt` — the four AI prompts. Each is plain English. Read the comments at the top of each file before editing.

## How a label change rolls out

1. Edit `rubrics.ts`. The UI updates immediately on next deploy.
2. The Stage 2 prompt reads from this file at build time, so the AI starts using the new label immediately.
3. Old database rows still contain the old label string. Run `npm run backfill:rubric-labels` to rewrite them.

## How to add a new rubric (5 steps)

1. Add the rubric definition to `rubrics.ts` following the existing pattern.
2. Add the field to `lib/types/analysis.ts` (the TypeScript shape).
3. Add the rubric scoring instruction to `lib/pipeline/prompts/stage2-chapter-extractor.txt`.
4. Add a UI surface in `components/analysis/sections/` — copy an existing card, swap data path.
5. Bump `SCHEMA_VERSION` in env to `v2`. Old rows show `null` for the new field gracefully.

## How to change an AI prompt

1. Open `lib/pipeline/prompts/stageX-name.txt`.
2. Read the "What this prompt does" header at the top.
3. Edit. Keep the JSON schema instructions intact — they are what prevents parse failures.
4. Test locally with `npm run pipeline:test` before deploying.
