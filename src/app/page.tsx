"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Sparkles, Copy, Download, RefreshCw, Upload, FileText, AlertCircle, ChevronDown, ChevronUp, Search, Filter } from "lucide-react";
import * as Slider from "@radix-ui/react-slider";
import * as Switch from "@radix-ui/react-switch";
import JSZip from "jszip";

interface BatchFile {
  id: string;
  name: string;
  content: string;
  isTxt: boolean;
  status: 'pending' | 'processing' | 'done' | 'error';
  result?: {
    humanizedText: string;
    confidenceScore: number;
    semanticRetention: number;
    wordsAdded: number;
    transformations: any[];
  };
  error?: string;
}

export default function Home() {
  const [mode, setMode] = useState<'single' | 'batch'>('single');
  
  // Single Mode State
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [isProcessingSingle, setIsProcessingSingle] = useState(false);
  const [transformations, setTransformations] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  const [metrics, setMetrics] = useState({
    confidenceScore: 0,
    semanticRetention: 0,
    wordsAdded: 0
  });

  // Batch Mode State
  const [batchFiles, setBatchFiles] = useState<BatchFile[]>([]);
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<'name_asc' | 'confidence_desc' | 'confidence_asc'>('name_asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedFileId, setExpandedFileId] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ITEMS_PER_PAGE = 10;

  // Configuration State (Shared)
  const [synonymIntensity, setSynonymIntensity] = useState([0.2]);
  const [transitionFreq, setTransitionFreq] = useState([0.2]);
  const [creativity, setCreativity] = useState([50]);
  const [contextPreservation, setContextPreservation] = useState([80]);
  const [preserveIntent, setPreserveIntent] = useState(true);
  const [verificationAlgorithm, setVerificationAlgorithm] = useState<'dice' | 'levenshtein'>('dice');

  // High-Level Styling State (Shared)
  const [tone, setTone] = useState("neutral");
  const [formality, setFormality] = useState("formal");
  const [purpose, setPurpose] = useState("general");

  const buildApiPayload = (text: string) => ({
    text, tone, formality,
    synonymIntensity, transitionFreq,
    creativity, contextPreservation, preserveIntent,
    verificationAlgorithm
  });

  const handleHumanizeSingle = async () => {
    if (!inputText.trim()) return;
    setIsProcessingSingle(true);
    
    try {
      const response = await fetch('/api/humanize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildApiPayload(inputText)),
      });

      const data = await response.json();
      
      if (response.ok) {
        setOutputText(data.humanizedText);
        setTransformations(data.transformations || []);
        setMetrics({
          confidenceScore: data.confidenceScore,
          semanticRetention: data.semanticRetention,
          wordsAdded: data.wordsAdded
        });
      } else {
        console.error("Error:", data.error);
        setOutputText("An error occurred during deterministic processing.");
      }
    } catch (error) {
      console.error("Network error:", error);
      setOutputText("A network error occurred.");
    } finally {
      setIsProcessingSingle(false);
    }
  };

  const handleZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const zip = new JSZip();
      const contents = await zip.loadAsync(file);
      const extractedFiles: BatchFile[] = [];

      let idCounter = 0;
      for (const relativePath in contents.files) {
        const zipEntry = contents.files[relativePath];
        if (zipEntry.dir) continue; // Skip directories
        
        // Ignore common OS hidden files
        if (zipEntry.name.startsWith('__MACOSX') || zipEntry.name.includes('.DS_Store')) continue;

        const isTxt = zipEntry.name.toLowerCase().endsWith('.txt');
        let textContent = "";
        
        if (isTxt) {
          textContent = await zipEntry.async("string");
        }

        extractedFiles.push({
          id: `file_${Date.now()}_${idCounter++}`,
          name: zipEntry.name,
          content: textContent,
          isTxt,
          status: 'pending'
        });
      }

      setBatchFiles(extractedFiles);
      setCurrentPage(1); // Reset to first page
    } catch (error) {
      console.error("Error unzipping file", error);
      alert("Failed to read the ZIP file. Ensure it is a valid ZIP archive.");
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleHumanizeBatch = async () => {
    if (batchFiles.length === 0 || isProcessingBatch) return;
    setIsProcessingBatch(true);

    let updatedFiles = [...batchFiles];

    for (let i = 0; i < updatedFiles.length; i++) {
      if (!updatedFiles[i].isTxt || updatedFiles[i].status === 'done') continue;

      // Set status to processing
      updatedFiles[i].status = 'processing';
      setBatchFiles([...updatedFiles]);

      try {
        const response = await fetch('/api/humanize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(buildApiPayload(updatedFiles[i].content)),
        });

        const data = await response.json();
        
        if (response.ok) {
          updatedFiles[i].status = 'done';
          updatedFiles[i].result = {
            humanizedText: data.humanizedText,
            confidenceScore: data.confidenceScore,
            semanticRetention: data.semanticRetention,
            wordsAdded: data.wordsAdded,
            transformations: data.transformations || []
          };
        } else {
          updatedFiles[i].status = 'error';
          updatedFiles[i].error = data.error || "API Error";
        }
      } catch (error) {
        updatedFiles[i].status = 'error';
        updatedFiles[i].error = "Network Error";
      }

      // Update state after each file to show real-time progress
      setBatchFiles([...updatedFiles]);
    }

    setIsProcessingBatch(false);
  };

  const handleCopySingle = async () => {
    if (!outputText) return;
    try {
      await navigator.clipboard.writeText(outputText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const handleDownloadSingle = () => {
    if (!outputText) return;
    downloadTxtFile("humanized_text.txt", outputText);
  };

  const downloadTxtFile = (filename: string, text: string) => {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadAllZip = async () => {
    const zip = new JSZip();
    const folder = zip.folder("Humanized_Results");
    
    if (!folder) return;

    let hasFiles = false;
    batchFiles.forEach(file => {
      if (file.status === 'done' && file.result?.humanizedText) {
        hasFiles = true;
        const newName = file.name.replace(/\.txt$/i, '_humanized.txt');
        folder.file(newName, file.result.humanizedText);
      }
    });

    if (!hasFiles) {
      alert("No successfully processed files to download.");
      return;
    }

    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Humanify_Batch_Results.zip";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Batch Filter & Sort Logic
  const filteredAndSortedFiles = useMemo(() => {
    let result = [...batchFiles];
    
    if (searchQuery) {
      result = result.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    
    result.sort((a, b) => {
      if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
      
      const confA = a.result?.confidenceScore || 0;
      const confB = b.result?.confidenceScore || 0;
      
      if (sortBy === 'confidence_desc') return confB - confA;
      if (sortBy === 'confidence_asc') return confA - confB;
      
      return 0;
    });
    
    return result;
  }, [batchFiles, searchQuery, sortBy]);

  const totalPages = Math.ceil(filteredAndSortedFiles.length / ITEMS_PER_PAGE);
  const currentBatchFiles = filteredAndSortedFiles.slice(
    (currentPage - 1) * ITEMS_PER_PAGE, 
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
      
      {/* LEFT COLUMN: Input & Configuration Panel */}
      <div className="flex flex-col gap-6">
        
        {/* Mode Switcher */}
        <div className="flex p-1 bg-card border border-border rounded-lg shadow-sm">
          <button 
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${mode === 'single' ? 'bg-primary text-primary-foreground shadow' : 'hover:bg-muted text-muted-foreground'}`}
            onClick={() => setMode('single')}
          >
            Single Text
          </button>
          <button 
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${mode === 'batch' ? 'bg-primary text-primary-foreground shadow' : 'hover:bg-muted text-muted-foreground'}`}
            onClick={() => setMode('batch')}
          >
            Batch Upload (.ZIP)
          </button>
        </div>

        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Configuration Panel
          </h2>

          {/* Section A: High-Level Styling */}
          <div className="space-y-4 mb-8">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">A. High-Level Styling</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Emotional Tone</label>
                <select 
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                >
                  <option value="neutral">Neutral</option>
                  <option value="positive">Positive</option>
                  <option value="persuasive">Persuasive</option>
                  <option value="empathic">Empathic</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Purpose</label>
                <select 
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                >
                  <option value="general">General</option>
                  <option value="academic">Academic</option>
                  <option value="blog">Blog / Article</option>
                  <option value="report">Business Report</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2">
              <label className="text-sm font-medium">Formality (Formal vs Informal)</label>
              <Switch.Root 
                checked={formality === "formal"}
                onCheckedChange={(c) => setFormality(c ? "formal" : "informal")}
                className="w-11 h-6 bg-muted rounded-full relative data-[state=checked]:bg-primary outline-none cursor-default shadow-inner"
              >
                <Switch.Thumb className="block w-5 h-5 bg-white rounded-full transition-transform duration-100 translate-x-0.5 will-change-transform data-[state=checked]:translate-x-[22px]" />
              </Switch.Root>
            </div>
          </div>

          {/* Section B: Deterministic Controls */}
          <div className="space-y-6">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">B. Deterministic Engine</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <label className="text-sm font-medium">Synonym Intensity</label>
                <span className="text-xs text-muted-foreground">{synonymIntensity[0]}</span>
              </div>
              <Slider.Root className="relative flex items-center select-none touch-none w-full h-5" value={synonymIntensity} onValueChange={setSynonymIntensity} max={1} step={0.05}>
                <Slider.Track className="bg-muted relative grow rounded-full h-2">
                  <Slider.Range className="absolute bg-primary rounded-full h-full" />
                </Slider.Track>
                <Slider.Thumb className="block w-4 h-4 bg-white rounded-full shadow-[0_2px_10px] shadow-black/20 hover:bg-primary/10 focus:outline-none" />
              </Slider.Root>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <label className="text-sm font-medium">Transition Frequency</label>
                <span className="text-xs text-muted-foreground">{transitionFreq[0]}</span>
              </div>
              <Slider.Root className="relative flex items-center select-none touch-none w-full h-5" value={transitionFreq} onValueChange={setTransitionFreq} max={1} step={0.05}>
                <Slider.Track className="bg-muted relative grow rounded-full h-2">
                  <Slider.Range className="absolute bg-primary rounded-full h-full" />
                </Slider.Track>
                <Slider.Thumb className="block w-4 h-4 bg-white rounded-full shadow-[0_2px_10px] shadow-black/20 hover:bg-primary/10 focus:outline-none" />
              </Slider.Root>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <label className="text-sm font-medium">Creativity Level (Markov)</label>
                <span className="text-xs text-muted-foreground">{creativity[0]}%</span>
              </div>
              <Slider.Root className="relative flex items-center select-none touch-none w-full h-5" value={creativity} onValueChange={setCreativity} max={100} step={1}>
                <Slider.Track className="bg-muted relative grow rounded-full h-2">
                  <Slider.Range className="absolute bg-primary rounded-full h-full" />
                </Slider.Track>
                <Slider.Thumb className="block w-4 h-4 bg-white rounded-full shadow-[0_2px_10px] shadow-black/20 hover:bg-primary/10 focus:outline-none" />
              </Slider.Root>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <label className="text-sm font-medium">Context Preservation</label>
                <span className="text-xs text-muted-foreground">{contextPreservation[0]}%</span>
              </div>
              <Slider.Root className="relative flex items-center select-none touch-none w-full h-5" value={contextPreservation} onValueChange={setContextPreservation} max={100} step={1}>
                <Slider.Track className="bg-muted relative grow rounded-full h-2">
                  <Slider.Range className="absolute bg-primary rounded-full h-full" />
                </Slider.Track>
                <Slider.Thumb className="block w-4 h-4 bg-white rounded-full shadow-[0_2px_10px] shadow-black/20 hover:bg-primary/10 focus:outline-none" />
              </Slider.Root>
            </div>

            <div className="flex flex-col gap-3 pt-2 pb-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Strict Semantic Verification (Preserve Intent)</label>
                <Switch.Root 
                  checked={preserveIntent}
                  onCheckedChange={setPreserveIntent}
                  className="w-11 h-6 bg-muted rounded-full relative data-[state=checked]:bg-primary outline-none cursor-default shadow-inner"
                >
                  <Switch.Thumb className="block w-5 h-5 bg-white rounded-full transition-transform duration-100 translate-x-0.5 will-change-transform data-[state=checked]:translate-x-[22px]" />
                </Switch.Root>
              </div>
              
              {preserveIntent && (
                <div className="p-3 bg-muted/30 border border-border rounded-lg space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-foreground">Similarity Algorithm</label>
                    <select 
                      className="bg-background border border-border rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50"
                      value={verificationAlgorithm}
                      onChange={(e) => setVerificationAlgorithm(e.target.value as any)}
                    >
                      <option value="dice">Sørensen–Dice Coefficient</option>
                      <option value="levenshtein">Weighted Levenshtein</option>
                    </select>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    {verificationAlgorithm === 'dice' 
                      ? "Fast and robust overlap checking. Ideal for preserving full-sentence structural meaning without penalizing stylistic swaps." 
                      : "Strict character-level precision. Mimics Project 3 by mathematically weighting insertions, deletions, and substitutions."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section C: Input Area */}
        <div className="flex flex-col gap-4">
          {mode === 'single' ? (
            <>
              <textarea
                className="w-full h-48 bg-card border border-border rounded-xl p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Paste your AI-generated text here... We will automatically protect your citations and enhance the writing style deterministically."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
              <button 
                onClick={handleHumanizeSingle}
                disabled={isProcessingSingle || !inputText.trim()}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isProcessingSingle ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                {isProcessingSingle ? "Processing Deterministically..." : "Humanize Text"}
              </button>
            </>
          ) : (
            <>
              <div 
                className="w-full h-48 bg-card border-2 border-dashed border-border rounded-xl p-4 flex flex-col items-center justify-center gap-4 text-muted-foreground hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-10 w-10 text-muted-foreground/50" />
                <div className="text-center">
                  <p className="font-medium text-foreground">Click to upload a .ZIP file</p>
                  <p className="text-sm mt-1">Contains multiple .txt files for batch processing</p>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleZipUpload} 
                  accept=".zip" 
                  className="hidden" 
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  {batchFiles.length} files queued
                </span>
                <button 
                  onClick={handleHumanizeBatch}
                  disabled={isProcessingBatch || batchFiles.length === 0}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-6 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                >
                  {isProcessingBatch ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                  {isProcessingBatch ? "Processing Batch..." : "Humanize Batch"}
                </button>
              </div>
              
              {isProcessingBatch && (
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-primary h-full transition-all duration-300" 
                    style={{ width: `${(batchFiles.filter(f => f.status === 'done' || f.status === 'error').length / batchFiles.length) * 100}%` }}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Output & Metrics Dashboard */}
      <div className="flex flex-col gap-6 h-full min-h-[600px]">
        {mode === 'single' ? (
          <>
            {/* Single Mode Output */}
            <div className="flex-1 bg-card border border-border rounded-xl p-4 flex flex-col shadow-sm">
              <div className="flex items-center justify-between mb-4 border-b border-border pb-4">
                <h2 className="text-lg font-semibold">Humanized Result</h2>
                <div className="flex gap-2">
                  <button 
                    onClick={handleCopySingle} 
                    disabled={!outputText}
                    className="p-2 hover:bg-muted rounded-md transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50" 
                    title="Copy to clipboard"
                  >
                    {copied ? <span className="text-green-500 text-xs font-medium">Copied!</span> : <Copy className="h-4 w-4" />}
                  </button>
                  <button 
                    onClick={handleDownloadSingle}
                    disabled={!outputText}
                    className="p-2 hover:bg-muted rounded-md transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50" 
                    title="Download TXT"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {isProcessingSingle ? (
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-full"></div>
                    <div className="h-4 bg-muted rounded w-5/6"></div>
                    <div className="h-4 bg-muted rounded w-full"></div>
                  </div>
                ) : outputText ? (
                  <textarea
                    readOnly
                    className="w-full h-full min-h-[300px] bg-transparent resize-none focus:outline-none text-sm text-foreground/90"
                    value={outputText}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm italic min-h-[300px]">
                    Your mathematically verified text will appear here...
                  </div>
                )}
              </div>
            </div>

            {/* Real-Time Metrics */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Verification Metrics</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col items-center justify-center p-4 bg-background rounded-lg border border-border">
                  <span className="text-2xl font-bold text-primary">{outputText ? `${metrics.confidenceScore}%` : "-"}</span>
                  <span className="text-xs text-muted-foreground mt-1 text-center">Confidence<br/>Score</span>
                </div>
                <div className="flex flex-col items-center justify-center p-4 bg-background rounded-lg border border-border">
                  <span className="text-2xl font-bold text-foreground">{outputText ? `${metrics.semanticRetention}%` : "-"}</span>
                  <span className="text-xs text-muted-foreground mt-1 text-center">Semantic<br/>Retention</span>
                </div>
                <div className="flex flex-col items-center justify-center p-4 bg-background rounded-lg border border-border">
                  <span className="text-2xl font-bold text-foreground">{outputText ? (metrics.wordsAdded > 0 ? `+${metrics.wordsAdded}` : metrics.wordsAdded) : "-"}</span>
                  <span className="text-xs text-muted-foreground mt-1 text-center">Words<br/>Added</span>
                </div>
              </div>
            </div>

            {/* Transformation Logs Accordion */}
            {transformations.length > 0 && (
              <details className="bg-card border border-border rounded-xl shadow-sm group overflow-hidden">
                <summary className="p-4 cursor-pointer font-medium text-sm flex items-center justify-between hover:bg-muted/50 transition-colors">
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Transformations Applied ({transformations.length})
                  </span>
                  <span className="text-muted-foreground text-xs group-open:hidden">Click to expand</span>
                </summary>
                <div className="p-4 border-t border-border max-h-[300px] overflow-y-auto space-y-2 bg-background/50">
                  {transformations.map((log, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-card border border-border rounded-lg text-sm">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{log.type}</span>
                        <div className="flex items-center gap-2">
                          <span className="line-through text-muted-foreground/60">{log.original}</span>
                          <span className="text-muted-foreground">→</span>
                          <span className="font-medium text-foreground">{log.replacement}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-muted rounded-full text-xs font-medium">
                        <div className={`h-1.5 w-1.5 rounded-full ${
                          log.confidence >= 0.9 ? 'bg-green-500' : log.confidence >= 0.8 ? 'bg-yellow-500' : 'bg-orange-500'
                        }`}></div>
                        {Math.round(log.confidence * 100)}%
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </>
        ) : (
          <>
            {/* Batch Mode Output */}
            <div className="flex-1 bg-card border border-border rounded-xl shadow-sm flex flex-col overflow-hidden">
              {/* Batch Toolbar */}
              <div className="p-4 border-b border-border bg-background/50 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Batch Dashboard</h2>
                  <button 
                    onClick={handleDownloadAllZip}
                    disabled={!batchFiles.some(f => f.status === 'done')}
                    className="text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 px-4 py-2 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    <Download className="h-4 w-4" />
                    Download All (.ZIP)
                  </button>
                </div>
                
                <div className="flex gap-2 items-center">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input 
                      type="text" 
                      placeholder="Search files..."
                      className="w-full bg-background border border-border rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="relative w-48">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <select 
                      className="w-full bg-background border border-border rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary appearance-none"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                    >
                      <option value="name_asc">Sort A-Z</option>
                      <option value="confidence_desc">Highest Confidence</option>
                      <option value="confidence_asc">Lowest Confidence</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* File List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {currentBatchFiles.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm italic">
                    {searchQuery ? "No files match your search." : "Upload a .ZIP to see files here."}
                  </div>
                ) : (
                  currentBatchFiles.map(file => (
                    <div key={file.id} className="bg-background border border-border rounded-lg overflow-hidden transition-all">
                      {/* Row Header */}
                      <div 
                        className={`p-3 flex items-center justify-between cursor-pointer hover:bg-muted/30 ${expandedFileId === file.id ? 'bg-muted/50' : ''}`}
                        onClick={() => file.isTxt && file.status === 'done' && setExpandedFileId(expandedFileId === file.id ? null : file.id)}
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          {file.isTxt ? <FileText className="h-4 w-4 text-muted-foreground shrink-0" /> : <AlertCircle className="h-4 w-4 text-destructive shrink-0" />}
                          <span className="text-sm font-medium truncate" title={file.name}>{file.name}</span>
                        </div>
                        
                        <div className="flex items-center gap-4 shrink-0">
                          {!file.isTxt ? (
                            <span className="text-xs font-medium px-2 py-1 bg-destructive/10 text-destructive rounded-md">Not a .txt file</span>
                          ) : file.status === 'pending' ? (
                            <span className="text-xs font-medium px-2 py-1 bg-muted rounded-md text-muted-foreground">Queued</span>
                          ) : file.status === 'processing' ? (
                            <span className="text-xs font-medium px-2 py-1 bg-blue-500/10 text-blue-500 flex items-center gap-1 rounded-md"><RefreshCw className="h-3 w-3 animate-spin" /> Processing</span>
                          ) : file.status === 'error' ? (
                            <span className="text-xs font-medium px-2 py-1 bg-destructive/10 text-destructive rounded-md">Failed</span>
                          ) : (
                            <span className="text-xs font-medium px-2 py-1 bg-green-500/10 text-green-500 rounded-md">{file.result?.confidenceScore}% Conf</span>
                          )}
                          
                          {file.isTxt && file.status === 'done' && (
                            expandedFileId === file.id ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>

                      {/* Expanded View */}
                      {expandedFileId === file.id && file.result && (
                        <div className="p-4 border-t border-border bg-card">
                          <div className="grid grid-cols-3 gap-2 mb-4">
                             <div className="p-2 bg-background border border-border rounded-md flex flex-col items-center">
                                <span className="text-lg font-bold text-primary">{file.result.confidenceScore}%</span>
                                <span className="text-[10px] text-muted-foreground uppercase">Confidence</span>
                             </div>
                             <div className="p-2 bg-background border border-border rounded-md flex flex-col items-center">
                                <span className="text-lg font-bold">{file.result.semanticRetention}%</span>
                                <span className="text-[10px] text-muted-foreground uppercase">Retention</span>
                             </div>
                             <div className="p-2 bg-background border border-border rounded-md flex flex-col items-center">
                                <span className="text-lg font-bold">{file.result.wordsAdded > 0 ? `+${file.result.wordsAdded}` : file.result.wordsAdded}</span>
                                <span className="text-[10px] text-muted-foreground uppercase">Words</span>
                             </div>
                          </div>
                          
                          <textarea
                            readOnly
                            className="w-full h-40 bg-background border border-border rounded-md p-3 text-sm resize-none focus:outline-none mb-3"
                            value={file.result.humanizedText}
                          />
                          {/* Transformation Logs Accordion (Batch Mode) */}
                          {file.result.transformations.length > 0 && (
                            <details className="bg-card border border-border rounded-xl shadow-sm group overflow-hidden mb-3">
                              <summary className="p-3 cursor-pointer font-medium text-xs flex items-center justify-between hover:bg-muted/50 transition-colors">
                                <span className="flex items-center gap-2">
                                  <Sparkles className="h-3 w-3 text-primary" />
                                  Transformations Applied ({file.result.transformations.length})
                                </span>
                                <span className="text-muted-foreground text-[10px] group-open:hidden">Click to expand</span>
                              </summary>
                              <div className="p-3 border-t border-border max-h-[250px] overflow-y-auto space-y-2 bg-background/50">
                                {file.result.transformations.map((log, idx) => (
                                  <div key={idx} className="flex items-center justify-between p-2.5 bg-card border border-border rounded-lg text-xs">
                                    <div className="flex flex-col gap-1">
                                      <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{log.type}</span>
                                      <div className="flex items-center gap-2">
                                        <span className="line-through text-muted-foreground/60">{log.original}</span>
                                        <span className="text-muted-foreground">→</span>
                                        <span className="font-medium text-foreground">{log.replacement}</span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 px-2 py-1 bg-muted rounded-full text-[10px] font-medium">
                                      <div className={`h-1.5 w-1.5 rounded-full ${
                                        log.confidence >= 0.9 ? 'bg-green-500' : log.confidence >= 0.8 ? 'bg-yellow-500' : 'bg-orange-500'
                                      }`}></div>
                                      {Math.round(log.confidence * 100)}%
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </details>
                          )}
                          
                          <div className="flex justify-end items-center">
                            <div className="flex gap-2">
                               <button 
                                onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(file.result!.humanizedText); }}
                                className="text-xs font-medium bg-muted hover:bg-muted/80 px-3 py-1.5 rounded transition-colors flex items-center gap-1"
                               >
                                 <Copy className="h-3 w-3" /> Copy
                               </button>
                               <button 
                                onClick={(e) => { e.stopPropagation(); downloadTxtFile(file.name.replace('.txt', '_humanized.txt'), file.result!.humanizedText); }}
                                className="text-xs font-medium bg-muted hover:bg-muted/80 px-3 py-1.5 rounded transition-colors flex items-center gap-1"
                               >
                                 <Download className="h-3 w-3" /> Download
                               </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="p-3 border-t border-border bg-background/50 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredAndSortedFiles.length)} of {filteredAndSortedFiles.length}
                  </span>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 bg-card border border-border rounded hover:bg-muted disabled:opacity-50"
                    >
                      Prev
                    </button>
                    <button 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 bg-card border border-border rounded hover:bg-muted disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
