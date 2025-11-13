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

// Auth middleware
import { requireAuth, requireOwnerOrAdmin } from "./middleware/auth.js";

// Zod validation
import { insertProfileSchema } from "../shared/schema-sqlite.js";

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
  app.use("/api/admin", requireAuth, adminRoutes);
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

  // Profile endpoints - PROTECTED with auth middleware
  app.get("/api/profiles/:userId", requireAuth, requireOwnerOrAdmin, async (req, res) => {
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

  app.post("/api/profiles", requireAuth, async (req, res) => {
    try {
      // Validate request body with Zod
      const validationResult = insertProfileSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid profile data", 
          errors: validationResult.error.errors 
        });
      }
      
      const authenticatedUser = (req as any).user;
      
      // Ensure user can only create their own profile
      if (validationResult.data.user_id !== authenticatedUser.user_id) {
        return res.status(403).json({ 
          message: "Forbidden - You can only create your own profile" 
        });
      }
      
      // SECURITY FIX: Force role to "user" for self-service creation
      // Only admins can create profiles with elevated roles (future feature)
      // const sanitizedData = {
       // ...validationResult.data,
        //role: 'user', // Always set to 'user' regardless of client input
      //};
      
      // const profile = await storage.createProfile(sanitizedData);

      // A validationResult.data tartalmazza a user_id, email, role, name stb. mezőket.

    const profileDataFromClient = validationResult.data;

    // A user_id alapján frissítjük a profilt
    const updatedProfile = await storage.updateProfile(
        profileDataFromClient.user_id, 
        profileDataFromClient
    );
    
    res.status(201).json(updatedProfile); // 201 (Created) helyett 200 (OK) is lehetne, de így is jó
  } catch (error) {
    console.error("❌ Error creating/updating profile:", error); // <-- Átírtam a log üzenetet
    res.status(500).json({ message: "Failed to create or update profile" });
  }
});

  app.patch("/api/profiles/:userId", requireAuth, requireOwnerOrAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Validate request body with Zod (partial update)
      const partialProfileSchema = insertProfileSchema.partial();
      const validationResult = partialProfileSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid profile update data", 
          errors: validationResult.error.errors 
        });
      }
      
      // SECURITY FIX: Remove protected fields from user updates
      // Users cannot change their own role or user_id - only system/admin can do that
      const sanitizedData = { ...validationResult.data };
      delete sanitizedData.role; // Strip role from client updates
      delete sanitizedData.user_id; // Strip user_id to prevent ownership transfer
      
      // If no fields left to update after sanitization
      if (Object.keys(sanitizedData).length === 0) {
        return res.status(400).json({ 
          message: "No valid fields to update" 
        });
      }
      
      const profile = await storage.updateProfile(userId, sanitizedData);
      
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