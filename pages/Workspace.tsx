import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { generatePlan, executeStep } from '../services/ai';
import { fetchRepoContents, fetchFileRaw, GitHubFile } from '../services/github';
import { PlanStep } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, 
  Play, 
  CheckCircle2, 
  FileCode, 
  Loader2, 
  AlertCircle,
  Cpu,
  Terminal,
  Code,
  ChevronRight,
  ChevronDown,
  ArrowUp,
  Image as ImageIcon,
  FolderOpen,
  FileText
} from 'lucide-react';

export default function Workspace() {
  const { repoId } = useParams();
  const navigate = useNavigate();
  
  const [prompt, setPrompt] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [plan, setPlan] = useState<PlanStep[] | null>(null);
  const [currentStepId, setCurrentStepId] = useState<string | null>(null);
  const [executionLog, setExecutionLog] = useState<string[]>([]);
  const [diff, setDiff] = useState<string | null>(null);
  const [repoContext, setRepoContext] = useState<string>('');
  
  // Real File System State
  const [repoFiles, setRepoFiles] = useState<GitHubFile[]>([]);
  const [activeFile, setActiveFile] = useState<GitHubFile | null>(null);
  const [activeFileContent, setActiveFileContent] = useState<string>('');
  const [isLoadingFile, setIsLoadingFile] = useState(false);

  // Load Repo Context & Files
  useEffect(() => {
    const loadContext = async () => {
      const token = localStorage.getItem('gh_token');
      if (!token || !repoId) {
        setExecutionLog(prev => [...prev, "⚠ No GitHub token or Repo ID found."]);
        setRepoContext("// Context unavailable");
        return;
      }

      const decodedRepoName = decodeURIComponent(repoId);

      try {
        setExecutionLog(prev => [...prev, `🔍 Reading: ${decodedRepoName}`]);
        
        // Fetch root files
        const files = await fetchRepoContents(token, decodedRepoName, '');
        // Sort: folders first, then files
        const sortedFiles = files.sort((a, b) => {
            if (a.type === b.type) return a.name.localeCompare(b.name);
            return a.type === 'dir' ? -1 : 1;
        });
        setRepoFiles(sortedFiles);

        const fileList = files.map(f => `- ${f.path} (${f.type})`).join('\n');
        
        // Try to fetch README for context
        let readmeContent = '';
        const readme = files.find(f => f.name.toLowerCase() === 'readme.md');
        if (readme) {
          readmeContent = await fetchFileRaw(token, decodedRepoName, readme.path);
          // Set as active file initially if exists
          setActiveFile(readme);
          setActiveFileContent(readmeContent);
        }

        setRepoContext(`Repo: ${decodedRepoName}\nFiles:\n${fileList}\nREADME:\n${readmeContent.substring(0, 1000)}...`);
      } catch (e) {
        setExecutionLog(prev => [...prev, "❌ Failed to fetch repo details."]);
      }
    };
    loadContext();
  }, [repoId]);

  const handleFileClick = async (file: GitHubFile) => {
    if (file.type !== 'file') {
        // For this demo version, we only support root level files or need recursive fetching.
        // Just logging for now if it's a dir.
        return; 
    }
    
    setActiveFile(file);
    setIsLoadingFile(true);
    setDiff(null); // Clear diff view when switching files

    try {
        const token = localStorage.getItem('gh_token') || '';
        const content = await fetchFileRaw(token, decodeURIComponent(repoId || ''), file.path);
        setActiveFileContent(content);
    } catch (e) {
        setActiveFileContent('Error loading file content.');
    } finally {
        setIsLoadingFile(false);
    }
  };

  const handleCreatePlan = async () => {
    if (!prompt) return;
    setIsAnalyzing(true);
    try {
      const jsonStr = await generatePlan(prompt, repoContext);
      const cleanJson = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
      const planData = JSON.parse(cleanJson);
      setPlan(planData.steps.map((s: any) => ({ ...s, status: 'PENDING' })));
    } catch (e) {
      setPlan([
        { id: '1', title: 'Analyze Request', description: 'Review constraints', file_path: 'docs/README.md', operation: 'UPDATE', status: 'PENDING' },
      ]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExecute = async (step: PlanStep) => {
    setCurrentStepId(step.id);
    setPlan(prev => prev?.map(s => s.id === step.id ? { ...s, status: 'IN_PROGRESS' } : s) || null);
    try {
      await new Promise(r => setTimeout(r, 1000));
      const resultCode = await executeStep(step.description, repoContext);
      setDiff(resultCode);
      setPlan(prev => prev?.map(s => s.id === step.id ? { ...s, status: 'COMPLETED' } : s) || null);
    } catch (e) {
      setPlan(prev => prev?.map(s => s.id === step.id ? { ...s, status: 'FAILED' } : s) || null);
    } finally {
      setCurrentStepId(null);
    }
  };

  return (
    <Layout>
      <div className="flex h-full">
        
        {/* CENTER PANE: Chat / Agent Interaction */}
        <div className="flex-1 flex flex-col border-r border-[#27272a] bg-[#09090b] relative">
           
           {/* Chat History / Empty State */}
           <div className="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col">
              {!plan ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
                     <Cpu className="w-12 h-12 mb-4 text-gray-600" />
                     <p className="text-gray-400">Select a repository and describe your task.</p>
                  </div>
              ) : (
                  <div className="space-y-6">
                      {/* User Prompt Bubble */}
                      <div className="flex justify-end">
                          <div className="bg-[#27272a] text-gray-200 px-4 py-2 rounded-2xl rounded-tr-sm max-w-[80%]">
                              {prompt}
                          </div>
                      </div>

                      {/* AI Plan Response */}
                      <div className="flex justify-start w-full">
                           <div className="w-full">
                               <div className="flex items-center gap-2 mb-2 text-gray-400 text-xs uppercase tracking-wider font-semibold">
                                   <Bot className="w-3 h-3" />
                                   Implementation Plan
                               </div>
                               <div className="border border-[#27272a] rounded-lg overflow-hidden bg-[#0c0c0c]">
                                   {plan.map((step, idx) => (
                                       <div key={step.id} className="p-3 border-b border-[#27272a] last:border-0 flex items-center justify-between hover:bg-[#18181b] group">
                                           <div className="flex items-center gap-3">
                                               <div className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] 
                                                   ${step.status === 'COMPLETED' ? 'bg-green-900 border-green-500 text-green-500' : 'border-gray-600 text-gray-600'}
                                               `}>
                                                   {step.status === 'COMPLETED' ? <CheckCircle2 className="w-3 h-3" /> : idx + 1}
                                               </div>
                                               <div>
                                                   <div className="text-sm text-gray-200">{step.title}</div>
                                                   <div className="text-xs text-gray-500 font-mono">{step.file_path}</div>
                                               </div>
                                           </div>
                                           {step.status !== 'COMPLETED' && (
                                               <button 
                                                   onClick={() => handleExecute(step)}
                                                   className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white"
                                               >
                                                   {step.status === 'IN_PROGRESS' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                                               </button>
                                           )}
                                       </div>
                                   ))}
                               </div>
                           </div>
                      </div>
                  </div>
              )}
           </div>

           {/* Input Area (Pinned Bottom) */}
           <div className="p-4 bg-[#09090b]">
               <div className="relative bg-[#18181b] border border-[#27272a] rounded-xl p-3 shadow-lg">
                   <div className="mb-2">
                       <textarea 
                           value={prompt}
                           onChange={(e) => setPrompt(e.target.value)}
                           placeholder="Ask Forge to build, fix bugs, explore..."
                           className="w-full bg-transparent text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none resize-none min-h-[48px]"
                       />
                   </div>
                   
                   <div className="flex items-center justify-between pt-2 border-t border-[#27272a]/50">
                       <div className="flex items-center gap-2">
                           <div className="flex items-center gap-2 px-2 py-1 rounded bg-[#27272a] border border-[#3f3f46] text-xs text-gray-300 cursor-pointer hover:bg-[#3f3f46]">
                               <FolderOpen className="w-3 h-3" />
                               <span className="truncate max-w-[100px]">{decodeURIComponent(repoId || '').split('/')[1] || 'Select Repo'}</span>
                               <ChevronDown className="w-3 h-3 opacity-50" />
                           </div>
                       </div>
                       
                       <div className="flex items-center gap-2">
                           <button className="p-1.5 text-gray-500 hover:text-gray-300 transition-colors">
                               <ImageIcon className="w-4 h-4" />
                           </button>
                           <button 
                               onClick={handleCreatePlan}
                               disabled={!prompt || isAnalyzing}
                               className={`p-1.5 rounded-lg transition-colors ${prompt ? 'bg-white text-black hover:bg-gray-200' : 'bg-[#27272a] text-gray-600'}`}
                           >
                               <ArrowUp className="w-4 h-4" />
                           </button>
                       </div>
                   </div>
               </div>
           </div>
        </div>

        {/* RIGHT PANE: Code / Diff View */}
        <div className="w-[500px] bg-[#0c0c0c] flex flex-col border-l border-[#27272a] hidden md:flex">
            {/* Header */}
            <div className="h-10 border-b border-[#27272a] flex items-center px-4 justify-between bg-[#0c0c0c]">
                <div className="flex items-center gap-2 text-sm text-gray-300">
                    <Terminal className="w-3 h-3 text-gray-500" />
                    <span>File Explorer</span>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                
                {/* File List */}
                <div className="h-1/3 overflow-y-auto border-b border-[#27272a] custom-scrollbar">
                    {repoFiles.length === 0 ? (
                        <div className="p-4 text-xs text-gray-500 text-center">Loading files...</div>
                    ) : (
                        <div className="flex flex-col">
                            {repoFiles.map((file, i) => (
                                <div 
                                    key={i} 
                                    onClick={() => handleFileClick(file)}
                                    className={`px-4 py-2 flex items-center justify-between cursor-pointer hover:bg-[#18181b] ${activeFile?.path === file.path ? 'bg-[#18181b] border-l-2 border-forge-500' : 'border-l-2 border-transparent'}`}
                                >
                                    <div className="flex items-center gap-2">
                                        {file.type === 'dir' ? (
                                            <FolderOpen className="w-3 h-3 text-blue-400" />
                                        ) : (
                                            <FileCode className="w-3 h-3 text-gray-500" />
                                        )}
                                        <span className={`text-xs font-mono ${activeFile?.path === file.path ? 'text-white' : 'text-gray-400'}`}>
                                            {file.name}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Code / Diff Viewer */}
                <div className="flex-1 bg-[#09090b] overflow-auto custom-scrollbar relative">
                    {isLoadingFile ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
                        </div>
                    ) : diff ? (
                        <div className="p-4">
                            <div className="text-xs text-gray-500 mb-2 font-mono">Proposed Changes:</div>
                            <pre className="font-mono text-xs leading-5 text-gray-300 whitespace-pre-wrap">
                                {diff}
                            </pre>
                        </div>
                    ) : activeFileContent ? (
                        <div className="p-4">
                             <div className="text-xs text-gray-500 mb-2 font-mono">{activeFile?.path}</div>
                             <pre className="font-mono text-xs leading-5 text-gray-300 whitespace-pre-wrap">
                                {activeFileContent}
                             </pre>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-600">
                            <FileText className="w-10 h-10 mb-3 opacity-20" />
                            <p className="text-xs">Select a file to view content</p>
                        </div>
                    )}
                </div>

            </div>
            
            {/* Bottom Status Bar */}
            <div className="h-6 bg-[#0c0c0c] border-t border-[#27272a] flex items-center px-3 justify-between text-[10px] text-gray-500">
                 <span>{activeFile ? activeFile.path : 'No file selected'}</span>
                 <div className="flex items-center gap-3">
                     <span>{activeFileContent.length} bytes</span>
                     <span>UTF-8</span>
                 </div>
            </div>
        </div>
      </div>
    </Layout>
  );
}