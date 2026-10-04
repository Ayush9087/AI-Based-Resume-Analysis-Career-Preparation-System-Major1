import { analyzeWithGemini } from './geminiAiProvider.js';

// Keep provider selection behind this boundary so callers do not depend on Gemini.
export async function analyzeParsedResume(parsedResume) {
  return analyzeWithGemini(parsedResume);
}