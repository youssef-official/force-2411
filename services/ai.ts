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
const SITE_URL = 'https://force-2411.vercel.app';
const SITE_NAME = 'FORGE AI';

// Default Credentials (Fallback provided by user)
const DEFAULT_KEY = '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';

// Models
const PLANNING_MODEL = 'mistralai/mistral-7b-instruct:free'; 
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
  
  Return ONLY the JSON. Do not include any conversational text before or after.`;

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
  // 1. Determine the primary key to use
  let storedKey = localStorage.getItem('openrouter_key');
  let primaryKey = (storedKey && storedKey.trim()) ? storedKey : DEFAULT_KEY;

  // Internal fetcher function
  const performRequest = async (apiKey: string) => {
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
        // Specific error handling for 401 to trigger retry
        if (response.status === 401) {
            throw new Error("AUTH_FAILED");
        }
        if (response.status === 404) {
             throw new Error(`Model ${model} not found.`);
        }
        throw new Error(`API Error ${response.status}: ${errText}`);
      }

      const data = await response.json();
      if (data.error) {
           // OpenRouter sometimes returns 200 but with error field
           if (data.error.code === 401) throw new Error("AUTH_FAILED");
           throw new Error(`Logic Error: ${data.error.message}`);
      }

      let content = data.choices[0]?.message?.content || "";
      return content.replace(/^```[a-z]*\n/, '').replace(/\n```$/, '');
  };

  try {
      return await performRequest(primaryKey);
  } catch (error: any) {
      // 2. Retry with default key if the primary key was different and failed with auth error
      if (error.message === "AUTH_FAILED" && primaryKey !== DEFAULT_KEY) {
          console.warn("User-configured key failed. Retrying with system default key...");
          try {
              return await performRequest(DEFAULT_KEY);
          } catch (retryError: any) {
              // If default also fails, throw specific error
              if (retryError.message === "AUTH_FAILED") {
                  throw new Error("Authentication failed with both user and system keys. Please check your OpenRouter API Key.");
              }
              throw retryError;
          }
      }
      
      // If error was AUTH_FAILED but we already used DEFAULT_KEY, rethrow nice message
      if (error.message === "AUTH_FAILED") {
           throw new Error("Authentication failed: The provided API Key is invalid.");
      }

      throw error;
  }
}
