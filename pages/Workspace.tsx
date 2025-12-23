import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { generatePlan, executeStep } from '../services/ai';
import { fetchRepoContents, fetchFileRaw, commitFile, GitHubFile } from '../services/github';
import { PlanStep } from '../types';
import { 
  Bot, 
  Play, 
  CheckCircle2, 
  FileCode, 
  Loader2, 
  Terminal,
  ChevronDown,
  ArrowUp,
  Image as ImageIcon,
  FolderOpen,
  FileText,
  Save,
  GitCommit
} from 'lucide-react';

export default function Workspace() {
  const { repoId } = useParams();
  
  const [prompt, setPrompt] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [plan, setPlan] = useState<PlanStep[] | null>(null);
  const [currentStepId, setCurrentStepId] = useState<string | null>(null);
  const [repoContext, setRepoContext] = useState<string>('');
  
  // Real File System State
  const [repoFiles, setRepoFiles] = useState<GitHubFile[]>([]);
  const [activeFile, setActiveFile] = useState<GitHubFile | null>(null);
  const [activeFileContent, setActiveFileContent] = useState<string>('');
  const [activeFileSha, setActiveFileSha] = useState<string>('');
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  
  // Diff/New Content State
  const [proposedContent, setProposedContent] = useState<string | null>(null);

  // Load Repo Context & Files
  useEffect(() => {
    const loadContext = async () => {
      const token = localStorage.getItem('gh_token');
      if (!token || !repoId) {
        setRepoContext("// Context unavailable");
        return;
      }

      const decodedRepoName = decodeURIComponent(repoId);

      try {
        // Fetch root files
        const files = await fetchRepoContents(token, decodedRepoName, '');
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
          const result = await fetchFileRaw(token, decodedRepoName, readme.path);
          readmeContent = result.content;
          // Set as active file initially
          setActiveFile(readme);
          setActiveFileContent(result.content);
          setActiveFileSha(result.sha);
        }

        setRepoContext(`Repo: ${decodedRepoName}\nFiles:\n${fileList}\nREADME:\n${readmeContent.substring(0, 1000)}...`);
      } catch (e) {
        console.error("Failed to load context", e);
      }
    };
    loadContext();
  }, [repoId]);

  const handleFileClick = async (file: GitHubFile) => {
    if (file.type !== 'file') return;
    
    setActiveFile(file);
    setIsLoadingFile(true);
    setProposedContent(null);

    try {
        const token = localStorage.getItem('gh_token') || '';
        const { content, sha } = await fetchFileRaw(token, decodeURIComponent(repoId || ''), file.path);
        setActiveFileContent(content);
        setActiveFileSha(sha);
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
      // Attempt to parse JSON even if messy
      const cleanJson = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
      const planData = JSON.parse(cleanJson);
      setPlan(planData.steps.map((s: any) => ({ ...s, status: 'PENDING' })));
    } catch (e) {
      console.error("Plan generation failed", e);
      // Fallback plan
      setPlan([
        { id: '1', title: 'Manual Review', description: 'Review code manually due to AI error.', file_path: 'README.md', operation: 'UPDATE', status: 'PENDING' },
      ]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExecute = async (step: PlanStep) => {
    setCurrentStepId(step.id);
    setPlan(prev => prev?.map(s => s.id === step.id ? { ...s, status: 'IN_PROGRESS' } : s) || null);
    
    // Switch to the relevant file if found in list
    const targetFile = repoFiles.find(f => f.path === step.file_path);
    let currentCode = '';
    let sha = '';

    if (targetFile) {
        setActiveFile(targetFile);
        setIsLoadingFile(true);
        try {
            const token = localStorage.getItem('gh_token') || '';
            const res = await fetchFileRaw(token, decodeURIComponent(repoId || ''), targetFile.path);
            currentCode = res.content;
            sha = res.sha;
            setActiveFileContent(currentCode);
            setActiveFileSha(sha);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoadingFile(false);
        }
    } else {
        // If file doesn't exist, we assume creating (currentCode empty)
        // But for this MVP we focus on updates primarily or creating at root
    }

    try {
      const newCode = await executeStep(step.description, currentCode);
      setProposedContent(newCode);
      setPlan(prev => prev?.map(s => s.id === step.id ? { ...s, status: 'COMPLETED' } : s) || null);
    } catch (e) {
      setPlan(prev => prev?.map(s => s.id === step.id ? { ...s, status: 'FAILED' } : s) || null);
    } finally {
      setCurrentStepId(null);
    }
  };

  const handleCommit = async () => {
    if (!activeFile || !proposedContent || !repoId) return;
    
    setIsCommitting(true);
    const token = localStorage.getItem('gh_token') || '';
    
    const success = await commitFile(
        token, 
        decodeURIComponent(repoId), 
        activeFile.path, 
        proposedContent, 
        `Forge: Update ${activeFile.path}`, 
        activeFileSha
    );

    if (success) {
        setActiveFileContent(proposedContent);
        setProposedContent(null);
        // Refresh SHA potentially needed here but simple update works
        alert("Changes committed successfully!");
    } else {
        alert("Failed to commit changes.");
    }
    setIsCommitting(false);
  };

  return (
    <Layout>
      <div className="flex h-full w-full overflow-hidden">
        
        {/* LEFT PANE: Chat / Agent Interaction */}
        <div className="flex-[0.4] min-w-[320px] flex flex-col border-r border-[#27272a] bg-[#09090b] relative">
           
           {/* Chat History */}
           <div className="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col">
              {!plan ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
                     <Bot className="w-12 h-12 mb-4 text-gray-600" />
                     <p className="text-gray-400 text-sm">Select a repository and describe your task.</p>
                  </div>
              ) : (
                  <div className="space-y-6 pb-20">
                      {/* User Prompt */}
                      <div className="flex justify-end">
                          <div className="bg-[#27272a] text-gray-200 px-4 py-3 rounded-2xl rounded-tr-sm text-sm max-w-[90%] shadow-sm">
                              {prompt}
                          </div>
                      </div>

                      {/* AI Plan */}
                      <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                           <div className="flex items-center gap-2 mb-3 text-forge-400 text-xs uppercase tracking-wider font-bold">
                               <Bot className="w-3 h-3" />
                               Implementation Plan
                           </div>
                           <div className="border border-[#27272a] rounded-xl overflow-hidden bg-[#0c0c0c] shadow-sm">
                               {plan.map((step, idx) => (
                                   <div key={step.id} className="p-3 border-b border-[#27272a] last:border-0 flex items-center justify-between hover:bg-[#18181b] transition-colors group">
                                       <div className="flex items-center gap-3 overflow-hidden">
                                           <div className={`flex-shrink-0 w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-bold
                                               ${step.status === 'COMPLETED' ? 'bg-green-900/30 border-green-500/50 text-green-500' : 'border-gray-700 text-gray-500'}
                                           `}>
                                               {step.status === 'COMPLETED' ? <CheckCircle2 className="w-3 h-3" /> : idx + 1}
                                           </div>
                                           <div className="min-w-0">
                                               <div className="text-sm text-gray-200 truncate font-medium">{step.title}</div>
                                               <div className="text-xs text-gray-500 font-mono truncate">{step.file_path}</div>
                                           </div>
                                       </div>
                                       {step.status !== 'COMPLETED' && (
                                           <button 
                                               onClick={() => handleExecute(step)}
                                               disabled={!!currentStepId}
                                               className="p-1.5 hover:bg-white/10 rounded-md text-gray-400 hover:text-white transition-all disabled:opacity-50"
                                           >
                                               {step.status === 'IN_PROGRESS' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                                           </button>
                                       )}
                                   </div>
                               ))}
                           </div>
                      </div>
                  </div>
              )}
           </div>

           {/* Input Area */}
           <div className="p-4 bg-[#09090b] border-t border-[#27272a]">
               <div className="relative bg-[#18181b] border border-[#27272a] rounded-xl p-1 shadow-lg focus-within:border-gray-500 transition-colors">
                   <textarea 
                       value={prompt}
                       onChange={(e) => setPrompt(e.target.value)}
                       placeholder="Ask Forge to build, fix bugs, explore..."
                       className="w-full bg-transparent text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none resize-none min-h-[48px] p-3"
                   />
                   
                   <div className="flex items-center justify-between px-2 pb-2">
                       <div className="flex items-center gap-2">
                           <div className="flex items-center gap-2 px-2 py-1 rounded bg-[#27272a] border border-[#3f3f46] text-xs text-gray-300 cursor-pointer hover:bg-[#3f3f46]">
                               <FolderOpen className="w-3 h-3" />
                               <span className="truncate max-w-[100px]">{decodeURIComponent(repoId || '').split('/')[1] || 'Repo'}</span>
                               <ChevronDown className="w-3 h-3 opacity-50" />
                           </div>
                       </div>
                       
                       <div className="flex items-center gap-1">
                           <button 
                               onClick={handleCreatePlan}
                               disabled={!prompt || isAnalyzing}
                               className={`p-2 rounded-lg transition-colors ${prompt ? 'bg-white text-black hover:bg-gray-200' : 'bg-[#27272a] text-gray-600'}`}
                           >
                               {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4" />}
                           </button>
                       </div>
                   </div>
               </div>
           </div>
        </div>

        {/* RIGHT PANE: Code / Diff View */}
        <div className="flex-[0.6] bg-[#0c0c0c] flex flex-col min-w-0">
            {/* Header */}
            <div className="h-10 min-h-[40px] border-b border-[#27272a] flex items-center px-4 justify-between bg-[#0c0c0c]">
                <div className="flex items-center gap-2 text-sm text-gray-300">
                    <Terminal className="w-3 h-3 text-gray-500" />
                    <span>{activeFile ? activeFile.path : 'File Explorer'}</span>
                </div>
                {proposedContent && (
                    <div className="flex items-center gap-2">
                         <span className="text-xs text-yellow-500">Unsaved Changes</span>
                         <button 
                            onClick={handleCommit}
                            disabled={isCommitting}
                            className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 rounded-md transition-colors"
                         >
                            {isCommitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <GitCommit className="w-3 h-3" />}
                            Commit
                         </button>
                    </div>
                )}
            </div>

            {/* Content Area */}
            <div className="flex-1 flex overflow-hidden">
                
                {/* File List Sidebar */}
                <div className="w-48 border-r border-[#27272a] flex flex-col bg-[#0a0a0a]">
                    <div className="p-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Explorer</div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {repoFiles.length === 0 ? (
                            <div className="p-4 text-xs text-gray-500 text-center">Loading...</div>
                        ) : (
                            <div className="flex flex-col">
                                {repoFiles.map((file, i) => (
                                    <div 
                                        key={i} 
                                        onClick={() => handleFileClick(file)}
                                        className={`px-3 py-1.5 flex items-center gap-2 cursor-pointer hover:bg-[#18181b] truncate ${activeFile?.path === file.path ? 'bg-[#18181b] text-white' : 'text-gray-400'}`}
                                    >
                                        {file.type === 'dir' ? (
                                            <FolderOpen className="w-3 h-3 flex-shrink-0 text-blue-400" />
                                        ) : (
                                            <FileCode className="w-3 h-3 flex-shrink-0 text-gray-600" />
                                        )}
                                        <span className="text-xs font-mono truncate">{file.name}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Editor Area */}
                <div className="flex-1 bg-[#09090b] overflow-auto custom-scrollbar relative flex flex-col">
                    {isLoadingFile ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
                        </div>
                    ) : proposedContent ? (
                        <div className="flex-1 flex flex-col">
                            <div className="bg-yellow-900/10 border-b border-yellow-900/30 p-2 text-xs text-yellow-500 flex justify-between">
                                <span>Proposed AI Changes</span>
                                <span className="underline cursor-pointer" onClick={() => setProposedContent(null)}>Discard</span>
                            </div>
                            <textarea 
                                readOnly
                                className="flex-1 w-full h-full bg-[#09090b] p-4 font-mono text-xs leading-5 text-gray-300 resize-none focus:outline-none"
                                value={proposedContent}
                            />
                        </div>
                    ) : activeFileContent ? (
                        <textarea 
                            readOnly
                            className="flex-1 w-full h-full bg-[#09090b] p-4 font-mono text-xs leading-5 text-gray-300 resize-none focus:outline-none"
                            value={activeFileContent}
                        />
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
                 <span className="font-mono">{activeFile ? activeFile.path : ''}</span>
                 <div className="flex items-center gap-3">
                     <span>{activeFileContent.length} chars</span>
                     <span>UTF-8</span>
                 </div>
            </div>
        </div>
      </div>
    </Layout>
  );
}