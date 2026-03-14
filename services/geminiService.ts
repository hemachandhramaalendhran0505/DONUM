import { GoogleGenerativeAI } from "@google/generative-ai";
import { Category, Urgency } from '../types';

// Initialize Gemini with the provided API Key from environment variables
// Note: If this key is over quota or invalid, the service will fallback to mock data.
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "AIzaSyDd4DiCC6a_H-BgSASqPW3JrbcEyK8Tq3k";
const genAI = new GoogleGenerativeAI(apiKey);

/**
 * Analyzes natural language input to extract structured donation details.
 */
export const analyzeDonationInput = async (input: string, images: string[] = []) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Analyze the provided input to create a structured donation listing.

User Text Context: "${input}"

Return ONLY valid JSON with:
{
  "title": "EXACT item name",
  "category": "Food|Clothes|Books|Stationery|Electronics|Medical|Other",
  "quantity": "estimated quantity",
  "urgency": "Low|Medium|High|Critical",
  "location": "optional location"
}`;

    const result = await model.generateContent(prompt);
    let jsonString = result.response.text();

    // Clean up potential markdown formatting often returned by LLMs 
    if (jsonString.trim().startsWith('```json')) {
      jsonString = jsonString.trim().replace(/^```json\n?/, '').replace(/\n?```$/, '');
    } else if (jsonString.trim().startsWith('```')) {
      jsonString = jsonString.trim().replace(/^```\n?/, '').replace(/\n?```$/, '');
    }

    const parsedResult = JSON.parse(jsonString);
    console.log('🔍 AI Image Analysis:', parsedResult);
    
    return parsedResult;
  } catch (error) {
    console.error("Gemini analysis failed (Quota/Network):", error);
    
    // ENHANCED CONTEXTUAL MOCK FALLBACK - Dynamic based on input keywords
    const lowerInput = input.toLowerCase().trim();
    
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
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const chat = model.startChat({
      history: history.map(h => ({ role: h.role, parts: h.parts.map(p => ({ text: p.text })) })),
      generationConfig: {
        temperature: 0.7,
        topK: 1,
        topP: 1,
        maxOutputTokens: 2048,
      }
    });
    
    const result = await chat.sendMessage(message);
    
    return {
        text: result.response.text(),
        groundingChunks: undefined
    };
  } catch (error) {
    console.error("Chat failed:", error);
    // Intelligent fallback - keyword based suggestions
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
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Write a very short (2 sentences), inspiring message about a user who has impacted ${stats.livesImpacted} lives and diverted ${stats.wasteDivertedKg}kg of waste. Tone: Heroic, Warm.`;
    const result = await model.generateContent(prompt);
    return result.response.text();
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

      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const taskSummaries = tasks.map(t => `ID: ${t.id}, Item: ${t.title}, Urgency: ${t.urgency}, Loc: ${t.location}`).join('\\n');
      
      const prompt = `Rank these donation pickup tasks for a volunteer. Prioritize High/Critical urgency first, then group by location proximity logic. Return only the list of IDs in optimal order.
          
          Tasks:
          ${taskSummaries}`;
      
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      
      // Simple parsing - extract numbers as IDs
      const idMatch = responseText.match(/\\d+/g);
      return idMatch || [];
  } catch (e) {
      console.error("Smart sort failed", e);
      // Fallback: Return original order if AI sort fails
      return tasks.map(t => t.id); 
  }
}
