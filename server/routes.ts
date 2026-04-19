// server/routes.ts - VÉGLEGES, MODULÁRIS VERZIÓ (LIFT APIS + MULTILINGUAL FIX)

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
import aiHelpRoutes from "./routes/ai-help-routes.js";
import userManualRoutes from "./routes/user-manual-routes.js";
import technicianRoutes from "./routes/technician-routes.js";

// ===== LIFT TYPE SELECTION ROUTES =====
import liftTypesRoutes from "./routes/lift-types.js";
import liftSubtypesRoutes from "./routes/lift-subtypes.js";
import liftMappingsRoutes from "./routes/lift-mappings.js";
import liftAvailableRoutes from "./routes/lift-available.js";

// Auth middleware
import { 
  requireAuth, 
  requireOwnerOrAdmin, 
  requireAdmin 
} from "./middleware/auth.js";

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
  app.use("/api/admin", requireAuth, adminRoutes);
  app.use("/api/protocols", protocolMappingRoutes);
  app.use("/api/errors", errorRoutes);
  app.use("/api/ai-help", aiHelpRoutes);
  app.use("/api/manual", userManualRoutes);
  app.use("/api/technician", technicianRoutes);

  // ===== LIFT TYPE SELECTION API REGISZTRÁCIÓ =====
  app.use("/api/admin", requireAdmin, liftTypesRoutes);
  app.use("/api/admin", requireAdmin, liftSubtypesRoutes);
  app.use("/api/admin", requireAdmin, liftMappingsRoutes);
  app.use(liftAvailableRoutes);

  // --- Fő útvonalak ---

  // Health check
  app.get('/api/health', (_req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
  });

  // ===== JAVÍTOTT TÖBBNYELVŰ KÉRDÉSEK LEKÉRÉSE =====
  app.get("/api/questions/:language", async (req, res) => {
    try {
      const { language } = req.params;
      const { templateId } = req.query;
      
      const supportedLanguages = ["hu", "de", "en", "fr", "it"];
      if (!supportedLanguages.includes(language)) {
        return res.status(400).json({ message: "Invalid language specified" });
      }

      let questionsToFormat: any[] = [];

      // Template betöltés (templateId vagy aktív sablon)
      if (templateId && typeof templateId === "string") {
        console.log(`📦 Loading questions from template: ${templateId}`);
        
        try {
          const templateResult = await hybridTemplateLoader.loadTemplate(
            templateId,
            "unified",
            "multilingual"
          );
          
          questionsToFormat = await excelParserService.parseQuestionsFromExcel(
            templateResult.filePath
          );
          
          console.log(`✅ Loaded ${questionsToFormat.length} questions from template ${templateId}`);
        } catch (error) {
          console.error(`❌ Error loading template ${templateId}:`, error);
          return res.status(404).json({ message: "Template not found or invalid" });
        }
      } else {
        // Cache-elt aktív sablon használata
        if (!questionsCache) {
          const activeTemplate = await storage.getActiveTemplate("unified", "multilingual");
          
          if (!activeTemplate) {
            console.warn('⚠️ No active template found in DB, using local fallback.');
            const fallbackResult = await hybridTemplateLoader.loadTemplate(
              'alap_egysegu', 
              'unified', 
              'multilingual'
            );
            questionsCache = await excelParserService.parseQuestionsFromExcel(
              fallbackResult.filePath
            );
          } else {
            const templateResult = await hybridTemplateLoader.loadTemplate(
              activeTemplate.id, 
              "unified", 
              "multilingual"
            );
            questionsCache = await excelParserService.parseQuestionsFromExcel(
              templateResult.filePath
            );
          }
        }
        questionsToFormat = questionsCache;
      }

      // ===== JAVÍTOTT TÖBBNYELVŰ FORMÁZÁS =====
      const formattedQuestions = questionsToFormat.map((config) => {
        
        // === HELPER: Nyelvfüggő mező kiválasztása fallback-kel ===
        const getLocalizedField = (fieldName: string, lang: string): string | undefined => {
          // Kis betűs verziókat keresünk (titlehu, titlede, placeholderfr, groupNameit stb.)
          const huField = config[fieldName] || config[`${fieldName}hu`] || config[`${fieldName}Hu`];
          const deField = config[`${fieldName}de`] || config[`${fieldName}De`];
          const enField = config[`${fieldName}en`] || config[`${fieldName}En`];
          const frField = config[`${fieldName}fr`] || config[`${fieldName}Fr`];
          const itField = config[`${fieldName}it`] || config[`${fieldName}It`];
          
          // Fallback lánc: target nyelv → EN → DE → HU → alapmező
          switch (lang) {
            case "hu":
              return huField || enField || deField;
            case "de":
              return deField || enField || huField;
            case "en":
              return enField || deField || huField;
            case "fr":
              return frField || enField || deField || huField;
            case "it":
              return itField || enField || deField || huField;
            default:
              return huField || enField || deField;
          }
        };

        // === TITLE kiválasztás ===
        const title = getLocalizedField('title', language) || config.title || config.questionId;

        // === GROUP NAME kiválasztás ===
        let groupName = getLocalizedField('groupName', language);
        
        // Measurement/calculated speciális csoportnév
        const typeStr = config.type as string;
        if (typeStr === "measurement" || typeStr === "calculated") {
          const measurementGroupNames: Record<string, string> = {
            hu: "Mérési adatok",
            de: "Messdaten",
            en: "Measurement Data",
            fr: "Données de mesure",
            it: "Dati di misurazione"
          };
          groupName = measurementGroupNames[language] || measurementGroupNames["en"];
        }

        // === PLACEHOLDER kiválasztás ===
        const placeholder = getLocalizedField('placeholder', language);

        // === TYPE korrekció ===
        let correctedType = config.type;
        let options: string[] | undefined = config.options;

        if (correctedType === 'radio') {
          options = ['true', 'false', 'n.a.'];
        }

        // === DEBUGGING: Hiányzó magyar fordítások logolása ===
        if (language === "hu" && !config.titlehu && !config.titleHu && !config.title) {
          console.warn(`⚠️ Missing HU title for question: ${config.questionId}`);
        }

        return {
          id: config.questionId,
          title: title,
          groupName: groupName || "Általános",
          groupKey: config.groupKey,
          type: correctedType,
          options: options,
          optionCells: config.optionCells, // select_extended típushoz
          required: config.required,
          placeholder: placeholder,
          unit: config.unit,
          minValue: config.minValue,
          maxValue: config.maxValue,
          calculationFormula: config.calculationFormula,
          calculationInputs: config.calculationInputs,
          groupOrder: config.groupOrder,
          cellReference: config.cellReference,
          sheetName: config.sheetName,
          conditional_group_key: config.conditionalGroupKey,
        };
      });

      res.json(formattedQuestions);
    } catch (error) {
      console.error("❌ Error fetching questions:", error);
      questionsCache = null;
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

  // Profile endpoints - PROTECTED
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
      const validationResult = insertProfileSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid profile data", 
          errors: validationResult.error.errors 
        });
      }
      
      const authenticatedUser = (req as any).user;
      
      if (validationResult.data.user_id !== authenticatedUser.user_id) {
        return res.status(403).json({ 
          message: "Forbidden - You can only create your own profile" 
        });
      }
      
      const profileDataFromClient = validationResult.data;
      const updatedProfile = await storage.updateProfile(
        profileDataFromClient.user_id, 
        profileDataFromClient
      );
      
      res.status(201).json(updatedProfile);
    } catch (error) {
      console.error("❌ Error creating/updating profile:", error);
      res.status(500).json({ message: "Failed to create or update profile" });
    }
  });

  app.patch("/api/profiles/:userId", requireAuth, requireOwnerOrAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      
      const partialProfileSchema = insertProfileSchema.partial();
      const validationResult = partialProfileSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid profile update data", 
          errors: validationResult.error.errors 
        });
      }
      
      const sanitizedData = { ...validationResult.data };
      delete sanitizedData.role;
      delete sanitizedData.user_id;
      
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

  // Cache törlés endpoint (fejlesztési/debug célokra)
  app.post("/api/cache/clear", (_req, res) => {
    clearQuestionsCache();
    hybridTemplateLoader.clearCache();
    res.json({ success: true, message: "All caches cleared" });
  });
}