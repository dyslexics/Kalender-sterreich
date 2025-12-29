
import { GoogleGenAI } from "@google/genai";

const hasApiKey = !!process.env.API_KEY;
const ai = hasApiKey ? new GoogleGenAI({ apiKey: process.env.API_KEY! }) : null;

export async function getAustrianFact(date: string) {
  if (!ai) return "Wussten Sie, dass Österreich zu über 60% aus Bergen besteht?";
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Provide a short, interesting cultural fact or tradition about Austria related to the month or season of ${date}. Keep it under 200 characters. Return plain text only.`,
    });
    return response.text || "Österreich ist bekannt für seine Kaffeekultur und Gastfreundschaft.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Genießen Sie die österreichische Lebensart!";
  }
}
