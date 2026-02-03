import { Router } from 'express';
import { generateManualHTML } from '../../src/lib/user-manual-content';

const router = Router();

router.get('/download', (req, res) => {
  const lang = (req.query.lang as string) || 'hu';
  const validLang = ['hu', 'de', 'en'].includes(lang) ? lang as 'hu' | 'de' | 'en' : 'hu';
  
  const html = generateManualHTML(validLang);
  
  const titles: Record<string, string> = {
    hu: 'OTIS_APROD_Hasznalati_Utmutato',
    de: 'OTIS_APROD_Benutzerhandbuch',
    en: 'OTIS_APROD_User_Manual'
  };
  
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${titles[validLang]}.html"`);
  res.send(html);
});

router.get('/view', (req, res) => {
  const lang = (req.query.lang as string) || 'hu';
  const validLang = ['hu', 'de', 'en'].includes(lang) ? lang as 'hu' | 'de' | 'en' : 'hu';
  
  const html = generateManualHTML(validLang);
  
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});

export default router;
