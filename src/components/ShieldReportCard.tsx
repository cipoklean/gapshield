"use client";

import { motion } from "framer-motion";
import { IconShieldCheck, IconAlertTriangle, IconTrendingUp, IconTrendingDown, IconMinus, IconChecks, IconGitMerge } from "@tabler/icons-react";
import type { ShieldReport } from "@/app/actions";
import { findClosestTickers } from "@/lib/symbols";

interface ShieldReportCardProps {
  report: ShieldReport | null;
  loading: boolean;
}

export function ShieldReportCard({ report }: ShieldReportCardProps) {
  if (!report) return null;

  // Unknown symbol guardrail — render distinct panel instead of empty report
  if (report.unknownSymbol) {
    const closest = findClosestTickers(report.ticker, 3);
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass rounded-2xl p-8 space-y-4"
      >
        <div className="label-mono text-risk-high mb-2">SYMBOL NOT RECOGNIZED</div>
        <p className="text-ink-muted">
          <span className="text-ink font-mono font-medium">{report.ticker}</span> is not in GapShield&#39;s coverage list of US tickers and tokenized symbols (rAAPL, AAPLx, AAPLon). No report was generated.
        </p>
        {closest.length > 0 && (
          <div className="pt-4 border-t border-border">
            <p className="text-ink-faint text-sm mb-3">Did you mean any of these?</p>
            <div className="flex flex-wrap gap-2">
              {closest.map((t) => (
                <button
                  key={t}
                  onClick={() => window.dispatchEvent(new CustomEvent("analyze-ticker", { detail: t }))}
                  className="px-4 py-2 glass rounded-full text-sm font-mono text-gold hover:bg-gold/20 transition-colors"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    );
  }

  const riskColor =
    report.riskScore >= 70 ? "text-risk-high" :
    report.riskScore >= 40 ? "text-risk-mid" : "text-risk-low";

  const riskLabel =
    report.riskScore >= 70 ? "High Risk" :
    report.riskScore >= 40 ? "Moderate Risk" : "Low Risk";

  const biasIcon =
    report.bias === "Bullish" ? <IconTrendingUp className="w-5 h-5 text-risk-low" /> :
    report.bias === "Bearish" ? <IconTrendingDown className="w-5 h-5 text-risk-high" /> :
    <IconMinus className="w-5 h-5 text-ink-muted" />;

  return (
    <div className="space-y-6">
      {/* Main Report Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="glass-gold rounded-3xl p-8 md:p-12 space-y-8"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div>
            <div className="label-mono mb-3">{report.livePrice ? "Live Price Shield Report" : "Weekend Risk Report"}</div>
            <h3 className="headline text-5xl md:text-6xl text-ink">{report.ticker}</h3>
            {report.symbolMapped && report.symbolFrom && (
              <div className="mt-2 px-3 py-1.5 rounded-full bg-gold/10 border border-gold/30 inline-flex items-center gap-2">
                <span className="text-gold font-mono text-xs">TOKENIZED SYMBOL MAPPED</span>
                <span className="text-ink-muted text-xs">↔ {report.symbolFrom} → {report.ticker} ({report.symbolScheme})</span>
              </div>
            )}
            <p className="text-ink-muted mt-2 text-lg">Weekend Risk Analysis</p>
          </div>
          <div className="text-left md:text-right">
            <div className="label-mono mb-2">Generated</div>
            <div className="text-ink-faint font-mono text-sm">{new Date().toLocaleString()}</div>
            {report.livePrice && (
              <div className="mt-3 space-y-1">
                <div className="label-mono text-xs">Live Price (Last Close)</div>
                <div className="text-ink font-display text-xl">${report.livePrice.price}</div>
                <div className="text-xs text-ink-faint font-mono">
                  {report.livePrice.date} • {report.livePrice.source}{report.livePrice.ageMinutes != null ? ` (cached ${report.livePrice.ageMinutes}m ago)` : ""}
                </div>
              </div>
            )}
            <div className="mt-4 flex items-center gap-2 text-xs text-ink-faint justify-end">
              <div className={`w-2 h-2 rounded-full ${report.confidence > 80 ? 'bg-risk-low' : report.confidence > 60 ? 'bg-risk-mid' : 'bg-risk-high'}`} />
              Confidence: {report.confidence}%
            </div>
          </div>
        </div>

        {/* Risk Gauge & Key Info */}
        <div className="flex flex-col md:flex-row items-start gap-10">
          {/* Gauge */}
          <div className="relative w-36 h-36 flex-shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="rgba(148,163,184,0.08)"
                strokeWidth="6"
              />
              <motion.circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="var(--color-risk-high)"
                strokeWidth="6"
                strokeDasharray={`${report.riskScore * 2.51} 251`}
                strokeLinecap="round"
                initial={{ strokeDasharray: "0 251" }}
                animate={{ strokeDasharray: `${report.riskScore * 2.51} 251` }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                className={riskColor}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-4xl font-display ${riskColor}`}>{report.riskScore}</span>
              <span className={`label-mono text-[10px] tracking-[0.2em] mt-1 ${riskColor}`}>{riskLabel}</span>
            </div>
          </div>

          {/* Key Info */}
          <div className="flex-1 space-y-6">
            <div>
              <div className="label-mono mb-2">Directional Bias</div>
              <div className="flex items-center gap-3">
                {biasIcon}
                <span className="text-2xl text-ink font-medium">{report.bias}</span>
              </div>
            </div>

            <div>
              <div className="label-mono mb-3">Key Weekend Drivers</div>
              {report.keyDrivers.length > 0 ? (
                <ul className="space-y-3">
                  {report.keyDrivers.map((driver, i) => (
                    <li key={i} className="flex items-start gap-3 text-ink-muted">
                      <span className="text-gold mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" />
                      <span className="flex-1">{driver.title}</span>
                      {driver.source_tag && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${
                          driver.source_tag === "CITATION" ? "bg-emerald-500/20 text-emerald-300" :
                          driver.source_tag === "CURATED CONTEXT" ? "bg-amber-500/20 text-amber-300" :
                          "bg-ink-faint/20 text-ink-faint"
                        }`}>
                          {driver.source_tag}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="glass rounded-xl p-4 text-center">
                  <p className="text-ink-muted text-sm">No weekend drivers extracted this run. See Verification Layer for details.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Historical Parallel */}
        <div className="glass rounded-2xl p-6">
          <div className="label-mono mb-4 flex items-center gap-2">
            <IconShieldCheck className="w-4 h-4 text-gold" stroke={1.5} />
            Historical Parallel
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-ink-faint mb-1">Period</div>
              <div className="text-ink font-medium">{report.historicalParallel.period}</div>
            </div>
            <div>
              <div className="text-xs text-ink-faint mb-1">Event</div>
              <div className="text-ink-muted text-sm">{report.historicalParallel.description}</div>
            </div>
            <div>
              <div className="text-xs text-ink-faint mb-1">Market Reaction</div>
              <div className="text-gold font-mono">{report.historicalParallel.market_reaction}</div>
            </div>
          </div>
        </div>

        {/* Action Checklist */}
        <div>
          <div className="label-mono mb-5 flex items-center gap-2">
            <IconChecks className="w-4 h-4 text-risk-low" stroke={1.5} />
            Recommended Actions
          </div>
          <div className="grid gap-4">
            {report.actionItems.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 + 0.2 }}
                className="flex items-start gap-4 p-5 glass rounded-2xl hover:border-gold/20 transition-colors duration-300"
              >
                <span className="w-8 h-8 rounded-full bg-gold/20 text-gold flex items-center justify-center font-mono text-sm font-medium flex-shrink-0">
                  {i + 1}
                </span>
                <p className="text-ink-muted pt-1">
                  {item}
                  {report.priceAuditSkipped && /\$\s?\d/.test(item) && (
                    <span className="text-ink-faint text-xs ml-1">(level unaudited - quote unavailable)</span>
                  )}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Source Evidence */}
        {report.sources.length > 0 && (
          <div>
            <div className="label-mono mb-4 flex items-center gap-2">
              <IconGitMerge className="w-4 h-4 text-ink-muted" stroke={1.5} />
              Source Evidence
            </div>
            <div className="grid gap-3">
              {report.sources.slice(0, 4).map((source, i) => (
                <div key={i} className="flex items-start gap-3 p-4 glass rounded-xl">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-gold">{source.category}</span>
                      <span className="text-xs text-ink-faint">•</span>
                      <span className="text-xs text-ink-muted truncate">{source.name}</span>
                    </div>
                    <p className="text-sm text-ink-muted truncate">{source.detail}</p>
                  </div>
                  {source.url && (
                    <a href={source.url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-xs text-gold hover:underline px-3 py-1 glass rounded-full">
                      View
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Verification Panel */}
        {report.verification && <VerificationPanel verification={report.verification} />}

        {/* Model Note */}
        {report.modelNote && (
          <div className="glass rounded-xl p-4">
            <div className="label-mono text-xs text-ink-faint mb-2">Model Note</div>
            <p className="text-xs text-ink-muted">{report.modelNote}</p>
          </div>
        )}

        {/* Disclaimer */}
        <div className="flex items-start gap-3 text-xs text-ink-faint pt-4 border-t border-border">
          <IconAlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-ink-faint" stroke={1.5} />
          <p>This report is generated for informational purposes only and does not constitute financial advice. Always conduct your own research before making investment decisions.</p>
        </div>
      </motion.div>

      {/* Data Window Summary */}
      <DataWindowPanel dataWindow={report.dataWindow} verification={report.verification} />
    </div>
  );
}

// ─── Verification Panel ─────────────────────────────────────────────

interface VerificationPanelProps {
  verification: NonNullable<ShieldReport["verification"]>;
}

export function VerificationPanel({ verification }: VerificationPanelProps) {
  return (
    <div className="glass-gold rounded-2xl p-6 space-y-4">
      {/* Section Label */}
      <div className="label-mono flex items-center gap-2">
        <IconShieldCheck className="w-4 h-4 text-gold" stroke={1.5} />
        VERIFICATION LAYER
      </div>

      {/* Calibration Banner */}
      <div className={`glass rounded-xl p-4 flex items-start gap-3 ${verification.uncalibrated ? 'border-amber-500/30' : ''}`}>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-ink font-medium">Confidence Calibration</span>
            {verification.modelConfidence !== verification.calibratedConfidence && (
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                Adjusted
              </span>
            )}
            {verification.uncalibrated && (
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                UNCALIBRATED
              </span>
            )}
          </div>
          <div className="text-sm text-ink-muted">
            <span className="font-mono text-ink">{verification.modelConfidence}%</span>
            <span className="text-ink-faint mx-2">→</span>
            <span className="font-mono text-gold">{verification.calibratedConfidence}%</span>
            <span className="ml-2 text-xs">
              {verification.uncalibrated
                ? "no auditable evidence this run"
                : `based on ${verification.passedChecks}/${verification.evaluableChecks} evaluable claims`}
            </span>
          </div>
          <p className="text-xs text-ink-faint mt-1">
            Confidence is computed from verified evidence, not model self-report.
          </p>
        </div>
      </div>

      {/* Check Rows */}
      <div className="space-y-2">
        {/* Driver Checks */}
        {verification.driverChecks.map((check, i) => (
          <CheckRow
            key={`driver-${i}`}
            label={`Driver ${i + 1}: ${check.title.slice(0, 50)}${check.title.length > 50 ? "..." : ""}`}
            status={check.status}
            note={check.note}
          />
        ))}

        {/* Price Checks */}
        {verification.priceChecks.map((check, i) => (
          <CheckRow
            key={`price-${i}`}
            label={check.label}
            status={check.status}
            note={check.note}
          />
        ))}

        {/* Parallel Check */}
        <CheckRow
          label={`Historical: ${verification.parallelCheck.period}`}
          status={verification.parallelCheck.status}
          note={verification.parallelCheck.dbMagnitude ? `DB magnitude: ${verification.parallelCheck.dbMagnitude}` : undefined}
        />
      </div>
    </div>
  );
}

function CheckRow({ label, status, note }: { label: string; status: string; note?: string }) {
  const statusStyles: Record<string, string> = {
    "VERIFIED": "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    "CORRECTED": "bg-amber-500/20 text-amber-300 border-amber-500/30",
    "UNGROUNDED": "bg-red-500/20 text-red-300 border-red-500/30",
    "ILLUSTRATIVE — UNVERIFIED": "bg-orange-500/20 text-orange-300 border-orange-500/30",
    "SKIPPED": "bg-ink-faint/20 text-ink-faint border-ink-faint/30",
  };

  return (
    <div className="flex items-center gap-3 p-3 glass rounded-lg">
      <span className="flex-1 text-sm text-ink-muted truncate">{label}</span>
      <span className={`px-2.5 py-1 rounded-full text-xs font-mono border ${statusStyles[status] || statusStyles["SKIPPED"]}`}>
        {status}
      </span>
      {note && <span className="text-xs text-ink-faint hidden lg:block max-w-[200px] truncate">{note}</span>}
    </div>
  );
}

// ─── Data Window Panel ──────────────────────────────────────────────

interface DataWindowPanelProps {
  dataWindow: NonNullable<ShieldReport["dataWindow"]>;
  verification?: NonNullable<ShieldReport["verification"]>;
}

function DataWindowPanel({ dataWindow, verification }: DataWindowPanelProps) {
  // Compute counts from verification for consistency
  const verified = verification?.passedChecks ?? 0;
  const corrected = verification?.corrections.length ?? 0;
  const ungrounded = verification
    ? verification.totalChecks - verification.passedChecks - corrected - (verification.totalChecks - verification.evaluableChecks)
    : 0;
  const skipped = verification
    ? verification.totalChecks - verification.evaluableChecks
    : 0;

  return (
    <div className="glass rounded-2xl p-5 grid grid-cols-4 gap-y-4 xl:grid-cols-8">
      <div>
        <div className="label-mono text-xs mb-1">Model</div>
        <div className="text-ink font-mono text-sm">{dataWindow.model}</div>
      </div>
      <div>
        <div className="label-mono text-xs mb-1">Headlines</div>
        <div className="text-ink font-mono text-sm">{dataWindow.newsCount}</div>
      </div>
      <div>
        <div className="label-mono text-xs mb-1">Historical</div>
        <div className="text-ink font-mono text-sm">{dataWindow.historicalMatches}</div>
      </div>
      {verification && (
        <>
          <div>
            <div className="label-mono text-xs mb-1">Evaluated</div>
            <div className="text-ink font-mono text-sm">{verification.evaluableChecks}</div>
          </div>
          <div>
            <div className="label-mono text-xs mb-1">Verified</div>
            <div className="text-gold font-mono text-sm">{verified}</div>
          </div>
          <div>
            <div className="label-mono text-xs mb-1">Corrected</div>
            <div className="text-amber-400 font-mono text-sm">{corrected}</div>
          </div>
          <div>
            <div className="label-mono text-xs mb-1">Ungrounded</div>
            <div className="text-red-400 font-mono text-sm">{ungrounded}</div>
          </div>
          <div>
            <div className="label-mono text-xs mb-1">Skipped</div>
            <div className="text-ink-faint font-mono text-sm">{skipped}</div>
          </div>
        </>
      )}
      {dataWindow.cryptoSentiment && (
        <div>
          <div className="label-mono text-xs mb-1">Crypto Sentiment</div>
          <div className="text-ink font-mono text-sm">{dataWindow.cryptoSentiment}</div>
        </div>
      )}
    </div>
  );
}
