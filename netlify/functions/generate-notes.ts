import { Handler } from '@netlify/functions';
import { GoogleGenAI, Type } from '@google/genai';

const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const { text } = JSON.parse(event.body || '{}');

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Please provide valid study material text.' }),
      };
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Gemini API key is not configured in Netlify environment variables.' }),
      };
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

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

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: jsonStr,
    };
  } catch (error: any) {
    console.error('Netlify function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message || 'Internal server error while generating study notes.',
      }),
    };
  }
};

export { handler };
