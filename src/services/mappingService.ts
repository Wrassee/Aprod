// Template mapping szolgáltatás
import { CellMapping } from '@/types/mapping';

class MappingService {
  private mappingCache: Map<string, CellMapping[]> = new Map();

  /**
   * Betölti a template mapping-et a template fájlból
   */
  async loadTemplateMapping(templateId: string): Promise<CellMapping[]> {
    // Cache-ből próbáljuk betölteni
    if (this.mappingCache.has(templateId)) {
      return this.mappingCache.get(templateId)!;
    }

    try {
      const response = await fetch(`/api/templates/${templateId}/mapping`);
      if (!response.ok) {
        throw new Error(`Failed to load mapping: ${response.statusText}`);
      }

      const mappings: CellMapping[] = await response.json();
      
      // Validáljuk a cellahivatkozásokat
      const validMappings = mappings.filter(mapping => 
        this.validateCellReference(mapping.cellReference)
      );

      // Cache-eljük a betöltött mapping-et
      this.mappingCache.set(templateId, validMappings);
      
      console.log(`📋 Loaded ${validMappings.length} valid cell mappings for template ${templateId}`);
      return validMappings;

    } catch (error) {
      console.error('Error loading template mapping:', error);
      throw new Error(`Template mapping betöltése sikertelen: ${error}`);
    }
  }

  /**
   * Excel mappingot parse-ol egy template buffer-ből (Mapping munkalap)
   */
  async parseExcelMapping(buffer: ArrayBuffer): Promise<CellMapping[]> {
    try {
      // Itt használnánk az ExcelJS library-t a Mapping munkalap beolvasásához
      // Jelenleg placeholder implementáció
      const mappings: CellMapping[] = [];
      
      // TODO: ExcelJS implementáció a Mapping munkalap beolvasásához
      // - Keresni a "Mapping" vagy "CellMap" nevű munkalapot
      // - A oszlop: questionId, B oszlop: cellReference
      
      console.log(`📋 Parsed ${mappings.length} mappings from Excel buffer`);
      return mappings;

    } catch (error) {
      console.error('Error parsing Excel mapping:', error);
      throw new Error(`Excel mapping parse hiba: ${error}`);
    }
  }

  /**
   * Cellahivatkozás validálása (pl. A1, B166, CZ999)
   */
  validateCellReference(cellRef: string): boolean {
    if (!cellRef || typeof cellRef !== 'string') {
      return false;
    }

    // Excel cellahivatkozás pattern: A1, AB123, CZZ9999
    const pattern = /^[A-Z]{1,3}[1-9]\d*$/;
    return pattern.test(cellRef.toUpperCase());
  }

  /**
   * Niedervolt specifikus question ID generálás
   */
  generateNiedervoltQuestionId(row: number, field: string): string {
    return `Q_NID_${row}_${field}`;
  }

  /**
   * Niedervollt mérések Otis protokollba írása (kliens oldali API)
   */
  async mapToOtisProtocol(request: {
    protocolId: string;
    niedervoltData: Array<{
      deviceId: string;
      deviceName: string;
      measurements: Record<string, any>;
    }>;
    receptionDate: string;
  }): Promise<{
    success: boolean;
    modifiedCells: number;
    errors?: string[];
    missingMappings?: string[];
  }> {
    console.log('🔌 Mapping API call:', request);
    
    // Dynamically import apiRequest to avoid circular deps
    const { apiRequest } = await import('@/lib/queryClient');
    
    // Niedervolt adatok átalakítása write struktúrára
    const writes = request.niedervoltData.flatMap(({ deviceId, measurements }) => {
      return Object.entries(measurements).map(([field, value]) => ({
        questionId: `Q_NID_${deviceId}_${field}`,
        cellReference: `TBD_${deviceId}_${field}`, // Backend fogja feloldani a ténylegesen cell reference-t
        value: String(value || '')
      }));
    });
    
    // API hívás backend-hez
    const response = await apiRequest(`/api/protocols/write-mapping`, {
      method: 'POST',
      body: JSON.stringify({
        protocolId: request.protocolId,
        writes
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // Backend response -> frontend response átalakítás
    return {
      success: response.success || false,
      modifiedCells: response.writtenCells || response.modifiedCells || 0,
      errors: response.errors,
      missingMappings: response.missingMappings
    };
  }

  /**
   * Mapping cache törlése
   */
  clearCache(): void {
    this.mappingCache.clear();
  }
}

// Singleton instance
export const mappingService = new MappingService();