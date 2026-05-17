"use client";

import { useState } from "react";
import { Sparkles, Copy, Download, RefreshCw } from "lucide-react";
import * as Slider from "@radix-ui/react-slider";
import * as Switch from "@radix-ui/react-switch";

export default function Home() {
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [transformations, setTransformations] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  const [metrics, setMetrics] = useState({
    confidenceScore: 0,
    semanticRetention: 0,
    wordsAdded: 0
  });

  // Configuration State
  const [synonymIntensity, setSynonymIntensity] = useState([0.2]);
  const [transitionFreq, setTransitionFreq] = useState([0.2]);
  const [creativity, setCreativity] = useState([50]);
  const [contextPreservation, setContextPreservation] = useState([80]);
  const [preserveIntent, setPreserveIntent] = useState(true);

  // High-Level Styling State
  const [tone, setTone] = useState("neutral");
  const [formality, setFormality] = useState("formal");
  const [purpose, setPurpose] = useState("general");

  const handleHumanize = async () => {
    if (!inputText.trim()) return;
    setIsProcessing(true);
    
    try {
      const response = await fetch('/api/humanize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText,
          tone,
          formality,
          synonymIntensity,
          transitionFreq,
          creativity,
          contextPreservation,
          preserveIntent
        }),
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
      setIsProcessing(false);
    }
  };

  const handleCopy = async () => {
    if (!outputText) return;
    try {
      await navigator.clipboard.writeText(outputText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const handleDownload = () => {
    if (!outputText) return;
    const blob = new Blob([outputText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "humanized_text.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
      
      {/* LEFT COLUMN: Input & Configuration Panel */}
      <div className="flex flex-col gap-6">
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

            <div className="flex items-center justify-between pt-2">
              <label className="text-sm font-medium">Strict Semantic Verification (Preserve Intent)</label>
              <Switch.Root 
                checked={preserveIntent}
                onCheckedChange={setPreserveIntent}
                className="w-11 h-6 bg-muted rounded-full relative data-[state=checked]:bg-primary outline-none cursor-default shadow-inner"
              >
                <Switch.Thumb className="block w-5 h-5 bg-white rounded-full transition-transform duration-100 translate-x-0.5 will-change-transform data-[state=checked]:translate-x-[22px]" />
              </Switch.Root>
            </div>
          </div>
        </div>

        {/* Section C: Text Input */}
        <div className="flex flex-col gap-4">
          <textarea
            className="w-full h-48 bg-card border border-border rounded-xl p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="Paste your AI-generated text here... We will automatically protect your citations and enhance the writing style deterministically."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <button 
            onClick={handleHumanize}
            disabled={isProcessing || !inputText.trim()}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isProcessing ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
            {isProcessing ? "Processing Determinstically..." : "Humanize Text"}
          </button>
        </div>
      </div>

      {/* RIGHT COLUMN: Output & Metrics Dashboard */}
      <div className="flex flex-col gap-6">
        
        {/* Output Text Area */}
        <div className="flex-1 bg-card border border-border rounded-xl p-4 flex flex-col shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b border-border pb-4">
            <h2 className="text-lg font-semibold">Humanized Result</h2>
            <div className="flex gap-2">
              <button 
                onClick={handleCopy} 
                disabled={!outputText}
                className="p-2 hover:bg-muted rounded-md transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50" 
                title="Copy to clipboard"
              >
                {copied ? <span className="text-green-500 text-xs font-medium">Copied!</span> : <Copy className="h-4 w-4" />}
              </button>
              <button 
                onClick={handleDownload}
                disabled={!outputText}
                className="p-2 hover:bg-muted rounded-md transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50" 
                title="Download TXT"
              >
                <Download className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="flex-1">
            {isProcessing ? (
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
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm italic">
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

      </div>
    </div>
  );
}
