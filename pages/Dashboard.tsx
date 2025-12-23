
import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { Repository } from '../types';
import { GitBranch, Star, Search, Plus, ArrowRight, Loader2, Key, XCircle, FolderGit2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { validateToken, fetchUserRepos, GitHubRepo } from '../services/github';

export default function Dashboard() {
  const [repos, setRepos] = useState<Repository[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const savedToken = localStorage.getItem('gh_token');
    if (savedToken) {
      setToken(savedToken);
      handleVerifyToken(savedToken);
    }
  }, []);

  const handleVerifyToken = async (inputToken: string) => {
    setLoading(true);
    setAuthError('');
    try {
      const isValid = await validateToken(inputToken);
      if (isValid) {
        localStorage.setItem('gh_token', inputToken);
        setIsAuthenticated(true);
        loadRepos(inputToken);
      } else {
        setAuthError('Invalid Personal Access Token');
        setIsAuthenticated(false);
      }
    } catch (e) {
      setAuthError('Connection failed');
    } finally {
      setLoading(false);
    }
  };

  const loadRepos = async (authToken: string) => {
    setLoading(true);
    try {
      const ghRepos = await fetchUserRepos(authToken);
      const mappedRepos: Repository[] = ghRepos.map((r: GitHubRepo) => ({
        id: r.id.toString(),
        name: r.name,
        full_name: r.full_name,
        description: r.description || '',
        stars: r.stargazers_count,
        language: r.language || 'Unknown',
        default_branch: r.default_branch,
        updated_at: r.updated_at
      }));
      setRepos(mappedRepos);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleVerifyToken(token);
  };

  const clearToken = () => {
    localStorage.removeItem('gh_token');
    setToken('');
    setIsAuthenticated(false);
    setRepos([]);
  };

  const filteredRepos = repos.filter(r => 
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  if (!isAuthenticated) {
      return (
        <Layout>
             <div className="flex h-full items-center justify-center p-4">
                 <div className="w-full max-w-md bg-[#18181b] border border-[#27272a] rounded-xl p-8 shadow-2xl">
                     <div className="flex flex-col items-center mb-6">
                        <div className="w-12 h-12 bg-[#27272a] rounded-xl flex items-center justify-center mb-4">
                            <Key className="w-6 h-6 text-white" />
                        </div>
                        <h2 className="text-xl font-bold text-white">Connect GitHub</h2>
                        <p className="text-gray-400 text-sm text-center mt-2">Enter your Personal Access Token (Classic) to enable the agent.</p>
                     </div>
                     
                     <form onSubmit={handleManualSubmit} className="space-y-4">
                         <input 
                             type="password"
                             value={token}
                             onChange={(e) => setToken(e.target.value)}
                             placeholder="ghp_..."
                             className="w-full bg-[#09090b] border border-[#27272a] rounded-lg p-3 text-white font-mono text-sm focus:outline-none focus:border-gray-500"
                         />
                         {authError && (
                             <div className="text-red-400 text-xs flex items-center gap-1">
                                 <XCircle className="w-3 h-3" /> {authError}
                             </div>
                         )}
                         <button 
                             type="submit"
                             disabled={loading || !token}
                             className="w-full bg-white text-black font-semibold py-2.5 rounded-lg text-sm hover:bg-gray-200 transition-colors disabled:opacity-50"
                         >
                             {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Connect'}
                         </button>
                     </form>
                 </div>
             </div>
        </Layout>
      );
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto py-8">
        <div className="flex items-center justify-between mb-8">
             <h1 className="text-2xl font-bold text-white tracking-tight">Select Repository</h1>
             <div className="flex items-center gap-3">
                 <button onClick={clearToken} className="text-xs text-red-400 hover:text-red-300">Disconnect</button>
                 <button className="bg-white text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-200 flex items-center gap-2">
                     <Plus className="w-4 h-4" /> Import
                 </button>
             </div>
        </div>

        <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
                type="text" 
                placeholder="Filter repositories..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#18181b] border border-[#27272a] rounded-lg pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-gray-500"
            />
        </div>

        {loading ? (
             <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 text-white animate-spin" /></div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRepos.map((repo) => (
                    <div 
                        key={repo.id}
                        onClick={() => navigate(`/workspace/${encodeURIComponent(repo.full_name)}`)}
                        className="group bg-[#18181b] border border-[#27272a] rounded-xl p-4 cursor-pointer hover:border-gray-500 transition-all"
                    >
                        <div className="flex items-center justify-between mb-3">
                             <div className="flex items-center gap-2 text-sm font-medium text-white">
                                 <FolderGit2 className="w-4 h-4 text-gray-500" />
                                 <span className="truncate max-w-[180px]">{repo.name}</span>
                             </div>
                             {repo.language !== 'Unknown' && (
                                 <span className="text-[10px] px-2 py-0.5 rounded bg-[#27272a] text-gray-400">{repo.language}</span>
                             )}
                        </div>
                        <p className="text-gray-500 text-xs line-clamp-2 h-8 mb-4">{repo.description || 'No description provided.'}</p>
                        <div className="flex items-center justify-between pt-3 border-t border-[#27272a]">
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                                <span className="flex items-center gap-1"><GitBranch className="w-3 h-3" /> {repo.default_branch}</span>
                                <span className="flex items-center gap-1"><Star className="w-3 h-3" /> {repo.stars}</span>
                            </div>
                            <ArrowRight className="w-4 h-4 text-white opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>
    </Layout>
  );
}
