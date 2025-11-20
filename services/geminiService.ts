import { GoogleGenAI, Type } from "@google/genai";
import { Medicine } from "../types";

const getClient = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        console.warn("API Key not found in environment variables.");
        return null;
    }
    return new GoogleGenAI({ apiKey });
};

export const analyzePrescriptionSafety = async (
    diagnosis: string,
    medicines: Medicine[]
): Promise<{ safe: boolean; warnings: string[]; advice: string }> => {
    const ai = getClient();
    if (!ai) {
        return { safe: true, warnings: ["AI Service Unavailable"], advice: "Could not verify interactions." };
    }

    const medicinesList = medicines.map(m => `${m.name} (${m.dosage})`).join(", ");
    const prompt = `
        Patient Diagnosis: ${diagnosis}
        Prescribed Medicines: ${medicinesList}
        
        Task:
        1. Check for drug-drug interactions.
        2. Check for contraindications with the diagnosis.
        3. Suggest 1-2 lines of general lifestyle advice for this condition.
        
        Output JSON format strictly.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        safe: { type: Type.BOOLEAN },
                        warnings: { 
                            type: Type.ARRAY, 
                            items: { type: Type.STRING } 
                        },
                        advice: { type: Type.STRING }
                    },
                    required: ["safe", "warnings", "advice"]
                }
            }
        });

        const text = response.text;
        if (text) {
            return JSON.parse(text);
        }
        return { safe: true, warnings: [], advice: "" };
    } catch (error) {
        console.error("Gemini API Error:", error);
        return { safe: true, warnings: ["Error analyzing prescription"], advice: "" };
    }
};