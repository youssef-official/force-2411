import { ChatMessage, AIModel } from '../types';

// Safe environment variable retrieval
const getEnv = (key: string, fallback: string) => {
  try {
    return (typeof process !== 'undefined' && process.env && process.env[key]) || fallback;
  } catch {
    return fallback;
  }
};

// Use OpenRouter API Key
const OPENROUTER_API_KEY = getEnv('OPENROUTER_API_KEY', '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');
const SITE_URL = 'https://forge.ai';
const SITE_NAME = 'FORGE AI';

// Use reliable models available on OpenRouter Free Tier
// Fallback to Gemini 2.0 Flash Lite Preview which is usually free/cheap and fast
const PLANNING_MODEL = 'google/gemini-2.0-flash-lite-preview-02-05:free';
const CODING_MODEL = 'google/gemini-2.0-flash-lite-preview-02-05:free'; 

export const generatePlan = async (description: string, repoContext: string): Promise<string> => {
  const systemPrompt = `You are a Principal Software Architect.
  Analyze the following repository context and the user's request.
  Generate a detailed, step-by-step implementation plan in strict JSON format.
  
  Repository Context:
  ${repoContext.substring(0, 5000)}... (truncated)

  User Request: ${description}

  Output Format:
  {
    "title": "Short Plan Title",
    "steps": [
      {
        "id": "1",
        "title": "Task Title",
        "description": "Detailed instructions for the AI coder.",
        "file_path": "src/App.tsx",
        "operation": "UPDATE"
      }
    ]
  }
  
  Return ONLY the JSON. No markdown backticks.`;

  return await callOpenRouter(PLANNING_MODEL, [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: description }
  ]);
};

export const executeStep = async (stepDescription: string, currentCode: string): Promise<string> => {
  const systemPrompt = `You are a Senior Full-Stack Engineer.
  You are executing a specific task from a plan.
  
  Task: ${stepDescription}
  
  Current Code:
  ${currentCode}
  
  Output the FULL modified file content. 
  Do not include markdown formatting (like \`\`\`typescript). 
  Return ONLY the raw code.`;

  return await callOpenRouter(CODING_MODEL, [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: 'Execute the changes and return the full file content.' }
  ]);
};

async function callOpenRouter(model: string, messages: ChatMessage[]): Promise<string> {
  if (!OPENROUTER_API_KEY) {
     console.error("OpenRouter API Key is missing.");
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
        "temperature": 0.1, // Lower temperature for code stability
        "max_tokens": 4000
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("AI Error:", err);
      throw new Error(`OpenRouter API Error: ${response.status}`);
    }

    const data = await response.json();
    let content = data.choices[0]?.message?.content || "";
    
    // Clean up markdown if present
    content = content.replace(/^```[a-z]*\n/, '').replace(/\n```$/, '');
    
    return content;
  } catch (error) {
    console.error("AI Service Failure", error);
    throw error;
  }
}