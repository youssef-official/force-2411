
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
  
  // If it's a file, it returns an object, if dir, an array. We want array.
  return Array.isArray(data) ? data : [data];
};

export const fetchFileRaw = async (token: string, fullName: string, path: string): Promise<string> => {
  const res = await fetch(`${API_BASE}/repos/${fullName}/contents/${path}`, {
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3.raw', // Request raw content
    },
  });
  
  if (!res.ok) return '';
  return await res.text();
};
