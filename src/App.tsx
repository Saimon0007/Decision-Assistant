import React, { useState, useEffect } from 'react';
import { generateDecisions, Attachment } from './lib/gemini';
import { MarkdownRenderer } from './components/MarkdownRenderer';
import { FileUploader } from './components/FileUploader';
import { RecommendationCard } from './components/RecommendationCard';
import { AuthModal } from './components/AuthModal';
import { SessionsSidebar } from './components/SessionsSidebar';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { parseRecommendations, Recommendation } from './lib/parser';
import { Loader2, AlertCircle, FileText, Send, RefreshCw, Download, Globe2, BrainCircuit, ListChecks, FileSpreadsheet, Printer, Save, History, LogOut, User as UserIcon, LayoutDashboard, Zap } from 'lucide-react';
import { motion } from 'motion/react';

const SAMPLE_CONTEXT = `**Enter the instructions here after removing this line.`;

export default function App() {
  const [context, setContext] = useState(SAMPLE_CONTEXT);
  const [files, setFiles] = useState<File[]>([]);
  const [result, setResult] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Auth & Sessions State
  const [user, setUser] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSessions, setShowSessions] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);

  // View State
  const [currentView, setCurrentView] = useState<'generator' | 'dashboard'>('generator');

  // Check auth status on mount
  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
          loadSessions();
        }
      })
      .catch(() => {}); // Ignore errors if not logged in
  }, []);

  const loadSessions = async () => {
    try {
      const res = await fetch('/api/sessions');
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch (err) {
      console.error("Failed to load sessions", err);
    }
  };

  const handleLogin = (userData: any) => {
    setUser(userData);
    loadSessions();
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setSessions([]);
    setShowSessions(false);
    setContext(SAMPLE_CONTEXT);
    setResult(null);
    setRecommendations([]);
    setCurrentSessionId(null);
    setCurrentView('generator');
  };

  const handleSaveSession = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    
    if (!result) return;

    const title = context.split('\n')[0].substring(0, 50) || 'Untitled Session';
    
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          context,
          result,
          recommendations
        })
      });
      
      if (res.ok) {
        loadSessions();
        alert('Session saved successfully!');
      }
    } catch (err) {
      console.error("Failed to save session", err);
    }
  };

  const handleLoadSession = async (id: number) => {
    try {
      const res = await fetch(`/api/sessions/${id}`);
      if (res.ok) {
        const data = await res.json();
        setContext(data.context || '');
        setResult(data.result);
        setRecommendations(data.recommendations || []);
        setCurrentSessionId(data.id);
        setShowSessions(false);
        setCurrentView('generator');
      }
    } catch (err) {
      console.error("Failed to load session", err);
    }
  };

  const handleDeleteSession = async (id: number) => {
    if (!confirm('Are you sure you want to delete this session?')) return;
    try {
      await fetch(`/api/sessions/${id}`, { method: 'DELETE' });
      loadSessions();
      if (currentSessionId === id) {
        setCurrentSessionId(null);
        setContext(SAMPLE_CONTEXT);
        setResult(null);
        setRecommendations([]);
      }
    } catch (err) {
      console.error("Failed to delete session", err);
    }
  };

  const handleFilesSelected = (newFiles: File[]) => {
    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleRemoveFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const processFiles = async (filesToProcess: File[]): Promise<Attachment[]> => {
    const processedAttachments: Attachment[] = [];

    for (const file of filesToProcess) {
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      processedAttachments.push({
        mimeType: file.type,
        data: base64Data
      });
    }

    return processedAttachments;
  };

  const handleGenerate = async () => {
    if (!context.trim() && files.length === 0) {
      setError("Please provide text context or upload files.");
      return;
    }
    
    setLoading(true);
    setError(null);
    setResult(null);
    setRecommendations([]);

    try {
      const attachments = await processFiles(files);
      const response = await generateDecisions(context, attachments);
      setResult(response);
      
      // Parse recommendations from the response
      const parsedRecs = parseRecommendations(response);
      setRecommendations(parsedRecs);
      
    } catch (err) {
      setError("Failed to generate analysis. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCSV = () => {
    if (recommendations.length === 0) return;

    const headers = ['ID', 'Priority', 'Statement', 'Status', 'Supporting Facts', 'Sources'];
    const rows = recommendations.map(rec => [
      rec.id,
      rec.priority,
      `"${rec.statement.replace(/"/g, '""')}"`, // Escape quotes
      rec.status,
      `"${rec.facts.replace(/"/g, '""')}"`,
      `"${rec.sources.replace(/"/g, '""')}"`
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `strategic_decisions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-900 rounded-lg flex items-center justify-center text-white shadow-md">
              <Globe2 size={20} />
            </div>
            <div>
              <h1 className="text-lg font-serif font-bold tracking-tight text-slate-900 leading-none">
                Decision Assistant
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-1">Global Market Intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* View Switcher */}
            {user && (
              <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 mr-2">
                <button
                  onClick={() => setCurrentView('generator')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-2 ${
                    currentView === 'generator' 
                      ? 'bg-white text-indigo-900 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Zap size={14} />
                  Generator
                </button>
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-2 ${
                    currentView === 'dashboard' 
                      ? 'bg-white text-indigo-900 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <LayoutDashboard size={14} />
                  Analytics
                </button>
              </div>
            )}

            <div className="hidden md:flex items-center gap-2 text-xs font-mono text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
              <BrainCircuit size={14} className="text-indigo-600" />
              <span className="font-semibold text-indigo-900">THINKING MODE: ON</span>
            </div>
            
            {/* Auth & Session Controls */}
            {user ? (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowSessions(true)}
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors relative"
                  title="Saved Sessions"
                >
                  <History size={18} />
                  {sessions.length > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-indigo-500 rounded-full"></span>
                  )}
                </button>
                <div className="h-6 w-px bg-slate-200 mx-1"></div>
                <div className="flex items-center gap-2 mr-2">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-xs">
                    {user.username.substring(0, 2).toUpperCase()}
                  </div>
                </div>
                <button 
                  onClick={handleLogout}
                  className="text-xs text-slate-500 hover:text-red-600 font-medium"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setShowAuthModal(true)}
                className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-800 px-3 py-1.5 rounded-md hover:bg-indigo-50 transition-colors"
              >
                <UserIcon size={16} />
                Sign In
              </button>
            )}

            <button 
              onClick={() => {
                setContext(SAMPLE_CONTEXT);
                setResult(null);
                setRecommendations([]);
                setCurrentSessionId(null);
                setCurrentView('generator');
              }}
              className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
              title="Reset"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full relative">
        {currentView === 'dashboard' && user ? (
          <AnalyticsDashboard />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
            
            {/* Input Section */}
            <div className="lg:col-span-5 flex flex-col gap-6 input-section">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-[calc(100vh-12rem)] min-h-[600px] overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <FileText size={14} />
                    Context & Data Stream
                  </h2>
                  <button
                    onClick={() => setContext(SAMPLE_CONTEXT)}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 px-2 py-1 hover:bg-indigo-50 rounded transition-colors"
                  >
                    Load Sample
                  </button>
                </div>
                
                <div className="flex-grow flex flex-col overflow-y-auto custom-scrollbar">
                  <div className="p-6 border-b border-slate-100">
                    <FileUploader 
                      onFilesSelected={handleFilesSelected}
                      selectedFiles={files}
                      onRemoveFile={handleRemoveFile}
                      disabled={loading}
                    />
                  </div>
                  <div className="flex-grow relative min-h-[200px]">
                    <textarea
                      value={context}
                      onChange={(e) => setContext(e.target.value)}
                      className="w-full h-full p-6 text-sm font-mono bg-white text-slate-800 resize-none focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500/20"
                      placeholder="Describe the industry, job role, or market trend you want to analyze..."
                      spellCheck={false}
                    />
                  </div>
                </div>
                
                <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                  <button
                    onClick={handleGenerate}
                    disabled={loading || (!context.trim() && files.length === 0)}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-900 hover:bg-indigo-800 text-white font-medium py-3 px-4 rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed disabled:shadow-none"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin" size={18} />
                        Analyzing Global Trends...
                      </>
                    ) : (
                      <>
                        <Send size={18} />
                        Generate Market Analysis
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100 flex gap-3 items-start">
                <BrainCircuit size={18} className="text-indigo-600 shrink-0 mt-0.5" />
                <div className="text-xs text-indigo-900 leading-relaxed">
                  <strong className="font-semibold block mb-1">Deep Analysis Active:</strong>
                  Using <strong>Gemini 3.1 Pro</strong> with Thinking Mode & Google Search. This may take longer but provides real-time, reasoned insights into global and Bangladesh markets.
                </div>
              </div>
            </div>

            {/* Output Section */}
            <div className="lg:col-span-7 flex flex-col h-full">
              {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200 mb-6 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                  <AlertCircle size={20} />
                  {error}
                </div>
              )}

              <div id="report-content" className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full min-h-[600px] relative overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                  <div>
                    <h2 className="text-lg font-serif font-semibold text-slate-900">
                      Strategic Analysis
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Powered by Real-Time Search & Advanced Reasoning
                    </p>
                  </div>
                  {result && (
                    <div className="flex items-center gap-2">
                      {user && (
                        <button 
                          onClick={handleSaveSession}
                          className="flex items-center gap-2 text-xs font-medium text-indigo-600 hover:text-indigo-900 border border-indigo-200 hover:border-indigo-300 bg-indigo-50 px-3 py-1.5 rounded-md transition-colors shadow-sm"
                          title="Save Session"
                        >
                          <Save size={14} />
                          Save
                        </button>
                      )}
                      {recommendations.length > 0 && (
                        <button 
                          onClick={handleDownloadCSV}
                          className="flex items-center gap-2 text-xs font-medium text-emerald-700 hover:text-emerald-900 border border-emerald-200 hover:border-emerald-300 bg-emerald-50 px-3 py-1.5 rounded-md transition-colors shadow-sm"
                          title="Download Recommendations as CSV"
                        >
                          <FileSpreadsheet size={14} />
                          CSV
                        </button>
                      )}
                      <button 
                        onClick={handlePrintPDF}
                        className="flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 bg-white px-3 py-1.5 rounded-md transition-colors shadow-sm"
                        title="Print or Save as PDF"
                      >
                        <Printer size={14} />
                        PDF
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex-grow p-8 overflow-y-auto custom-scrollbar">
                  {loading ? (
                    <div className="space-y-8 animate-pulse">
                      <div className="flex items-center gap-3 text-indigo-600 mb-6">
                        <BrainCircuit className="animate-pulse" size={24} />
                        <span className="text-sm font-medium">Thinking & Searching Live Data...</span>
                      </div>
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="space-y-3">
                          <div className="h-6 bg-slate-200 rounded w-3/4"></div>
                          <div className="h-4 bg-slate-100 rounded w-full"></div>
                          <div className="h-4 bg-slate-100 rounded w-5/6"></div>
                          <div className="h-20 bg-slate-50 rounded border border-slate-100 mt-4"></div>
                        </div>
                      ))}
                    </div>
                  ) : result ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5 }}
                      className="space-y-8"
                    >
                      {/* Visual Recommendations */}
                      {recommendations.length > 0 && (
                        <div className="mb-8">
                          <div className="flex items-center gap-2 mb-4">
                            <ListChecks size={18} className="text-indigo-600" />
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Prioritized Actions</h3>
                          </div>
                          <div className="grid gap-4">
                            {recommendations.map((rec, idx) => (
                              <RecommendationCard key={idx} recommendation={rec} />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Full Report */}
                      <div>
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">Full Intelligence Report</h3>
                        <MarkdownRenderer content={result} />
                      </div>
                    </motion.div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 border border-slate-100">
                        <Globe2 size={32} className="opacity-30" />
                      </div>
                      <h3 className="font-medium text-slate-600 text-lg">Market Intelligence Ready</h3>
                      <p className="text-sm mt-2 max-w-xs text-slate-400">
                        Input a job role or industry to analyze global trends and Bangladesh-specific opportunities.
                      </p>
                    </div>
                  )}
                </div>
                
                {result && (
                  <div className="p-3 bg-slate-50 border-t border-slate-200 text-[10px] text-slate-400 text-center font-mono uppercase tracking-wider">
                    Generated by Gemini 3.1 Pro • Real-Time Data
                  </div>
                )}
              </div>
            </div>

            {/* Modals */}
            {showAuthModal && (
              <AuthModal onLogin={handleLogin} onClose={() => setShowAuthModal(false)} />
            )}
            
            <SessionsSidebar 
              sessions={sessions}
              onSelectSession={handleLoadSession}
              onDeleteSession={handleDeleteSession}
              isOpen={showSessions}
              onClose={() => setShowSessions(false)}
            />
          </div>
        )}
      </main>
    </div>
  );
}
