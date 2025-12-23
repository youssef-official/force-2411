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
  
  if (!res.ok) throw new Error(`Failed to fetch file: ${res.status}`);
  
  // Robust check for JSON content
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
      const data = await res.json();
      
      // If content is base64 encoded (standard for files)
      if (data.content && data.encoding === 'base64') {
          // Fix for newlines in base64 string
          const cleanContent = data.content.replace(/\n/g, '');
          const content = atob(cleanContent);
          return { content, sha: data.sha };
      }
      
      // If for some reason content is not encoded or empty
      return { content: '', sha: data.sha || '' };
  } else {
      // Fallback: If GitHub returns raw text (shouldn't happen with our Accept header, but safe to handle)
      console.warn("GitHub API returned non-JSON. Falling back to text.");
      const text = await res.text();
      // We don't get SHA in this case easily, so we might need to fetch metadata separately if this happens
      // But for read-only context, this is acceptable
      return { content: text, sha: '' };
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
    // Convert content to base64, handling UTF-8 characters correctly
    const contentBase64 = btoa(
      encodeURIComponent(content).replace(/%([0-9A-F]{2})/g,
        function toSolidBytes(match, p1) {
            return String.fromCharCode(parseInt(p1, 16));
        })
    );

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
    return { success: true, newSha: data.content?.sha };
  } catch (e) {
    console.error("Commit Error:", e);
    return { success: false };
  }
};