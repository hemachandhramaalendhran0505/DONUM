import { GoogleGenAI, Type } from "@google/genai";
import { Category, Urgency } from '../types';

// ✅ Secure API Key from .env (empty fallback → mocks)
const apiKey: string = (import.meta.env as any).VITE_GEMINI_API_KEY || "";


const ai = new GoogleGenAI({ apiKey });

/**
 * Analyzes natural language/images → structured donation (VISUAL FIRST)
 */
export const analyzeDonationInput = async (input: string, images: string[] = []): Promise<{
  title: string;
  category: Category;
  quantity: string;
  urgency: Urgency;
  location?: string;
  imageAnalysis?: string;
  error?: string;
}> => {
  try {
    const parts: any[] = [];

    // Process base64 images
    images.forEach((img) => {
      const matches = img.match(/^data:(.+);base64,(.+)$/);
      if (matches) {
        parts.push({
          inlineData: {
            mimeType: matches[1],
            data: matches[2],
          },
        });
      }
    });

    // Strict visual-first prompt
    parts.push({
      text: `Analyze IMAGES FIRST (visual details: color/brand/condition/quantity).
Secondary: "${input}"

CRITICAL RULES:
- TITLE: "[Color] [Material] [Item] [Brand] [Qty]" e.g. "Blue Cotton Shirt Nike (2 pcs)"
- Food: Urgency=Critical (hot)/High (perish)/Medium (dry)
- Medical/Clothes: Medium (High if damaged)
- Books/Electronics: Low-Medium

Return STRICT JSON (no markdown):
{
  "title": "EXACT visual title",
  "imageAnalysis": "Detailed visual desc",
  "category": "${['Food','Clothes','Books','Stationery','Electronics','Medical','Other'].join('|')}",
  "quantity": "Visual qty e.g. '5 bags'",
  "urgency": "${['Low','Medium','High','Critical'].join('|')}",
  "location": "from text only or empty"
}`
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            imageAnalysis: { type: Type.STRING },
            category: { type: Type.STRING, enum: ['Food','Clothes','Books','Stationery','Electronics','Medical','Other'] },
            quantity: { type: Type.STRING },
            urgency: { type: Type.STRING, enum: ['Low','Medium','High','Critical'] },
            location: { type: Type.STRING }
          },
          required: ["title", "category", "urgency", "quantity"]
        }
      }
    });

    let jsonString = response.text || "{}";
    // Robust markdown stripping
    jsonString = jsonString.replace(/^```json\s*/g, '').replace(/\s*```$/g, '').replace(/^```\s*/g, '').replace(/\s*```$/g, '').trim();

    const parsed = JSON.parse(jsonString);
    console.log('🔍 AI Vision Result:', parsed);
    return parsed;

  } catch (error: any) {
    console.error("Gemini Vision failed:", error.message || error);
    // Contextual keyword mock
    const lowerInput = input.toLowerCase();
    if (lowerInput.includes('book') || lowerInput.includes('textbook')) {
      return { title: "School Books", category: "Books", quantity: "5 books", urgency: "Low" as Urgency, error: "ai_quota" };
    } else if (lowerInput.includes('food') || lowerInput.includes('rice') || lowerInput.includes('meal')) {
      return { title: "Packed Food", category: "Food", quantity: "5kg", urgency: "High" as Urgency, error: "ai_quota" };
    } else if (lowerInput.includes('cloth') || lowerInput.includes('shirt') || lowerInput.includes('dress')) {
      return { title: "Clothing Items", category: "Clothes", quantity: "10 pcs", urgency: "Medium" as Urgency, error: "ai_quota" };
    }
    return { title: input.substring(0, 50) || "Donation Item", category: "Other" as Category, quantity: "1", urgency: "Medium" as Urgency, error: "ai_quota" };
  }
};

/**
 * Contextual chat with Maps grounding
 */
export const chatWithBot = async (
  history: {role: 'user' | 'model', parts: {text: string}[] }[],
  message: string,
  userLocation?: { lat: number, lng: number }
) => {
  try {
    const config: any = {
      tools: [{ googleMaps: {} }],
      systemInstruction: "DONUM AI: Help donors/volunteers/receivers. Use Maps for local shelters/food banks. Concise, helpful."
    };

    if (userLocation) {
      config.toolConfig = {
        retrievalConfig: { latLng: { latitude: userLocation.lat, longitude: userLocation.lng } }
      };
    }

    const chat = ai.chats.create({ model: 'gemini-2.5-flash', history, config });
    const result = await chat.sendMessage(message);



    return {
      text: result.text || "Thanks for helping the community!",
      groundingChunks: result.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  } catch (error: any) {
    console.error("Chat failed:", error.message || error);
    // Smart fallback
    const lowerMsg = message.toLowerCase();
    if (lowerMsg.includes('food')) return { text: "Food → Madiwala Shelter (map pin). High urgency needs!" };
    if (lowerMsg.includes('clothes')) return { text: "Clothes → Goonj (check Volunteer tab)." };
    if (lowerMsg.includes('book')) return { text: "Books → Pratham Whitefield. Donate now!" };
    return { text: "Donate Food/Clothes/Books → Map shows urgent nearby (5km).", groundingChunks: [] };
  }
};

/**
 * Impact story from stats
 */
export const generateImpactStory = async (stats: { livesImpacted: number, wasteDivertedKg: number }) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ text: `Inspiring 2-sentence story: Impacted ${stats.livesImpacted} lives, diverted ${stats.wasteDivertedKg}kg waste. Heroic/warm tone.` }]
    });
    return response.text || "";
  } catch (error: any) {
    console.error("Story gen failed:", error.message || error);
    return `Your donations impacted ${stats.livesImpacted} lives & saved ${stats.wasteDivertedKg}kg waste. You're a community hero! 🌟`;
  }
};

/**
 * AI-optimized task sort for volunteers
 */
export const smartSortTasks = async (tasks: any[]) => {
  try {
    if (!tasks?.length) return [];
    const summaries = tasks.map(t => `ID:${t.id} ${t.title} (${t.urgency}, ${t.location})`).join('\n');
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ text: `Optimal volunteer pickup order (High urgency first, cluster locations):\n${summaries}\nReturn ONLY: ["id1","id2",...] JSON array` }],
      config: { responseMimeType: "application/json", responseSchema: { type: Type.OBJECT, properties: { sortedIds: { type: Type.ARRAY, items: { type: Type.STRING } } } } }
    });

    let jsonString = response.text || "[]";
    jsonString = jsonString.replace(/^```json\s*/g, '').replace(/\s*```$/g, '').trim();
    const result = JSON.parse(jsonString);
    return result.sortedIds || tasks.map(t => t.id);
  } catch (e: any) {
    console.error("Sort failed:", e.message || e);
    return tasks.map(t => t.id); // Original order fallback
  }
};

