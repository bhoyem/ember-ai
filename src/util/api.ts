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

type GenerateResponseResult =
    | {
          ok: true;
          text: string;
      }
    | {
          ok: false;
          error: string;
      };

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

export async function generateResponse(prompt: string): Promise<GenerateResponseResult> {
    const primaryModel = process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
    const models = [primaryModel, FALLBACK_MODEL].filter(
        (model, index, allModels) => allModels.indexOf(model) === index,
    );
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return {
            ok: false,
            error: 'Gemini is not configured for this deployment. Add GEMINI_API_KEY in Vercel project environment variables and redeploy.',
        };
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
                    contents: prompt,
                });

                return {
                    ok: true,
                    text: result.candidates?.[0]?.content?.parts?.[0]?.text ?? '',
                };
            } catch (error) {
                if (isModelNotFoundError(error)) {
                    return {
                        ok: false,
                        error: `Gemini could not use model "${model}". Check GEMINI_MODEL in Vercel environment variables.`,
                    };
                }

                if (isTemporaryGeminiError(error) && attempt === 1) {
                    await wait(800);
                    continue;
                }

                if (isTemporaryGeminiError(error)) {
                    break;
                }

                console.error(error);

                return {
                    ok: false,
                    error: 'Gemini could not generate a response. Check the Vercel function logs for the server-side error.',
                };
            }
        }
    }

    return {
        ok: false,
        error: `Gemini is temporarily overloaded for ${models.join(
            ' and ',
        )}. Please try again in a minute.`,
    };
}
