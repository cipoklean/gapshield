"use client";

import { useState, useEffect, useRef } from "react";
import { generateShieldReport, type ShieldReport } from "@/app/actions";
import { TickerInput } from "@/components/TickerInput";
import { ShieldReportCard } from "@/components/ShieldReportCard";
import { motion, AnimatePresence } from "framer-motion";
import { IconBolt, IconRobot } from "@tabler/icons-react";

export default function AnalyzeSection() {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ShieldReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pipelineStep, setPipelineStep] = useState(0);

  const pipelineSteps = [
    { id: 0, label: "Extracting weekend news and market signals", icon: "🔍" },
    { id: 1, label: "Classifying events by market impact", icon: "🏷️" },
    { id: 2, label: "Cross-referencing historical gap patterns", icon: "📊" },
    { id: 3, label: "Synthesizing risk assessment", icon: "🧠" },
  ];

  // Listen for "analyze-ticker" custom event dispatched by "Did you mean?" buttons
  const pendingTickerRef = useRef<string | null>(null);
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (typeof detail === "string" && detail.trim()) {
        pendingTickerRef.current = detail.trim();
      }
    };
    window.addEventListener("analyze-ticker", handler);
    return () => window.removeEventListener("analyze-ticker", handler);
  }, []);

  const handleAnalyze = async (ticker: string) => {
    setLoading(true);
    setError(null);
    setReport(null);
    setPipelineStep(0);

    // Pick up any pending ticker from a "Did you mean?" click while loading
    const resolvedTicker = pendingTickerRef.current || ticker;
    pendingTickerRef.current = null;

    // Animate pipeline steps
    const stepInterval = setInterval(() => {
      setPipelineStep(prev => Math.min(prev + 1, pipelineSteps.length - 1));
    }, 400);

    try {
      const result = await generateShieldReport(resolvedTicker);
      setReport(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate report");
    } finally {
      clearInterval(stepInterval);
      setLoading(false);
      setPipelineStep(pipelineSteps.length - 1);
    }
  };

  return (
    <section id="analyze" className="py-32 px-6 relative">
      {/* Background accent */}
      <div className="absolute inset-0 bg-gradient-to-b from-bg-deep via-bg-surface/30 to-bg-deep pointer-events-none" />
      
      {/* Gradient orbs */}
      <div className="absolute top-1/4 left-0 w-96 h-96 bg-gold/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="relative max-w-5xl mx-auto space-y-16">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center space-y-6"
        >
          <h2 className="headline text-5xl md:text-7xl text-ink leading-[1.05]">
            Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-amber-400">Monday Shield</span>
          </h2>
          <p className="text-ink-muted text-lg max-w-xl mx-auto leading-relaxed">
            Enter any ticker symbol to generate a comprehensive weekend risk analysis and actionable intelligence report.
          </p>
        </motion.div>

        {/* Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="flex justify-center"
        >
          <TickerInput onAnalyze={handleAnalyze} loading={loading} />
        </motion.div>

        {/* Quick tickers */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-col items-center gap-3"
        >
          <div className="flex flex-wrap justify-center gap-3">
            <span className="text-ink-faint text-sm self-center mr-2">Quick analyze:</span>
            {["AAPL", "TSLA", "NVDA", "MSFT", "AMZN", "META", "SPY", "QQQ"].map((t) => (
              <button
                key={t}
                onClick={() => handleAnalyze(t)}
                disabled={loading}
                className="px-5 py-2.5 glass rounded-full text-sm font-mono text-ink-muted hover:text-gold hover:border-gold/30 transition-all duration-300 disabled:opacity-50 active:scale-[0.98]"
              >
                {t}
              </button>
            ))}
          </div>
          <p className="text-ink-faint text-xs font-mono">
            Native tickers trade Monday–Friday; Bitget rTokens (rAAPL, rTSLA…) trade 24/7
          </p>
        </motion.div>

        {/* Pipeline Animation */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="glass-gold rounded-2xl p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <IconRobot className="w-5 h-5 text-gold" stroke={1.5} />
                <span className="label-mono">AI Processing Pipeline</span>
              </div>
              <div className="space-y-3">
                {pipelineSteps.map((step, i) => (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ 
                      opacity: i <= pipelineStep ? 1 : 0.4,
                      x: i <= pipelineStep ? 0 : -20,
                    }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center gap-3"
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                      i < pipelineStep ? "bg-emerald-500/20 text-emerald-300" :
                      i === pipelineStep ? "bg-gold/20 text-gold animate-pulse" :
                      "bg-ink-faint/20 text-ink-faint"
                    }`}>
                      {i < pipelineStep ? "✓" : i + 1}
                    </div>
                    <span className={`text-sm ${
                      i < pipelineStep ? "text-ink-muted" :
                      i === pipelineStep ? "text-ink font-medium" :
                      "text-ink-faint"
                    }`}>
                      {step.label}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error state */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="glass border-risk-high/30 rounded-2xl p-5 text-center"
            >
              <p className="text-risk-high">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Report */}
        <ShieldReportCard report={report} loading={loading} />

        {/* Empty state */}
        {!report && !loading && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 space-y-6"
          >
            <div className="w-20 h-20 mx-auto rounded-full glass flex items-center justify-center float">
              <IconBolt className="w-10 h-10 text-gold" stroke={1.5} />
            </div>
            <div>
              <p className="text-ink text-lg font-medium mb-2">Ready to Analyze</p>
              <p className="text-ink-faint text-sm max-w-md mx-auto">
                Enter a ticker above to generate your Weekend Risk Intelligence report with historical parallels and actionable insights.
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
