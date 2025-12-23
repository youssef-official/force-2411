export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          created_at: string;
          tier: 'FREE' | 'PRO';
        };
      };
      repositories: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          full_name: string;
          description: string | null;
          url: string;
          default_branch: string;
          created_at: string;
        };
      };
      plans: {
        Row: {
          id: string;
          repo_id: string;
          user_id: string;
          title: string;
          status: 'DRAFT' | 'APPROVED' | 'COMPLETED';
          content_json: any;
          created_at: string;
        };
      };
    };
  };
}

export type Repository = {
  id: string;
  name: string;
  full_name: string;
  description: string;
  stars: number;
  language: string;
  updated_at: string;
  default_branch: string;
};

export type PlanStep = {
  id: string;
  title: string;
  description: string;
  file_path: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  code_snippet?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
};

export type AIModel = 'mistralai/devstral-2512:free' | 'openai/gpt-oss-120b:free';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}
