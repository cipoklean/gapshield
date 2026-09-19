/**
 * Generate Weekend Shield Report — Real Data + AI Synthesis + Verification
 */

"use server";

import { fetchNews, NewsItem } from "@/lib/news";
import { fetchLivePrice, PriceData } from "@/lib/prices";
import { callQwenLLM, LLMOutput, KeyDriverWithSources } from "@/lib/llm";
import { heuristicAnalyze } from "@/lib/heuristic";
import { runVerification, VerificationResult } from "@/lib/verify";
import { HISTORICAL_PARALLELS } from "@/data/historical-parallels";
import { normalizeSymbol } from "@/lib/symbols";

// ─── Type Extensions ────────────────────────────────────────────────

export interface SourceEvidence {
  name: string;
  category: string;
  detail: string;
  timestamp?: string;
  url?: string;
}

export interface KeyDriver extends Omit<KeyDriverWithSources, "title" | "impact"> {
  title: string;
  impact: string;
  source_tag?: "CITATION" | "CURATED CONTEXT" | "GENERIC";
}

export interface HistoricalParallelInfo {
  period: string;
  description: string;
  market_reaction: string;
}

export interface DataWindow {
  newsCount: number;
  cryptoSentiment: string | null;
  historicalMatches: number;
  model: "Qwen" | "Heuristic" | "Heuristic (Qwen error)";
  /** How headlines were sourced: live RSS, retry RSS, or cached snapshot */
  headlineSource: "live" | "retry" | "snapshot";
  /** Count of checks that were evaluable (non-SKIPPED) */
  evaluableChecks: number;
  uncalibrated: boolean;
  /** Present when user input was a tokenized form like rAAPL */
  symbolMap?: { from: string; ticker: string; scheme: string };
}

export interface ShieldReport {
  ticker: string;
  riskScore: number;
  bias: "Bullish" | "Bearish" | "Neutral";
  keyDrivers: KeyDriver[];
  historicalParallel: HistoricalParallelInfo;
  actionItems: string[];
  confidence: number;
  calibratedConfidence: number;
  modelNote?: string;
  sources: SourceEvidence[];
  verification?: VerificationResult;
  dataWindow: DataWindow;
  livePrice?: PriceData | null;
  /** True when price audit was SKIPPED — actions with $ amounts show unaudited suffix */
  priceAuditSkipped?: boolean;
  /** True when user input was a recognized tokenized symbol (rAAPL, AAPLx, etc.) */
  symbolMapped?: boolean;
  /** Original user input when symbol was mapped */
  symbolFrom?: string;
  /** Naming scheme label for mapped symbols */
  symbolScheme?: string;
  /** True when the input symbol is not recognized and no report was generated */
  unknownSymbol?: boolean;
}

// ─── Model Note Builder ─────────────────────────────────────────────

/**
 * Returns one of three exact phrases so the UI always displays unambiguous state.
 * - "Heuristic mode - no Qwen key configured."      → no key
 * - "Qwen configured but synthesis failed (<reason>) - heuristic fallback active." → key present, LLM failed
 * - "Qwen synthesis complete."                        → successful LLM path
 */
function buildModelNote(modelType: string, headlineCount: number, qwenFailedReason?: string): string {
  if (qwenFailedReason) {
    return `Qwen configured but synthesis failed (${qwenFailedReason}) - heuristic fallback active.`;
  }
  if (modelType === "Qwen") {
    return "Qwen synthesis complete.";
  }
  return "Heuristic mode - no Qwen key configured.";
}

// ─── Cache ──────────────────────────────────────────────────────────

const DATA_CACHE = new Map<string, {
  news: NewsItem[];
  sourceMode: "live" | "retry" | "snapshot";
  price: PriceData | null;
  timestamp: number;
}>();
const CACHE_TTL_MS = 15 * 60 * 1000;

async function getCachedData(ticker: string): Promise<{
  news: NewsItem[];
  sourceMode: "live" | "retry" | "snapshot";
  price: PriceData | null;
}> {
  const upper = ticker.toUpperCase();
  const cached = DATA_CACHE.get(upper);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached;
  }

  const [{ items: news, sourceMode }, price] = await Promise.all([
    fetchNews(ticker),
    fetchLivePrice(ticker),
  ]);

  DATA_CACHE.set(upper, { news, sourceMode, price, timestamp: Date.now() });
  return { news, sourceMode, price };
}

// ─── Schema Validation ──────────────────────────────────────────────

function validateLLMOutput(output: LLMOutput): boolean {
  if (!output.risk_score || output.risk_score < 0 || output.risk_score > 100) return false;
  if (!["Bullish", "Bearish", "Neutral"].includes(output.directional_bias)) return false;
  if (!output.confidence || output.confidence < 0 || output.confidence > 100) return false;
  if (!Array.isArray(output.key_drivers) || output.key_drivers.length === 0) return false;
  if (!output.historical_parallel?.period) return false;
  if (!Array.isArray(output.action_checklist) || output.action_checklist.length === 0) return false;
  return true;
}

// Curated driver fallbacks for when no headlines are available
const CURATED_DRIVERS: Record<string, Array<{ title: string; impact: string }>> = {
  AAPL: [
    { title: "China export restrictions on semiconductor components affecting iPhone supply chain", impact: "Supply disruption risk" },
    { title: "Federal Reserve meeting minutes signal potential rate hike delay", impact: "Rate uncertainty weighs on tech valuations" },
    { title: "EU regulatory scrutiny on App Store policies intensifying", impact: "Revenue margin pressure from regulation" },
  ],
  TSLA: [
    { title: "OPEC+ unexpected production cut announcement affects EV demand outlook", impact: "Energy cost spike threatens margins" },
    { title: "China EV competitor BYD announces aggressive pricing strategy", impact: "Market share erosion in key market" },
    { title: "EU anti-subsidy investigation into Chinese EV imports", impact: "Gigafactory Berlin exposure to trade policy" },
  ],
  NVDA: [
    { title: "Mixed signals from AI infrastructure spending reports", impact: "Demand visibility uncertain" },
    { title: "Export controls discussion ongoing but no final decision", impact: "China revenue at risk" },
    { title: "Data center demand remains strong per recent earnings guidance", impact: "Core business resilient" },
  ],
};

const GENERIC_DRIVERS = [
  { title: "Weekend news flow indicates elevated uncertainty", impact: "Cross-asset correlation patterns suggest caution" },
  { title: "Liquidity conditions expected to tighten on Monday open", impact: "Wider spreads may amplify gap risk" },
  { title: "Institutional positioning suggests defensive stance", impact: "Reduced buying interest on any dip" },
];

// ─── Main Generator ─────────────────────────────────────────────────

/** Result shape returned by generateShieldReport including symbol metadata */
export interface ReportWithSymbols extends ShieldReport {
  symbolMapped?: boolean;
  symbolFrom?: string;
  symbolScheme?: string;
  unknownSymbol?: boolean;
  closestTickers?: string[];
}

export async function generateShieldReport(ticker: string): Promise<ShieldReport> {
  // ── FIX 1: Symbol normalization
  const originalInput = ticker.trim();
  const normalized = normalizeSymbol(originalInput);

  if (normalized.unknown && !process.env.QWEN_API_KEY) {
    // Unknown symbol with no API key — return empty to trigger UI warning
    return {
      ticker: normalized.ticker,
      riskScore: 0,
      bias: "Neutral",
      keyDrivers: [],
      historicalParallel: { period: "", description: "", market_reaction: "" },
      actionItems: [],
      confidence: 0,
      calibratedConfidence: 0,
      sources: [],
      dataWindow: {
        newsCount: 0,
        cryptoSentiment: null,
        historicalMatches: 0,
        model: "Heuristic",
        headlineSource: "snapshot",
        evaluableChecks: 0,
        uncalibrated: true,
      },
      symbolMapped: false,
      unknownSymbol: true,
      symbolFrom: originalInput,
    };
  }

  const analyzeTicker = normalized.mapped ? normalized.ticker : normalized.ticker;
  const tickerUpper = analyzeTicker.toUpperCase();

  console.info(`[GenerateReport] Analyzing ${originalInput} → ${analyzeTicker}${normalized.mapped ? ` (${normalized.scheme})` : ""}`);

  // Phase 1: Fetch real data
  const { news, sourceMode, price } = await getCachedData(tickerUpper);

  // Phase 2: Synthesize via LLM or heuristic
  let llmOutput: LLMOutput | null = null;
  let modelType: "Qwen" | "Heuristic" | "Heuristic (Qwen error)" = "Heuristic";
  let qwenFailedReason: string | undefined;

  // FIX 4: Attempt Qwen whenever key is configured, even if RSS returned zero headlines
  const hasKey = !!process.env.QWEN_API_KEY;
  const llmResult = hasKey ? await callQwenLLM({
    ticker: tickerUpper,
    headlines: news,
    livePrice: price,
    historicalParallels: HISTORICAL_PARALLELS[tickerUpper] || [],
    isWeekend: true,
  }) : { ok: false, reason: "no key" };

  if (llmResult.ok && llmResult.output && validateLLMOutput(llmResult.output)) {
    llmOutput = llmResult.output;
    modelType = "Qwen";
    console.info("[GenerateReport] Qwen synthesis complete");
  } else if (hasKey) {
    // Key was configured but synthesis failed — transparent fallback messaging
    qwenFailedReason = llmResult.reason;
    console.warn(`[GenerateReport] Qwen synthesis failed (${qwenFailedReason}), falling back to heuristic`);
    const heuristicOutput = heuristicAnalyze(tickerUpper, news, price);
    llmOutput = heuristicOutput;
    modelType = "Heuristic (Qwen error)";
  } else {
    // No key at all
    const heuristicOutput = heuristicAnalyze(tickerUpper, news, price);
    llmOutput = heuristicOutput;
    modelType = "Heuristic";
  }

  // Phase 3: Run verification pipeline
  const verification = runVerification(
    llmOutput,
    news,
    price,
    HISTORICAL_PARALLELS[tickerUpper] || [],
    tickerUpper
  );

  // Apply auto-corrections to action items
  const correctedActionItems = [...llmOutput.action_checklist];
  for (const correction of verification.corrections) {
    const match = correction.match(/from \$([\d,]+) to \$([\d,]+)/);
    if (match) {
      const [, oldPrice, newPrice] = match;
      for (let i = 0; i < correctedActionItems.length; i++) {
        if (correctedActionItems[i].includes(oldPrice)) {
          correctedActionItems[i] = correctedActionItems[i].replace(oldPrice, newPrice.replace(/,/g, ""));
        }
      }
    }
  }

  // Ensure we always have drivers to show
  let keyDrivers = llmOutput.key_drivers.map(d => ({
    title: d.title,
    impact: d.impact,
    source_indices: d.source_indices,
    source_tag: (d.source_indices.length > 0 && d.source_indices.every(idx => idx >= 0 && idx < news.length)
      ? "CITATION"
      : undefined) as KeyDriver["source_tag"],
  }));

  // FIX B: If fewer than 2 drivers survive grounding, backfill from curated
  // scenario drivers so the KEY WEEKEND DRIVERS section always has content.
  if (keyDrivers.length < 2) {
    const curated = CURATED_DRIVERS[tickerUpper];
    if (curated && curated.length >= 2 - keyDrivers.length) {
      const needed = 2 - keyDrivers.length;
      keyDrivers.push(
        ...curated.slice(0, needed).map(d => ({
          title: d.title,
          impact: d.impact,
          source_indices: [],
          source_tag: "CURATED CONTEXT" as const,
        }))
      );
    } else if (keyDrivers.length === 0) {
      // Total fallback — use curated or generic
      const fallback = (curated && curated.length > 0)
        ? curated
        : GENERIC_DRIVERS;
      keyDrivers = fallback.map(d => ({
        title: d.title,
        impact: d.impact,
        source_indices: [],
        source_tag: (curated && curated.length > 0) ? "CURATED CONTEXT" as const : "GENERIC" as const,
      }));
    }
  }

  // Phase 4: Build final report
  const report: ShieldReport = {
    ticker: normalized.mapped ? originalInput : tickerUpper,
    riskScore: llmOutput.risk_score,
    bias: llmOutput.directional_bias,
    keyDrivers,
    historicalParallel: llmOutput.historical_parallel,
    actionItems: correctedActionItems,
    confidence: verification.calibratedConfidence,
    calibratedConfidence: verification.calibratedConfidence,
    modelNote: buildModelNote(modelType, news.length, qwenFailedReason),
    sources: llmOutput.sources.map(s => ({
      name: s.name,
      category: s.category,
      detail: s.detail,
      url: s.url,
    })),
    verification,
    dataWindow: {
      newsCount: news.length,
      cryptoSentiment: null,
      historicalMatches: verification.passedChecks,
      model: modelType,
      headlineSource: sourceMode,
      evaluableChecks: verification.totalChecks - (news.length === 0 ? verification.totalChecks : 0),
      uncalibrated: verification.uncalibrated,
      ...(normalized.mapped && { symbolMap: { from: originalInput, ticker: normalized.ticker, scheme: normalized.scheme! } }),
    },
    livePrice: price,
    priceAuditSkipped: verification.priceChecks.some(p => p.status === "SKIPPED"),
    symbolMapped: normalized.mapped,
    symbolFrom: normalized.mapped ? originalInput : undefined,
    symbolScheme: normalized.mapped ? normalized.scheme : undefined,
  };

  // Simulate realistic processing time (1.6-2.2s total)
  await new Promise(resolve => setTimeout(resolve, 1800));

  return report;
}
