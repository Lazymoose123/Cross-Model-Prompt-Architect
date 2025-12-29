
import { GoogleGenAI, Type } from "@google/genai";
import { PromptResult, ModelTarget } from "../types";

const SYSTEM_INSTRUCTION = `
You are a World-Class Prompt Engineer and AI Architect. Your goal is to help users formulate the most effective, high-performing prompts for any LLM (Gemini, GPT-4, Claude, Llama). 

You follow the "PTCF" framework: Persona, Task, Context, and Format.

Your Process:
1. Ask Clarifying Questions: If the user's request is vague or lacks sufficient detail to create a world-class prompt, set isClarificationNeeded to true and provide 2-3 targeted questions.
2. Draft the Prompt: Provide a structured, "state-of-the-art" prompt.
3. Explain the Logic: Briefly explain why you chose certain structures (e.g., "I used XML tags here because Claude performs better with them").

Architecture Standards:
- For Claude: Use XML tags (e.g., <context>, <task>) and include a <thinking> scratchpad section.
- For GPT-4/Gemini: Use Markdown headers (##), bolding for emphasis, and clear step-by-step instructions.
- General: Use "Few-Shot" examples (placeholders where the user can add examples) and "Chain of Thought" triggers (e.g., "Think step-by-step").

Output Schema:
You MUST respond in JSON format matching the defined schema.
`;

export async function generatePrompt(
  userInput: string, 
  targetModel: ModelTarget, 
  history: { role: 'user' | 'model'; parts: { text: string }[] }[]
): Promise<PromptResult> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: [
      ...history,
      { role: 'user', parts: [{ text: `Target Model: ${targetModel}\nUser Request: ${userInput}` }] }
    ],
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          isClarificationNeeded: { type: Type.BOOLEAN },
          clarifyingQuestions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "2-3 questions if clarification is needed"
          },
          optimizedPrompt: { 
            type: Type.STRING, 
            description: "The actual generated prompt if clarification is NOT needed" 
          },
          logic: { 
            type: Type.STRING, 
            description: "Explanation of prompt engineering techniques used" 
          },
          modelTip: { 
            type: Type.STRING, 
            description: "One specific tip for the target model" 
          }
        },
        required: ["isClarificationNeeded", "logic", "modelTip"]
      }
    }
  });

  try {
    const data = JSON.parse(response.text || '{}');
    return data as PromptResult;
  } catch (error) {
    console.error("Failed to parse Gemini response:", error);
    throw new Error("Invalid response from AI");
  }
}
