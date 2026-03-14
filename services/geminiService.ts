import { GoogleGenAI, Type } from "@google/genai";
import { Category, Urgency } from '../types';

// Initialize Gemini with the provided API Key from environment variables
// Note: If this key is over quota or invalid, the service will fallback to mock data.
const apiKey = (import.meta.env as any).VITE_GEMINI_API_KEY || "AIzaSyDd4DiCC6a_H-BgSASqPW3JrbcEyK8Tq3k";
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
      
      EXACT VISUAL ANALYSIS (Primary):
      VISUAL FIRST: Analyze IMAGES before text. Provide EXACT item details:
      - Color, material, brand/logo, condition (new/good/worn).
      - E.g., 'Blue Cotton Polo Shirt with Nike logo (Size M, Good condition)'
      
      STRICT IMAGE CLASSIFICATION (Same priority):
      1. Food → 'Food' (hot/cold/packed/fresh)
      2. Medical → 'Medical'
      3. Clothes → 'Clothes' 
      4. Books/Electronics → respective categories
      
      TITLE RULES:
      - EXACT description from image: "[Color] [Material] [Item] [Brand if visible] [Qty hint]"
      - Examples:
        * Clothes: "Blue Cotton Shirt (2 pieces)"
        * Food: "Hot Packed Veg Biryani (5 boxes)"
        * Books: "Class 10 Physics Textbook (Stack of 4)"
      
      URGENCY:
      - Food: Hot=Critical, Cold/Perishable=High, Dry=Medium
      - Clothes/Medical: Medium (unless damaged=High)
      - Books/Electronics: Low
      - Other: Medium
      
      User Text Context: "${input}" (secondary to images)
    `});

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { 
              type: Type.STRING, 
              description: "EXACT item name from image analysis (include color/material/brand)" 
            },
            imageAnalysis: { 
              type: Type.STRING, 
              description: "Detailed visual description: color, material, condition, brands" 
            },
            category: { 
              type: Type.STRING, 
              enum: ['Food', 'Clothes', 'Books', 'Stationery', 'Electronics', 'Medical', 'Other'],
              description: "Category from visual priority rules"
            },
            quantity: { 
              type: Type.STRING, 
              description: "Visual quantity estimate: '1 shirt', '5 books', '2kg rice'" 
            },
            urgency: { 
              type: Type.STRING, 
              enum: ['Low', 'Medium', 'High', 'Critical'],
              description: "Visual perishability/condition-based urgency" 
            },
            location: { 
              type: Type.STRING, 
              description: "From text only, empty if none" 
            }
          },
          required: ["title", "category", "urgency", "quantity"]
        }
      }
    });

    let jsonString = response.text || "{}";
    // Clean up potential markdown formatting often returned by LLMs - FIXED VERSION
    const markdownJsonStart = '\\`\\`\\`json';
    const markdownStart = '\\`\\`\\`';
    if (jsonString.startsWith('```json')) {
        jsonString = jsonString.replace(/^```json\\s*/, '').replace(/\\s*```$/, '');
    } else if (jsonString.startsWith('```')) {
        jsonString = jsonString.replace(/^```\\s*/, '').replace(/\\s*```$/, '');
    }

    const parsedResult = JSON.parse(jsonString);
    
    // Log for debugging exact details
    console.log('🔍 AI Image Analysis:', parsedResult);
    
    return parsedResult;
  } catch (error) {
    console.error("Gemini analysis failed (Quota/Network):", error);
    
    console.error("Gemini quota/network error. Using enhanced contextual mock:", { input, error });
    
    // ENHANCED CONTEXTUAL MOCK FALLBACK - Dynamic based on input keywords
    const lowerInput = input.toLowerCase().trim();
    
    // Comprehensive keyword mapping
    if (lowerInput.includes('book') || lowerInput.includes('study') || lowerInput.includes('textbook')) {
        return {
            title: "School Textbooks (Smart Mock)",
            category: "Books" as const,
            quantity: "2-5 books",
            urgency: "Low",
            location: "",
            error: "ai_quota_exceeded"
        };
    } else if (lowerInput.includes('shirt') || lowerInput.includes('cloth') || lowerInput.includes('pants') || lowerInput.includes('dress')) {
        return {
            title: "Mixed Clothing Items (Smart Mock)",
            category: "Clothes" as const,
            quantity: "10 pieces",
            urgency: "Medium",
            location: "",
            error: "ai_quota_exceeded"
        };
    } else if (lowerInput.includes('food') || lowerInput.includes('meal') || lowerInput.includes('rice') || lowerInput.includes('bread')) {
        return {
            title: "Packed Food Items (Smart Mock)",
            category: "Food" as const,
            quantity: "5 kg",
            urgency: "High",
            location: "",
            error: "ai_quota_exceeded"
        };
    } else if (lowerInput.includes('medicine') || lowerInput.includes('drug') || lowerInput.includes('pill') || lowerInput.includes('syrup')) {
        return {
            title: "Basic Medical Supplies (Smart Mock)",
            category: "Medical" as const,
            quantity: "1 box",
            urgency: "Critical",
            location: "",
            error: "ai_quota_exceeded"
        };
    } else if (lowerInput.includes('laptop') || lowerInput.includes('phone') || lowerInput.includes('tablet')) {
        return {
            title: "Used Electronics (Smart Mock)",
            category: "Electronics" as const,
            quantity: "1-2 items",
            urgency: "Medium",
            location: "",
            error: "ai_quota_exceeded"
        };
    }
    
    // Smart generic fallback based on input length/content
    const genericTitle = lowerInput || "Community Donation Items";
    return {
        title: `${genericTitle.substring(0, 30)}... (Smart Mock)`,
        category: "Other" as const,
        quantity: lowerInput.length > 20 ? "Multiple items" : "1 bundle",
        urgency: "Medium",
        location: "",
        error: "ai_quota_exceeded"
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
    // Intelligent fallback
    const lowerMsg = message.toLowerCase();
    let response = "Thanks! ";
    
    if (lowerMsg.includes('food') || lowerMsg.includes('rice') || lowerMsg.includes('meal') || lowerMsg.includes('eat')) {
        response += "Food donations save lives! Check Madiwala Shelter or Akshaya Patra on the map.";
    } else if (lowerMsg.includes('clothes') || lowerMsg.includes('shirt') || lowerMsg.includes('dress')) {
        response += "Clothing for Goonj Foundation—see volunteer feed for urgent needs!";
    } else if (lowerMsg.includes('book') || lowerMsg.includes('study')) {
        response += "Books needed at Pratham—Whitefield area. View categories!";
    } else if (lowerMsg.includes('volunteer') || lowerMsg.includes('help')) {
        response += "Volunteers welcome! Check Volunteer tab for food runs nearby.";
    } else if (lowerMsg.includes('nearby') || lowerMsg.includes('location')) {
        response += "Map shows all donations within 5km—tap for directions!";
    } else {
        response += "Donate food/clothes/books, volunteer, or check map for urgent needs!";
    }
    
    return {
        text: response,
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

      const taskSummaries = tasks.map(t => `ID: ${t.id}, Item: ${t.title}, Urgency: ${t.urgency}, Loc: ${t.location}`).join('\\n');
      
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
      // Fallback: Return original order if AI sort failed
      return tasks.map(t => t.id); 
  }
}

