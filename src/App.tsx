import React, { useState, useEffect } from 'react';
import { generateDecisions, Attachment } from './lib/gemini';
import { MarkdownRenderer } from './components/MarkdownRenderer';
import { FileUploader } from './components/FileUploader';
import { RecommendationCard } from './components/RecommendationCard';
import { parseRecommendations, Recommendation } from './lib/parser';
import { Loader2, AlertCircle, FileText, Send, RefreshCw, Download, Globe2, BrainCircuit, ListChecks, FileSpreadsheet, Printer } from 'lucide-react';
import { motion } from 'motion/react';

const SAMPLE_CONTEXT = `**Enter the instructions here after removing this line.`;

export default function App() {
  const [context, setContext] = useState(SAMPLE_CONTEXT);
  const [files, setFiles] = useState<File[]>([]);
  const [result, setResult] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
            <div className="hidden md:flex items-center gap-2 text-xs font-mono text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
              <BrainCircuit size={14} className="text-indigo-600" />
              <span className="font-semibold text-indigo-900">THINKING MODE: ON</span>
            </div>
            <button 
              onClick={() => setContext(SAMPLE_CONTEXT)}
              className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
              title="Reset"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
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
        </div>
      </main>
    </div>
  );
}
