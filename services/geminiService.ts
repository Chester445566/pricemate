
import { GoogleGenAI, Type } from "@google/genai";

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  console.warn("API_KEY not found in environment variables. Gemini features will be disabled.");
}
const ai = new GoogleGenAI({ apiKey: API_KEY! });

export interface ImageAnalysisResult {
    detectedBrand: string | null;
    detectedModel: string | null;
    damageScore: number;
    description: string;
}

const fileToGenerativePart = (base64Data: string, mimeType: string) => {
  return {
    inlineData: {
      data: base64Data,
      mimeType
    },
  };
};

export const analyzeImageWithGemini = async (base64Image: string, mimeType: string): Promise<ImageAnalysisResult> => {
    if(!API_KEY) {
        // Return a mock response if API key is not available
        return {
            detectedBrand: "Samsung",
            detectedModel: "Galaxy S22",
            damageScore: 0.1,
            description: "A Samsung Galaxy S22 phone in good condition with minor scratches on the screen."
        };
    }
    
    const imagePart = fileToGenerativePart(base64Image, mimeType);
    
    const prompt = "Analyze the image of this product. Identify its brand, model, and overall condition. Provide a short description. Also, provide a damage score from 0 (mint condition) to 1 (heavily damaged).";

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: [imagePart, { text: prompt }] },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        detectedBrand: {
                            type: Type.STRING,
                            description: "The identified brand of the product, or null if not identifiable."
                        },
                        detectedModel: {
                            type: Type.STRING,
                            description: "The identified model of the product, or null if not identifiable."
                        },
                        damageScore: {
                            type: Type.NUMBER,
                            description: "A score from 0.0 to 1.0 indicating the level of damage."
                        },
                        description: {
                            type: Type.STRING,
                            description: "A brief one-sentence description of the item and its condition."
                        }
                    },
                    required: ["detectedBrand", "detectedModel", "damageScore", "description"]
                }
            }
        });
        
        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText);
        return result;

    } catch (error) {
        console.error("Error analyzing image with Gemini:", error);
        throw new Error("Failed to analyze image.");
    }
};
