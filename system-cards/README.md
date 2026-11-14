# System Card Version History

This folder records the evolution of Mini-Me's behavioral instructions.

| Version | Design stage | Main change | Evidence status |
|---|---|---|---|
| [V1](v1-predictive-interpreter.md) | Predictive interpreter | Journal text is translated into mood and color | Reconstructed from saved design/iteration records; not a verbatim prompt export |
| [V2](v2-tentative-hypothesis.md) | Tentative, palette-aware suggestion | Personal palette, uncertainty, explanation, and user override become explicit | Reconstructed from saved design/iteration records; not a verbatim prompt export |
| [V3](v3-collaborative-sensemaking.md) | Collaborative sensemaking | Structured feedback, clarification, color preservation, comparison, and explicit final save | Current implemented behavior in `api/reflect.ts` and `api/reflect/revise.ts` |

## Evolution summary

`Predict mood/color` → `Offer a tentative palette-aware hypothesis` → `Negotiate meaning while preserving human authority`

The main design lesson was that stating “the user decides” in a prompt was not enough. Human authority had to become visible in the interface through feedback choices, clarification, manual adjustment, side-by-side comparison, and explicit confirmation.
