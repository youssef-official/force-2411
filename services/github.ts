export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string;
  stargazers_count: number;
  language: string;
  updated_at: string;
  default_branch: string;
  html_url: string;
}

export interface GitHubFile {
  name: string;
  path: string;
  type: 'file' | 'dir';
  sha: string;
}

const API_BASE = 'https://api.github.com';

export const validateToken = async (token: string): Promise<boolean> => {
  try {
    const res = await fetch(`${API_BASE}/user`, {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });
    return res.ok;
  } catch (e) {
    return false;
  }
};

export const fetchUserRepos = async (token: string): Promise<GitHubRepo[]> => {
  const res = await fetch(`${API_BASE}/user/repos?sort=updated&per_page=100&type=all`, {
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });
  
  if (!res.ok) throw new Error('Failed to fetch repositories');
  return await res.json();
};

export const fetchRepoContents = async (token: string, fullName: string, path: string = ''): Promise<GitHubFile[]> => {
  const res = await fetch(`${API_BASE}/repos/${fullName}/contents/${path}`, {
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (!res.ok) return [];
  const data = await res.json();
  
  return Array.isArray(data) ? data : [data];
};

export const fetchFileRaw = async (token: string, fullName: string, path: string): Promise<{ content: string, sha: string }> => {
  const res = await fetch(`${API_BASE}/repos/${fullName}/contents/${path}`, {
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json', // Get JSON to extract SHA and Content
    },
  });
  
  if (!res.ok) throw new Error('Failed to fetch file');
  
  const data = await res.json();
  // Content is base64 encoded
  const content = atob(data.content.replace(/\n/g, ''));
  
  return { content, sha: data.sha };
};

export const commitFile = async (
  token: string, 
  fullName: string, 
  path: string, 
  content: string, 
  message: string, 
  sha?: string
): Promise<boolean> => {
  try {
    // Convert content to base64
    const contentBase64 = btoa(unescape(encodeURIComponent(content))); // utf-8 safe base64

    const body: any = {
      message: message,
      content: contentBase64,
    };

    if (sha) {
      body.sha = sha;
    }

    const res = await fetch(`${API_BASE}/repos/${fullName}/contents/${path}`, {
      method: 'PUT',
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Commit failed", err);
      return false;
    }

    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
};