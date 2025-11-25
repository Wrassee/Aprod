// server/routes/lift-subtypes.ts - TELJES JAVÍTOTT VERZIÓ
import { Router } from "express";
import { z } from "zod";
import { db, liftTypes, liftSubtypes } from "../db.js";
import { eq, and, asc } from "drizzle-orm"; // 🔥 asc HOZZÁADVA
import { requireAuth, requireAdmin } from "../middleware/auth.js"; // 🔥 AUTH HOZZÁADVA

const router = Router();

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================
const createLiftSubtypeSchema = z.object({
  liftTypeId: z.string().uuid(),
  code: z.string().min(1).max(50).toUpperCase(),
  nameHu: z.string().min(1),
  nameDe: z.string().optional(),
  descriptionHu: z.string().optional(),
  descriptionDe: z.string().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

const updateLiftSubtypeSchema = createLiftSubtypeSchema.partial().omit({ liftTypeId: true });

// =============================================================================
// GET /lift-subtypes - List all subtypes (optionally filtered)
// 🔥 PREFIX JAVÍTVA
// 🔥 AUTH HOZZÁADVA
// =============================================================================
router.get("/lift-subtypes", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { liftTypeId } = req.query;

    let query = db.select().from(liftSubtypes);

    // Filter by lift type if provided
    if (liftTypeId && typeof liftTypeId === "string") {
      query = query.where(eq(liftSubtypes.lift_type_id, liftTypeId)); // 🔥 JAVÍTVA: snake_case
    }

    // 🔥 orderBy JAVÍTVA: asc() + snake_case
    const subtypes = await query.orderBy(
      asc(liftSubtypes.sort_order),
      asc(liftSubtypes.name_hu)
    );

    res.json({
      success: true,
      data: subtypes,
    });
  } catch (error) {
    console.error("Error fetching lift subtypes:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch lift subtypes",
    });
  }
});

// =============================================================================
// POST /lift-subtypes - Create new subtype
// 🔥 PREFIX JAVÍTVA
// 🔥 AUTH HOZZÁADVA
// =============================================================================
router.post("/lift-subtypes", requireAuth, requireAdmin, async (req, res) => {
  try {
    const validatedData = createLiftSubtypeSchema.parse(req.body);

    // Check if parent lift type exists
    const [parentType] = await db
      .select()
      .from(liftTypes)
      .where(eq(liftTypes.id, validatedData.liftTypeId));

    if (!parentType) {
      return res.status(404).json({
        success: false,
        message: "Parent lift type not found",
      });
    }

    // Check if code already exists within this lift type
    const existing = await db
      .select()
      .from(liftSubtypes)
      .where(
        and(
          eq(liftSubtypes.lift_type_id, validatedData.liftTypeId), // 🔥 JAVÍTVA: snake_case
          eq(liftSubtypes.code, validatedData.code)
        )
      );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Subtype with code '${validatedData.code}' already exists for this lift type`,
      });
    }

    // 🔥 camelCase → snake_case MAPPING
    const [newSubtype] = await db
      .insert(liftSubtypes)
      .values({
        lift_type_id: validatedData.liftTypeId, // 🔥 JAVÍTVA
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
      message: "Lift subtype created successfully",
      data: newSubtype,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors.map((e) => `${e.path.join(".")}: ${e.message}`),
      });
    }

    console.error("Error creating lift subtype:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create lift subtype",
    });
  }
});

// =============================================================================
// PUT /lift-subtypes/:id - Update subtype
// 🔥 PREFIX JAVÍTVA
// 🔥 AUTH HOZZÁADVA
// =============================================================================
router.put("/lift-subtypes/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = updateLiftSubtypeSchema.parse(req.body);

    // Check if subtype exists
    const [existing] = await db
      .select()
      .from(liftSubtypes)
      .where(eq(liftSubtypes.id, id));

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Lift subtype not found",
      });
    }

    // If code is being updated, check for duplicates within same lift type
    if (validatedData.code && validatedData.code !== existing.code) {
      const duplicate = await db
        .select()
        .from(liftSubtypes)
        .where(
          and(
            eq(liftSubtypes.lift_type_id, existing.lift_type_id), // 🔥 JAVÍTVA: snake_case
            eq(liftSubtypes.code, validatedData.code)
          )
        );

      if (duplicate.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Subtype with code '${validatedData.code}' already exists for this lift type`,
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
      .update(liftSubtypes)
      .set(updatePayload)
      .where(eq(liftSubtypes.id, id))
      .returning();

    res.json({
      success: true,
      message: "Lift subtype updated successfully",
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

    console.error("Error updating lift subtype:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update lift subtype",
    });
  }
});

// =============================================================================
// DELETE /lift-subtypes/:id - Delete subtype (cascade mappings)
// 🔥 PREFIX JAVÍTVA
// 🔥 AUTH HOZZÁADVA
// =============================================================================
router.delete("/lift-subtypes/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if subtype exists
    const [existing] = await db
      .select()
      .from(liftSubtypes)
      .where(eq(liftSubtypes.id, id));

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Lift subtype not found",
      });
    }

    await db.delete(liftSubtypes).where(eq(liftSubtypes.id, id));

    res.json({
      success: true,
      message: "Lift subtype deleted successfully (associated mappings also removed)",
    });
  } catch (error) {
    console.error("Error deleting lift subtype:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete lift subtype",
    });
  }
});

// =============================================================================
// PATCH /lift-subtypes/:id/toggle - Toggle active status
// 🔥 PREFIX JAVÍTVA
// 🔥 AUTH HOZZÁADVA
// =============================================================================
router.patch("/lift-subtypes/:id/toggle", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await db
      .select()
      .from(liftSubtypes)
      .where(eq(liftSubtypes.id, id));

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Lift subtype not found",
      });
    }

    const [updated] = await db
      .update(liftSubtypes)
      .set({
        is_active: !existing.is_active, // 🔥 JAVÍTVA: snake_case
        updated_at: new Date(), // 🔥 JAVÍTVA: snake_case
      })
      .where(eq(liftSubtypes.id, id))
      .returning();

    res.json({
      success: true,
      message: `Lift subtype ${updated.is_active ? "activated" : "deactivated"}`,
      data: updated,
    });
  } catch (error) {
    console.error("Error toggling lift subtype:", error);
    res.status(500).json({
      success: false,
      message: "Failed to toggle lift subtype status",
    });
  }
});

export default router;