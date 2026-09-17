/**
 * Verification & Confidence Calibration Engine
 * L2-L5 checks that ground LLM output against real data
 *
 * Calibration formula (L5):
 *   calibrated = clamp(round(model_confidence × (0.25 + 0.75 × verificationRate)), 5, 95)
 *   where verificationRate = passedChecks / evaluableChecks
 *   and evaluableChecks = count of checks that are NOT SKIPPED.
 *   If evaluableChecks == 0: calibrated = modelConfidence (UNCALIBRATED).
 *
 * Price-level rule (L3):
 *   A bearish support level is considered STALE if its ratio to live price
 *   falls outside [0.50, 1.50]. Auto-correct to round(livePrice × 0.92).
 *   Only audit strings containing a dollar amount ($NNN).
 */

import { NewsItem } from "./news";
import { PriceData } from "./prices";
import { HistoricalParallel } from "../data/historical-parallels";
import type { KeyDriverWithSources, LLMOutput } from "./llm";

export type CheckStatus = "VERIFIED" | "CORRECTED" | "UNGROUNDED" | "ILLUSTRATIVE — UNVERIFIED" | "SKIPPED";

export interface DriverCheck {
  index: number;
  title: string;
  status: CheckStatus;
  note?: string;
}

export interface PriceCheck {
  label: string; // e.g., "Price audit: $180 vs live quote"
  extractedValue?: number;
  livePrice?: number;
  ratio?: number;
  status: CheckStatus;
  correction?: string;
  note?: string;
}

export interface ParallelCheck {
  period: string;
  event: string;
  marketReaction: string;
  status: CheckStatus;
  dbMagnitude?: string;
}

export interface VerificationResult {
  driverChecks: DriverCheck[];
  priceChecks: PriceCheck[];
  parallelCheck: ParallelCheck;
  modelConfidence: number;
  calibratedConfidence: number;
  verificationRate: number;
  totalChecks: number;
  passedChecks: number;
  /** Count of checks that were NOT SKIPPED (used for Data Window display) */
  evaluableChecks: number;
  corrections: string[];
  /** True when no checks were evaluable (all SKIPPED), so calibration is trivial */
  uncalibrated: boolean;
}

// Token overlap calculation
function tokenOverlap(a: string, b: string): number {
  const tokensA = a.toLowerCase().split(/\s+/).filter(t => t.length > 2);
  const tokensB = b.toLowerCase().split(/\s+/).filter(t => t.length > 2);
  if (tokensA.length === 0 || tokensB.length === 0) return 0;
  const setB = new Set(tokensB);
  const matches = tokensA.filter(t => setB.has(t)).length;
  return matches / Math.max(tokensA.length, tokensB.length);
}

// Extract dollar amounts from text (only strings matching /\$\s?\d/)
function extractDollarAmounts(text: string): number[] {
  const matches = text.match(/\$\s?(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)/g);
  if (!matches) return [];
  return matches.map(m => parseFloat(m.replace(/[$\s]/g, ""))).filter(n => !isNaN(n) && n > 0);
}

/**
 * L2: Ground drivers against headlines
 */
export function groundDrivers(
  drivers: KeyDriverWithSources[],
  headlines: NewsItem[]
): DriverCheck[] {
  return drivers.map((driver, i) => {
    // Check all cited indices exist
    const allIndicesValid = driver.source_indices.every(idx => idx >= 0 && idx < headlines.length);

    if (!allIndicesValid) {
      return {
        index: i,
        title: driver.title,
        status: "UNGROUNDED" as const,
        note: "Cited headline indices out of range",
      };
    }

    // Check token overlap with each cited headline
    let maxOverlap = 0;
    for (const idx of driver.source_indices) {
      const overlap = tokenOverlap(driver.title, headlines[idx].title);
      maxOverlap = Math.max(maxOverlap, overlap);
    }

    if (maxOverlap >= 0.2) {
      return {
        index: i,
        title: driver.title,
        status: "VERIFIED" as const,
        note: `Source match: ${(maxOverlap * 100).toFixed(0)}% overlap`,
      };
    }

    return {
      index: i,
      title: driver.title,
      status: "UNGROUNDED" as const,
      note: `Low source overlap: ${(maxOverlap * 100).toFixed(0)}%`,
    };
  });
}

/**
 * L3: Audit price levels against live price
 * Only audits action items and impacts that contain a dollar amount.
 */
export function auditPriceLevels(
  report: LLMOutput,
  livePrice: PriceData | null
): PriceCheck[] {
  if (!livePrice) {
    // No live price available — return one SKIPPED row with neutral message
    return [{
      label: "Price audit skipped - quote unavailable",
      status: "SKIPPED" as const,
      note: "Live price unavailable",
    }];
  }

  const checks: PriceCheck[] = [];

  // Only audit strings that contain a dollar amount
  const allTexts = [
    ...report.action_checklist,
    ...report.key_drivers.map(d => d.impact),
  ];

  let hasAnyPriceClaim = false;

  for (const text of allTexts) {
    const amounts = extractDollarAmounts(text);
    if (amounts.length === 0) continue;

    hasAnyPriceClaim = true;

    for (const amount of amounts) {
      const ratio = amount / livePrice.price;
      let status: CheckStatus = "VERIFIED";
      let correction: string | undefined;
      let note: string;
      const label = `Price audit: $${amount.toLocaleString()} vs live quote $${livePrice.price.toLocaleString()}`;

      if (ratio < 0.5 || ratio > 1.5) {
        status = "CORRECTED";
        const correctedPrice = Math.round(livePrice.price * 0.92);
        correction = `Auto-corrected from $${amount} to $${correctedPrice}`;
        note = `Ratio ${ratio.toFixed(2)} outside [0.5, 1.5] bounds`;
      } else if (ratio > 1.0) {
        note = `Support/resistance at ${((ratio - 1) * 100).toFixed(1)}% above live price`;
      } else {
        note = `Level at ${((1 - ratio) * 100).toFixed(1)}% below live price`;
      }

      checks.push({
        label,
        extractedValue: amount,
        livePrice: livePrice.price,
        ratio,
        status,
        correction,
        note,
      });
    }
  }

  if (!hasAnyPriceClaim) {
    return [{
      label: "Price audit skipped - no dollar amounts in report",
      status: "SKIPPED" as const,
      note: "No price claims to audit",
    }];
  }

  return checks;
}

/**
 * L4: Match historical parallel against curated database
 */
export function matchParallel(
  parallel: LLMOutput["historical_parallel"],
  ticker: string,
  db: HistoricalParallel[]
): ParallelCheck {
  const tickerParallel = db.find(p =>
    p.event.toLowerCase().includes(ticker.toLowerCase()) ||
    tokenOverlap(parallel.description, p.event) >= 0.3
  );

  if (tickerParallel) {
    return {
      period: tickerParallel.period,
      event: tickerParallel.event,
      marketReaction: tickerParallel.market_reaction,
      status: "VERIFIED" as const,
      dbMagnitude: tickerParallel.magnitude,
    };
  }

  // Check any parallel in DB
  const anyMatch = db.find(p => tokenOverlap(parallel.description, p.event) >= 0.3);
  if (anyMatch) {
    return {
      period: anyMatch.period,
      event: anyMatch.event,
      marketReaction: anyMatch.market_reaction,
      status: "VERIFIED" as const,
      dbMagnitude: anyMatch.magnitude,
    };
  }

  return {
    period: parallel.period,
    event: parallel.description,
    marketReaction: parallel.market_reaction,
    status: "ILLUSTRATIVE — UNVERIFIED" as const,
  };
}

/**
 * L5: Calibrate confidence based on verification rate
 * SKIPPED checks are excluded from the rate calculation.
 * If no evaluable checks exist, return modelConfidence unchanged (UNCALIBRATED).
 */
export function calibrateConfidence(
  modelConfidence: number,
  checks: Array<{ status: CheckStatus }>
): {
    modelConfidence: number;
    calibrated: number;
    verificationRate: number;
    totalChecks: number;
    passedChecks: number;
    evaluableChecks: number;
    uncalibrated: boolean;
  } {
  const totalChecks = checks.length;

  // Separate evaluable from skipped
  const evaluable = checks.filter(c => c.status !== "SKIPPED");
  const evaluableChecks = evaluable.length;
  const passedChecks = evaluable.filter(c => c.status === "VERIFIED" || c.status === "CORRECTED").length;

  // If nothing evaluable, don't calibrate — just pass through
  if (evaluableChecks === 0) {
    return {
      modelConfidence,
      calibrated: modelConfidence,
      verificationRate: 0,
      totalChecks,
      passedChecks: 0,
      evaluableChecks: 0,
      uncalibrated: true,
    };
  }

  const verificationRate = passedChecks / evaluableChecks;

  // Calibration formula: calibrated = clamp(round(model × (0.25 + 0.75 × verificationRate)), 5, 95)
  const calibrated = Math.min(95, Math.max(5, Math.round(
    modelConfidence * (0.25 + 0.75 * verificationRate)
  )));

  return {
    modelConfidence,
    calibrated,
    verificationRate,
    totalChecks,
    passedChecks,
    evaluableChecks,
    uncalibrated: false,
  };
}

/**
 * Main verification pipeline
 */
export function runVerification(
  report: LLMOutput,
  headlines: NewsItem[],
  livePrice: PriceData | null,
  historicalDb: HistoricalParallel[],
  ticker: string
): VerificationResult {
  // L2: Ground drivers
  const driverChecks = groundDrivers(report.key_drivers, headlines);

  // L3: Audit price levels
  const priceChecks = auditPriceLevels(report, livePrice);

  // L4: Match parallel
  const parallelCheck = matchParallel(report.historical_parallel, ticker, historicalDb);

  // Collect all checks for calibration (all statuses including SKIPPED)
  const allChecks = [
    ...driverChecks.map(d => ({ status: d.status })),
    ...priceChecks.map(p => ({ status: p.status })),
    { status: parallelCheck.status },
  ];

  // Collect corrections
  const corrections = priceChecks
    .filter(p => p.correction)
    .map(p => p.correction!);

  // L5: Calibrate confidence
  const calibration = calibrateConfidence(report.confidence, allChecks);

  return {
    driverChecks,
    priceChecks,
    parallelCheck,
    modelConfidence: calibration.modelConfidence,
    calibratedConfidence: calibration.calibrated,
    verificationRate: calibration.verificationRate,
    totalChecks: calibration.totalChecks,
    passedChecks: calibration.passedChecks,
    evaluableChecks: calibration.evaluableChecks,
    corrections,
    uncalibrated: calibration.uncalibrated,
  };
}
