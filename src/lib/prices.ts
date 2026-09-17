/**
 * Live Price Adapter
 * Fetches current market price for a ticker via Stooq, Yahoo, or cached fallback.
 */

export interface PriceData {
  ticker: string;
  price: number;
  currency: string;
  date: string;
  source: 'stooq' | 'yahoo' | 'cached' | 'none';
  ageMinutes?: number; // For cached entries
}

const PRICE_CACHE = new Map<string, { data: PriceData; timestamp: number }>();
const STALE_MAX_MINUTES = 30; // Hard limit before discarding

const COMMON_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (compatible; GapShieldResearch/1.0)',
  'Accept': 'application/json, text/csv, application/xml',
};

function getCachedPrice(ticker: string): { data: PriceData; timestamp: number } | null {
  return PRICE_CACHE.get(ticker.toUpperCase()) ?? null;
}

function setCachedPrice(ticker: string, data: PriceData) {
  PRICE_CACHE.set(ticker.toUpperCase(), {
    data,
    timestamp: Date.now(),
  });
}

function fetchWithTimeout(url: string, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, {
    headers: COMMON_HEADERS,
    signal: controller.signal,
    cache: 'no-store',
  }).finally(() => clearTimeout(timeout));
}

async function fetchStooqPrice(ticker: string): Promise<PriceData | null> {
  const symbol = `${ticker}.us`;
  const url = `https://stooq.com/q/l/?s=${symbol}&f=sd2t2ohlcv&h&e=csv`;

  try {
    const response = await fetchWithTimeout(url);
    if (!response.ok) return null;

    const text = await response.text();
    const lines = text.trim().split('\n');
    const lastLine = lines[lines.length - 1];
    const parts = lastLine.split(',');

    if (parts.length < 6) return null;

    const date = parts[1];
    const close = parseFloat(parts[5]);

    if (isNaN(close) || close <= 0) return null;

    return {
      ticker: ticker.toUpperCase(),
      price: close,
      currency: 'USD',
      date,
      source: 'stooq',
    };
  } catch {
    return null;
  }
}

async function fetchYahooChartPrice(ticker: string): Promise<PriceData | null> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker.toUpperCase()}?range=1d&interval=1m`;

  try {
    const response = await fetchWithTimeout(url);
    if (!response.ok) return null;

    const data = await response.json();
    const meta = data.chart?.result?.[0]?.meta;

    if (!meta) return null;

    return {
      ticker: ticker.toUpperCase(),
      price: meta.regularMarketPrice,
      currency: meta.currency || 'USD',
      date: new Date(meta.regularMarketTime * 1000).toISOString().split('T')[0],
      source: 'yahoo',
    };
  } catch {
    return null;
  }
}

async function fetchYahooQuotePrice(ticker: string): Promise<PriceData | null> {
  // Third fallback: direct quote endpoint (query2) for simple price lookup
  const url = `https://query2.finance.yahoo.com/v8/finance/chart/${ticker.toUpperCase()}?interval=1d&range=1d`;

  try {
    const response = await fetchWithTimeout(url);
    if (!response.ok) return null;

    const data = await response.json();
    const meta = data.chart?.result?.[0]?.meta;

    if (!meta || !meta.regularMarketPrice) return null;

    return {
      ticker: ticker.toUpperCase(),
      price: meta.regularMarketPrice,
      currency: meta.currency || 'USD',
      date: meta.regularMarketTime ? new Date(meta.regularMarketTime * 1000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      source: 'yahoo',
    };
  } catch {
    return null;
  }
}

export async function fetchLivePrice(ticker: string): Promise<PriceData | null> {
  const upper = ticker.toUpperCase();

  // Try fresh sources in order: Stooq → Yahoo chart → Yahoo quote → cached
  let priceData = await fetchStooqPrice(upper);
  if (!priceData) {
    priceData = await fetchYahooChartPrice(upper);
  }
  if (!priceData) {
    priceData = await fetchYahooQuotePrice(upper);
  }

  if (priceData) {
    setCachedPrice(upper, priceData);
    return priceData;
  }

  // Fallback to stale cache (tagged with age)
  const cached = getCachedPrice(upper);
  if (cached) {
    const ageMs = Date.now() - cached.timestamp;
    const ageMinutes = Math.round(ageMs / 60000);
    if (ageMinutes <= STALE_MAX_MINUTES) {
      return {
        ...cached.data,
        source: 'cached' as const,
        ageMinutes,
      };
    }
    // Too stale, discard
    PRICE_CACHE.delete(upper);
  }

  return null;
}
