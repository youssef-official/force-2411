import React, { useEffect, useState } from 'react';
import { LogOut, Github, Key, Search, Edit3, Menu, X, Settings, Save, RotateCcw } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useNavigate } from 'react-router-dom';
import { Logo } from './Logo';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

const DEFAULT_KEY = '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';

export const Layout: React.FC<LayoutProps> = ({ children, title }) => {
  const navigate = useNavigate();
  const [isGithubConnected, setIsGithubConnected] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [openRouterKey, setOpenRouterKey] = useState('');
  const [settingsSaved, setSettingsSaved] = useState(false);

  useEffect(() => {
     const ghToken = localStorage.getItem('gh_token');
     setIsGithubConnected(!!ghToken);
     
     const orKey = localStorage.getItem('openrouter_key');
     // Always load what's in storage, or default if empty
     setOpenRouterKey(orKey || DEFAULT_KEY);

     // Auto-close sidebar on mobile
     if (window.innerWidth < 768) {
       setSidebarOpen(false);
     }
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('gh_token');
    navigate('/login');
  };

  const handleSaveSettings = () => {
    localStorage.setItem('openrouter_key', openRouterKey.trim());
    setSettingsSaved(true);
    setTimeout(() => {
        setSettingsSaved(false);
        setShowSettings(false);
    }, 1000);
  };
  
  const handleResetDefault = () => {
      setOpenRouterKey(DEFAULT_KEY);
      localStorage.removeItem('openrouter_key'); // clear storage so it uses default logic or next save
  };

  return (
    <div className="h-screen w-screen bg-[#09090b] text-gray-200 font-sans flex overflow-hidden">
      
      {/* Mobile Sidebar Overlay */}
      {!sidebarOpen && (
        <button 
          onClick={() => setSidebarOpen(true)}
          className="fixed top-4 left-4 z-50 p-2 bg-[#18181b] rounded-md md:hidden border border-[#27272a]"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#18181b] border border-[#27272a] rounded-xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-4 border-b border-[#27272a] flex items-center justify-between bg-[#0c0c0c]">
                    <h3 className="font-semibold text-white flex items-center gap-2">
                        <Settings className="w-4 h-4" /> Settings
                    </h3>
                    <button onClick={() => setShowSettings(false)} className="text-gray-500 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-medium text-gray-300">OpenRouter API Key</label>
                            <button onClick={handleResetDefault} className="text-xs text-forge-400 hover:underline flex items-center gap-1">
                                <RotateCcw className="w-3 h-3" /> Reset to Default
                            </button>
                        </div>
                        <div className="relative">
                            <Key className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                            <input 
                                type="text" 
                                value={openRouterKey}
                                onChange={(e) => setOpenRouterKey(e.target.value)}
                                placeholder="sk-or-v1-..."
                                className="w-full bg-[#09090b] border border-[#27272a] rounded-lg py-2 pl-9 pr-3 text-sm text-white focus:outline-none focus:border-forge-500 transition-colors font-mono"
                            />
                        </div>
                        <p className="text-xs text-gray-500">
                            Required for AI planning and coding features. 
                            <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" className="text-forge-400 hover:underline ml-1">Get a key</a>
                        </p>
                    </div>

                    <div className="pt-2">
                        <button 
                            onClick={handleSaveSettings}
                            className={`w-full py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                                settingsSaved 
                                ? 'bg-green-600 text-white' 
                                : 'bg-white text-black hover:bg-gray-200'
                            }`}
                        >
                            {settingsSaved ? 'Saved!' : 'Save Configuration'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-40 w-72 bg-[#0c0c0c] border-r border-[#27272a] flex flex-col transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
          md:relative md:translate-x-0 md:flex-shrink-0 h-full
        `}
      >
        
        {/* Header */}
        <div className="h-14 min-h-[56px] px-4 flex items-center justify-between border-b border-[#27272a]/50">
           <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
             <Logo className="w-6 h-6 text-white" />
             <span className="font-bold text-white tracking-tight">FORGE</span>
           </div>
           <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-500 hover:text-white">
             <X className="w-5 h-5" />
           </button>
        </div>

        {/* Search & New Agent */}
        <div className="p-4 space-y-3">
          <div className="relative group">
             <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500 group-focus-within:text-gray-300" />
             <input 
               type="text" 
               placeholder="Search agents..." 
               className="w-full bg-[#18181b] border border-[#27272a] rounded-lg py-2 pl-9 pr-3 text-sm text-gray-300 placeholder:text-gray-600 focus:outline-none focus:border-gray-500 transition-colors"
             />
          </div>
          
          <button 
            onClick={() => navigate('/')}
            className="w-full bg-white hover:bg-gray-200 text-black font-semibold py-2 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <Edit3 className="w-4 h-4" />
            New Agent
          </button>
        </div>

        {/* List Section */}
        <div className="flex-1 overflow-y-auto px-2 custom-scrollbar">
           <div className="px-2 py-2">
             <h3 className="text-xs font-medium text-gray-500 mb-2 px-2">Recent Activity</h3>
             <div className="text-center py-8 text-gray-600 text-xs">
                No recent executions
             </div>
           </div>
        </div>

        {/* Footer/User */}
        <div className="p-3 border-t border-[#27272a] bg-[#0c0c0c] mt-auto">
           <div className="flex items-center justify-between px-2 mb-3">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gray-700 to-gray-600 flex items-center justify-center text-xs font-bold text-white">
                  ME
                </div>
                <div className="flex flex-col">
                    <span className="text-xs font-medium text-gray-200">Developer</span>
                    <span className="text-[10px] text-gray-500">Free Tier</span>
                </div>
              </div>
              <button 
                  onClick={() => setShowSettings(true)}
                  className="p-1 hover:bg-[#27272a] rounded-md transition-colors"
              >
                  <Settings className="w-4 h-4 text-gray-600 cursor-pointer hover:text-gray-300" />
              </button>
           </div>
           
           <div className="pt-3 border-t border-[#27272a]/50 flex items-center justify-between text-xs text-gray-500 px-2">
              <div className="flex items-center gap-2">
                  {isGithubConnected ? <Github className="w-3 h-3 text-green-500" /> : <Key className="w-3 h-3" />}
                  <span>{isGithubConnected ? 'GitHub Active' : 'No Token'}</span>
              </div>
              <button onClick={handleLogout} className="hover:text-red-400 transition-colors flex items-center gap-1">
                  <LogOut className="w-3 h-3" />
                  Sign Out
              </button>
           </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 h-full w-full overflow-hidden flex flex-col bg-[#09090b] relative">
         {children}
      </main>
    </div>
  );
};