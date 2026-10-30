import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json({ limit: '10mb' }));

  // Initialize Gemini AI client server-side
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || '',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // API endpoint for generating study notes
  app.post('/api/generate-notes', async (req, res) => {
    try {
      const { text } = req.body;

      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        return res.status(400).json({ error: 'Please provide valid study material text.' });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({
          error: 'Gemini API key is not configured. Please set GEMINI_API_KEY in secrets.',
        });
      }

      const prompt = `Analyze the following study material and generate comprehensive, structured study notes.
Material:
"""
${text}
"""`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: prompt,
        config: {
          systemInstruction:
            'You are an expert academic tutor and instructional designer. Your task is to analyze the provided study material and return structured study notes in strict JSON format. Include: 1) A concise executive summary. 2) 5-10 bulleted key takeaways with bold titles and descriptions. 3) Exactly 5 distinct practice test questions. Every question MUST have a non-empty question text, a non-empty answer, and a non-empty explanation. Do not leave any answers or explanations blank. 4) A simplified explanation (beginner-friendly breakdown or analogy).',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: {
                type: Type.STRING,
                description: 'A professional descriptive title for these study notes.',
              },
              summary: {
                type: Type.STRING,
                description: 'A comprehensive executive summary of the material.',
              },
              keyPoints: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING, description: 'Short title of the key point.' },
                    description: { type: Type.STRING, description: 'Detailed explanation of the key point.' },
                  },
                  required: ['title', 'description'],
                },
                description: '5 to 10 key bullet points extracted from the text.',
              },
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING, description: 'Practice question text.' },
                    answer: { type: Type.STRING, description: 'Correct answer.' },
                    explanation: { type: Type.STRING, description: 'Detailed explanation of why the answer is correct.' },
                  },
                  required: ['question', 'answer', 'explanation'],
                },
                description: 'Exactly 5 practice questions with non-empty answers and explanations.',
              },
              simplifiedExplanation: {
                type: Type.STRING,
                description: 'A simplified beginner-friendly explanation or intuitive analogy.',
              },
            },
            required: ['title', 'summary', 'keyPoints', 'questions', 'simplifiedExplanation'],
          },
        },
      });

      let jsonStr = (response.text ?? '{}').trim();
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      let parsedData;
      try {
        parsedData = JSON.parse(jsonStr);
      } catch (err) {
        console.error('Failed to parse Gemini JSON response:', jsonStr);
        return res.status(500).json({ error: 'Failed to parse AI-generated study notes structure.' });
      }

      return res.json(parsedData);
    } catch (error: any) {
      console.error('Error generating notes:', error);
      return res.status(500).json({
        error: error.message || 'Internal server error while generating study notes.',
      });
    }
  });

  // Setup Vite middleware for development
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });

  app.use(vite.middlewares);

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
