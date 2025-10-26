// server/routes.ts - VÉGLEGES, MODULÁRIS VERZIÓ

import type { Express } from "express";
import { storage } from "./storage.js";
import { testConnection } from "./db.js";
import { excelParserService } from "./services/excel-parser.js";
import { hybridTemplateLoader } from "./services/hybrid-template-loader.js";
import { niedervoltService } from "./services/niedervolt-service.js";

// Moduláris routerek importálása
import { adminRoutes } from "./routes/admin-routes.js";
import { protocolMappingRoutes } from "./routes/protocol-mapping.js";
import { errorRoutes } from "./routes/error-routes.js";

// Gyorsítótár a kérdések tárolására
let questionsCache: any[] | null = null;

/**
 * Kiüríti a memóriában tárolt kérdés cache-t.
 * Ezt kívülről (pl. az admin-routes.ts-ből) is meg lehet hívni.
 */
export function clearQuestionsCache() {
  questionsCache = null;
  console.log('✅ In-memory questions cache cleared.');
}

export async function registerRoutes(app: Express) {
  await testConnection();

  // --- Moduláris Routerek Regisztrálása ---
  // A bejövő kérések először ezeken a routereken mennek keresztül.
  app.use("/api/admin", adminRoutes);
  app.use("/api/protocols", protocolMappingRoutes);
  app.use("/api/errors", errorRoutes);

  // --- Fő (nem kiszervezett) útvonalak ---

  // Health check a rendszer állapotának ellenőrzésére
  app.get('/api/health', (_req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
  });

  // Kérdések lekérése az aktív sablonból
  app.get("/api/questions/:language", async (req, res) => {
    try {
      const { language } = req.params;
      if (language !== "hu" && language !== "de") {
        return res.status(400).json({ message: "Invalid language specified" });
      }

      // Gyorsítótár ellenőrzése
      if (!questionsCache) {
        const activeTemplate = await storage.getActiveTemplate("unified", "multilingual");
        
        // Ha nincs aktív sablon az adatbázisban, egy helyi "tartalék" sablont használunk
        if (!activeTemplate) {
            console.warn('⚠️ No active template found in DB, using local fallback.');
            const fallbackResult = await hybridTemplateLoader.loadTemplate('alap_egysegu', 'unified', 'multilingual');
            questionsCache = await excelParserService.parseQuestionsFromExcel(fallbackResult.filePath);
        } else {
            const templateResult = await hybridTemplateLoader.loadTemplate(activeTemplate.id, "unified", "multilingual");
            questionsCache = await excelParserService.parseQuestionsFromExcel(templateResult.filePath);
        }
      }

      // A válasz formázása a frontend számára - EREDETI STRUKTÚRA
      const formattedQuestions = questionsCache.map((config) => {
        let groupName = language === "de" && config.groupNameDe ? config.groupNameDe : config.groupName;
        const typeStr = config.type as string;
        if (typeStr === "measurement" || typeStr === "calculated") {
          groupName = language === "de" ? "Messdaten" : "Mérési adatok";
        }

        // JAVÍTOTT: Robusztusabb type korrekció és options generálás
        let correctedType = config.type;
        let options: string[] | undefined = config.options; // Alapértelmezett átvétel

        // Először a specifikus placeholder-t ellenőrizzük
        if (correctedType === 'radio') {
            options = ['true', 'false', 'n.a.'];
        }

        return {
          id: config.questionId,
          title: language === "hu" ? (config.titleHu || config.title) : (config.titleDe || config.title),
          groupName: groupName,
          groupKey: config.groupKey, // NEW: Stable slug for filtering (NOT translated)
          type: correctedType,
          options: options,
          required: config.required,
          placeholder: language === "de" && config.placeholderDe ? config.placeholderDe : config.placeholder,
          unit: config.unit,
          minValue: config.minValue,
          maxValue: config.maxValue,
          calculationFormula: config.calculationFormula,
          calculationInputs: config.calculationInputs,
          groupOrder: config.groupOrder,
          cellReference: config.cellReference,
          sheetName: config.sheetName,
          conditional_group_key: config.conditionalGroupKey, // CRITICAL FIX: Send conditional key to frontend
        };
      });

      res.json(formattedQuestions);
    } catch (error) {
      console.error("❌ Error fetching questions:", error);
      questionsCache = null; // Hiba esetén töröljük a cache-t
      res.status(500).json({ message: "Failed to fetch questions" });
    }
  });

  // Niedervolt eszközök listájának lekérése
  app.get("/api/niedervolt/devices", async (_req, res) => {
    try {
      const devices = await niedervoltService.getNiedervoltDevices();
      const dropdownOptions = niedervoltService.getDropdownOptions();
      res.json({ devices, dropdownOptions });
    } catch (error) {
      console.error("❌ Error fetching niedervolt devices:", error);
      res.status(500).json({ message: "Failed to fetch niedervolt devices" });
    }
  });

  // Profile endpoints
  app.get("/api/profiles/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const profile = await storage.getProfileByUserId(userId);
      
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      
      res.json(profile);
    } catch (error) {
      console.error("❌ Error fetching profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.post("/api/profiles", async (req, res) => {
    try {
      const profileData = req.body;
      const profile = await storage.createProfile(profileData);
      res.status(201).json(profile);
    } catch (error) {
      console.error("❌ Error creating profile:", error);
      res.status(500).json({ message: "Failed to create profile" });
    }
  });

  app.patch("/api/profiles/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const updates = req.body;
      const profile = await storage.updateProfile(userId, updates);
      
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      
      res.json(profile);
    } catch (error) {
      console.error("❌ Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // OPCIONÁLIS: Manuális cache törlés endpoint (fejlesztési/debug célokra)
  app.post("/api/cache/clear", (_req, res) => {
    clearQuestionsCache();
    hybridTemplateLoader.clearCache();
    res.json({ success: true, message: "All caches cleared" });
  });
}