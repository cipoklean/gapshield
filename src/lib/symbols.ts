/**
 * Symbol Normalization & Recognition
 * Handles tokenized-symbol prefixes (rAAPL, AAPLx, AAPLon) and unknown-symbol guardrails.
 */

// Broad list of ~100 most-active US equity tickers covering quick-picks, curated-DB,
// snapshot tickers, mega-caps, sector ETFs, and popular names referenced in docs.
const KNOWN_TICKERS_SET: Set<string> = new Set([
  // Quick picks + curated DB
  "AAPL", "TSLA", "NVDA", "MSFT", "AMZN", "META", "SPY", "QQQ",
  // Mega caps
  "GOOGL", "GOOG", "BRK.B", "JPM", "JNJ", "V", "PG", "UNH", "HD", "MA",
  "DIS", "BAC", "XOM", "CVX", "PFE", "ABBV", "MRK", "KO", "PEP",
  "COST", "AVGO", "NFLX", "TMO", "LLY", "CSCO", "ACN", "MCD", "AMD",
  "INTC", "NOW", "ADBE", "CRM", "TXN", "QCOM", "AMAT", "BKNG", "HON",
  "UNP", "NEE", "LOW", "SBUX", "GS", "BLK", "AXP", "CAT", "DE",
  "MDLZ", "SYK", "ADP", "GILD", "CI", "ISRG", "VRTX", "MO", "ZTS",
  "TGT", "MMM", "DUK", "SO", "CL", "F", "GM", "USB", "PNC", "TFC",
  // ETFs
  "IWM", "EEM", "VEA", "VTI", "VOO", "SCHF", "AGG", "BND", "VWO",
]);

export function isKnownTicker(ticker: string): boolean {
  return KNOWN_TICKERS_SET.has(ticker.toUpperCase());
}

export interface SymbolResult {
  /** The underlying ticker to analyze (uppercase) */
  ticker: string;
  /** True if input was a recognized normalized form (r-prefix, x-suffix, on-suffix) */
  mapped?: boolean;
  /** Original input before normalization (only when mapped=true) */
  from?: string;
  /** Human-readable naming scheme label (only when mapped=true) */
  scheme?: string;
  /** True when the input is not recognized at all */
  unknown?: boolean;
}

export function normalizeSymbol(input: string): SymbolResult {
  const raw = input.trim().toUpperCase();

  if (KNOWN_TICKERS_SET.has(raw)) {
    return { ticker: raw };
  }

  // r-prefix: Bitget rToken convention (e.g., rAAPL, rNVDA)
  const rMatch = raw.match(/^R([A-Z]{1,4})$/);
  if (rMatch && KNOWN_TICKERS_SET.has(rMatch[1])) {
    return { ticker: rMatch[1], mapped: true, from: raw, scheme: "Bitget rToken" };
  }

  // x-suffix: xStocks convention (e.g., AAPLx)
  const xMatch = raw.match(/^([A-Z]{1,4})X$/);
  if (xMatch && KNOWN_TICKERS_SET.has(xMatch[1])) {
    return { ticker: xMatch[1], mapped: true, from: raw, scheme: "xStocks" };
  }

  // on-suffix: Ondo tokenized convention (e.g., AAPLon)
  const onMatch = raw.match(/^([A-Z]{1,4})ON$/);
  if (onMatch && KNOWN_TICKERS_SET.has(onMatch[1])) {
    return { ticker: onMatch[1], mapped: true, from: raw, scheme: "Ondo tokenized" };
  }

  return { ticker: raw, unknown: true };
}

/**
 * Levenshtein distance between two strings.
 */
function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1,
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

/**
 * Return up to 3 known tickers whose name is within Levenshtein distance ≤ 2
 * of the given input, sorted by distance ascending.
 */
export function findClosestTickers(input: string, maxResults = 3): string[] {
  const upper = input.trim().toUpperCase();
  const candidates = Array.from(KNOWN_TICKERS_SET)
    .filter(t => t !== upper)
    .map(t => ({ ticker: t, dist: levenshtein(upper, t) }))
    .filter(c => c.dist <= 2)
    .sort((a, b) => a.dist - b.dist)
    .slice(0, maxResults);
  return candidates.map(c => c.ticker);
}
