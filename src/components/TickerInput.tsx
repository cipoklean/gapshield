import { useState } from "react";
import { IconSearch, IconLoader2 } from "@tabler/icons-react";

interface TickerInputProps {
  onAnalyze: (ticker: string) => void;
  loading: boolean;
}

export function TickerInput({ onAnalyze, loading }: TickerInputProps) {
  const [ticker, setTicker] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (ticker.trim()) {
      onAnalyze(ticker.trim().toUpperCase());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-3 w-full max-w-md">
      <div className="relative flex-1">
        <IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-faint" stroke={1.5} />
        <input
          type="text"
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
          placeholder="AAPL, TSLA, NVDA..."
          className="w-full pl-12 pr-4 py-4 bg-bg-card border border-border rounded-xl text-ink placeholder-ink-faint focus:border-gold/60 focus:outline-none transition-all duration-300 font-mono text-lg"
          disabled={loading}
        />
      </div>
      <button
        type="submit"
        disabled={loading || !ticker.trim()}
        className="px-6 py-4 bg-gradient-to-r from-gold to-gold-light text-bg-deep font-semibold rounded-xl hover:shadow-[0_0_30px_rgba(201,162,39,0.3)] disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all duration-300 flex items-center gap-2"
      >
        {loading ? (
          <>
            <IconLoader2 className="w-5 h-5 animate-spin" />
            <span>Analyzing...</span>
          </>
        ) : (
          <span>Generate</span>
        )}
      </button>
    </form>
  );
}
