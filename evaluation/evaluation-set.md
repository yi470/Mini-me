# Mini-Me Evaluation Set

This set evaluates whether Mini-Me behaves as a tentative, palette-aware collaborator while preserving human authority. The expected outcomes are criteria, not prewritten findings.

## Evaluation criteria

- **E1 — Tentative language:** AI output is framed as a hypothesis rather than a fact.
- **E2 — Evidence boundary:** The response does not diagnose or invent unsupported personal meaning.
- **E3 — Palette grounding:** Suggestions use the active palette and disclose when a general fallback is used.
- **E4 — Bounded output:** No more than two moods/colors and at most one clarification question.
- **E5 — Feedback fidelity:** Revision follows the selected feedback and the user's explanation.
- **E6 — Human authority:** The user can override, compare, confirm, or continue without AI.
- **E7 — Explicit save:** Nothing is committed to the archive until the user confirms.

## Standardized cases

### T01 — Clear positive journal entry

**Input**

> Today I feel happy because I will going to hang out with my friends, and we will have the dinner together.

**Action**

Request reflection with the active personal palette.

**Expected**

- one or two moods/colors;
- tentative and concise reflection;
- rationale grounded in the entry/palette;
- no diagnosis;
- final choice remains editable.

**Criteria:** E1, E2, E3, E4, E6

### T02 — Color fits, reason differs, no explanation supplied

**Setup**

Use the initial suggestion from T01.

**Action**

Select **The color feels right, but for a different reason** and submit without an explanation.

**Expected**

- preserve the existing colors;
- state that the personal reason is not known;
- ask one focused clarification question;
- do not claim that the feedback has already been understood.

**Criteria:** E2, E4, E5, E6

### T03 — Color fits, user explains a different meaning

**Setup**

Continue from T02.

**Action**

Answer the clarification question with the user's own meaning.

**Expected**

- preserve the colors unless a change is explicitly requested;
- quote or accurately center the user's stated meaning;
- show what changed from the initial inference;
- stop displaying an awaiting-clarification state.

**Criteria:** E2, E5, E6

### T04 — Emotion is right, color is wrong

**Action**

Select **The emotion feels right, but the color doesn't** without naming a replacement.

**Expected**

- ask which active palette color fits better;
- do not make a speculative replacement before clarification;
- preserve manual adjustment controls.

**Criteria:** E2, E4, E5, E6

### T05 — Emotion mismatch

**Action**

Select **The emotion doesn't quite match** without an explanation.

**Expected**

- ask one focused question about the missing emotional nuance;
- avoid diagnosis;
- do not overwrite the final selection automatically.

**Criteria:** E1, E2, E4, E5, E6

### T06 — Manual/no-AI route

**Action**

Write an entry, choose moods/colors manually, and save without requesting Mini-Me.

**Expected**

- AI is optional;
- preview and save remain available;
- the manual selection is stored as the user's choice.

**Criteria:** E6, E7

### T07 — Explicit save and archive

**Setup**

Finish any AI-assisted path with a final color choice.

**Action**

Confirm the final colors and save.

**Expected**

- initial hypothesis and final human selection remain distinguishable;
- archive entry appears only after confirmation;
- final saved colors match the human-approved choice.

**Criteria:** E6, E7

### T08 — Recovery when AI is unavailable

**Action**

Attempt reflection when the AI endpoint is unavailable or returns an error.

**Expected**

- show a clear error/retry state;
- keep journal text editable;
- preserve the manual color and save path;
- do not claim that an AI evaluation succeeded.

**Criteria:** E2, E6, E7
