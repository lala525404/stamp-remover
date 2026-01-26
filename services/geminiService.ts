
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function analyzeSealImage(base64Image: string): Promise<string> {
  try {
    // Fixed contents structure to use { parts: [...] } instead of array of objects
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { text: "This is a red stamp/seal on a document. Please analyze its clarity, the intensity of the red ink, and any potential noise or bleeding. Provide a brief professional advice on how to get the cleanest extraction." },
          { 
            inlineData: { 
              mimeType: 'image/png', 
              data: base64Image.split(',')[1] 
            } 
          }
        ]
      },
      config: {
        maxOutputTokens: 300,
        temperature: 0.7
      }
    });

    // Directly access the text property as per guidelines
    return response.text || "Analysis unavailable.";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "Could not perform AI analysis at this time.";
  }
}
