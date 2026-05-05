// 'use server';

// import { GoogleGenAI } from '@google/genai';

// export const generateResponse = async (prompt: string) => {
//     const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

//     const result = await ai.models.generateContent({
//         model: process.env.GEMINI_MODEL as string,
//         contents: prompt,
//     });
//     return result.text;
// };

// 'use server';

// import { GoogleGenerativeAI } from "@google/generative-ai";

// export const generateResponse = async (prompt: string) => {
//     const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

//     const model = ai.getGenerativeModel({
//         model: process.env.GEMINI_MODEL!,
//     });

//     const result = await model.generateContent(prompt);

//     return result.response.text();
// };

'use server';

import { GoogleGenAI } from '@google/genai';

const DEFAULT_MODEL = 'gemini-2.5-flash';
const FALLBACK_MODEL = 'gemini-2.5-flash-lite';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function isModelNotFoundError(error: unknown) {
    return error instanceof Error && error.message.includes('NOT_FOUND');
}

function isTemporaryGeminiError(error: unknown) {
    if (!(error instanceof Error)) {
        return false;
    }

    return (
        error.message.includes('503') ||
        error.message.includes('UNAVAILABLE') ||
        error.message.includes('high demand')
    );
}

export async function generateResponse(prompt: string) {
    const primaryModel = process.env.GEMINI_MODEL ?? DEFAULT_MODEL;
    const models = [primaryModel, FALLBACK_MODEL].filter(
        (model, index, allModels) => allModels.indexOf(model) === index,
    );
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        throw new Error('Missing GEMINI_API_KEY in .env.local.');
    }

    const client = new GoogleGenAI({
        apiKey,
    });
    // const modellist = await client.models.list();
    // console.log(modellist);

    for (const model of models) {
        for (let attempt = 1; attempt <= 2; attempt += 1) {
            try {
                const result = await client.models.generateContent({
                    model,
                    contents: [
                        {
                            role: 'user',
                            parts: [{ text: prompt }],
                        },
                    ],
                });

                return result.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
            } catch (error) {
                if (isModelNotFoundError(error)) {
                    throw new Error(
                        `Gemini could not use model "${model}". Check GEMINI_MODEL in .env.local or run client.models.list() to see available models.`,
                    );
                }

                if (isTemporaryGeminiError(error) && attempt === 1) {
                    await wait(800);
                    continue;
                }

                if (isTemporaryGeminiError(error)) {
                    break;
                }

                throw error;
            }
        }
    }

    throw new Error(
        `Gemini is temporarily overloaded for ${models.join(
            ' and ',
        )}. Please try again in a minute.`,
    );
}
