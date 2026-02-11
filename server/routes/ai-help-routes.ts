import { Router } from 'express';
import OpenAI from 'openai';
import { coreSystemPrompt, domainSystemPrompt, faqContent } from '../../src/lib/help-content.js';
import { userManualContent } from '../../src/lib/user-manual-content.js';

const router = Router();

let groqClient: OpenAI | null = null;

function getGroqClient(): OpenAI | null {
  if (!process.env.GROQ_API_KEY) {
    return null;
  }
  if (!groqClient) {
    groqClient = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1',
    });
  }
  return groqClient;
}

/**
 * KEYWORD NORMALIZALAS
 * Eltávolítja a space, underscore, dash karaktereket és kisbetűssé alakít
 * 
 * Példák:
 * "defaultIfHidden" -> "defaultifhidden"
 * "Default if hidden" -> "defaultifhidden"
 * "default_if_hidden" -> "defaultifhidden"
 * "cell-reference" -> "cellreference"
 */
function normalizeKeyword(text: string): string {
  return text.toLowerCase().replace(/[_\s-]/g, '');
}

/**
 * PRODUCTION-READY RAG-light: Normalized Keyword-based Knowledge Finder
 * 
 * KRITIKUS JAVÍTÁSOK:
 * 1. Normalizált kulcsszó matching (case/space/underscore insensitive)
 * 2. Kategória-alapú súlyozás (context.currentPage alapján)
 * 3. Strukturált <FAQ> és <MANUAL> blokkok
 * 4. Manual content teljes szekció (nem truncált)
 */
function findRelevantKnowledge(question: string, lang: string, context?: any): string {
  const normalizedQuestion = normalizeKeyword(question);
  let faqMatches: Array<{ faq: any; score: number }> = [];
  let manualMatches: Array<{ section: any; score: number }> = [];

  // ══════════════════════════════════════════════════════════════
  // 1. FAQ KERESÉS - NORMALIZÁLT KULCSSZÓ MATCHING
  // ══════════════════════════════════════════════════════════════
  const langFaq = faqContent[lang] || faqContent['hu'];

  langFaq.forEach(faq => {
    let score = 0;

    // Normalizált kulcsszó egyezések számolása
    const matchingKeywords = faq.keywords.filter(keyword => {
      const normalizedKeyword = normalizeKeyword(keyword);
      return normalizedQuestion.includes(normalizedKeyword);
    });

    score += matchingKeywords.length * 10; // 10 pont per kulcsszó

    // Kategória-alapú súlyozás (ha van currentPage context)
    if (context?.currentPage) {
      const pageCategory = mapPageToCategory(context.currentPage);
      if (faq.category === pageCategory) {
        score += 5; // +5 pont releváns kategória
      }
    }

    // Csak ha van találat
    if (score > 0) {
      faqMatches.push({ faq, score });
    }
  });

  // Rendezés score szerint, max 2 legjobb
  faqMatches.sort((a, b) => b.score - a.score);
  const topFaqs = faqMatches.slice(0, 2);

  // ══════════════════════════════════════════════════════════════
  // 2. MANUAL KERESÉS - TELJES SZEKCIÓ (NEM TRUNCÁLT)
  // ══════════════════════════════════════════════════════════════
  const manual = userManualContent[lang] || userManualContent['hu'];

  manual.sections.forEach(section => {
    let score = 0;

    // Cím egyezések (normalizált)
    const titleWords = section.title.toLowerCase().split(' ');
    const matchingTitleWords = titleWords.filter(word => {
      const normalizedWord = normalizeKeyword(word);
      return normalizedWord.length > 3 && normalizedQuestion.includes(normalizedWord);
    });
    score += matchingTitleWords.length * 8; // 8 pont per cím szó

    // Tartalom első 300 karakter egyezései (normalizált)
    const contentPreview = section.content.toLowerCase().substring(0, 300);
    const contentWords = contentPreview.split(' ');
    const matchingContentWords = contentWords.filter(word => {
      const normalizedWord = normalizeKeyword(word);
      return normalizedWord.length > 4 && normalizedQuestion.includes(normalizedWord);
    });
    score += matchingContentWords.length * 3; // 3 pont per tartalom szó

    if (score > 0) {
      manualMatches.push({ section, score });
    }
  });

  // Rendezés score szerint, max 1 legjobb
  manualMatches.sort((a, b) => b.score - a.score);
  const topManuals = manualMatches.slice(0, 1);

  // ══════════════════════════════════════════════════════════════
  // 3. STRUKTURÁLT TARTALOM ÖSSZÁLLÍTÁSA
  // ══════════════════════════════════════════════════════════════
  let relevantText = "";

  // FAQ blokk
  if (topFaqs.length > 0) {
    relevantText += "\n<FAQ>\n";
    relevantText += "GYIK (FAQ) - KOTELEZŐ ERVENYŰ TUDAS\n\n";

    topFaqs.forEach((match, index) => {
      relevantText += `${index + 1}. KERDES: ${match.faq.question}\n`;
      relevantText += `   VALASZ: ${match.faq.answer}\n\n`;
    });

    relevantText += "</FAQ>\n";
  }

  // Manual blokk - TELJES SZEKCIÓ, NEM TRUNCÁLT
  if (topManuals.length > 0) {
    relevantText += "\n<MANUAL>\n";
    relevantText += "KEZIKONYV RESZLET - KOTELEZŐ ERVENYŰ TUDAS\n\n";

    topManuals.forEach((match, index) => {
      relevantText += `FEJEZET: ${match.section.title}\n\n`;
      relevantText += `TARTALOM:\n${match.section.content}\n\n`;
    });

    relevantText += "</MANUAL>\n";
  }

  // Ha nincs releváns dokumentáció
  if (relevantText === "") {
    relevantText = "\n[Nincs kozvetlen relevans dokumentacio a kerdeshez. Ha nincs biztos valasz, jelezd a bizonytalansagot es javasolj support csatornat.]\n";
  }

  return relevantText;
}

/**
 * Oldal → Kategória mapping (kategória-alapú súlyozáshoz)
 */
function mapPageToCategory(currentPage: string): string {
  const mapping: Record<string, string> = {
    'questionnaire': 'protocol',
    'measurements': 'measurements',
    'niedervolt': 'measurements',
    'niedervolt-table': 'measurements',
    'niedervolt-measurements': 'measurements',
    'erdungskontrolle': 'measurements',
    'signature': 'protocol',
    'completion': 'excel',
    'errors': 'errors',
    'admin': 'general',
  };

  return mapping[currentPage] || 'general';
}

/**
 * Nyelv-specifikus utasítás generálása
 */
function getLanguageInstruction(lang: string): string {
  const instructions: Record<string, string> = {
    hu: 'Valaszolj MAGYARUL, roviden es erthetoen. Hasznalj strukturalt formazast (listak, lepesek).',
    de: 'Antworte auf DEUTSCH, kurz und verstandlich. Verwenden Sie strukturierte Formatierung (Listen, Schritte).',
    en: 'Answer in ENGLISH, briefly and clearly. Use structured formatting (lists, steps).',
    fr: 'Reponds en FRANÇAIS, brievement et clairement. Utilisez un formatage structure (listes, etapes).',
    it: 'Rispondi in ITALIANO, brevemente e chiaramente. Usa la formattazione strutturata (elenchi, passaggi).'
  };
  return instructions[lang] || instructions.hu;
}

/**
 * Fallback üzenet amikor az AI nem elérhető
 */
function getFallbackMessage(lang: string): string {
  const messages: Record<string, string> = {
    hu: 'Sajnos az AI szolgaltatas jelenleg nem elerhető. Kerlek, probald meg kesőbb vagy nezd meg a Gyakori Kerdeseket.',
    de: 'Der KI-Dienst ist derzeit leider nicht verfugbar. Bitte versuchen Sie es spater oder schauen Sie in die FAQ.',
    en: 'Sorry, the AI service is currently unavailable. Please try again later or check the FAQ.',
    fr: 'Desole, le service IA est actuellement indisponible. Veuillez reessayer plus tard ou consulter la FAQ.',
    it: 'Spiacenti, il servizio AI non e attualmente disponibile. Riprova piu tardi o consulta le FAQ.'
  };
  return messages[lang] || messages.hu;
}

/**
 * Főbb AI kérdés-feldolgozó endpoint
 */
router.post('/ask', async (req, res) => {
  try {
    const { question, language = 'hu', context } = req.body;

    // Validáció
    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'Question is required' });
    }

    if (question.length > 500) {
      return res.status(400).json({ error: 'Question too long (max 500 characters)' });
    }

    // Groq kliens ellenőrzése
    const client = getGroqClient();
    if (!client) {
      return res.status(503).json({ 
        error: 'AI service not configured',
        fallbackMessage: getFallbackMessage(language)
      });
    }

    // ═══════════════════════════════════════════════════════════════
    // RAG-LIGHT: Tudás becsatornázása (normalizált kulcsszó + súlyozás)
    // ═══════════════════════════════════════════════════════════════
    const injectedKnowledge = findRelevantKnowledge(question, language, context);

    // Kontextus információk formázása
    const contextInfo = context ? `
JELENLEGI FELHASZNALOI KONTEXTUS

Jelenlegi oldal: ${context.currentPage || 'N/A'}
Kitoltott mezők szama: ${context.filledFields || 0}
Dokumentalt hibak szama: ${context.errorCount || 0}

Ez a kontextus segit szemelyre szabni a valaszodat.
` : '';

    // Nyelv-specifikus utasítás
    const languageInstruction = getLanguageInstruction(language);

    // ═══════════════════════════════════════════════════════════════
    // MODULÁRIS SYSTEM MESSAGE ÖSSZEÁLLÍTÁSA
    // ═══════════════════════════════════════════════════════════════
    const systemMessage = `${coreSystemPrompt}

${domainSystemPrompt}

${injectedKnowledge}

${contextInfo}

${languageInstruction}`;

    // ═══════════════════════════════════════════════════════════════
    // GROQ API HÍVÁS - llama-3.3-70b-versatile modellel
    // ═══════════════════════════════════════════════════════════════
    const response = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: question }
      ],
      temperature: 0.2,  // Alacsony hőmérséklet = kevesebb hallucináció
      max_tokens: 800,   // Elegendő részletes válaszhoz
      top_p: 0.9,        // Nucleus sampling
    });

    const answer = response.choices[0]?.message?.content || getFallbackMessage(language);

    // Siker - válasz visszaadása
    res.json({ answer });

  } catch (error: any) {
    console.error('AI Help Error:', error);

    // Hiba kezelés
    const language = req.body?.language || 'hu';

    // Production environment: ne adjunk ki részletes hibákat
    const errorDetails = process.env.NODE_ENV === 'development' 
      ? { message: error.message, stack: error.stack }
      : undefined;

    res.status(500).json({ 
      error: 'AI service error',
      fallbackMessage: getFallbackMessage(language),
      details: errorDetails
    });
  }
});

/**
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  const client = getGroqClient();

  res.json({
    status: client ? 'healthy' : 'groq_not_configured',
    timestamp: new Date().toISOString(),
    model: 'llama-3.3-70b-versatile',
    version: '2.0.0'
  });
});

export default router;