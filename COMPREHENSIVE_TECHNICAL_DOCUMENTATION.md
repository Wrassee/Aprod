### **7. `admin.tsx` - Admin Interface**

```typescript
// Frissített funkciók (2024+):
- Template lista (helyi + Supabase Storage)
- Template feltöltés drag&drop-pal, két típusra bontva: kérdés sablon és protokoll sablon
- Feltöltésnél kötelező megadni: sablon neve, típusa ("unified" vagy "protocol"), valamint a language ("multilingual")
- Fájlok feltöltése: production környezetben Supabase Storage-ba kerülnek, a temp fájlokat automatikusan törli a backend
- Template aktiválás/deaktiválás és törlés API-n keresztül történik; sikeres művelet után automatikus sablonlista frissül
- Betöltési stratégia kiválasztása (helyi először, cache először, csak távoli)
- Sablon előnézet (template preview)
- Manuális cache clear lehetőség
- Frontend validáció: minden kötelező mezőre (név, típus, file) ellenőrzés
- Hibakezelés: minden API hívás toast üzenettel visszajelez, a backend error üzenetét is megjeleníti
```

#### **API endpointok (2024+)**
```typescript
// Template management endpoints:
GET    /api/admin/templates            // Sablonok listázása
POST   /api/admin/templates/upload     // Sablon feltöltése (multipart/form-data, kötelező: file, name, type, language)
POST   /api/admin/templates/:id/activate  // Sablon aktiválás
DELETE /api/admin/templates/:id        // Sablon törlés
GET    /api/admin/templates/available  // Elérhető sablonok (helyi + távoli)
```

#### **Technikai megjegyzés**
- Productionban a fájlok feltöltése Supabase Storage-ba történik, temp fájlokat a rendszer azonnal törli a feltöltés után.
- A frontend validálja a sablon nevét, típusát és a feltöltött fájlt, csak ezek megléte esetén engedélyezett a feltöltés.
- Minden admin művelet (feltöltés, aktiválás, törlés) után automatikusan frissül a sablon lista.
- Hiba esetén a frontend toastban mutatja a backend részletes error üzenetét.

#### **Új UX funkciók**
- "Betöltési stratégia" választó: helyi először, cache először, csak távoli
- Sablon előnézet részletesen mutatja az Excel tartalmát
- Manuális cache törlés gomb