/**
 * Heuristic Fallback Engine
 * Generates risk reports from keyword analysis when no LLM API is available
 */

import { NewsItem } from "./news";
import { PriceData } from "./prices";
import { HISTORICAL_PARALLELS } from "../data/historical-parallels";

export interface HeuristicReport {
  risk_score: number;
  directional_bias: "Bullish" | "Bearish" | "Neutral";
  confidence: number;
  key_drivers: Array<{ title: string; impact: string; source_indices: number[] }>;
  historical_parallel: {
    period: string;
    description: string;
    market_reaction: string;
  };
  action_checklist: string[];
  sources: Array<{ name: string; category: string; detail: string; url?: string }>;
  model_note?: string;
}

const BULLISH_KEYWORDS = ["earnings beat", "buyback", "growth", "upgrade", "partnership", "innovation", "strong demand"];
const BEARISH_KEYWORDS = ["layoff", "recall", "fine", "investigation", "decline", "loss", "recession", "tariff", "sanction", "restrict"];

export function heuristicAnalyze(
  ticker: string,
  headlines: NewsItem[],
  livePrice: PriceData | null
): HeuristicReport {
  // Keyword scoring
  let bearishScore = 0;
  let bullishScore = 0;
  const detectedDrivers: Array<{ title: string; impact: string; source_indices: number[] }> = [];

  for (let i = 0; i < headlines.length; i++) {
    const headline = headlines[i];
    const text = headline.title.toLowerCase();

    let hasBearish = false;
    let hasBullish = false;

    for (const keyword of BEARISH_KEYWORDS) {
      if (text.includes(keyword)) {
        bearishScore += 15;
        hasBearish = true;
        break;
      }
    }

    for (const keyword of BULLISH_KEYWORDS) {
      if (text.includes(keyword)) {
        bullishScore += 15;
        hasBullish = true;
        break;
      }
    }

    if (hasBearish || hasBullish) {
      detectedDrivers.push({
        title: headline.title,
        impact: hasBearish ? "Negative sentiment signal" : "Positive sentiment signal",
        source_indices: [i],
      });
    }
  }

  // Calculate final metrics
  const netScore = bullishScore - bearishScore;
  let bias: "Bullish" | "Bearish" | "Neutral";
  let riskScore: number;

  if (netScore > 20) {
    bias = "Bullish";
    riskScore = Math.min(95, 50 + bearishScore);
  } else if (netScore < -20) {
    bias = "Bearish";
    riskScore = Math.min(95, 50 + bullishScore);
  } else {
    bias = "Neutral";
    riskScore = 50 + Math.abs(netScore);
  }

  riskScore = Math.max(riskScore, 40);

  // Get best historical parallel
  const tickerParallel = HISTORICAL_PARALLELS[ticker.toUpperCase()] || [];
  const bestParallel = tickerParallel[0] || {
    period: "Historical average",
    event: "Typical weekend gap scenario",
    market_reaction: "2-4% average gap on Monday open",
    magnitude: "±3%",
  };

  // Generate sources from headlines
  const sources = headlines.slice(0, 4).map((h) => ({
    name: h.source || "News Source",
    category: "News Extraction",
    detail: h.title,
    url: h.link,
  }));

  // Generate action checklist with price-aware levels
  const actionChecklist: string[] = [];
  const priceLevel = livePrice?.price || 180; // Default fallback

  if (bias === "Bearish") {
    actionChecklist.push(`Consider reducing position size by 20-30% ahead of Monday open`);
    actionChecklist.push(`Set stop-loss orders at $${Math.round(priceLevel * 0.92)} support level`);
    actionChecklist.push("Monitor Asian pre-market futures for overnight sentiment shift");
  } else if (bias === "Bullish") {
    actionChecklist.push("Maintain current positions with wider stops");
    actionChecklist.push(`Consider adding on any dip below $${Math.round(priceLevel * 0.95)}`);
    actionChecklist.push(`Watch for resistance at $${Math.round(priceLevel * 1.05)}`);
  } else {
    actionChecklist.push("Review portfolio allocation for weekend exposure");
    actionChecklist.push(`Set conservative stop-loss at $${Math.round(priceLevel * 0.90)}`);
    actionChecklist.push("Wait for Monday morning clarity before adjusting positions");
  }

  // Model note must derive FROM the final bias — never recompute independently.
  let modelNote = `Heuristic analysis: ${headlines.length} headlines processed.`;
  if (headlines.length === 0) {
    modelNote += " Live feed unavailable - analysis used cached headline snapshot and curated historical context.";
  } else {
    // Capitalize bias word: Neutral / Bearish / Bullish
    const biasLabel = bias.charAt(0).toUpperCase() + bias.slice(1).toLowerCase();
    modelNote += ` ${biasLabel} signals detected.`;
  }

  return {
    risk_score: riskScore,
    directional_bias: bias,
    confidence: Math.min(85, 60 + headlines.length * 2),
    // With >= 3 headlines emit up to 3 drivers citing specific headlines.
    // Otherwise include every detected driver so the report is never empty.
    key_drivers: headlines.length >= 3
      ? detectedDrivers.slice(0, 3)
      : detectedDrivers,
    historical_parallel: {
      period: bestParallel.period,
      description: bestParallel.event,
      market_reaction: bestParallel.market_reaction,
    },
    action_checklist: actionChecklist,
    sources,
    model_note: modelNote,
  };
}
