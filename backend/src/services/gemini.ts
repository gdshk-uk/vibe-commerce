/**
 * Gemini AI Service
 * Handles text embeddings and chat completions using Gemini 1.5 Flash
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Initialize Gemini AI client
 */
export function initGemini(apiKey: string): GoogleGenerativeAI {
  return new GoogleGenerativeAI(apiKey);
}

/**
 * Generate text embedding using Gemini
 */
export async function generateEmbedding(
  apiKey: string,
  text: string
): Promise<number[]> {
  const genAI = initGemini(apiKey);
  const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });

  const result = await model.embedContent(text);
  return result.embedding.values;
}

/**
 * Generate embeddings for multiple texts in batch
 */
export async function generateBatchEmbeddings(
  apiKey: string,
  texts: string[]
): Promise<number[][]> {
  const genAI = initGemini(apiKey);
  const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });

  const results = await Promise.all(
    texts.map((text) => model.embedContent(text))
  );

  return results.map((result) => result.embedding.values);
}

/**
 * System prompt for Vibe Commerce AI shopping assistant
 */
const SYSTEM_PROMPT = `You are a sophisticated shopping assistant for Vibe Commerce, a premium e-commerce platform.

Your personality:
- Professional, friendly, and fashion-forward
- Knowledgeable about products and trends
- Helpful without being pushy

Your capabilities:
- Help users discover products based on their preferences
- Provide personalized recommendations
- Answer questions about products, orders, and shopping process
- Guide users through the shopping experience

Important constraints:
- ONLY answer questions related to products, orders, and shopping
- NEVER fabricate product links or inventory information
- For sensitive operations (account changes, payment info), direct users to the official UI
- If you don't know something, admit it honestly
- Keep responses concise and actionable

Context provided to you:
- User's current browsing context
- Recent order history (if logged in)
- Previous conversation history

Always maintain a premium, trustworthy brand voice that reflects Vibe Commerce's quality standards.`;

/**
 * Generate streaming chat response
 */
export async function* generateChatStream(
  apiKey: string,
  userMessage: string,
  conversationHistory: Array<{ role: 'user' | 'model'; parts: string }> = [],
  context?: {
    currentProductId?: string;
    recentOrders?: string[];
    userPreferences?: string[];
  }
): AsyncGenerator<string, void, unknown> {
  const genAI = initGemini(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    systemInstruction: SYSTEM_PROMPT,
  });

  // Build context string
  let contextStr = '';
  if (context) {
    if (context.currentProductId) {
      contextStr += `\nCurrent product: ${context.currentProductId}`;
    }
    if (context.recentOrders && context.recentOrders.length > 0) {
      contextStr += `\nRecent orders: ${context.recentOrders.join(', ')}`;
    }
    if (context.userPreferences && context.userPreferences.length > 0) {
      contextStr += `\nUser interests: ${context.userPreferences.join(', ')}`;
    }
  }

  const fullMessage = contextStr
    ? `${contextStr}\n\nUser: ${userMessage}`
    : userMessage;

  // Convert conversation history to Gemini format
  const history = conversationHistory.map((msg) => ({
    role: msg.role,
    parts: [{ text: msg.parts }],
  }));

  const chat = model.startChat({
    history,
    generationConfig: {
      maxOutputTokens: 500,
      temperature: 0.7,
      topP: 0.8,
      topK: 40,
    },
  });

  const result = await chat.sendMessageStream(fullMessage);

  // Stream the response
  for await (const chunk of result.stream) {
    const chunkText = chunk.text();
    yield chunkText;
  }
}

/**
 * Generate non-streaming chat response
 */
export async function generateChatResponse(
  apiKey: string,
  userMessage: string,
  conversationHistory: Array<{ role: 'user' | 'model'; parts: string }> = [],
  context?: {
    currentProductId?: string;
    recentOrders?: string[];
    userPreferences?: string[];
  }
): Promise<string> {
  const genAI = initGemini(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    systemInstruction: SYSTEM_PROMPT,
  });

  // Build context string
  let contextStr = '';
  if (context) {
    if (context.currentProductId) {
      contextStr += `\nCurrent product: ${context.currentProductId}`;
    }
    if (context.recentOrders && context.recentOrders.length > 0) {
      contextStr += `\nRecent orders: ${context.recentOrders.join(', ')}`;
    }
    if (context.userPreferences && context.userPreferences.length > 0) {
      contextStr += `\nUser interests: ${context.userPreferences.join(', ')}`;
    }
  }

  const fullMessage = contextStr
    ? `${contextStr}\n\nUser: ${userMessage}`
    : userMessage;

  // Convert conversation history to Gemini format
  const history = conversationHistory.map((msg) => ({
    role: msg.role,
    parts: [{ text: msg.parts }],
  }));

  const chat = model.startChat({
    history,
    generationConfig: {
      maxOutputTokens: 500,
      temperature: 0.7,
      topP: 0.8,
      topK: 40,
    },
  });

  const result = await chat.sendMessage(fullMessage);
  return result.response.text();
}
