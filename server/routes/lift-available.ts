import { Router } from "express";
import { db, liftTypes, liftSubtypes, liftTemplateMappings, templates } from "../db.js";
import { eq, and } from "drizzle-orm";

const router = Router();

// =============================================================================
// GET /api/lifts/available - Public endpoint for lift type selection
// =============================================================================
router.get("/api/lifts/available", async (req, res) => {
  try {
    // Fetch all active lift types
    const activeTypes = await db
      .select()
      .from(liftTypes)
      .where(eq(liftTypes.is_active, true))
      .orderBy(liftTypes.sort_order, liftTypes.name_hu);

    // Build response with subtypes and mappings
    const liftTypesWithData = await Promise.all(
      activeTypes.map(async (type: any) => {
        // Get active subtypes for this type
        const subtypes = await db
          .select()
          .from(liftSubtypes)
          .where(
            and(
              eq(liftSubtypes.lift_type_id, type.id),
              eq(liftSubtypes.is_active, true)
            )
          )
          .orderBy(liftSubtypes.sort_order, liftSubtypes.name_hu);

        // For each subtype, get active mapping with template details
        const subtypesWithMappings = await Promise.all(
          subtypes.map(async (subtype: any) => {
            // Get active mapping
            const [mapping] = await db
              .select()
              .from(liftTemplateMappings)
              .where(
                and(
                  eq(liftTemplateMappings.lift_subtype_id, subtype.id),
                  eq(liftTemplateMappings.is_active, true)
                )
              );

            if (!mapping) {
              return {
                ...subtype,
                mapping: null,
              };
            }

            // Fetch question template if exists
            const [questionTemplate] = mapping.question_template_id
              ? await db
                  .select({
                    id: templates.id,
                    name: templates.name,
                    type: templates.type,
                    language: templates.language,
                    is_active: templates.is_active,
                  })
                  .from(templates)
                  .where(eq(templates.id, mapping.question_template_id))
              : [null];

            // Fetch protocol template if exists
            const [protocolTemplate] = mapping.protocol_template_id
              ? await db
                  .select({
                    id: templates.id,
                    name: templates.name,
                    type: templates.type,
                    language: templates.language,
                    is_active: templates.is_active,
                  })
                  .from(templates)
                  .where(eq(templates.id, mapping.protocol_template_id))
              : [null];

            return {
              id: subtype.id,
              code: subtype.code,
              name_hu: subtype.name_hu,
              name_de: subtype.name_de,
              description_hu: subtype.description_hu,
              description_de: subtype.description_de,
              sort_order: subtype.sort_order,
              mapping: {
                id: mapping.id,
                question_template: questionTemplate,
                protocol_template: protocolTemplate,
                notes: mapping.notes,
              },
            };
          })
        );

        return {
          id: type.id,
          code: type.code,
          name_hu: type.name_hu,
          name_de: type.name_de,
          description_hu: type.description_hu,
          description_de: type.description_de,
          sort_order: type.sort_order,
          subtypes: subtypesWithMappings,
        };
      })
    );

    res.json({
      success: true,
      data: {
        liftTypes: liftTypesWithData,
      },
    });
  } catch (error) {
    console.error("Error fetching available lifts:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch available lift types",
    });
  }
});

// =============================================================================
// GET /api/lifts/mapping/:subtypeId - Get mapping for specific subtype
// =============================================================================
router.get("/api/lifts/mapping/:subtypeId", async (req, res) => {
  try {
    const { subtypeId } = req.params;

    // Get active mapping for this subtype
    const [mapping] = await db
      .select()
      .from(liftTemplateMappings)
      .where(
        and(
          eq(liftTemplateMappings.lift_subtype_id, subtypeId),
          eq(liftTemplateMappings.is_active, true)
        )
      );

    if (!mapping) {
      return res.status(404).json({
        success: false,
        message: "No active mapping found for this subtype",
      });
    }

    // Fetch templates
    const [questionTemplate] = mapping.question_template_id
      ? await db
          .select()
          .from(templates)
          .where(eq(templates.id, mapping.question_template_id))
      : [null];

    const [protocolTemplate] = mapping.protocol_template_id
      ? await db
          .select()
          .from(templates)
          .where(eq(templates.id, mapping.protocol_template_id))
      : [null];

    res.json({
      success: true,
      data: {
        mapping: {
          id: mapping.id,
          lift_subtype_id: mapping.lift_subtype_id,
          question_template: questionTemplate,
          protocol_template: protocolTemplate,
          is_active: mapping.is_active,
          notes: mapping.notes,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching lift mapping:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch lift mapping",
    });
  }
});

export default router;