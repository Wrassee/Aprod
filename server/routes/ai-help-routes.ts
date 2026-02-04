import { Router } from 'express';
import OpenAI from 'openai';
import { systemPromptForAI } from '../../src/lib/help-content.js';

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

router.post('/ask', async (req, res) => {
  try {
    const { question, language = 'hu', context } = req.body;

    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'Question is required' });
    }

    const client = getGroqClient();
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

    const systemMessage = `${systemPromptForAI}\n\n${languageInstruction}\n${contextInfo}`;

    const response = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: question }
      ],
      max_tokens: 500
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
