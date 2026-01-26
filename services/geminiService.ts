import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// [수정됨 1] Vercel 환경 변수 이름과 Vite 문법에 맞게 변경
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

export async function analyzeSealImage(base64Image: string): Promise<string> {
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      // [수정됨 2] 모델명을 안정적인 버전으로 변경 (3버전은 아직 없을 수 있음)
      model: 'gemini-1.5-flash', 
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

    return response.text || "Analysis unavailable.";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "Could not perform AI analysis at this time.";
  }
}
