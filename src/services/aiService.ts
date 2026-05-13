import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function getFinancialAdvice(userContext: any, query: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          text: `You are SaccoSwift AI, a financial advisor for a Kenyan SACCO. 
          User Context: ${JSON.stringify(userContext)}
          
          User Question: ${query}`
        }
      ],
      config: {
        systemInstruction: "Provide professional, encouraging, and accurate financial advice based on the user's SACCO data. Focus on savings, loan qualification, and financial stability. Use a helpful and respectful tone appropriate for a SACCO member in Kenya.",
        temperature: 0.7,
      }
    });

    return response.text;
  } catch (error) {
    console.error("AI Service Error:", error);
    return "I'm sorry, I'm having trouble processing your request right now. Please try again later.";
  }
}

export async function analyzeCreditScore(userContext: any) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          text: `Evaluate the creditworthiness of this SACCO member based on their activity: ${JSON.stringify(userContext)}.
          Provide a score from 300 to 850 and a brief justification.`
        }
      ],
      config: {
        systemInstruction: "You are a credit scoring AI. Analyze savings behavior, loan history, and transaction patterns to estimate a credit score.",
        responseMimeType: "application/json",
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("AI Credit Scoring Error:", error);
    return { score: "N/A", justification: "Analysis unavailable." };
  }
}
