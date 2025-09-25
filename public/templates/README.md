# OTIS APROD - Helyi Template Sablonok

Ez a mappa tartalmazza az alkalmazásba beépített, helyben elérhető Excel template sablonokat.

## Sablonok

### Alapértelmezett Sablonok
- `alap_egysegu.xlsx` - Általános célú egységes sablon
- `minimal_kerdesek.xlsx` - Minimális kérdések gyors átvételhez
- `expressz_protokoll.xlsx` - Gyors protokoll sablon

### Bővített Sablonok
- `bovitett_kerdesek.xlsx` - Részletes kérdéssor speciális esetekhez
- `teljes_dokumentacio.xlsx` - Komplett dokumentációs sablon
- `fejlett_szamitasok.xlsx` - Fejlett mérési és számítási funkciók

## Használat

Ezek a sablonok automatikusan elérhetők az alkalmazásból hálózati kapcsolat nélkül is. 
Az intelligens betöltési rendszer először ezeket próbálja használni, csak utána fordul 
a dinamikusan letöltött sablonokhoz.

## Frissítés

A sablonok frissítéséhez módosítani kell a projekt forráskódját és újra kell telepíteni 
az alkalmazást. Gyakori változtatásokhoz használd a Supabase-es dinamikus letöltést.