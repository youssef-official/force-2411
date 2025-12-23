import { ChatMessage, AIModel } from '../types';

// Safe environment variable retrieval
const getEnv = (key: string, fallback: string) => {
  try {
    return (typeof process !== 'undefined' && process.env && process.env[key]) || fallback;
  } catch {
    return fallback;
  }
};

// Application Meta
const SITE_URL = 'http://localhost:3000';
const SITE_NAME = 'FORGE AI';

// Models as requested by the user
const PLANNING_MODEL = 'mistralai/devstral-2512:free';
const CODING_MODEL = 'openai/gpt-oss-120b:free'; 

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
  // Retrieve API Key from Local Storage dynamically
  const apiKey = localStorage.getItem('openrouter_key');

  if (!apiKey) {
     console.error("OpenRouter API Key is missing.");
     throw new Error("OpenRouter API Key is missing. Please configure it in Settings.");
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey.trim()}`,
        "HTTP-Referer": SITE_URL,
        "X-Title": SITE_NAME,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "model": model,
        "messages": messages,
        "temperature": 0.1,
        "max_tokens": 4000
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`OpenRouter API Error (${response.status}):`, errText);
      
      if (response.status === 401) {
          throw new Error("Authentication failed: Invalid API Key. Please check your settings.");
      }
      if (response.status === 404) {
          // Fallback guidance if model doesn't exist
          throw new Error(`Model ${model} not found or unavailable. Try changing models in source.`);
      }
      
      throw new Error(`OpenRouter API Error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    
    if (data.error) {
         throw new Error(`OpenRouter Logic Error: ${data.error.message}`);
    }

    let content = data.choices[0]?.message?.content || "";
    
    // Clean up markdown if present
    content = content.replace(/^```[a-z]*\n/, '').replace(/\n```$/, '');
    
    return content;
  } catch (error) {
    console.error("AI Service Failure", error);
    throw error;
  }
}