import { genkit, z } from 'genkit';
import { googleAI, gemini15Flash } from '@genkit-ai/googleai';

export const ai = genkit({
 plugins: [googleAI({ apiKey: process.env.GOOGLE_API_KEY })],
 model: gemini15Flash,
});

export const rationaleValidationFlow = ai.defineFlow(
 {
 name: 'rationaleValidationFlow',
 inputSchema: z.object({
 title: z.string(),
 description: z.string(),
 pointsRequested: z.number(),
 }),
 outputSchema: z.object({
 isValid: z.boolean(),
 confidence: z.number(),
 feedback: z.string(),
 }),
 },
 async (input) => {
 const prompt = `Analyze the following faculty achievement:
Title: ${input.title}
Description: ${input.description}
Points Requested: ${input.pointsRequested}

Determine if this is a valid academic/institutional achievement and provide feedback.
Return a JSON object with isValid (boolean), confidence (number 0-1), and feedback (string).`;

 const { object } = await ai.generate({
 model: gemini15Flash,
 prompt,
 output: {
 schema: z.object({
 isValid: z.boolean(),
 confidence: z.number(),
 feedback: z.string(),
 })
 }
 });

 return object;
 }
);