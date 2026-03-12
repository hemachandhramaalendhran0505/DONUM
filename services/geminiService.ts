import { GoogleGenAI, Type } from "@google/genai";
import { Category, Urgency } from '../types';

// Initialize Gemini with the provided API Key from environment variables
// Note: If this key is over quota or invalid, the service will fallback to mock data.
const apiKey = "AIzaSyDd4DiCC6a_H-BgSASqPW3JrbcEyK8Tq3k";
const ai = new GoogleGenAI({ apiKey });

/**
 * Analyzes natural language input to extract structured donation details.
 */
export const analyzeDonationInput = async (input: string, images: string[] = []) => {
  try {
    const parts: any[] = [];

    // Process images if provided
    if (images && images.length > 0) {
      images.forEach((img) => {
        // img is expected to be a Data URL (e.g., "data:image/jpeg;base64,...")
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
    }

    // Add text prompt with Strict Classification Rules
    parts.push({
      text: `Analyze the provided images (up to 5) and text to create a structured donation listing.
      
      STRICT IMAGE CLASSIFICATION RULES:
      1. Look at ALL provided images. The image content is the primary source of truth.
      2. If ANY image contains food, the 'category' MUST be 'Food'.
      3. If images contain different items, prioritize Food, then Medical, then Clothes, then others.

      FOOD ATTRIBUTE DETECTION (Crucial):
      - Identify if the food appears HOT (steam, fresh cooking) or COLD.
      - Identify if it is PACKED (boxes, sealed packets) or OPEN (in pots/containers).
      - Identify if it is Fresh Produce or Cooked Meals.
      - Include these attributes in the TITLE. E.g., "Hot Packed Veg Biryani", "Fresh Cold Milk", "Leftover Wedding Sambar (In Container)".

      TITLE GENERATION INSTRUCTIONS:
      - Combine findings from all images.
      - Format: "[Attribute] [Item Name] [Quantity hint if visible]"
      - Examples: 
        - "5 Boxes of Hot Veg Meals"
        - "Bag of Fresh Tomatoes and Onions"
        - "Bundle of 3 Cotton Shirts and 1 Denim Jacket"
        - "Stack of Class 10 Physics Textbooks"

      URGENCY RULES:
      - Hot/Cooked Food: 'Critical'
      - Perishable/Cold Food: 'High'
      - Packed/Dry Food: 'Medium'
      - Non-food: 'Low' or 'Medium'

      User Context Text: "${input}"`
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Specific name of the item including attributes (Hot, Packed, etc.) identified in the image" },
            category: { 
              type: Type.STRING, 
              enum: ['Food', 'Clothes', 'Books', 'Stationery', 'Electronics', 'Medical', 'Other'],
              description: "The strict category based on image analysis"
            },
            quantity: { type: Type.STRING, description: "Estimated quantity e.g., '5 kg', '2 bags', '10 pieces'" },
            urgency: { 
              type: Type.STRING, 
              enum: ['Low', 'Medium', 'High', 'Critical'],
              description: "Urgency level based on perishability" 
            },
            location: { type: Type.STRING, description: "Extracted location if present in text, else empty string" }
          },
          required: ["title", "category", "urgency", "quantity"]
        }
      }
    });

    let jsonString = response.text || "{}";
    
    // Clean up potential markdown formatting often returned by LLMs
    if (jsonString.startsWith('```json')) {
        jsonString = jsonString.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (jsonString.startsWith('```')) {
        jsonString = jsonString.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Gemini analysis failed (Quota/Network):", error);
    
    // MOCK FALLBACK for Demo Purposes
    // If text contains keywords, return relevant mock data
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('book') || lowerInput.includes('study')) {
        return {
            title: "School Textbooks (Mock)",
            category: "Books",
            quantity: "1 Set",
            urgency: "Low",
            location: ""
        };
    } else if (lowerInput.includes('shirt') || lowerInput.includes('cloth')) {
        return {
            title: "Cotton Shirts (Mock)",
            category: "Clothes",
            quantity: "5 pcs",
            urgency: "Medium",
            location: ""
        };
    }

    // Default Mock
    return {
        title: "Assorted Food Items (Mock AI)",
        category: "Food",
        quantity: "10 meals",
        urgency: "High",
        location: ""
    };
  }
};

/**
 * Chat with the AI Assistant using Google Maps Grounding
 */
export const chatWithBot = async (
    history: {role: 'user' | 'model', parts: {text: string}[]}[], 
    message: string,
    userLocation?: { lat: number, lng: number }
) => {
  try {
    const config: any = {
      tools: [{ googleMaps: {} }],
      systemInstruction: "You are the DONUM Platform AI Assistant. You help Donors, Volunteers, and Receivers.\n" +
      "- Use Google Maps to find real-world locations for donation centers, shelters, or food banks when asked.\n" +
      "- If a donor asks what to donate, suggest seasonal items (e.g., clothes in winter, books before school starts).\n" +
      "- If a volunteer asks about routes, explain you can optimize them.\n" +
      "- Keep answers concise, friendly, and focused on charity/logistics.",
    };

    // Add user location to tool config for accurate local results
    if (userLocation) {
        config.toolConfig = {
            retrievalConfig: {
                latLng: {
                    latitude: userLocation.lat,
                    longitude: userLocation.lng
                }
            }
        };
    }

    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      history: history,
      config: config
    });

    const result = await chat.sendMessage({ message });
    
    // Extract grounding metadata for maps
    const groundingChunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks;

    return {
        text: result.text,
        groundingChunks: groundingChunks
    };
  } catch (error) {
    console.error("Chat failed:", error);
    return {
        text: "I'm currently running in low-power mode (Quota Exceeded). But I can tell you that donating food and clothes is always a great idea! Please check the map for nearby centers.",
        groundingChunks: undefined
    };
  }
};

/**
 * Generates an inspiring impact story based on stats.
 */
export const generateImpactStory = async (stats: { livesImpacted: number, wasteDivertedKg: number }) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Write a very short (2 sentences), inspiring message about a user who has impacted ${stats.livesImpacted} lives and diverted ${stats.wasteDivertedKg}kg of waste. Tone: Heroic, Warm.`,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini story generation failed:", error);
    return "Your heroic efforts have touched many lives. By sharing what you have, you are building a bridge of hope and sustainability.";
  }
};

/**
 * Matches a volunteer to a list of tasks based on efficiency.
 */
export const smartSortTasks = async (tasks: any[]) => {
  try {
      if (!tasks || tasks.length === 0) return [];

      const taskSummaries = tasks.map(t => `ID: ${t.id}, Item: ${t.title}, Urgency: ${t.urgency}, Loc: ${t.location}`).join('\n');
      
      const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: `Rank these donation pickup tasks for a volunteer. Prioritize High/Critical urgency first, then group by location proximity logic. Return only the list of IDs in optimal order.
          
          Tasks:
          ${taskSummaries}`,
          config: {
              responseMimeType: "application/json",
              responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                      sortedIds: {
                          type: Type.ARRAY,
                          items: { type: Type.STRING }
                      }
                  }
              }
          }
      });
      const result = JSON.parse(response.text || "{}");
      return result.sortedIds || [];
  } catch (e) {
      console.error("Smart sort failed", e);
      // Fallback: Return original order if AI sort fails
      return tasks.map(t => t.id); 
  }
}