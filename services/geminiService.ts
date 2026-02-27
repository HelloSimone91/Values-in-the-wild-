
import { GoogleGenAI, Type } from "@google/genai";
import { ResonanceOption, ValueEntry } from "../types";
import { SYSTEM_INSTRUCTION } from "../constants";

// Helper to initialize the client with the required parameter format
export const getClient = () => {
  if (!process.env.API_KEY) {
    throw new Error("API Key not found");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// Schema for Resonance Menu
const resonanceSchema = {
  type: Type.OBJECT,
  properties: {
    options: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          value: { type: Type.STRING, description: "The identified value (noun)" },
          reason: { type: Type.STRING, description: "Brief explanation connecting the action to the value" }
        },
        required: ["value", "reason"]
      }
    }
  },
  required: ["options"]
};

// Analyzes user input behavior to identify potential values
export const analyzeBehavior = async (
  input: string,
  pillar: string
): Promise<ResonanceOption[]> => {
  const ai = getClient();
  
  const prompt = `
    Context: The user is in '${pillar}' mode.
    User Input: "${input}"
    
    Task:
    1. Isolate the verb/action in the input.
    2. Identify 3 distinct potential values that drive this behavior.
    3. Return them as a "Resonance Menu".
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: resonanceSchema,
        temperature: 0.7,
      },
    });

    const jsonText = response.text || "";
    const parsed = JSON.parse(jsonText);
    return parsed.options || [];
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return [
      { value: "Error", reason: "Could not analyze. Please try again." },
      { value: "Retry", reason: "Check your connection or API key." },
      { value: "Skip", reason: "Move to next step." }
    ];
  }
};

// Generates a comprehensive report based on collected value entries
export const generateSynthesis = async (entries: ValueEntry[]): Promise<string> => {
  const ai = getClient();

  if (entries.length === 0) {
    return "No values collected yet. Go to Audit or Wild mode to start your journey.";
  }

  const dataSummary = entries.map(e => `- Value: ${e.value} (Source: "${e.sourceAction}" in ${e.pillar})`).join("\n");

  const prompt = `
    Analyze the following collected 'Embodied Values' from the user:
    
    ${dataSummary}

    Task:
    1. Identify patterns (e.g., "Creativity appears in Spending but is missing from Work").
    2. Highlight the strongest embodied values.
    3. Point out any interesting contradictions or gaps.
    4. Keep it concise, insightful, and encouraging. Use Markdown for formatting.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });

    return response.text || "Could not generate synthesis.";
  } catch (error) {
    console.error("Gemini Synthesis Error:", error);
    return "Error generating synthesis.";
  }
};
