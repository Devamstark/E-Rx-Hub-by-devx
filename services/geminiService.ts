
import { GoogleGenAI, Type } from "@google/genai";
import { Medicine, InventoryItem, Sale } from "../types";

const getClient = () => {
    let apiKey = '';
    try {
        // Safety check: process might not be defined in strict browser environments
        if (typeof process !== 'undefined' && process.env?.API_KEY) {
            apiKey = process.env.API_KEY;
        }
    } catch (e) {
        console.warn("Environment variable access failed");
    }

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

export const getPharmacyAIInsights = async (
    inventory: InventoryItem[],
    recentSales: Sale[]
): Promise<{ 
    reorderSuggestions: { itemName: string, reason: string }[], 
    pricingTips: { itemName: string, tip: string }[],
    anomalies: string[] 
}> => {
    const ai = getClient();
    if (!ai) {
        return { reorderSuggestions: [], pricingTips: [], anomalies: ["AI Unavailable"] };
    }

    // Prepare summary data to avoid sending too much tokens
    const lowStock = inventory.filter(i => i.stock < i.minStockLevel).map(i => `${i.name} (Stock: ${i.stock})`);
    const salesSummary = recentSales.slice(0, 5).map(s => `Sale ${s.invoiceNumber}: ${s.roundedTotal}`).join(", ");
    const nearExpiry = inventory.filter(i => {
        const diff = new Date(i.expiryDate).getTime() - new Date().getTime();
        return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000;
    }).map(i => `${i.name} (Exp: ${i.expiryDate})`);

    const prompt = `
        Analyze this pharmacy data:
        Low Stock Items: ${lowStock.join(", ")}
        Near Expiry Items: ${nearExpiry.join(", ")}
        Recent Sales Sample: ${salesSummary}
        
        Provide:
        1. 3 Reorder suggestions based on low stock or logic.
        2. 2 Pricing/Sales tips (e.g. discount near expiry).
        3. Identify any data anomalies or billing risks if apparent.
        
        Return JSON.
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
                        reorderSuggestions: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    itemName: { type: Type.STRING },
                                    reason: { type: Type.STRING }
                                }
                            }
                        },
                        pricingTips: {
                             type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    itemName: { type: Type.STRING },
                                    tip: { type: Type.STRING }
                                }
                            }
                        },
                        anomalies: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        }
                    }
                }
            }
        });
        
        const text = response.text;
        if (text) {
             return JSON.parse(text);
        }
        return { reorderSuggestions: [], pricingTips: [], anomalies: [] };

    } catch (e) {
        console.error("AI Insight Error", e);
        return { reorderSuggestions: [], pricingTips: [], anomalies: ["Analysis Failed"] };
    }
};
