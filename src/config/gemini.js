// src/config/gemini.js
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini - In production, use environment variables!
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY; // Your actual API key in quotes

/* Check if API key is configured
if (!API_KEY || API_KEY === 'AIzaSyD4nh1ihIySIw1OJuWzKHq-D36e9Ofo05w') {
  console.error('⚠️ Gemini API key not configured! Please add your API key to src/config/gemini.js');
}*/

// Initialize the Gemini API
const genAI = new GoogleGenerativeAI(API_KEY);

// Create a model instance with the UPDATED model name
export const chatModel = genAI.getGenerativeModel({ 
  model: 'gemini-1.5-flash', // Updated model name
  generationConfig: {
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 1024,
  },
});

// Alternative models you can try:
// model: 'gemini-1.5-flash' - Faster, good for chat
// model: 'gemini-1.5-pro' - More capable but slower

// System prompt remains the same
export const SYSTEM_PROMPT = `You are a compassionate, supportive mental health companion. 
Your role is to:
- Listen with empathy and without judgment
- Provide emotional support and encouragement
- Suggest helpful coping strategies when appropriate
- Encourage self-reflection and mindfulness
- Remind users that you're an AI companion, not a replacement for professional help

Important guidelines:
- Be warm, understanding, and patient
- Never diagnose or prescribe medications
- If someone is in crisis, encourage them to seek professional help immediately
- Focus on emotional support and practical wellness tips
- Keep responses concise but meaningful (2-3 paragraphs max)
- Use a conversational, friendly tone
- Ask thoughtful follow-up questions when appropriate

Remember: You're here to support, not to solve everything. Sometimes just listening and validating feelings is enough.`;

// Helper function to test if API is working
export const testGeminiConnection = async () => {
  try {
    const result = await chatModel.generateContent("Say 'Hello, I'm connected!' in a friendly way.");
    const response = await result.response;
    console.log('✅ Gemini API connected successfully!');
    return response.text();
  } catch (error) {
    console.error('❌ Gemini API connection failed:', error);
    throw error;
  }
};

// List available models (for debugging)
export const listAvailableModels = async () => {
  try {
    const models = await genAI.listModels();
    console.log('Available models:');
    for await (const model of models) {
      console.log(model);
    }
  } catch (error) {
    console.error('Error listing models:', error);
  }
};