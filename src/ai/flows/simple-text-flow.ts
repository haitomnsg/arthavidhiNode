'use server';
/**
 * @fileOverview A simple flow for generating text from a prompt.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Define the flow for generating simple text responses
const simpleTextFlow = ai.defineFlow(
  {
    name: 'simpleTextFlow',
    inputSchema: z.string(),
    outputSchema: z.string(),
  },
  async (prompt) => {
    const { text } = await ai.generate({
      prompt: prompt,
    });
    return text;
  }
);

// Export an async wrapper function that calls the flow
export async function generateSimpleText(prompt: string): Promise<string> {
    return await simpleTextFlow(prompt);
}
