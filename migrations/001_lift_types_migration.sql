-- Migration: Lift Types and Template Mapping System
-- Created: 2025-11-14
-- Description: Creates tables for lift type selection and template mapping

-- =============================================================================
-- 1. LIFT_TYPES TABLE - Main lift categories
-- =============================================================================
CREATE TABLE IF NOT EXISTS lift_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,              -- 'MOD', 'BEX', 'NEU', 'EGYEDI'
  name_hu TEXT NOT NULL,                  -- Hungarian name
  name_de TEXT,                           -- German name
  description_hu TEXT,                    -- Optional description (HU)
  description_de TEXT,                    -- Optional description (DE)
  sort_order INTEGER DEFAULT 0,           -- Display order
  is_active BOOLEAN DEFAULT true,         -- Enable/disable type
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for faster lookups
CREATE INDEX idx_lift_types_code ON lift_types(code);
CREATE INDEX idx_lift_types_active ON lift_types(is_active);

-- =============================================================================
-- 2. LIFT_SUBTYPES TABLE - Subcategories for each lift type
-- =============================================================================
CREATE TABLE IF NOT EXISTS lift_subtypes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lift_type_id UUID NOT NULL REFERENCES lift_types(id) ON DELETE CASCADE,
  code TEXT NOT NULL,                     -- 'MOD_DR', 'MOD_BELT', 'BEX_GEN2', etc.
  name_hu TEXT NOT NULL,                  -- Hungarian name
  name_de TEXT,                           -- German name
  description_hu TEXT,                    -- Optional description (HU)
  description_de TEXT,                    -- Optional description (DE)
  sort_order INTEGER DEFAULT 0,           -- Display order within type
  is_active BOOLEAN DEFAULT true,         -- Enable/disable subtype
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Ensure unique code within same lift type
  UNIQUE(lift_type_id, code)
);

-- Indexes for faster lookups
CREATE INDEX idx_lift_subtypes_type ON lift_subtypes(lift_type_id);
CREATE INDEX idx_lift_subtypes_code ON lift_subtypes(code);
CREATE INDEX idx_lift_subtypes_active ON lift_subtypes(is_active);

-- =============================================================================
-- 3. LIFT_TEMPLATE_MAPPINGS TABLE - Links subtypes to templates
-- =============================================================================
CREATE TABLE IF NOT EXISTS lift_template_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lift_subtype_id UUID NOT NULL REFERENCES lift_subtypes(id) ON DELETE CASCADE,
  question_template_id UUID REFERENCES templates(id) ON DELETE SET NULL,
  protocol_template_id UUID REFERENCES templates(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,         -- Only one active mapping per subtype
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by TEXT,                        -- Admin user who created mapping
  notes TEXT,                             -- Admin notes about this mapping
  
  -- Constraints
  CONSTRAINT check_templates_exist CHECK (
    question_template_id IS NOT NULL OR protocol_template_id IS NOT NULL
  )
);

-- Indexes for faster lookups
CREATE INDEX idx_mappings_subtype ON lift_template_mappings(lift_subtype_id);
CREATE INDEX idx_mappings_question ON lift_template_mappings(question_template_id);
CREATE INDEX idx_mappings_protocol ON lift_template_mappings(protocol_template_id);
CREATE INDEX idx_mappings_active ON lift_template_mappings(is_active);

-- Unique constraint: only one active mapping per subtype
CREATE UNIQUE INDEX idx_mappings_active_subtype 
  ON lift_template_mappings(lift_subtype_id) 
  WHERE is_active = true;

-- =============================================================================
-- 4. SEED DATA - Default lift types and subtypes
-- =============================================================================

-- Insert main lift types
INSERT INTO lift_types (code, name_hu, name_de, description_hu, description_de, sort_order) VALUES
  ('MOD', 'Modernizáció', 'Modernisierung', 'Meglévő lift korszerűsítése', 'Modernisierung eines bestehenden Aufzugs', 1),
  ('BEX', 'Teljes szanálás', 'BEX - Ersatz', 'Teljes liftkicserélés', 'Kompletter Austausch des Aufzugs', 2),
  ('NEU', 'Új építés', 'Neubau', 'Új lift telepítése', 'Installation eines neuen Aufzugs', 3),
  ('EGYEDI', 'Egyedi protokoll', 'Benutzerdefiniert', 'Egyedi, feltöltött protokoll', 'Benutzerdefiniertes Protokoll', 4)
ON CONFLICT (code) DO NOTHING;

-- Insert MOD (Modernization) subtypes
INSERT INTO lift_subtypes (lift_type_id, code, name_hu, name_de, sort_order)
SELECT 
  lt.id,
  subtype.code,
  subtype.name_hu,
  subtype.name_de,
  subtype.sort_order
FROM lift_types lt
CROSS JOIN (
  VALUES 
    ('MOD_SEIL', 'Drótköteles', 'Seilaufzug', 1),
    ('MOD_BELT', 'Hajtásszíjas', 'Riemenantrieb', 2),
    ('MOD_HYD', 'Hidraulikus', 'Hydraulisch', 3)
) AS subtype(code, name_hu, name_de, sort_order)
WHERE lt.code = 'MOD'
ON CONFLICT (lift_type_id, code) DO NOTHING;

-- Insert BEX (Complete renovation) subtypes
INSERT INTO lift_subtypes (lift_type_id, code, name_hu, name_de, sort_order)
SELECT 
  lt.id,
  subtype.code,
  subtype.name_hu,
  subtype.name_de,
  subtype.sort_order
FROM lift_types lt
CROSS JOIN (
  VALUES 
    ('BEX_GEN2', 'Gen2', 'Gen2', 1),
    ('BEX_GEN360', 'Gen360', 'Gen360', 2)
) AS subtype(code, name_hu, name_de, sort_order)
WHERE lt.code = 'BEX'
ON CONFLICT (lift_type_id, code) DO NOTHING;

-- Insert NEU (New installation) subtypes
INSERT INTO lift_subtypes (lift_type_id, code, name_hu, name_de, sort_order)
SELECT 
  lt.id,
  subtype.code,
  subtype.name_hu,
  subtype.name_de,
  subtype.sort_order
FROM lift_types lt
CROSS JOIN (
  VALUES 
    ('NEU_GEN2', 'Gen2', 'Gen2', 1),
    ('NEU_GEN360', 'Gen360', 'Gen360', 2)
) AS subtype(code, name_hu, name_de, sort_order)
WHERE lt.code = 'NEU'
ON CONFLICT (lift_type_id, code) DO NOTHING;

-- Insert EGYEDI (Custom) placeholder subtype
INSERT INTO lift_subtypes (lift_type_id, code, name_hu, name_de, sort_order)
SELECT 
  lt.id,
  'CUSTOM',
  'Egyedi protokoll',
  'Benutzerdefiniert',
  1
FROM lift_types lt
WHERE lt.code = 'EGYEDI'
ON CONFLICT (lift_type_id, code) DO NOTHING;

-- =============================================================================
-- 5. TRIGGER FOR UPDATED_AT TIMESTAMP
-- =============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for all tables
CREATE TRIGGER update_lift_types_updated_at
  BEFORE UPDATE ON lift_types
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lift_subtypes_updated_at
  BEFORE UPDATE ON lift_subtypes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lift_template_mappings_updated_at
  BEFORE UPDATE ON lift_template_mappings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 6. VIEWS FOR EASIER QUERYING
-- =============================================================================

-- View: Complete lift type hierarchy with active mappings
CREATE OR REPLACE VIEW v_lift_types_complete AS
SELECT 
  lt.id AS type_id,
  lt.code AS type_code,
  lt.name_hu AS type_name_hu,
  lt.name_de AS type_name_de,
  lt.sort_order AS type_sort_order,
  st.id AS subtype_id,
  st.code AS subtype_code,
  st.name_hu AS subtype_name_hu,
  st.name_de AS subtype_name_de,
  st.sort_order AS subtype_sort_order,
  m.id AS mapping_id,
  m.is_active AS mapping_active,
  qt.id AS question_template_id,
  qt.name AS question_template_name,
  qt.language AS question_template_language,
  pt.id AS protocol_template_id,
  pt.name AS protocol_template_name,
  pt.language AS protocol_template_language
FROM lift_types lt
LEFT JOIN lift_subtypes st ON st.lift_type_id = lt.id AND st.is_active = true
LEFT JOIN lift_template_mappings m ON m.lift_subtype_id = st.id AND m.is_active = true
LEFT JOIN templates qt ON qt.id = m.question_template_id
LEFT JOIN templates pt ON pt.id = m.protocol_template_id
WHERE lt.is_active = true
ORDER BY lt.sort_order, st.sort_order;

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================

-- Verification queries (optional, for testing)
-- SELECT * FROM lift_types;
-- SELECT * FROM lift_subtypes;
-- SELECT * FROM v_lift_types_complete;