// server/routes/lift-mappings.ts - TELJES JAVÍTOTT VERZIÓ
import { Router } from "express";
import { z } from "zod";
import { db, liftTypes, liftSubtypes, liftTemplateMappings, templates } from "../db.js";
import { eq, and } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middleware/auth.js"; // 🔥 AUTH HOZZÁADVA

const router = Router();

/* ============================================================================
   VALIDATION SCHEMAS (FIXED VERSION)
   ========================================================================== */

// Base schema
const baseMappingSchema = z.object({
  liftSubtypeId: z.string().uuid("Invalid subtype ID"),
  questionTemplateId: z.string().uuid("Invalid question template ID").optional(),
  protocolTemplateId: z.string().uuid("Invalid protocol template ID").optional(),
  notes: z.string().optional(),
});

// Creation schema
const createMappingSchema = baseMappingSchema.refine(
  (data) => data.questionTemplateId || data.protocolTemplateId,
  {
    message: "At least one template (question or protocol) must be provided",
  }
);

// Update schema
const updateMappingSchema = baseMappingSchema
  .partial()
  .omit({ liftSubtypeId: true });

/* =============================================================================
   GET /lift-mappings
   🔥 PREFIX JAVÍTVA
   🔥 AUTH HOZZÁADVA
   ========================================================================== */
router.get("/lift-mappings", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { liftSubtypeId, isActive } = req.query;

    let mappingsQuery = db
      .select({
        id: liftTemplateMappings.id,
        liftSubtypeId: liftTemplateMappings.lift_subtype_id,
        questionTemplateId: liftTemplateMappings.question_template_id,
        protocolTemplateId: liftTemplateMappings.protocol_template_id,
        isActive: liftTemplateMappings.is_active,
        createdAt: liftTemplateMappings.created_at,
        updatedAt: liftTemplateMappings.updated_at,
        createdBy: liftTemplateMappings.created_by,
        notes: liftTemplateMappings.notes,
      })
      .from(liftTemplateMappings);

    // Apply filters
    const conditions: any[] = [];
    
    if (liftSubtypeId && typeof liftSubtypeId === "string") {
      conditions.push(eq(liftTemplateMappings.lift_subtype_id, liftSubtypeId));
    }

    if (isActive === "true") {
      conditions.push(eq(liftTemplateMappings.is_active, true));
    } else if (isActive === "false") {
      conditions.push(eq(liftTemplateMappings.is_active, false));
    }

    if (conditions.length > 0) {
      mappingsQuery = mappingsQuery.where(
        conditions.length === 1 ? conditions[0] : and(...conditions)
      );
    }

    const mappings = await mappingsQuery;

    const enrichedMappings = await Promise.all(
      mappings.map(async (mapping: any) => {
        const [subtype] = mapping.liftSubtypeId
          ? await db.select().from(liftSubtypes)
              .where(eq(liftSubtypes.id, mapping.liftSubtypeId))
          : [null];

        const [liftType] = subtype
          ? await db.select().from(liftTypes)
              .where(eq(liftTypes.id, subtype.lift_type_id))
          : [null];

        const [questionTemplate] = mapping.questionTemplateId
          ? await db.select().from(templates)
              .where(eq(templates.id, mapping.questionTemplateId))
          : [null];

        const [protocolTemplate] = mapping.protocolTemplateId
          ? await db.select().from(templates)
              .where(eq(templates.id, mapping.protocolTemplateId))
          : [null];

        return {
          ...mapping,
          subtype,
          liftType,
          questionTemplate,
          protocolTemplate,
        };
      })
    );

    res.json({ success: true, data: enrichedMappings });
  } catch (error) {
    console.error("Error fetching lift mappings:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch lift mappings",
    });
  }
});

/* =============================================================================
   POST /lift-mappings - Create mapping
   🔥 PREFIX JAVÍTVA
   🔥 AUTH HOZZÁADVA
   ========================================================================== */
router.post("/lift-mappings", requireAuth, requireAdmin, async (req, res) => {
  try {
    const validatedData = createMappingSchema.parse(req.body);

    const [subtype] = await db
      .select()
      .from(liftSubtypes)
      .where(eq(liftSubtypes.id, validatedData.liftSubtypeId));

    if (!subtype) {
      return res.status(404).json({
        success: false,
        message: "Lift subtype not found",
      });
    }

    if (validatedData.questionTemplateId) {
      const [qTemplate] = await db
        .select()
        .from(templates)
        .where(eq(templates.id, validatedData.questionTemplateId));

      if (!qTemplate) {
        return res.status(404).json({
          success: false,
          message: "Question template not found",
        });
      }

      if (qTemplate.type !== "unified") {
        return res.status(400).json({
          success: false,
          message: "Question template must be of type 'unified'",
        });
      }
    }

    if (validatedData.protocolTemplateId) {
      const [pTemplate] = await db
        .select()
        .from(templates)
        .where(eq(templates.id, validatedData.protocolTemplateId));

      if (!pTemplate) {
        return res.status(404).json({
          success: false,
          message: "Protocol template not found",
        });
      }

      if (pTemplate.type !== "protocol") {
        return res.status(400).json({
          success: false,
          message: "Protocol template must be of type 'protocol'",
        });
      }
    }

    const existingActive = await db
      .select()
      .from(liftTemplateMappings)
      .where(
        and(
          eq(liftTemplateMappings.lift_subtype_id, validatedData.liftSubtypeId),
          eq(liftTemplateMappings.is_active, true)
        )
      );

    if (existingActive.length > 0) {
      return res.status(400).json({
        success: false,
        message: "An active mapping already exists for this subtype. Deactivate it first.",
        existingMapping: existingActive[0],
      });
    }

    // 🔥 camelCase → snake_case MAPPING
    const [newMapping] = await db
      .insert(liftTemplateMappings)
      .values({
        lift_subtype_id: validatedData.liftSubtypeId, // 🔥 JAVÍTVA
        question_template_id: validatedData.questionTemplateId || null, // 🔥 JAVÍTVA
        protocol_template_id: validatedData.protocolTemplateId || null, // 🔥 JAVÍTVA
        notes: validatedData.notes || null,
        created_by: (req as any).user?.id || "admin", // 🔥 JAVÍTVA: user ID
      })
      .returning();

    res.status(201).json({
      success: true,
      message: "Template mapping created successfully",
      data: newMapping,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors.map((e) => `${e.path.join(".")}: ${e.message}`),
      });
    }

    console.error("Error creating lift mapping:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create lift mapping",
    });
  }
});

/* =============================================================================
   PUT /lift-mappings/:id - Update mapping
   🔥 PREFIX JAVÍTVA
   🔥 AUTH HOZZÁADVA
   ========================================================================== */
router.put("/lift-mappings/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = updateMappingSchema.parse(req.body);

    const [existing] = await db
      .select()
      .from(liftTemplateMappings)
      .where(eq(liftTemplateMappings.id, id));

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Mapping not found",
      });
    }

    if (validatedData.questionTemplateId) {
      const [qTemplate] = await db
        .select()
        .from(templates)
        .where(eq(templates.id, validatedData.questionTemplateId));

      if (!qTemplate || qTemplate.type !== "unified") {
        return res.status(400).json({
          success: false,
          message: "Invalid question template (must exist and be type 'unified')",
        });
      }
    }

    if (validatedData.protocolTemplateId) {
      const [pTemplate] = await db
        .select()
        .from(templates)
        .where(eq(templates.id, validatedData.protocolTemplateId));

      if (!pTemplate || pTemplate.type !== "protocol") {
        return res.status(400).json({
          success: false,
          message: "Invalid protocol template (must exist and be type 'protocol')",
        });
      }
    }

    // 🔥 camelCase → snake_case MAPPING
    const updatePayload: any = {
      updated_at: new Date(),
    };
    
    if (validatedData.questionTemplateId !== undefined) updatePayload.question_template_id = validatedData.questionTemplateId;
    if (validatedData.protocolTemplateId !== undefined) updatePayload.protocol_template_id = validatedData.protocolTemplateId;
    if (validatedData.notes !== undefined) updatePayload.notes = validatedData.notes;

    const [updated] = await db
      .update(liftTemplateMappings)
      .set(updatePayload)
      .where(eq(liftTemplateMappings.id, id))
      .returning();

    res.json({
      success: true,
      message: "Mapping updated successfully",
      data: updated,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors.map((e) => `${e.path.join(".")}: ${e.message}`),
      });
    }

    console.error("Error updating lift mapping:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update lift mapping",
    });
  }
});

/* =============================================================================
   POST /lift-mappings/:id/activate
   🔥 PREFIX JAVÍTVA
   🔥 AUTH HOZZÁADVA
   ========================================================================== */
router.post("/lift-mappings/:id/activate", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await db
      .select()
      .from(liftTemplateMappings)
      .where(eq(liftTemplateMappings.id, id));

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Mapping not found",
      });
    }

    await db
      .update(liftTemplateMappings)
      .set({ is_active: false, updated_at: new Date() })
      .where(
        and(
          eq(liftTemplateMappings.lift_subtype_id, existing.lift_subtype_id),
          eq(liftTemplateMappings.is_active, true)
        )
      );

    const [activated] = await db
      .update(liftTemplateMappings)
      .set({ is_active: true, updated_at: new Date() })
      .where(eq(liftTemplateMappings.id, id))
      .returning();

    res.json({
      success: true,
      message: "Mapping activated successfully",
      data: activated,
    });
  } catch (error) {
    console.error("Error activating mapping:", error);
    res.status(500).json({
      success: false,
      message: "Failed to activate mapping",
    });
  }
});

/* =============================================================================
   POST /lift-mappings/:id/deactivate
   🔥 PREFIX JAVÍTVA
   🔥 AUTH HOZZÁADVA
   ========================================================================== */
router.post("/lift-mappings/:id/deactivate", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await db
      .select()
      .from(liftTemplateMappings)
      .where(eq(liftTemplateMappings.id, id));

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Mapping not found",
      });
    }

    const [deactivated] = await db
      .update(liftTemplateMappings)
      .set({ is_active: false, updated_at: new Date() })
      .where(eq(liftTemplateMappings.id, id))
      .returning();

    res.json({
      success: true,
      message: "Mapping deactivated successfully",
      data: deactivated,
    });
  } catch (error) {
    console.error("Error deactivating mapping:", error);
    res.status(500).json({
      success: false,
      message: "Failed to deactivate mapping",
    });
  }
});

/* =============================================================================
   DELETE /lift-mappings/:id
   🔥 PREFIX JAVÍTVA
   🔥 AUTH HOZZÁADVA
   ========================================================================== */
router.delete("/lift-mappings/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await db
      .select()
      .from(liftTemplateMappings)
      .where(eq(liftTemplateMappings.id, id));

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Mapping not found",
      });
    }

    await db.delete(liftTemplateMappings).where(eq(liftTemplateMappings.id, id));

    res.json({
      success: true,
      message: "Mapping deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting mapping:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete lift mapping",
    });
  }
});

export default router;