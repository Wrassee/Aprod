import { Router } from 'express';
import OpenAI from 'openai';
import { systemPromptForAI } from '../../src/lib/help-content';

const router = Router();

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
// Lazy initialization to avoid crash when API key is missing
let openai: OpenAI | null = null;
function getOpenAIClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!openai) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
}

router.post('/ask', async (req, res) => {
  try {
    const { question, language = 'hu', context } = req.body;

    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'Question is required' });
    }

    const client = getOpenAIClient();
    if (!client) {
      return res.status(503).json({ 
        error: 'AI service not configured',
        fallbackMessage: getFallbackMessage(language)
      });
    }

    const languageInstruction = getLanguageInstruction(language);
    
    const contextInfo = context ? `
Jelenlegi kontextus:
- Oldal: ${context.currentPage || 'N/A'}
- Kitöltött mezők száma: ${context.filledFields || 0}
- Hibák száma: ${context.errorCount || 0}
` : '';

    const response = await client.chat.completions.create({
      model: "gpt-5",
      messages: [
        { 
          role: "system", 
          content: `${systemPromptForAI}\n\n${languageInstruction}\n${contextInfo}` 
        },
        { role: "user", content: question }
      ],
      max_completion_tokens: 500
    });

    const answer = response.choices[0]?.message?.content || getFallbackMessage(language);

    res.json({ answer });
  } catch (error: any) {
    console.error('AI Help Error:', error);
    
    const language = req.body?.language || 'hu';
    res.status(500).json({ 
      error: 'AI service error',
      fallbackMessage: getFallbackMessage(language)
    });
  }
});

function getLanguageInstruction(lang: string): string {
  const instructions: Record<string, string> = {
    hu: 'Válaszolj magyarul, röviden és érthetően.',
    de: 'Antworte auf Deutsch, kurz und verständlich.',
    en: 'Answer in English, briefly and clearly.',
    fr: 'Réponds en français, brièvement et clairement.',
    it: 'Rispondi in italiano, brevemente e chiaramente.'
  };
  return instructions[lang] || instructions.hu;
}

function getFallbackMessage(lang: string): string {
  const messages: Record<string, string> = {
    hu: 'Sajnos az AI szolgáltatás jelenleg nem elérhető. Kérlek, próbáld meg később vagy nézd meg a Gyakori Kérdéseket.',
    de: 'Der KI-Dienst ist derzeit leider nicht verfügbar. Bitte versuchen Sie es später oder schauen Sie in die FAQ.',
    en: 'Sorry, the AI service is currently unavailable. Please try again later or check the FAQ.',
    fr: 'Désolé, le service IA est actuellement indisponible. Veuillez réessayer plus tard ou consulter la FAQ.',
    it: 'Spiacenti, il servizio AI non è attualmente disponibile. Riprova più tardi o consulta le FAQ.'
  };
  return messages[lang] || messages.hu;
}

export default router;
