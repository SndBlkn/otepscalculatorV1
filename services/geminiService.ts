import { GoogleGenAI, Type } from "@google/genai";
import { OTDeviceCategory, CalculationResult } from '../types';

// Define the response schema for structured output
const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
      description: "A professional executive summary of the OT infrastructure sizing.",
    },
    riskAssessment: {
      type: Type.STRING,
      description: "Analysis of potential visibility gaps based on the device mix (e.g., high PLC count but low switch logging).",
    },
    storageStrategy: {
      type: Type.STRING,
      description: "Recommendations for hot/warm/cold storage based on the calculated volume.",
    },
    keyRecommendations: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of 3-4 actionable recommendations for the SOC implementation.",
    }
  },
  required: ["summary", "riskAssessment", "storageStrategy", "keyRecommendations"],
};

export const analyzeInfrastructure = async (
  devices: OTDeviceCategory[],
  results: CalculationResult
) => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error("API Key not found");
    }

    const ai = new GoogleGenAI({ apiKey });

    // Prepare a prompt context
    const deviceSummary = devices
      .filter(d => d.count > 0)
      .map(d => `- ${d.name} [${d.logSourceType}]: ${d.count} units (Est. ${d.count * d.baseEpsMultiplier} EPS)`)
      .join('\n');

    const prompt = `
      Act as a Senior OT Security Architect. 
      Analyze the following Operational Technology (OT) infrastructure for a SOC sizing project.
      
      Total Estimated EPS: ${results.totalEps.toFixed(0)}
      Daily Data Volume: ${results.dailyLogsGB.toFixed(2)} GB
      
      Asset Inventory:
      ${deviceSummary}
      
      Provide a professional assessment focusing on:
      1. Does the EPS vs. Asset count ratio look realistic for an OT environment considering the Log Source Types selected?
      2. Are there potential blind spots? (e.g., using Syslog for PLCs vs NetFlow for switches).
      3. Storage advice (Hot/Cold retention) for compliance (NIST/IEC 62443).
      
      Keep the tone technical, professional, and concise.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        temperature: 0.4, // Low temperature for more analytical/deterministic output
      }
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text);

  } catch (error) {
    console.error("Gemini analysis failed:", error);
    throw error;
  }
};