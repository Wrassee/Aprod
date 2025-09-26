// Excel író szolgáltatás - ExcelJS használatával, formázás megőrzés
import ExcelJS from 'exceljs';
import { CellWrite } from '../types/mapping';

interface ExcelWriteConfig {
  protocolBuffer: ArrayBuffer;
  writes: CellWrite[];
  preserveFormatting: boolean;
}

interface ExcelWriteResult {
  success: boolean;
  modifiedCells: number;
  buffer?: ArrayBuffer;
  errors?: string[];
}

class ExcelWriteService {
  /**
   * Otis protokoll frissítése cell mapping alapján
   * KRITIKUS: Csak cell.value módosítása, formázás megőrzése!
   */
  async writeToProtocol(config: ExcelWriteConfig): Promise<ExcelWriteResult> {
    try {
      console.log(`📝 Starting Excel write operation with ${config.writes.length} cells`);
      
      // ExcelJS Workbook létrehozása
      const workbook = new ExcelJS.Workbook();
      
      // Buffer betöltése (ArrayBuffer -> Buffer konverzió)
      const buffer = Buffer.from(config.protocolBuffer);
      await workbook.xlsx.load(buffer);
      
      const errors: string[] = [];
      let modifiedCells = 0;
      
      // Minden write művelet végrehajtása
      for (const write of config.writes) {
        try {
          const result = await this.updateCellValue(workbook, write);
          if (result.success) {
            modifiedCells++;
            console.log(`✅ Updated cell ${write.cellReference}: "${write.value}"`);
          } else {
            errors.push(`Cell ${write.cellReference}: ${result.error}`);
            console.warn(`⚠️ Failed to update ${write.cellReference}: ${result.error}`);
          }
        } catch (cellError) {
          const errorMsg = `Cell ${write.cellReference}: ${cellError}`;
          errors.push(errorMsg);
          console.error(`❌ Error updating cell:`, cellError);
        }
      }
      
      // Frissített Excel buffer generálása
      const outputBuffer = await workbook.xlsx.writeBuffer();
      
      console.log(`✅ Excel write completed: ${modifiedCells}/${config.writes.length} cells modified`);
      
      // Node.js Buffer -> ArrayBuffer konverzió
      const nodeBuffer = outputBuffer as Buffer;
      const arrayBuffer = nodeBuffer.buffer.slice(
        nodeBuffer.byteOffset, 
        nodeBuffer.byteOffset + nodeBuffer.byteLength
      ) as ArrayBuffer;
      
      return {
        success: modifiedCells > 0,
        modifiedCells,
        buffer: arrayBuffer,
        errors: errors.length > 0 ? errors : undefined
      };
      
    } catch (error) {
      console.error('❌ Excel write service error:', error);
      return {
        success: false,
        modifiedCells: 0,
        errors: [`Excel write hiba: ${error}`]
      };
    }
  }

  /**
   * Egyetlen cella értékének frissítése
   * KRITIKUS: Csak value módosítása, style/format érintetlen!
   */
  private async updateCellValue(
    workbook: ExcelJS.Workbook, 
    write: CellWrite
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Munkalap megkeresése
      const worksheet = this.findWorksheet(workbook, write.sheetName);
      if (!worksheet) {
        return { 
          success: false, 
          error: `Munkalap nem található: ${write.sheetName || 'default'}` 
        };
      }
      
      // Cellahivatkozás validálása
      if (!this.validateCellReference(write.cellReference)) {
        return { 
          success: false, 
          error: `Érvénytelen cellahivatkozás: ${write.cellReference}` 
        };
      }
      
      // Cella megszerzése vagy létrehozása
      const cell = worksheet.getCell(write.cellReference);
      
      // KRITIKUS: Csak az érték módosítása!
      if (write.value === null || write.value === '') {
        cell.value = null; // Üres cella
      } else if (typeof write.value === 'number') {
        cell.value = write.value; // Számérték
      } else {
        cell.value = String(write.value); // Szövegérték
      }
      
      // TILOS: cell.style, cell.numFmt, cell.border módosítása!
      // A formázás automatikusan megmarad az ExcelJS-ben
      
      return { success: true };
      
    } catch (error) {
      return { 
        success: false, 
        error: `Cella frissítési hiba: ${error}` 
      };
    }
  }

  /**
   * Munkalap megkeresése név alapján
   */
  private findWorksheet(workbook: ExcelJS.Workbook, sheetName?: string): ExcelJS.Worksheet | null {
    if (!sheetName) {
      // Ha nincs megadva, az első munkalapot használjuk
      return workbook.worksheets[0] || null;
    }
    
    // Név alapján keresés
    const worksheet = workbook.getWorksheet(sheetName);
    return worksheet || null;
  }

  /**
   * Cellahivatkozás validálása (A1, B166, CZ999)
   */
  private validateCellReference(cellRef: string): boolean {
    if (!cellRef || typeof cellRef !== 'string') {
      return false;
    }
    
    // Excel cellahivatkozás pattern: A1, AB123, CZZ9999
    const pattern = /^[A-Z]{1,3}[1-9]\d*$/;
    return pattern.test(cellRef.toUpperCase());
  }

  /**
   * Excel fájl formátum ellenőrzése
   */
  async validateExcelFile(buffer: ArrayBuffer): Promise<{ valid: boolean; error?: string }> {
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(Buffer.from(buffer));
      
      if (workbook.worksheets.length === 0) {
        return { valid: false, error: 'Excel fájl nem tartalmaz munkalapokat' };
      }
      
      return { valid: true };
      
    } catch (error) {
      return { 
        valid: false, 
        error: `Excel fájl validálási hiba: ${error}` 
      };
    }
  }

  /**
   * Cellák batch frissítése optimalizált módon
   */
  async batchUpdateCells(
    protocolBuffer: ArrayBuffer,
    cellWrites: CellWrite[]
  ): Promise<ExcelWriteResult> {
    // Csoportosítás munkalap szerint az optimalizáláshoz
    const writesBySheet = new Map<string, CellWrite[]>();
    
    cellWrites.forEach(write => {
      const sheetName = write.sheetName || 'default';
      if (!writesBySheet.has(sheetName)) {
        writesBySheet.set(sheetName, []);
      }
      writesBySheet.get(sheetName)!.push(write);
    });
    
    console.log(`📊 Batch update: ${cellWrites.length} cells across ${writesBySheet.size} sheets`);
    
    return this.writeToProtocol({
      protocolBuffer,
      writes: cellWrites,
      preserveFormatting: true
    });
  }
}

// Singleton instance export
export const excelWriteService = new ExcelWriteService();