// src/services/niedervolt-service.ts

import { storage } from "../storage.js";
// Az XLSX import már nem szükséges, mivel nincs több Excel feldolgozás
// import * as XLSX from 'xlsx';

// Bővített hardcoded devices - 20 lift specifikus eszköz
const FALLBACK_GERMAN_DEVICES = [
  { id: 'device-1', name: 'Antriebsmotor' },
  { id: 'device-2', name: 'Türantriebsmotor' },
  { id: 'device-3', name: 'Lüfter' },
  { id: 'device-4', name: 'Beleuchtung Kabine' },
  { id: 'device-5', name: 'Beleuchtung Schacht' },
  { id: 'device-6', name: 'Notruf' },
  { id: 'device-7', name: 'Steuerung' },
  { id: 'device-8', name: 'Schützsteuerung' },
  { id: 'device-9', name: 'Frequenzumrichter' },
  { id: 'device-10', name: 'Bremse' },
  { id: 'device-11', name: 'Encoder' },
  { id: 'device-12', name: 'Sicherheitskette' },
  { id: 'device-13', name: 'Netzanschluss' },
  // Új eszközök hozzáadása
  { id: 'device-14', name: 'Positionssensor' },
  { id: 'device-15', name: 'Übergeschwindigkeitsregler' },
  { id: 'device-16', name: 'Fangvorrichtung' },
  { id: 'device-17', name: 'Türkontakte' },
  { id: 'device-18', name: 'Schachtkopfschalter' },
  { id: 'device-19', name: 'Pufferkontakte' },
  { id: 'device-20', name: 'Spannungsüberwachung' }
];

const FALLBACK_HUNGARIAN_DEVICES = [
  { id: 'device-1', name: 'Motor vagy vezérlés' },
  { id: 'device-2', name: 'Ajtó motor' },
  { id: 'device-3', name: 'Ventilátor' },
  { id: 'device-4', name: 'Kabin világítás' },
  { id: 'device-5', name: 'Akna világítás' },
  { id: 'device-6', name: 'Vészhívó' },
  { id: 'device-7', name: 'Vezérlés' },
  { id: 'device-8', name: 'Kontaktor vezérlés' },
  { id: 'device-9', name: 'Frekvenciaváltó' },
  { id: 'device-10', name: 'Fék' },
  { id: 'device-11', name: 'Enkóder' },
  { id: 'device-12', name: 'Biztonsági lánc' },
  { id: 'device-13', name: 'Hálózati csatlakozás' },
  // Új eszközök magyar megfelelői
  { id: 'device-14', name: 'Pozíció érzékelő' },
  { id: 'device-15', name: 'Túlsebesség szabályozó' },
  { id: 'device-16', name: 'Felfogó berendezés' },
  { id: 'device-17', name: 'Ajtó kontaktok' },
  { id: 'device-18', name: 'Aknafej kapcsoló' },
  { id: 'device-19', name: 'Ütköző kontaktok' },
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
    // Mindig és kizárólag a hardcoded eszközöket adjuk vissza.
    // A try-catch blokk is felesleges, de a biztonság kedvéért maradhat.
    try {
        return this.getHardcodedDevices();
    } catch (error) {
        console.error('⚠️ Critical error in getHardcodedDevices, returning empty array:', error);
        return [];
    }
  }

  /**
   * Az Excel sablonból olvasó metódus teljes egészében eltávolításra került,
   * hogy a jövőben se okozzon problémát.
   */

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

  /**
   * Get dropdown options (these remain hardcoded for consistency)
   */
  getDropdownOptions() {
    return {
      sicherung: ['6A', '10A', '13A', '16A', '20A', '25A', '32A', '40A', '50A', '63A'],
      ls: ['B6', 'B10', 'B13', 'B16', 'B20', 'B25', 'B32', 'C6', 'C10', 'C13', 'C16', 'C20', 'C25', 'C32'],
      fiTest: ['OK', 'NOK']
    };
  }
}

export const niedervoltService = new NiedervoltService();