import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// Check if AI features should be enabled
const isAIEnabled = !!process.env.GOOGLE_GENAI_API_KEY;

// Conditionally initialize Genkit with plugins only if API key is available
export const ai = genkit({
  plugins: isAIEnabled ? [googleAI()] : [],
  model: isAIEnabled ? 'googleai/gemini-2.0-flash' : undefined,
});

// Export flag to check if AI is available
export const isAIAvailable = isAIEnabled;

// Helper function to check AI availability before using AI features
export function requireAI(): void {
  if (!isAIEnabled) {
    throw new Error('AI features are not available. Please configure GOOGLE_GENAI_API_KEY in your environment variables.');
  }
}
