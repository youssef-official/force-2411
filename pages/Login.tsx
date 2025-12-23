
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Github, Loader2, Mail, Lock, ArrowRight } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../components/Logo';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const navigate = useNavigate();

  const handleGithubLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDevLogin = async () => {
    setLoading(true);
    setTimeout(() => {
        navigate('/'); 
    }, 1500);
  };

  return (
    <div className="min-h-screen w-full bg-[#050505] flex flex-col items-center justify-center relative overflow-hidden">
      
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="z-10 w-full max-w-sm p-6"
      >
        <div className="mb-10 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-[#18181b] rounded-2xl flex items-center justify-center border border-[#27272a] shadow-2xl mb-6">
                <Logo className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight mb-2">FORGE</h1>
            <p className="text-gray-500 text-sm">Production Grade AI Engineering</p>
        </div>

        <div className="space-y-4">
            {error && (
                <div className="p-3 bg-red-900/20 border border-red-900/50 text-red-400 rounded-lg text-xs text-center">
                    {error}
                </div>
            )}
            
            <form onSubmit={handleEmailAuth} className="space-y-3">
                <div className="relative group">
                    <Mail className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                    <input 
                        type="email" 
                        placeholder="Email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-[#0a0a0a] border border-[#27272a] rounded-lg py-2 pl-9 pr-3 text-sm text-white focus:outline-none focus:border-white/20 transition-colors"
                    />
                </div>
                <div className="relative group">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                    <input 
                        type="password" 
                        placeholder="Password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-[#0a0a0a] border border-[#27272a] rounded-lg py-2 pl-9 pr-3 text-sm text-white focus:outline-none focus:border-white/20 transition-colors"
                    />
                </div>

                <button 
                    type="submit"
                    disabled={loading}
                    className="w-full h-9 bg-white hover:bg-gray-200 text-black rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
                >
                   {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : (
                       <>
                         <span>{mode === 'signin' ? 'Sign In' : 'Create Account'}</span>
                         <ArrowRight className="w-3 h-3" />
                       </>
                   )}
                </button>
            </form>

            <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#27272a]"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                    <span className="px-2 bg-[#050505] text-gray-600">OR</span>
                </div>
            </div>

            <button
                type="button"
                onClick={handleGithubLogin}
                disabled={loading}
                className="w-full h-9 bg-[#18181b] hover:bg-[#27272a] text-gray-300 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 border border-[#27272a]"
            >
                <Github className="w-4 h-4" />
                <span>GitHub</span>
            </button>

            <div className="mt-4 text-center">
                <button 
                    type="button"
                    onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                    className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                >
                    {mode === 'signin' ? "Create an account" : "Sign in to existing account"}
                </button>
            </div>
        </div>

        <div className="mt-8 text-center">
             <button onClick={handleDevLogin} className="text-[10px] text-gray-700 hover:text-gray-500">
                Skip Login (Dev)
             </button>
        </div>
      </motion.div>
    </div>
  );
}
