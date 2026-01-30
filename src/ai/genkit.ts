// AI features are disabled for cPanel deployment
// To enable AI, add @genkit-ai/googleai and genkit packages back to dependencies

// Placeholder AI object that throws helpful errors
export const ai = {
  definePrompt: () => {
    throw new Error('AI features are disabled. Install genkit packages to enable.');
  },
  generate: () => {
    throw new Error('AI features are disabled. Install genkit packages to enable.');
  },
};

// Export flag to check if AI is available
export const isAIAvailable = false;

// Helper function to check AI availability before using AI features
export function requireAI(): void {
  throw new Error('AI features are not available. To enable AI features, install @genkit-ai/googleai and genkit packages.');
}
