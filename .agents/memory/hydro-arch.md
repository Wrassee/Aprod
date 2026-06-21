---
name: HYDRO Protocol Architecture
description: MOD_HYD lift type routes to a standalone HYDRO questionnaire, not the general questionnaire
---

**Rule:** When `selectedType.code === 'MOD_HYD'` in lift-selector.tsx, navigate to `'hydro-questionnaire'` NOT `'questionnaire'`.

**Why:** MOD_HYD (Modernizáció/Hydraulikus) uses a completely different protocol document (ABNAHME_HYDRO.pdf AcroForm) with 254 checkbox questions across 14 chapters (B1-B14), plus measurement and text fields. It has nothing to do with the Excel-based general protocol flow.

**How to apply:**
- Screen type `'hydro-questionnaire'` exists in both App.tsx and lift-selector.tsx local Screen types.
- `src/pages/hydro-questionnaire.tsx` is the standalone HYDRO form page.
- State persisted at localStorage key `'hydro-form-data'`.
- PDF generated via `POST /api/protocols/download-hydro-pdf` in `server/routes/protocol-mapping.ts`.
- HYDRO PDF filler: `server/services/hydro-pdf-filler.ts` — 1014 fields, all mapped.

**Chapter structure (254 Ja-checkbox questions total):**
B1:1, B2:25, B3:47, B4:19, B5:36, B6:13, B7:49, B8:19, B9:6, B10:7, B11:22, B12:2 (paths 16.2/16.3!), B13:4, B14:4

**Special options per chapter:**
- B1: Ja/keine/nz (no Nein, no U)
- B10 question 10.1: has extra Siehe option
- B12: Ja/Nein/U only (no nz)
- B6: includes A.6.1, A.6.2, B.6.1, B.6.2, C.6.1 paths

**B10: ALL 7 questions have Nein** (TXT confirmed — XML only showed Nein for 3 and 4, but TXT shows 1-7 all have Nein)
**B13 Nein fields are CHECKBOXES** (not text fields as XML suggested)
