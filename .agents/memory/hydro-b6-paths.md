---
name: B6 Special Paths (A/B/C prefix)
description: B6 chapter has letter-prefixed question paths that need special handling in getChapterFromPath
---

**Rule:** In `server/services/hydro-pdf-filler.ts`, `getChapterFromPath()` must handle B6 special paths before the main digit regex.

**Why:** TXT analysis revealed B6 has paths like `A.6.1`, `A.6.2`, `B.6.1`, `B.6.2`, `C.6.1`. The default regex `^(\d+)[.\-_]` does NOT match these (A is not a digit). Without the fix, these questions would be silently skipped.

**Fix applied (2026-06):**
```ts
function getChapterFromPath(questionPath: string): number | null {
  // B6 speciális: A.6.x / B.6.x / C.6.x → fejezet 6
  if (/^[A-C]\.6\./i.test(questionPath)) return 6;
  const match = questionPath.match(/^(\d+)[.\-_]/);
  ...
}
```

**PDF field names:** `B6_Ja_A.6.1`, `B6_Nein_A.6.1`, etc. (chapter prefix stays as "B6").
