import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import ExcelJS from 'exceljs';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

type CellWrite = { questionId: string; value: string | number | null };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { writes, protocolFileKey, templateFileKey } = req.body as {
    writes: CellWrite[];
    protocolFileKey: string;
    templateFileKey: string;
  };

  try {
    // 1. Letöltés: template fájl
    const { data: templateData } = await supabase.storage.from('templates').download(templateFileKey);
    if (!templateData) return res.status(404).json({ error: 'Template file not found' });

    const templateWorkbook = new ExcelJS.Workbook();
    await templateWorkbook.xlsx.load(await templateData.arrayBuffer());
    const mappingSheet = templateWorkbook.getWorksheet('niv');
    if (!mappingSheet) return res.status(400).json({ error: 'Mapping sheet "niv" not found' });

    const mapping = new Map<string, string>();
    mappingSheet.eachRow((row, rowNumber) => {
      const qId = row.getCell(1).text.trim();
      const cellRef = row.getCell(2).text.trim();
      if (qId && cellRef) mapping.set(qId, cellRef);
    });

    // 2. Letöltés: Otis fájl
    const { data: otisData } = await supabase.storage.from('protocols').download(protocolFileKey);
    if (!otisData) return res.status(404).json({ error: 'Otis protocol file not found' });

    const otisWorkbook = new ExcelJS.Workbook();
    await otisWorkbook.xlsx.load(await otisData.arrayBuffer());
    const targetSheet = otisWorkbook.worksheets[0]; // első munkalap

    // 3. Írás
    for (const { questionId, value } of writes) {
      const cellRef = mapping.get(questionId);
      if (!cellRef) continue;
      const cell = targetSheet.getCell(cellRef);
      cell.value = value ?? '';
    }

    // 4. Mentés verziózott névvel
    const buffer = await otisWorkbook.xlsx.writeBuffer();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const newKey = `otis-protocols/protocol_v${timestamp}.xlsx`;

    const { error: uploadError } = await supabase.storage.from('protocols').upload(newKey, buffer, {
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      upsert: true,
    });

    if (uploadError) throw uploadError;

    res.status(200).json({ success: true, fileKey: newKey });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
