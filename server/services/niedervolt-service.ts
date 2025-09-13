// src/services/niedervolt-service.ts

import { storage } from "../storage.js";

// Bővített hardcoded devices - 20 lift specifikus eszköz
const FALLBACK_GERMAN_DEVICES = [
  { id: 'device-1', name: 'Antriebsmotor' },
  { id: 'device-2', name: 'Türantriebsmotor 1' },
  { id: 'device-3', name: 'Schachtsteckdose' },
  { id: 'device-4', name: 'Beleuchtung Kabine' },
  { id: 'device-5', name: 'Beleuchtung Schacht' },
  { id: 'device-6', name: 'Steckdose Maschinenraum' },
  { id: 'device-7', name: 'Weitestentfernter Sicherheitskontakt' },
  { id: 'device-8', name: 'Türantriebsmotor 2' },
  { id: 'device-9', name: 'Fotozelle' },
  { id: 'device-10', name: 'Motorgest. Ventil (hydr.)' },
  { id: 'device-11', name: 'Ventillator' },
  { id: 'device-12', name: 'Steckdose' },
  { id: 'device-13', name: 'Netzanschluss' },
  // Új eszközök hozzáadása
  { id: 'device-14', name: 'Steuerung' },
  { id: 'device-15', name: 'Frequenzumrichter' },
  { id: 'device-16', name: 'Bündigstellungsmotor' },
  { id: 'device-17', name: 'Türkontakte' },
  { id: 'device-18', name: 'Schachtkopfschalter' },
  { id: 'device-19', name: 'Pufferkontakte' },
  { id: 'device-20', name: 'Spannungsüberwachung' }
];

const FALLBACK_HUNGARIAN_DEVICES = [
  { id: 'device-1', name: 'Motor vagy vezérlés' },
  { id: 'device-2', name: 'Ajtó motor' },
  { id: 'device-3', name: 'Konektor az aknában' },
  { id: 'device-4', name: 'Kabin világítás' },
  { id: 'device-5', name: 'Akna világítás' },
  { id: 'device-6', name: 'Konektor a gépházban' },
  { id: 'device-7', name: 'Legtávolabbi biztonságikör pontja' },
  { id: 'device-8', name: 'Ajtó motor 2' },
  { id: 'device-9', name: 'Fénykapu' },
  { id: 'device-10', name: 'Motorszabályozott szelep (hidraulika)' },
  { id: 'device-11', name: 'Ventillátor' },
  { id: 'device-12', name: 'Konektor' },
  { id: 'device-13', name: 'Hálózati csatlakozás' },
  // Új eszközök magyar megfelelői
  { id: 'device-14', name: 'Vezérlés' },
  { id: 'device-15', name: 'Frekvenciaváltó' },
  { id: 'device-16', name: 'Szintbeállító motor' },
  { id: 'device-17', name: 'Ajtó kontaktok' },
  { id: 'device-18', name: 'Aknafej kapcsoló' },
  { id: 'device-19', name: 'Puffer kontaktok' },
  { id: 'device-20', name: 'Feszültség felügyelet' }
];

export interface NiedervoltDevice {
  id: string;
  name: {
    de: string;
    hu: string;
  };
}

export class NiedervoltService {
  
  /**
   * Get niedervolt devices - EGYSZERŰSÍTETT: csak hardcoded lista
   */
  async getNiedervoltDevices(): Promise<NiedervoltDevice[]> {
    console.log('📋 Loading hardcoded niedervolt devices (template search disabled)');
    try {
        return this.getHardcodedDevices();
    } catch (error) {
        console.error('⚠️ Critical error in getHardcodedDevices, returning empty array:', error);
        return [];
    }
  }

  /**
   * Get hardcoded devices - BŐVÍTETT LISTA
   */
  private getHardcodedDevices(): NiedervoltDevice[] {
    console.log(`✅ Using ${FALLBACK_GERMAN_DEVICES.length} hardcoded niedervolt devices`);
    
    return FALLBACK_GERMAN_DEVICES.map((germanDevice, index) => ({
      id: germanDevice.id,
      name: {
        de: germanDevice.name,
        hu: FALLBACK_HUNGARIAN_DEVICES[index]?.name || germanDevice.name
      }
    }));
  }

  // ====================================================================
  // === MÓDOSÍTÁS KEZDETE ===
  // ====================================================================
  /**
   * Get dropdown options (these remain hardcoded for consistency)
   */
  getDropdownOptions() {
    return {
      biztositek: ['6A', '10A', '13A', '16A', '20A', '25A', '32A', '40A', '50A', '63A'],
      kismegszakito: ['B6', 'B10', 'B13', 'B16', 'B20', 'B25', 'B32', 'C6', 'C10', 'C13', 'C16', 'C20', 'C25', 'C32'],
      fiTest: ['OK', 'NOK']
    };
  }
  // ====================================================================
  // === MÓDOSÍTÁS VÉGE ===
  // ====================================================================
}

export const niedervoltService = new NiedervoltService();