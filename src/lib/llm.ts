/**
 * LLM Adapter — Synthesizes weekend intelligence into structured risk reports
 * Uses Qwen API when available, otherwise falls back to heuristic engine.
 *
 * Returns a structured result with ok/reason so the orchestrator can distinguish
 * failure modes transparently.
 */

import { NewsItem } from "./news";
import { PriceData } from "./prices";
import { HistoricalParallel } from "../data/historical-parallels";

export interface KeyDriverWithSources {
  title: string;
  impact: string;
  source_indices: number[];
}

export interface LLMOutput {
  risk_score: number;
  directional_bias: "Bullish" | "Bearish" | "Neutral";
  confidence: number;
  key_drivers: KeyDriverWithSources[];
  historical_parallel: {
    period: string;
    description: string;
    market_reaction: string;
  };
  action_checklist: string[];
  sources: Array<{ name: string; category: string; detail: string; url?: string }>;
  model_note?: string;
}

/**
 * Result wrapper that always includes ok + reason.
 */
export interface LLMResult {
  ok: boolean;
  /** undefined only when ok=true */
  reason?: string;
  output?: LLMOutput;
}

export interface LLMInput {
  ticker: string;
  headlines: NewsItem[];
  livePrice?: PriceData | null;
  historicalParallels: HistoricalParallel[];
  isWeekend: boolean;
}

const QWEN_PROMPT = `You are a financial risk analyst specializing in weekend market gap analysis for tokenized US stocks.

## Context
- **Ticker**: {{TICKER}}
- **Live Price**: {{PRICE}} USD (as of {{PRICE_DATE}})
- **Is Weekend**: {{IS_WEEKEND}}

## Recent Headlines (Last 72 Hours)
{{HEADLINES}}

## Historical Parallels
{{HISTORICAL}}

## Instructions
1. Analyze weekend news for market-moving signals
2. Use the LIVE PRICE to derive all price levels (never recall from memory)
3. For bearish scenarios, support levels should be 5-8% below current price
4. For bullish scenarios, resistance levels should be 3-5% above current price
5. Every key driver must cite specific headline indices [0], [1], etc.
6. Focus on information gap risk between Friday close and Monday open

## Output Format
Return ONLY valid JSON matching this schema:
{
  "risk_score": <number 0-100>,
  "directional_bias": "<Bullish|Bearish|Neutral>",
  "confidence": <number 0-100>,
  "key_drivers": [
    {
      "title": "<string - specific event>",
      "impact": "<string - market effect with price level derived from live price>",
      "source_indices": [<number>, ...]
    }
  ],
  "historical_parallel": {
    "period": "<string - e.g., 'October 2022'>",
    "description": "<string - what happened>",
    "market_reaction": "<string - percentage move>"
  },
  "action_checklist": ["<string>", "<string>", "<string>"],
  "sources": [
    {
      "name": "<source name>",
      "category": "<type>",
      "detail": "<headline or summary>",
      "url": "<link if available>"
    }
  ],
  "model_note": "<synthesis summary>"
}

Return ONLY the JSON object. No markdown, no explanation.`;

const DEFAULT_TIMEOUT_MS = 15000;

export async function callQwenLLM(input: LLMInput): Promise<LLMResult> {
  const apiKey = process.env.QWEN_API_KEY;
  if (!apiKey) {
    return { ok: false, reason: "no key" };
  }

  const baseUrl = process.env.QWEN_BASE_URL || "https://dashscope.aliyuncs.com/compatible-mode/v1";
  const model = process.env.QWEN_MODEL || "qwen-max";

  const headlinesText = input.headlines
    .map((h, i) => `[${i}] ${h.title} (${h.source})`)
    .join("\n") || "No headlines available";

  const historicalText = input.historicalParallels
    .slice(0, 2)
    .map((h) => `- ${h.period}: ${h.event} → ${h.market_reaction}`)
    .join("\n") || "No historical matches found";

  const priceInfo = input.livePrice
    ? `${input.livePrice.price} USD (as of ${input.livePrice.date})`
    : "Price unavailable";

  const prompt = QWEN_PROMPT
    .replace("{{TICKER}}", input.ticker)
    .replace("{{PRICE}}", priceInfo)
    .replace("{{PRICE_DATE}}", input.livePrice?.date || "N/A")
    .replace("{{IS_WEEKEND}}", String(input.isWeekend))
    .replace("{{HEADLINES}}", headlinesText)
    .replace("{{HISTORICAL}}", historicalText);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 1500,
      }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    if (!response.ok) {
      return { ok: false, reason: `HTTP ${response.status}` };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return { ok: false, reason: "empty response" };
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { ok: false, reason: "invalid JSON" };
    }

    const output = JSON.parse(jsonMatch[0]) as LLMOutput;

    // Sanity-check required fields
    if (
      typeof output.risk_score !== "number" ||
      !["Bullish", "Bearish", "Neutral"].includes(output.directional_bias) ||
      !Array.isArray(output.key_drivers) ||
      !Array.isArray(output.action_checklist)
    ) {
      return { ok: false, reason: "schema mismatch" };
    }

    return { ok: true, output };
  } catch (error) {
    const reason = error instanceof Error
      ? error.message.startsWith("AbortError") ? "timeout" : error.message
      : "unknown error";
    console.warn("[LLMAdapter] Qwen synthesis failed:", reason);
    return { ok: false, reason };
  }
}
