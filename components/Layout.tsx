
import React, { useEffect, useState } from 'react';
import { LogOut, Github, Key, Search, Plus, Settings, Menu, X, Edit3 } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useNavigate, useLocation } from 'react-router-dom';
import { Logo } from './Logo';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, title }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isGithubConnected, setIsGithubConnected] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
     const token = localStorage.getItem('gh_token');
     setIsGithubConnected(!!token);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('gh_token');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-gray-200 font-sans flex overflow-hidden">
      
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
      <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:relative z-40 w-72 h-full bg-[#0c0c0c] border-r border-[#27272a] flex flex-col transition-transform duration-300`}>
        
        {/* Header */}
        <div className="p-4 flex items-center justify-between">
           <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
             <Logo className="w-6 h-6 text-gray-100" />
             <span className="font-bold text-gray-100 tracking-tight">FORGE</span>
           </div>
           <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-500">
             <X className="w-5 h-5" />
           </button>
        </div>

        {/* Search & New Agent */}
        <div className="px-4 pb-4 space-y-3">
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

        {/* List Section (Today/Previous) */}
        <div className="flex-1 overflow-y-auto px-2 custom-scrollbar">
           <div className="px-2 py-2">
             <h3 className="text-xs font-medium text-gray-500 mb-2 px-2">Today</h3>
             <div className="space-y-0.5">
               {/* Mock Items simulating the screenshot */}
               <div className="px-3 py-2 rounded-md bg-[#18181b] border border-[#27272a] text-sm text-gray-200 flex flex-col gap-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="font-medium truncate">Fix build errors</span>
                  </div>
                  <div className="text-[10px] text-gray-500 flex justify-between">
                    <span className="text-green-400">+2058</span>
                    <span className="text-red-400">-226</span>
                  </div>
               </div>
             </div>
           </div>
        </div>

        {/* Footer/User */}
        <div className="p-3 border-t border-[#27272a] bg-[#0c0c0c]">
           <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <div className="w-6 h-6 rounded bg-gradient-to-tr from-gray-700 to-gray-600 flex items-center justify-center text-[10px] font-bold text-white">
                  YE
                </div>
                <span>Dashboard</span>
              </div>
              <Settings className="w-4 h-4 text-gray-600 cursor-pointer hover:text-gray-300" />
           </div>
           
           <div className="mt-3 pt-3 border-t border-[#27272a]/50 flex items-center justify-between text-xs text-gray-500 px-2">
              <div className="flex items-center gap-2">
                  {isGithubConnected ? <Github className="w-3 h-3 text-green-500" /> : <Key className="w-3 h-3" />}
                  <span>{isGithubConnected ? 'Connected' : 'No Key'}</span>
              </div>
              <button onClick={handleLogout} className="hover:text-red-400 transition-colors">
                  <LogOut className="w-3 h-3" />
              </button>
           </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 h-screen overflow-hidden flex flex-col bg-[#09090b]">
         {children}
      </main>
    </div>
  );
};
