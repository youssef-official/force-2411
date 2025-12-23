import React, { useEffect, useState } from 'react';
import { LogOut, Github, Key, Search, Edit3, Menu, X, Settings } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useNavigate } from 'react-router-dom';
import { Logo } from './Logo';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, title }) => {
  const navigate = useNavigate();
  const [isGithubConnected, setIsGithubConnected] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
     const token = localStorage.getItem('gh_token');
     setIsGithubConnected(!!token);
     
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
              <Settings className="w-4 h-4 text-gray-600 cursor-pointer hover:text-gray-300" />
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