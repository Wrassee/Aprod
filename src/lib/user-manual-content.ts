export const userManualContent = {
  hu: {
    title: "OTIS APROD - Teljes Használati Útmutató",
    subtitle: "Lift Átvételi Protokoll Digitalizáló Alkalmazás",
    version: "v2.0 - 2024",
    sections: [
      {
        title: "1. Bevezetés",
        content: `Az OTIS APROD alkalmazás célja a lift átvételi protokollok digitalizálása. Az alkalmazás végigvezeti Önt a teljes átvételi folyamaton, segít a hibák dokumentálásában, és automatikusan generálja a szükséges dokumentumokat (Excel, PDF).

**Főbb előnyök:**
• Papírmentes munkavégzés
• Automatikus számítások és validáció
• Hibadokumentáció képekkel
• Digitális aláírás
• Többnyelvű támogatás (Magyar, Német, Angol, Francia, Olasz)
• Offline működés PWA-ként`
      },
      {
        title: "2. Első lépések",
        content: `**Bejelentkezés:**
1. Nyissa meg az alkalmazást a böngészőben
2. Kattintson a "Bejelentkezés" gombra
3. Adja meg email címét és jelszavát
4. Sikeres bejelentkezés után a főoldalra kerül

**Nyelv beállítása:**
• A jobb felső sarokban található nyelvválasztóval válthat nyelvek között
• A kiválasztott nyelv automatikusan mentésre kerül

**PWA telepítése (opcionális):**
• Chrome/Edge: Kattintson a címsorban megjelenő "Telepítés" ikonra
• Mobil: "Hozzáadás a kezdőképernyőhöz" opció`
      },
      {
        title: "3. Új protokoll létrehozása",
        content: `**Lépések:**
1. A főoldalon kattintson az "Új Protokoll" gombra
2. Válassza ki a lift típusát:
   • MOD - Modernizáció
   • BEX - Beépített lift
   • NEU - Új lift
   • EGYEDI - Egyéni konfiguráció

3. Válassza ki az altípust (ha van)
4. Adja meg az alapadatokat:
   • Átvétel dátuma
   • Helyszín
   • Ügyfél adatok

5. Kattintson a "Protokoll indítása" gombra

**Fontos:** A protokoll automatikusan mentésre kerül minden módosítás után!`
      },
      {
        title: "4. Kérdések megválaszolása",
        content: `**Kérdéstípusok:**

**Igen/Nem/N.A. kérdések:**
• Kattintson a megfelelő gombra
• N.A. = Nem alkalmazható (ha a kérdés nem releváns)

**Szöveges mezők:**
• Írja be a kívánt szöveget
• Speciális karakterek is használhatók

**Választólista (Select):**
• Kattintson a mezőre
• Válasszon a listából

**Mérések:**
• Adja meg a számértéket
• Az egység automatikusan megjelenik
• Piros jelzés = érték a tűréshatáron kívül

**Számított mezők:**
• Automatikusan kitöltődnek a megadott értékek alapján
• Nem szerkeszthetők kézzel

**Navigáció:**
• "Előző" / "Következő" gombokkal lépkedhet
• A bal oldali menüből bármelyik szakaszra ugorhat
• Zöld pipa = kitöltött szakasz`
      },
      {
        title: "5. Feltételes kérdések",
        content: `Bizonyos kérdések csak akkor jelennek meg, ha egy korábbi kérdésre "Igen" választ adott.

**Példa:**
• "Van-e vészvilágítás?" → Igen
• Megjelennek a vészvilágítás részletes kérdései

Ha "Nem"-et válaszol:
• A kapcsolódó kérdések automatikusan elrejtődnek
• Az Excel cellák automatikusan kitöltődnek az alapértelmezett értékkel

**Tipp:** Ha egy szakasz váratlanul eltűnik, ellenőrizze a kapcsolódó fő kérdést!`
      },
      {
        title: "6. Niedervolt rendszer",
        content: `A Niedervolt szakasz a biztonsági berendezések ellenőrzésére szolgál.

**Eszközök:**
• Az eszközök listája az Excel sablonból töltődik be
• Egyedi eszközöket is hozzáadhat

**FI mérések:**
• Adja meg a mért értékeket mA-ben
• Piros jelzés = nem megfelelő érték
• A tűréshatárokat az Excel sablon tartalmazza

**Szinkronizáció:**
• Az eszközök és mérések automatikusan szinkronizálódnak az Excel-lel
• Új eszköz hozzáadása: kattintson a "+" gombra`
      },
      {
        title: "7. Hibák dokumentálása",
        content: `**Új hiba rögzítése:**
1. Kattintson a "Hiba hozzáadása" gombra
2. Töltse ki a mezőket:
   • Cím: Rövid leírás
   • Részletes leírás: Mi a probléma?
   • Súlyosság: Kritikus / Közepes / Alacsony

**Képek csatolása:**
• Kattintson a "Kép hozzáadása" gombra
• Készítsen fotót vagy válasszon a galériából
• Több kép is csatolható

**Hiba szerkesztése:**
• Kattintson a hiba kártyájára
• Módosítsa a szükséges mezőket
• Mentés automatikus

**Hiba törlése:**
• Kattintson a kuka ikonra
• Erősítse meg a törlést

**Fontos:** A hibák külön PDF dokumentumban is exportálhatók!`
      },
      {
        title: "8. Digitális aláírás",
        content: `**Aláírás lépései:**
1. Navigáljon az "Aláírás" szakaszhoz
2. Rajzolja be aláírását az érintőképernyőn vagy egérrel
3. Ha hibázott, kattintson a "Törlés" gombra
4. Adja meg a nyomtatott nevet
5. Kattintson a "Mentés" gombra

**Tippek:**
• Mobilon fordítsa el a készüléket fekvő módba
• Használjon ujjat vagy érintőceruzát
• Az aláírás az Excel és PDF dokumentumba is bekerül`
      },
      {
        title: "9. Dokumentumok generálása",
        content: `**Excel generálás:**
1. Kattintson az "Excel letöltése" gombra
2. A rendszer kitölti az összes cellát a válaszokkal
3. A fájl automatikusan letöltődik

**PDF generálás:**
1. Kattintson a "PDF letöltése" gombra
2. Két PDF készül:
   • Protokoll PDF (az Excel-ből konvertálva)
   • Hibalista PDF (ha vannak hibák)

**Megosztás:**
• A letöltött fájlokat emailben küldheti
• Vagy feltöltheti a vállalati rendszerbe

**Fontos:** A generálás néhány másodpercet vehet igénybe!`
      },
      {
        title: "10. Korábbi protokollok",
        content: `**Protokollok listája:**
• A főoldalon láthatja az összes korábbi protokollt
• Szűrhet dátum, helyszín vagy állapot szerint

**Protokoll megnyitása:**
• Kattintson a protokoll sorára
• Folytathatja a kitöltést vagy megtekintheti

**Protokoll törlése:**
• Kattintson a kuka ikonra
• Figyelem: Ez a művelet nem vonható vissza!

**Protokoll másolása:**
• Kattintson a másolás ikonra
• Új protokoll jön létre az adatokkal`
      },
      {
        title: "11. Admin funkciók",
        content: `**Sablonkezelés (csak adminoknak):**
• Excel sablonok feltöltése
• Kérdéssablonok kezelése
• Aktív sablon kiválasztása

**Felhasználókezelés:**
• Új felhasználók meghívása
• Jogosultságok beállítása
• Felhasználók inaktiválása

**Lift típusok kezelése:**
• Új típusok hozzáadása
• Altípusok szerkesztése
• Megjelenési sorrend módosítása`
      },
      {
        title: "12. Hibaelhárítás",
        content: `**Gyakori problémák és megoldások:**

**"Az oldal nem töltődik be"**
• Ellenőrizze az internetkapcsolatot
• Próbálja meg frissíteni az oldalt (F5)
• Törölje a böngésző gyorsítótárát

**"Nem tudom menteni a protokollt"**
• Ellenőrizze, hogy be van-e jelentkezve
• Próbálja újra néhány másodperc múlva
• Ha a probléma fennáll, lépjen kapcsolatba a támogatással

**"A PDF generálás sikertelen"**
• Ellenőrizze, hogy minden kötelező mező ki van-e töltve
• Próbálja újra
• Nagy fájlméretnél várjon türelemmel

**"Nem látom a kérdéseket"**
• Ellenőrizze a kiválasztott lift típust
• Győződjön meg róla, hogy aktív sablon van beállítva
• Lépjen kapcsolatba az adminisztrátorral

**Támogatás:**
• Használja az AI Segítőt (? ikon)
• Email: support@otis.com`
      },
      {
        title: "13. Billentyűparancsok",
        content: `**Gyorsbillentyűk:**
• Ctrl + S: Mentés
• Ctrl + P: PDF nyomtatás
• Esc: Felugró ablak bezárása
• Tab: Következő mezőre ugrás
• Shift + Tab: Előző mezőre ugrás
• Enter: Kiválasztás megerősítése

**Navigáció:**
• ← / →: Előző/Következő szakasz
• Home: Első szakasz
• End: Utolsó szakasz`
      },
      {
        title: "14. Adatvédelem és biztonság",
        content: `**Adatkezelés:**
• Az adatok titkosítva tárolódnak
• Csak bejelentkezett felhasználók férhetnek hozzá
• A protokollok a Supabase felhőben tárolódnak

**Biztonsági tippek:**
• Használjon erős jelszót
• Ne ossza meg bejelentkezési adatait
• Jelentkezzen ki nyilvános számítógépeken
• Rendszeresen változtassa jelszavát

**GDPR megfelelőség:**
• Az alkalmazás megfelel az EU adatvédelmi előírásoknak
• Adattörlési kérelem: support@otis.com`
      }
    ],
    footer: "© 2024 OTIS Elevator Company - APROD Alkalmazás"
  },
  de: {
    title: "OTIS APROD - Vollständiges Benutzerhandbuch",
    subtitle: "Anwendung zur Digitalisierung von Aufzugsabnahmeprotokollen",
    version: "v2.0 - 2024",
    sections: [
      {
        title: "1. Einführung",
        content: `Die OTIS APROD-Anwendung dient der Digitalisierung von Aufzugsabnahmeprotokollen. Die Anwendung führt Sie durch den gesamten Abnahmeprozess, hilft bei der Fehlerdokumentation und generiert automatisch die erforderlichen Dokumente (Excel, PDF).

**Hauptvorteile:**
• Papierloses Arbeiten
• Automatische Berechnungen und Validierung
• Fehlerdokumentation mit Bildern
• Digitale Unterschrift
• Mehrsprachige Unterstützung (Ungarisch, Deutsch, Englisch, Französisch, Italienisch)
• Offline-Betrieb als PWA`
      },
      {
        title: "2. Erste Schritte",
        content: `**Anmeldung:**
1. Öffnen Sie die Anwendung im Browser
2. Klicken Sie auf "Anmelden"
3. Geben Sie Ihre E-Mail und Ihr Passwort ein
4. Nach erfolgreicher Anmeldung gelangen Sie zur Startseite

**Sprache einstellen:**
• Mit dem Sprachwähler in der oberen rechten Ecke können Sie zwischen Sprachen wechseln
• Die gewählte Sprache wird automatisch gespeichert

**PWA-Installation (optional):**
• Chrome/Edge: Klicken Sie auf das "Installieren"-Symbol in der Adressleiste
• Mobil: Option "Zum Startbildschirm hinzufügen"`
      },
      {
        title: "3. Neues Protokoll erstellen",
        content: `**Schritte:**
1. Klicken Sie auf der Startseite auf "Neues Protokoll"
2. Wählen Sie den Aufzugstyp:
   • MOD - Modernisierung
   • BEX - Eingebauter Aufzug
   • NEU - Neuer Aufzug
   • CUSTOM - Individuelle Konfiguration

3. Wählen Sie den Untertyp (falls vorhanden)
4. Geben Sie die Basisdaten ein:
   • Abnahmedatum
   • Standort
   • Kundendaten

5. Klicken Sie auf "Protokoll starten"

**Wichtig:** Das Protokoll wird nach jeder Änderung automatisch gespeichert!`
      },
      {
        title: "4. Fragen beantworten",
        content: `**Fragetypen:**

**Ja/Nein/N.A. Fragen:**
• Klicken Sie auf die entsprechende Schaltfläche
• N.A. = Nicht anwendbar (wenn die Frage nicht relevant ist)

**Textfelder:**
• Geben Sie den gewünschten Text ein
• Sonderzeichen sind erlaubt

**Auswahlliste (Select):**
• Klicken Sie auf das Feld
• Wählen Sie aus der Liste

**Messungen:**
• Geben Sie den Zahlenwert ein
• Die Einheit wird automatisch angezeigt
• Rote Markierung = Wert außerhalb der Toleranz

**Berechnete Felder:**
• Werden automatisch basierend auf den eingegebenen Werten ausgefüllt
• Können nicht manuell bearbeitet werden

**Navigation:**
• Mit "Zurück" / "Weiter" können Sie navigieren
• Über das linke Menü können Sie zu jedem Abschnitt springen
• Grünes Häkchen = ausgefüllter Abschnitt`
      }
    ],
    footer: "© 2024 OTIS Elevator Company - APROD Anwendung"
  },
  en: {
    title: "OTIS APROD - Complete User Manual",
    subtitle: "Elevator Acceptance Protocol Digitization Application",
    version: "v2.0 - 2024",
    sections: [
      {
        title: "1. Introduction",
        content: `The OTIS APROD application is designed to digitize elevator acceptance protocols. The application guides you through the complete acceptance process, helps document errors, and automatically generates the required documents (Excel, PDF).

**Main Benefits:**
• Paperless work
• Automatic calculations and validation
• Error documentation with images
• Digital signature
• Multilingual support (Hungarian, German, English, French, Italian)
• Offline operation as PWA`
      },
      {
        title: "2. Getting Started",
        content: `**Login:**
1. Open the application in your browser
2. Click the "Login" button
3. Enter your email and password
4. After successful login, you will be taken to the main page

**Language Settings:**
• Use the language selector in the top right corner to switch languages
• The selected language is automatically saved

**PWA Installation (optional):**
• Chrome/Edge: Click the "Install" icon in the address bar
• Mobile: "Add to Home Screen" option`
      },
      {
        title: "3. Creating a New Protocol",
        content: `**Steps:**
1. Click "New Protocol" on the main page
2. Select the elevator type:
   • MOD - Modernization
   • BEX - Built-in elevator
   • NEU - New elevator
   • CUSTOM - Custom configuration

3. Select the subtype (if available)
4. Enter the basic data:
   • Acceptance date
   • Location
   • Customer data

5. Click "Start Protocol"

**Important:** The protocol is automatically saved after every change!`
      },
      {
        title: "4. Answering Questions",
        content: `**Question Types:**

**Yes/No/N.A. Questions:**
• Click the appropriate button
• N.A. = Not Applicable (if the question is not relevant)

**Text Fields:**
• Enter the desired text
• Special characters are allowed

**Select List:**
• Click on the field
• Choose from the list

**Measurements:**
• Enter the numeric value
• The unit is displayed automatically
• Red indicator = value outside tolerance

**Calculated Fields:**
• Filled automatically based on entered values
• Cannot be edited manually

**Navigation:**
• Use "Previous" / "Next" buttons to navigate
• Jump to any section from the left menu
• Green checkmark = completed section`
      }
    ],
    footer: "© 2024 OTIS Elevator Company - APROD Application"
  }
};

export function generateManualHTML(lang: 'hu' | 'de' | 'en' = 'hu'): string {
  const manual = userManualContent[lang] || userManualContent.hu;
  
  let html = `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${manual.title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 900px;
      margin: 0 auto;
      padding: 40px 20px;
      background: #f5f5f5;
    }
    .cover {
      text-align: center;
      padding: 60px 20px;
      background: linear-gradient(135deg, #1a365d 0%, #2563eb 100%);
      color: white;
      border-radius: 12px;
      margin-bottom: 40px;
    }
    .cover h1 { font-size: 2.5em; margin-bottom: 10px; }
    .cover h2 { font-size: 1.3em; font-weight: 400; opacity: 0.9; }
    .cover .version { margin-top: 20px; opacity: 0.7; }
    .toc {
      background: white;
      padding: 30px;
      border-radius: 12px;
      margin-bottom: 30px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .toc h3 { margin-bottom: 15px; color: #1a365d; }
    .toc ul { list-style: none; }
    .toc li { padding: 8px 0; border-bottom: 1px solid #eee; }
    .toc a { color: #2563eb; text-decoration: none; }
    .toc a:hover { text-decoration: underline; }
    .section {
      background: white;
      padding: 30px;
      border-radius: 12px;
      margin-bottom: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .section h2 {
      color: #1a365d;
      border-bottom: 3px solid #2563eb;
      padding-bottom: 10px;
      margin-bottom: 20px;
    }
    .section p { margin-bottom: 15px; white-space: pre-line; }
    .footer {
      text-align: center;
      padding: 20px;
      color: #666;
      font-size: 0.9em;
    }
    @media print {
      body { background: white; padding: 20px; }
      .cover { page-break-after: always; }
      .section { page-break-inside: avoid; box-shadow: none; border: 1px solid #ddd; }
    }
  </style>
</head>
<body>
  <div class="cover">
    <h1>${manual.title}</h1>
    <h2>${manual.subtitle}</h2>
    <div class="version">${manual.version}</div>
  </div>
  
  <div class="toc">
    <h3>${lang === 'hu' ? 'Tartalomjegyzék' : lang === 'de' ? 'Inhaltsverzeichnis' : 'Table of Contents'}</h3>
    <ul>
      ${manual.sections.map((s, i) => `<li><a href="#section-${i}">${s.title}</a></li>`).join('\n      ')}
    </ul>
  </div>
  
  ${manual.sections.map((s, i) => `
  <div class="section" id="section-${i}">
    <h2>${s.title}</h2>
    <p>${s.content}</p>
  </div>
  `).join('')}
  
  <div class="footer">${manual.footer}</div>
</body>
</html>`;
  
  return html;
}
