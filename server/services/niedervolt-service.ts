// src/services/niedervolt-service.ts

import { storage } from "../storage.js";

// Bővített hardcoded devices - 20 lift specifikus eszköz (5 nyelvű támogatás)
const DEVICE_NAMES = {
  'device-1': {
    de: 'Antriebsmotor',
    hu: 'Motor vagy vezérlés',
    en: 'Drive Motor',
    fr: 'Moteur d\'entraînement',
    it: 'Motore di azionamento'
  },
  'device-2': {
    de: 'Türantriebsmotor 1',
    hu: 'Ajtó motor',
    en: 'Door Motor 1',
    fr: 'Moteur de porte 1',
    it: 'Motore porta 1'
  },
  'device-3': {
    de: 'Schachtsteckdose',
    hu: 'Konektor az aknában',
    en: 'Shaft Socket',
    fr: 'Prise de gaine',
    it: 'Presa vano corsa'
  },
  'device-4': {
    de: 'Beleuchtung Kabine',
    hu: 'Kabin világítás',
    en: 'Cabin Lighting',
    fr: 'Éclairage cabine',
    it: 'Illuminazione cabina'
  },
  'device-5': {
    de: 'Beleuchtung Schacht',
    hu: 'Akna világítás',
    en: 'Shaft Lighting',
    fr: 'Éclairage gaine',
    it: 'Illuminazione vano corsa'
  },
  'device-6': {
    de: 'Steckdose Maschinenraum',
    hu: 'Konektor a gépházban',
    en: 'Machine Room Socket',
    fr: 'Prise salle des machines',
    it: 'Presa locale macchine'
  },
  'device-7': {
    de: 'Weitestentfernter Sicherheitskontakt',
    hu: 'Legtávolabbi biztonságikör pontja',
    en: 'Furthest Safety Contact',
    fr: 'Contact de sécurité le plus éloigné',
    it: 'Contatto di sicurezza più lontano'
  },
  'device-8': {
    de: 'Türantriebsmotor 2',
    hu: 'Ajtó motor 2',
    en: 'Door Motor 2',
    fr: 'Moteur de porte 2',
    it: 'Motore porta 2'
  },
  'device-9': {
    de: 'Fotozelle',
    hu: 'Fénykapu',
    en: 'Photo Cell',
    fr: 'Cellule photo',
    it: 'Fotocellula'
  },
  'device-10': {
    de: 'Motorgest. Ventil (hydr.)',
    hu: 'Motorszabályozott szelep (hidraulika)',
    en: 'Motor Controlled Valve (hydr.)',
    fr: 'Vanne motorisée (hydr.)',
    it: 'Valvola motorizzata (idr.)'
  },
  'device-11': {
    de: 'Ventillator',
    hu: 'Ventillátor',
    en: 'Ventilator',
    fr: 'Ventilateur',
    it: 'Ventilatore'
  },
  'device-12': {
    de: 'Steckdose',
    hu: 'Konektor',
    en: 'Socket',
    fr: 'Prise',
    it: 'Presa'
  },
  'device-13': {
    de: 'Netzanschluss',
    hu: 'Hálózati csatlakozás',
    en: 'Power Connection',
    fr: 'Connexion réseau',
    it: 'Connessione di rete'
  },
  'device-14': {
    de: 'Steuerung',
    hu: 'Vezérlés',
    en: 'Controller',
    fr: 'Commande',
    it: 'Controllo'
  },
  'device-15': {
    de: 'Frequenzumrichter',
    hu: 'Frekvenciaváltó',
    en: 'Frequency Inverter',
    fr: 'Variateur de fréquence',
    it: 'Inverter di frequenza'
  },
  'device-16': {
    de: 'Bündigstellungsmotor',
    hu: 'Szintbeállító motor',
    en: 'Leveling Motor',
    fr: 'Moteur de nivellement',
    it: 'Motore di livellamento'
  },
  'device-17': {
    de: 'Türkontakte',
    hu: 'Ajtó kontaktok',
    en: 'Door Contacts',
    fr: 'Contacts de porte',
    it: 'Contatti porta'
  },
  'device-18': {
    de: 'Schachtkopfschalter',
    hu: 'Aknafej kapcsoló',
    en: 'Shaft Head Switch',
    fr: 'Interrupteur tête de gaine',
    it: 'Interruttore testa vano'
  },
  'device-19': {
    de: 'Pufferkontakte',
    hu: 'Puffer kontaktok',
    en: 'Buffer Contacts',
    fr: 'Contacts de tampon',
    it: 'Contatti ammortizzatore'
  },
  'device-20': {
    de: 'Spannungsüberwachung',
    hu: 'Feszültség felügyelet',
    en: 'Voltage Monitor',
    fr: 'Surveillance de tension',
    it: 'Monitoraggio tensione'
  }
};

export interface NiedervoltDevice {
  id: string;
  name: {
    de: string;
    hu: string;
    en: string;
    fr: string;
    it: string;
  };
}

export class NiedervoltService {
  
  /**
   * Get niedervolt devices - 5 nyelvű támogatással
   */
  async getNiedervoltDevices(): Promise<NiedervoltDevice[]> {
    console.log('📋 Loading hardcoded niedervolt devices (5 language support)');
    try {
        return this.getHardcodedDevices();
    } catch (error) {
        console.error('⚠️ Critical error in getHardcodedDevices, returning empty array:', error);
        return [];
    }
  }

  /**
   * Get hardcoded devices - 5 NYELVŰ LISTA
   */
  private getHardcodedDevices(): NiedervoltDevice[] {
    const deviceIds = Object.keys(DEVICE_NAMES);
    console.log(`✅ Using ${deviceIds.length} hardcoded niedervolt devices (5 languages)`);
    
    return deviceIds.map(id => ({
      id,
      name: DEVICE_NAMES[id as keyof typeof DEVICE_NAMES]
    }));
  }

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
}

export const niedervoltService = new NiedervoltService();
