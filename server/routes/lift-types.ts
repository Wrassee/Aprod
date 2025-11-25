// server/routes/lift-types.ts - TELJES JAVÍTOTT VERZIÓ
import { Router } from "express";
import { z } from "zod";
import { db, liftTypes, liftSubtypes } from "../db.js";
import { eq, asc } from "drizzle-orm"; // 🔥 asc HOZZÁADVA
import { requireAuth, requireAdmin } from "../middleware/auth.js"; // 🔥 AUTH HOZZÁADVA

const router = Router();

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================
const createLiftTypeSchema = z.object({
  code: z.string().min(1).max(50).toUpperCase(),
  nameHu: z.string().min(1),
  nameDe: z.string().optional(),
  descriptionHu: z.string().optional(),
  descriptionDe: z.string().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

const updateLiftTypeSchema = createLiftTypeSchema.partial();

// =============================================================================
// GET /lift-types - List all lift types with subtypes
// 🔥 PREFIX JAVÍTVA: /api/admin ELTÁVOLÍTVA
// 🔥 AUTH HOZZÁADVA
// =============================================================================
router.get("/lift-types", requireAuth, requireAdmin, async (req, res) => {
  try {
    // 🔥 orderBy JAVÍTVA: asc() használata
    const types = await db
      .select()
      .from(liftTypes)
      .orderBy(asc(liftTypes.sort_order), asc(liftTypes.name_hu));

    // Fetch subtypes for each type
    const typesWithSubtypes = await Promise.all(
      types.map(async (type: any) => {
        // 🔥 orderBy JAVÍTVA + lift_type_id (snake_case)
        const subtypes = await db
          .select()
          .from(liftSubtypes)
          .where(eq(liftSubtypes.lift_type_id, type.id))
          .orderBy(asc(liftSubtypes.sort_order), asc(liftSubtypes.name_hu));

        return {
          ...type,
          subtypes,
        };
      })
    );

    res.json({
      success: true,
      data: typesWithSubtypes,
    });
  } catch (error) {
    console.error("Error fetching lift types:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch lift types",
    });
  }
});

// =============================================================================
// POST /lift-types - Create new lift type
// 🔥 PREFIX JAVÍTVA
// 🔥 AUTH HOZZÁADVA
// =============================================================================
router.post("/lift-types", requireAuth, requireAdmin, async (req, res) => {
  try {
    const validatedData = createLiftTypeSchema.parse(req.body);

    // Check if code already exists
    const existing = await db
      .select()
      .from(liftTypes)
      .where(eq(liftTypes.code, validatedData.code));

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Lift type with code '${validatedData.code}' already exists`,
      });
    }

    // 🔥 camelCase → snake_case MAPPING
    const [newType] = await db
      .insert(liftTypes)
      .values({
        code: validatedData.code,
        name_hu: validatedData.nameHu, // 🔥 JAVÍTVA
        name_de: validatedData.nameDe || null, // 🔥 JAVÍTVA
        description_hu: validatedData.descriptionHu || null, // 🔥 JAVÍTVA
        description_de: validatedData.descriptionDe || null, // 🔥 JAVÍTVA
        sort_order: validatedData.sortOrder || 0, // 🔥 JAVÍTVA
      })
      .returning();

    res.status(201).json({
      success: true,
      message: "Lift type created successfully",
      data: newType,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors.map((e) => e.message),
      });
    }

    console.error("Error creating lift type:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create lift type",
    });
  }
});

// =============================================================================
// PUT /lift-types/:id - Update lift type
// 🔥 PREFIX JAVÍTVA
// 🔥 AUTH HOZZÁADVA
// =============================================================================
router.put("/lift-types/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = updateLiftTypeSchema.parse(req.body);

    // Check if type exists
    const [existing] = await db
      .select()
      .from(liftTypes)
      .where(eq(liftTypes.id, id));

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Lift type not found",
      });
    }

    // If code is being updated, check for duplicates
    if (validatedData.code && validatedData.code !== existing.code) {
      const duplicate = await db
        .select()
        .from(liftTypes)
        .where(eq(liftTypes.code, validatedData.code));

      if (duplicate.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Lift type with code '${validatedData.code}' already exists`,
        });
      }
    }

    // 🔥 camelCase → snake_case MAPPING
    const updatePayload: any = {
      updated_at: new Date(),
    };
    
    if (validatedData.code !== undefined) updatePayload.code = validatedData.code;
    if (validatedData.nameHu !== undefined) updatePayload.name_hu = validatedData.nameHu;
    if (validatedData.nameDe !== undefined) updatePayload.name_de = validatedData.nameDe;
    if (validatedData.descriptionHu !== undefined) updatePayload.description_hu = validatedData.descriptionHu;
    if (validatedData.descriptionDe !== undefined) updatePayload.description_de = validatedData.descriptionDe;
    if (validatedData.sortOrder !== undefined) updatePayload.sort_order = validatedData.sortOrder;

    const [updated] = await db
      .update(liftTypes)
      .set(updatePayload)
      .where(eq(liftTypes.id, id))
      .returning();

    res.json({
      success: true,
      message: "Lift type updated successfully",
      data: updated,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors.map((e) => e.message),
      });
    }

    console.error("Error updating lift type:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update lift type",
    });
  }
});

// =============================================================================
// DELETE /lift-types/:id - Delete lift type (cascade subtypes)
// 🔥 PREFIX JAVÍTVA
// 🔥 AUTH HOZZÁADVA
// =============================================================================
router.delete("/lift-types/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if type exists
    const [existing] = await db
      .select()
      .from(liftTypes)
      .where(eq(liftTypes.id, id));

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Lift type not found",
      });
    }

    // Check if type has subtypes (will be cascade deleted)
    const subtypes = await db
      .select()
      .from(liftSubtypes)
      .where(eq(liftSubtypes.lift_type_id, id)); // 🔥 JAVÍTVA: snake_case

    await db.delete(liftTypes).where(eq(liftTypes.id, id));

    res.json({
      success: true,
      message: `Lift type deleted successfully (${subtypes.length} subtypes also removed)`,
    });
  } catch (error) {
    console.error("Error deleting lift type:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete lift type",
    });
  }
});

// =============================================================================
// PATCH /lift-types/:id/toggle - Toggle active status
// 🔥 PREFIX JAVÍTVA
// 🔥 AUTH HOZZÁADVA
// =============================================================================
router.patch("/lift-types/:id/toggle", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await db
      .select()
      .from(liftTypes)
      .where(eq(liftTypes.id, id));

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Lift type not found",
      });
    }

    const [updated] = await db
      .update(liftTypes)
      .set({
        is_active: !existing.is_active, // 🔥 JAVÍTVA: snake_case
        updated_at: new Date(), // 🔥 JAVÍTVA: snake_case
      })
      .where(eq(liftTypes.id, id))
      .returning();

    res.json({
      success: true,
      message: `Lift type ${updated.is_active ? "activated" : "deactivated"}`,
      data: updated,
    });
  } catch (error) {
    console.error("Error toggling lift type:", error);
    res.status(500).json({
      success: false,
      message: "Failed to toggle lift type status",
    });
  }
});

export default router;