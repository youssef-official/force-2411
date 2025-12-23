import { ChatMessage, AIModel } from '../types';

// Fallback value for demo environment
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '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';
const SITE_URL = 'http://localhost:3000'; // Replace with actual site URL
const SITE_NAME = 'FORGE AI';

export const generatePlan = async (description: string, repoContext: string): Promise<string> => {
  const model: AIModel = 'mistralai/devstral-2512:free';
  
  const systemPrompt = `You are a Principal Software Architect.
  Analyze the following repository context and the user's request.
  Generate a detailed, step-by-step implementation plan (JSON format).
  
  Repository Context:
  ${repoContext.substring(0, 2000)}... (truncated for context limit)

  Response Format:
  {
    "title": "Short Plan Title",
    "steps": [
      {
        "id": "1",
        "title": "Task Title",
        "description": "Detailed description of what to change",
        "file_path": "src/App.tsx",
        "operation": "UPDATE"
      }
    ]
  }
  
  Return ONLY the JSON.`;

  return await callOpenRouter(model, [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: description }
  ]);
};

export const executeStep = async (stepDescription: string, currentCode: string): Promise<string> => {
  const model: AIModel = 'openai/gpt-oss-120b:free';
  
  const systemPrompt = `You are a Senior Full-Stack Engineer.
  You are executing a specific task from a plan.
  
  Task: ${stepDescription}
  
  Current Code:
  ${currentCode}
  
  Output the FULL modified file content. Do not use markdown blocks, just the raw code.`;

  return await callOpenRouter(model, [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: 'Execute the changes.' }
  ]);
};

async function callOpenRouter(model: string, messages: ChatMessage[]): Promise<string> {
  if (!OPENROUTER_API_KEY) {
     console.error("OpenRouter API Key is missing. Please check your configuration.");
     // Return a mock response or throw depending on desired behavior, throwing for now to be explicit
     throw new Error("OpenRouter API Key is missing.");
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": SITE_URL,
        "X-Title": SITE_NAME,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "model": model,
        "messages": messages,
        "temperature": 0.2, // Lower temp for code
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("AI Error:", err);
      throw new Error(`OpenRouter API Error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "";
  } catch (error) {
    console.error("AI Service Failure", error);
    throw error;
  }
}