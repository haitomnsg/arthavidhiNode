// AI features are optional - this module handles missing dependencies gracefully

let ai: any = null;
let isAIAvailable = false;

// Try to initialize Genkit only if the packages are available
try {
  if (process.env.GOOGLE_GENAI_API_KEY) {
    const { genkit } = require('genkit');
    const { googleAI } = require('@genkit-ai/googleai');
    
    ai = genkit({
      plugins: [googleAI()],
      model: 'googleai/gemini-2.0-flash',
    });
    isAIAvailable = true;
  }
} catch (error) {
  // AI packages not installed or failed to load - this is expected on cPanel
  console.log('AI features disabled: Genkit packages not available');
  isAIAvailable = false;
}

// Export a mock or real AI instance
export { ai, isAIAvailable };

// Helper function to check AI availability before using AI features
export function requireAI(): void {
  if (!isAIAvailable || !ai) {
    throw new Error('AI features are not available. Please install genkit packages and configure GOOGLE_GENAI_API_KEY.');
  }
}
