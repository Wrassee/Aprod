/**
 * Centralized filename correction utilities for handling corrupt character encodings
 * in Supabase storage operations (download, delete, etc.)
 */

export interface FilenameStrategy {
  path: string;
  description: string;
}

/**
 * Generates multiple filename correction strategies for handling corrupt encoding
 * Common issue: "KÃÂ©rdÃÂ©ssor" (double-encoded UTF-8) -> "Kérdéssor" (correct)
 */
export function generateFilenameStrategies(originalPath: string): FilenameStrategy[] {
  return [
    // 1. Eredeti fájlnév (lehet, hogy nem korrupt)
    { path: originalPath, description: "original path" },
    
    // 2. URL encoded verzió
    { 
      path: originalPath.split('/').map((part: string) => encodeURIComponent(part)).join('/'), 
      description: "URL encoded path" 
    },
    
    // 3. Dupla UTF-8 encoding javítás (KÃÂ©rdÃÂ©ssor -> Kérdéssor)
    { 
      path: fixDoubleEncodedUTF8(originalPath), 
      description: "UTF-8 double-encoding fixed" 
    },
    
    // 4. ASCII-safe verzió (ékezetek eltávolítása)
    { 
      path: toASCIISafe(originalPath), 
      description: "ASCII-safe path" 
    },
    
    // 5. Tiszta ASCII csak (minden nem-ASCII karakter eltávolítása)
    { 
      path: originalPath.replace(/[^\x00-\x7F]/g, ''), 
      description: "clean ASCII path" 
    }
  ];
}

/**
 * Fixes double-encoded UTF-8 strings (common in file upload corruptions)
 * Example: "KÃÂ©rdÃÂ©ssor" -> "Kérdéssor"
 */
function fixDoubleEncodedUTF8(text: string): string {
  return text
    // Fix common Hungarian characters
    .replace(/KÃÂ©rdÃÂ©ssor/g, 'Kérdéssor')
    .replace(/KÃ\x83Â©rdÃ\x83Â©ssor/g, 'Kérdéssor')
    // Fix other common double-encodings  
    .replace(/Ã¡/g, 'á')  // á
    .replace(/Ã©/g, 'é')  // é
    .replace(/Ã­/g, 'í')  // í
    .replace(/Ã³/g, 'ó')  // ó
    .replace(/Ãº/g, 'ú')  // ú
    .replace(/Ã¼/g, 'ü')  // ü
    .replace(/Ã¶/g, 'ö')  // ö
    .replace(/Å'/g, 'ő')  // ő
    .replace(/Å±/g, 'ű'); // ű
}

/**
 * Converts text to ASCII-safe version by replacing diacritics
 */
function toASCIISafe(text: string): string {
  return text
    .replace(/[áàâäã]/g, 'a')
    .replace(/[éèêë]/g, 'e') 
    .replace(/[íìîï]/g, 'i')
    .replace(/[óòôöõő]/g, 'o')
    .replace(/[úùûüűů]/g, 'u')
    .replace(/[ýÿ]/g, 'y')
    .replace(/[ć]/g, 'c')
    .replace(/[ď]/g, 'd')
    .replace(/[ň]/g, 'n')
    .replace(/[ř]/g, 'r')
    .replace(/[š]/g, 's')
    .replace(/[ť]/g, 't')
    .replace(/[ž]/g, 'z')
    .replace(/[ÁÀÂÄÃ]/g, 'A')
    .replace(/[ÉÈÊË]/g, 'E')
    .replace(/[ÍÌÎÏ]/g, 'I')
    .replace(/[ÓÒÔÖÕŐ]/g, 'O')
    .replace(/[ÚÙÛÜŰ]/g, 'U')
    .replace(/[ÝŸ]/g, 'Y')
    .replace(/[Ć]/g, 'C')
    .replace(/[Ď]/g, 'D')
    .replace(/[Ň]/g, 'N')
    .replace(/[Ř]/g, 'R')
    .replace(/[Š]/g, 'S')
    .replace(/[Ť]/g, 'T')
    .replace(/[Ž]/g, 'Z');
}

/**
 * Attempts multiple strategies for a Supabase operation (download, delete, etc.)
 * Returns the successful strategy result or throws the last error
 */
export async function executeWithFilenameStrategies<T>(
  originalPath: string,
  operation: (path: string) => Promise<T>,
  operationName: string = 'operation'
): Promise<{ result: T; strategy: FilenameStrategy }> {
  const strategies = generateFilenameStrategies(originalPath);
  let lastError: any;

  for (const strategy of strategies) {
    console.log(`🔄 Trying ${operationName} strategy: ${strategy.description} -> ${strategy.path}`);
    try {
      const result = await operation(strategy.path);
      console.log(`✅ ${operationName} successful with strategy: ${strategy.description}`);
      return { result, strategy };
    } catch (error: any) {
      console.log(`❌ ${operationName} strategy "${strategy.description}" failed:`, error?.message || error);
      lastError = error;
      continue;
    }
  }

  // Ha minden stratégia failelt
  console.error(`💥 ALL ${operationName} strategies failed for path: ${originalPath}. Last error:`, lastError);
  throw lastError;
}