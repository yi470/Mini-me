# In My Colors — Mini-Me

In My Colors is a reflective journal and personal color archive. Mini-Me reads the current journal entry together with the user's active color palette, offers a tentative emotional/color hypothesis, and then gives the user explicit control to accept, question, revise, override, and save the final colors.

## Submission links

- **Deployed app:** [mini-me-yz1f.vercel.app](https://mini-me-yz1f.vercel.app/)
- **Source repository:** [github.com/yi470/Mini-me](https://github.com/yi470/Mini-me)
- **Google AI Studio project:** [Mini-me / In My Colors](https://ai.studio/apps/a8285912-3f8b-40f7-b62d-f04003a04b67)
- **Editable detailed system map:** [FigJam](https://www.figma.com/board/lCqKByHlpduLcwGlkoVqRB/TDF-Weekly-Journal?node-id=164-83)
- **Process documentation:** [Week 4 journal](https://github.com/dengyixin2026-lang/Agent-Studio-1/blob/main/week-04.md)

## Project-files package

This repository contains the four items named in the Mini-Me Project Files assignment:

1. **System Card versions:** [`system-cards/`](system-cards/README.md)
2. **Evaluation set:** [`evaluation/evaluation-set.md`](evaluation/evaluation-set.md)
3. **Observed results and evidence:** [`evaluation/results.md`](evaluation/results.md)
4. **Repository and deployed URL:** listed above

The project also includes a detailed [system map](docs/detailed-system-map.png) and six screenshots from one continuous recorded evaluation flow. Planned tests are kept separate from observed results; no unrun test is presented as a finding.

## Core interaction

1. Write a journal entry.
2. Choose **Reflect with Mini-Me**, or continue manually without AI.
3. Review the tentative mood/color hypothesis.
4. Accept it or provide structured feedback.
5. Mini-Me preserves or revises the colors according to the feedback and asks at most one clarification question when the user's meaning is unknown.
6. The user makes the final color choice and explicitly saves the entry.

Human experience is treated as the ground truth. AI suggestions are hypotheses, not diagnoses or automatic decisions.

## System architecture

- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **AI:** Gemini through server-side API routes
- **Storage:** browser-local journal, palette, and evaluation records
- **Deployment:** Vercel
- **Environment variable:** `GEMINI_API_KEY` (the secret value is not committed)

![Detailed system map](docs/detailed-system-map.png)

## Run locally

```bash
npm install
cp .env.example .env
# Add GEMINI_API_KEY to .env
npm run dev
```

Validation commands:

```bash
npm run lint
npm run build
```

## Evidence boundary

The six screenshots in `evaluation/evidence/` document one continuous November 13, 2026 interaction, not six independent experiments. System Card V3 is the current implemented instruction. V1 and V2 are documented reconstructions from saved iteration evidence because verbatim exports of their original prompts were not retained; they are labeled accordingly rather than presented as exact historical source files.
