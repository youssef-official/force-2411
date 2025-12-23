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
      Accept: 'application/vnd.github.v3+json',
    },
  });
  
  if (!res.ok) throw new Error('Failed to fetch file');
  
  // Check if response is actually JSON
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
      const data = await res.json();
      // Content is base64 encoded in the JSON response
      if (data.content && data.encoding === 'base64') {
          const content = atob(data.content.replace(/\n/g, ''));
          return { content, sha: data.sha };
      }
      // Handle edge case where API returns something else
      throw new Error("Invalid file format from GitHub");
  } else {
      throw new Error("GitHub API returned non-JSON response");
  }
};

export const commitFile = async (
  token: string, 
  fullName: string, 
  path: string, 
  content: string, 
  message: string, 
  sha?: string
): Promise<{ success: boolean; newSha?: string }> => {
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
      return { success: false };
    }

    const data = await res.json();
    // Return the new SHA so the frontend can stay in sync
    return { success: true, newSha: data.content?.sha };
  } catch (e) {
    console.error(e);
    return { success: false };
  }
};