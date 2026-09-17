/**
 * News Adapter — Fetches recent headlines via Google News RSS with resilience
 * On failure, retries with a simplified query before falling back to cached snapshots.
 */

import { XMLParser } from "fast-xml-parser";
import { getHeadlineSnapshot } from "../data/headline-snapshots";

export interface NewsItem {
  title: string;
  link: string;
  pubDate?: string;
  source: string;
}

const RSS_PARSER = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
});

const COMMON_HEADERS = {
  "User-Agent": "Mozilla/5.0 (compatible; GapShieldResearch/1.0)",
  Accept: "application/rss+xml, application/xml, text/xml",
};

const TickerQueries: Record<string, string> = {
  AAPL: "AAPL stock Apple earnings regulation China supply chain",
  TSLA: "TSLA stock Tesla EV demand regulation OPEC pricing",
  NVDA: "NVDA stock Nvidia AI chips export controls data center",
  MSFT: "MSFT stock Microsoft earnings cloud AI regulation",
  AMZN: "AMZN stock Amazon earnings retail AWS regulation",
  META: "META stock Meta earnings AI regulation antitrust",
  QQQ: "QQQ ETF Nasdaq-100 tech stocks earnings Fed",
  SPY: "SPY ETF S&P 500 stocks market weekend earnings",
};

// No longer used — all tickers now get ticker-specific queries.
export function getQueryForTicker(ticker: string): string {
  // Universal ticker-specific query works for any ticker — including all 500+ rTokens.
  // The elaborate queries below are a curated enhancement for known tickers only.
  const upper = ticker.toUpperCase();
  if (TickerQueries[upper]) return TickerQueries[upper];
  return `${upper} stock news`;
}

const SIMPLE_QUERY_TIMEOUT = 8000;

function fetchRSSWithTimeout(
  url: string,
  timeoutMs = SIMPLE_QUERY_TIMEOUT
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { headers: COMMON_HEADERS, signal: controller.signal, cache: "no-store" })
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.text();
    })
    .finally(() => clearTimeout(timer));
}

function parseRSS(xml: string, limit: number): NewsItem[] {
  const result = RSS_PARSER.parse(xml);
  const items: NewsItem[] = [];
  const channel = result?.rss?.channel;
  const rssItems = channel?.item || [];

  for (const item of rssItems.slice(0, limit)) {
    items.push({
      title: item.title || "",
      link: item.link || "",
      pubDate: item.pubDate || undefined,
      source: item.source || item.creator || "Google News",
    });
  }
  return items;
}

/**
 * Fetch news with resilience:
 * 1. Try full ticker-specific query
 * 2. Retry with simplified ticker-only query
 * 3. Fall back to cached headline snapshots
 */
export async function fetchNews(
  ticker: string,
  limit: number = 10
): Promise<{ items: NewsItem[]; sourceMode: "live" | "retry" | "snapshot" }> {
  const upper = ticker.toUpperCase();
  const baseQuery = getQueryForTicker(ticker);

  // Attempt 1: Full query
  try {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(baseQuery)}&when:3d&hl=en-US&gl=US&ceid=US:en`;
    const xml = await fetchRSSWithTimeout(url);
    const items = parseRSS(xml, limit);
    if (items.length > 0) {
      return { items, sourceMode: "live" };
    }
  } catch (error) {
    console.warn("[NewsAdapter] Full query failed:", error);
  }

  // Attempt 2: Simplified ticker-only query
  try {
    const simpleQuery = `${upper} stock news`;
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(simpleQuery)}&when:7d&hl=en-US&gl=US&ceid=US:en`;
    const xml = await fetchRSSWithTimeout(url);
    const items = parseRSS(xml, limit);
    if (items.length > 0) {
      return { items, sourceMode: "retry" };
    }
  } catch (error) {
    console.warn("[NewsAdapter] Simplified query failed:", error);
  }

  // Attempt 3: Cached snapshots
  console.info("[NewsAdapter] Using cached headline snapshot for", upper);
  const snapshots = getHeadlineSnapshot(upper);
  const items: NewsItem[] = snapshots.map((s) => ({
    title: s.title,
    link: s.link,
    source: s.source,
  }));

  return { items, sourceMode: "snapshot" };
}
