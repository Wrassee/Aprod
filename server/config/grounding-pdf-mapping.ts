// server/config/grounding-pdf-mapping.ts

interface AnswerMapping {
  questionId: string;
  okFieldName: string;
  notOkFieldName: string;
}

interface MetadataMapping {
  appDataKey: string;
  pdfFieldName: string;
}

export const groundingPdfMapping: {
  metadata: MetadataMapping[];
  answers: AnswerMapping[];
  remarks: { punktField: string; bemerkungField: string }[];
} = {
  metadata: [
    { appDataKey: 'liftId', pdfFieldName: 'Anlage Nr' },
    { appDataKey: 'technicianName', pdfFieldName: 'Name des Technikers' },
    { appDataKey: 'agency', pdfFieldName: 'Agentur' },
    { appDataKey: 'receptionDate', pdfFieldName: 'Datum' },
    { appDataKey: 'address', pdfFieldName: 'Adresse der Anlage' },
    { appDataKey: 'signature', pdfFieldName: 'signature' }
    // { appDataKey: 'visum', pdfFieldName: 'Visum' } //
  ],

  // A kérdések (Excel question_id → PDF OK/nicht OK mezők)
  answers: [
    // 1. Maschinenraum
    { questionId: 'OK1/1',  okFieldName: 'OK1/1',  notOkFieldName: 'nicht OK1/1' },
    { questionId: 'OK1/2',  okFieldName: 'OK1/2',  notOkFieldName: 'nicht OK1/2' },
    { questionId: 'OK1/3',  okFieldName: 'OK1/3',  notOkFieldName: 'nicht OK1/3' },
    { questionId: 'OK1/4',  okFieldName: 'OK1/4',  notOkFieldName: 'nicht OK1/4' },
    { questionId: 'OK1/5',  okFieldName: 'OK1/5',  notOkFieldName: 'nicht OK1/5' },
    { questionId: 'OK1/6',  okFieldName: 'OK1/6',  notOkFieldName: 'nicht OK1/6' },
    { questionId: 'OK1/7',  okFieldName: 'OK1/7',  notOkFieldName: 'nicht OK1/7' },
    { questionId: 'OK1/8',  okFieldName: 'OK1/8',  notOkFieldName: 'nicht OK1/8' },
    { questionId: 'OK1/9',  okFieldName: 'OK1/9',  notOkFieldName: 'nicht OK1/9' },
    { questionId: 'OK1/10', okFieldName: 'OK1/10', notOkFieldName: 'nicht OK1/10' },
    { questionId: 'OK1/11', okFieldName: 'OK1/11', notOkFieldName: 'nicht OK1/11' },
    { questionId: 'OK1/12', okFieldName: 'OK1/12', notOkFieldName: 'nicht OK1/12' },

    // 2. Kabinendach
    { questionId: 'OK2/1',  okFieldName: 'OK2/1',  notOkFieldName: 'nicht OK2/1' },
    { questionId: 'OK2/2',  okFieldName: 'OK2/2',  notOkFieldName: 'nicht OK2/2' },
    { questionId: 'OK2/3',  okFieldName: 'OK2/3',  notOkFieldName: 'nicht OK2/3' },
    { questionId: 'OK2/4',  okFieldName: 'OK2/4',  notOkFieldName: 'nicht OK2/4' },
    { questionId: 'OK2/5',  okFieldName: 'OK2/5',  notOkFieldName: 'nicht OK2/5' },
    { questionId: 'OK2/6',  okFieldName: 'OK2/6',  notOkFieldName: 'nicht OK2/6' },
    { questionId: 'OK2/7',  okFieldName: 'OK2/7',  notOkFieldName: 'nicht OK2/7' },
    { questionId: 'OK2/8',  okFieldName: 'OK2/8',  notOkFieldName: 'nicht OK2/8' },
    { questionId: 'OK2/9',  okFieldName: 'OK2/9',  notOkFieldName: 'nicht OK2/9' },
    { questionId: 'OK2/10', okFieldName: 'OK2/10', notOkFieldName: 'nicht OK2/10' },
    { questionId: 'OK2/11', okFieldName: 'OK2/11', notOkFieldName: 'nicht OK2/11' },
    { questionId: 'OK2/12', okFieldName: 'OK2/12', notOkFieldName: 'nicht OK2/12' },
    { questionId: 'OK2/13', okFieldName: 'OK2/13', notOkFieldName: 'nicht OK2/13' },
    { questionId: 'OK2/14', okFieldName: 'OK2/14', notOkFieldName: 'nicht OK2/14' },

    // 3. Schacht
    { questionId: 'OK3/1',  okFieldName: 'OK3/1',  notOkFieldName: 'nicht OK3/1' },
    { questionId: 'OK3/2',  okFieldName: 'OK3/2',  notOkFieldName: 'nicht OK3/2' },
    { questionId: 'OK3/3',  okFieldName: 'OK3/3',  notOkFieldName: 'nicht OK3/3' },
    { questionId: 'OK3/4',  okFieldName: 'OK3/4',  notOkFieldName: 'nicht OK3/4' },
    { questionId: 'OK3/5',  okFieldName: 'OK3/5',  notOkFieldName: 'nicht OK3/5' },
    { questionId: 'OK3/6',  okFieldName: 'OK3/6',  notOkFieldName: 'nicht OK3/6' },
    { questionId: 'OK3/7',  okFieldName: 'OK3/7',  notOkFieldName: 'nicht OK3/7' },
    { questionId: 'OK3/8',  okFieldName: 'OK3/8',  notOkFieldName: 'nicht OK3/8' },
    { questionId: 'OK3/9',  okFieldName: 'OK3/9',  notOkFieldName: 'nicht OK3/9' },
    { questionId: 'OK3/12', okFieldName: 'OK3/12', notOkFieldName: 'nicht OK3/12' },

    // 4. Schachtgrube
    { questionId: 'OK4/1',  okFieldName: 'OK4/1',  notOkFieldName: 'nicht OK4/1' },
    { questionId: 'OK4/2',  okFieldName: 'OK4/2',  notOkFieldName: 'nicht OK4/2' },
    { questionId: 'OK4/3',  okFieldName: 'OK4/3',  notOkFieldName: 'nicht OK4/3' },
    { questionId: 'OK4/4',  okFieldName: 'OK4/4',  notOkFieldName: 'nicht OK4/4' },
    { questionId: 'OK4/5',  okFieldName: 'OK4/5',  notOkFieldName: 'nicht OK4/5' },
    { questionId: 'OK4/6',  okFieldName: 'OK4/6',  notOkFieldName: 'nicht OK4/6' },
    { questionId: 'OK4/7',  okFieldName: 'OK4/7',  notOkFieldName: 'nicht OK4/7' },
    { questionId: 'OK4/10', okFieldName: 'OK4/10', notOkFieldName: 'nicht OK4/10' },

    // 5. Kabine
    { questionId: 'OK5/1', okFieldName: 'OK5/1', notOkFieldName: 'nicht OK5/1' },
    { questionId: 'OK5/2', okFieldName: 'OK5/2', notOkFieldName: 'nicht OK5/2' },
    { questionId: 'OK5/3', okFieldName: 'OK5/3', notOkFieldName: 'nicht OK5/3' },
    { questionId: 'OK5/4', okFieldName: 'OK5/4', notOkFieldName: 'nicht OK5/4' },
    { questionId: 'OK5/5', okFieldName: 'OK5/5', notOkFieldName: 'nicht OK5/5' },
    { questionId: 'OK5/6', okFieldName: 'OK5/6', notOkFieldName: 'nicht OK5/6' }
  ],

  // Bemerkung/Punkt mezők
  remarks: [
    { punktField: 'PunktRow1', bemerkungField: 'Bemerkung Row1' },
    { punktField: 'PunktRow2', bemerkungField: 'Bemerkung Row2' }
  ]
};