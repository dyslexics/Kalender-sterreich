
import { GoogleGenAI } from "@google/genai";

// Always use named parameter for apiKey and obtain it exclusively from process.env.API_KEY.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function getAustrianFact(date: string) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Provide a short, interesting cultural fact or tradition about Austria related to the month or season of ${date}. Keep it under 200 characters. Return plain text only.`,
    });
    // .text is a property, not a method.
    return response.text || "Austria is known for its stunning Alpine landscapes and rich musical history.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Enjoy the beautiful Austrian culture today!";
  }
}
