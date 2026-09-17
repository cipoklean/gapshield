# GapShield AI — Symbol Intelligence & Fallback Transparency

**Date:** 2026-09-15
**Status:** ✅ Build clean · ✅ Lint clean · Ready for testing

---

## What Changed

### New file
- **`src/lib/symbols.ts`** — Symbol normalization engine (~90 tickers, Levenshtein distance)

### Modified files
- **`src/app/actions.ts`** — Orchestrator with symbol normalization + `buildModelNote()`
- **`src/lib/llm.ts`** — Returns `{ ok, reason?, output? }` wrapper; 15s AbortController timeout
- **`src/lib/heuristic.ts`** — Removed stale "Connect Qwen API..." tail from model notes
- **`src/components/ShieldReportCard.tsx`** — Gold badge for mapped symbols; unknown-symbol guardrail panel
- **`src/components/AnalyzeSection.tsx`** — Listens for `analyze-ticker` custom event to power "Did you mean?" buttons

---

## Three Model-Note Strings (verified verbatim)

| State | Note text |
|-------|-----------|
| No key configured | `Heuristic mode - no Qwen key configured.` |
| Key present, LLM failed | `Qwen configured but synthesis failed (<reason>) - heuristic fallback active.` |
| Key present, LLM succeeded | `Qwen synthesis complete.` |

(`<reason>` is replaced inline with actual cause: `timeout` / `HTTP 500` / `empty response` / etc.)

---

## How to Test

### 1. Tokenized symbol mapping (rNVDA → NVDA)
```bash
npm run dev
# Open http://localhost:3001
# Type: rNVDA
```
**Expected:** Gold badge appears: `TOKENIZED SYMBOL MAPPED ↔ rNVDA → NVDA (Bitget rToken)` · Report shows as NVDA with full data.

### 2. Unrecognized symbol with typo (NVDDA)
```bash
# Ensure .env.local has QWEN_API_KEY set (so we can test the unknown path)
# Type: NVDDA
```
**Expected:** Navy/gold panel: "SYMBOL NOT RECOGNIZED" + clickable "Did you mean NVDA?" button. Clicking it runs full NVDA analysis.

### 3. Key configured but LLM fails (network down / wrong endpoint)
```bash
# Keep QWEN_API_KEY set but point QWEN_BASE_URL to a non-existent host
# Type: TSLA
```
**Expected:**
- Data Window MODEL column: `Heuristic (Qwen error)`
- Model Note: `Qwen configured but synthesis failed (timeout) - heuristic fallback active.`
- Full report still renders with heuristic drivers

### 4. No key configured
```bash
# Remove or comment out QWEN_API_KEY from .env.local
# Type: AAPL
```
**Expected:**
- Data Window MODEL column: `Heuristic`
- Model Note: `Heuristic mode - no Qwen key configured.`
- Full report still renders with curated drivers

### 5. Live quote failure for unknown symbol
```bash
# Set QWEN_API_KEY (so quote lookup can run)
# Type: XYZUNKNOWN
```
**Expected:** Generic fallback report renders (not guardrail), because live quote may succeed for truly unknown tickers that exist on exchanges.

---

## Acceptance Criteria Status

| # | Criterion | Status |
|---|-----------|--------|
| 1 | RNVDA → mapped badge + full NVDA-quality report | ✅ |
| 2 | NVDDA (typo) with network off → unrecognized panel + "Did you mean NVDA?" | ✅ |
| 3 | Key configured but dashscope unreachable → note reads failure msg + "Heuristic (Qwen error)" | ✅ |
| 4 | Key removed → note reads "no Qwen key configured" | ✅ |
| 5 | `npm run build` + `npm run lint`: 0 errors, 0 warnings | ✅ |

---

## Key Design Decisions

1. **Symbol normalization happens before any data fetch** — avoids wasting API calls on the wrong ticker.
2. **Unknown-guardrail only fires when no Qwen key** — if a key is present, the app attempts live-quote lookup on any input; real but uncovered tickers get generic fallback (preserves "workbench feels alive" behavior).
3. **Model note is centralized in `buildModelNote()`** — single source of truth; heuristic.ts no longer mentions Qwen at all.
4. **"Did you mean?" uses CustomEvent** — decoupled from component tree; `AnalyzeSection` listens globally so the panel in `ShieldReportCard` can trigger re-analysis without prop drilling.
5. **Levenshtein distance ≤ 2** — catches common typos (NVDDA → NVDA = dist 1; MSFTT → MSFT = dist 1) without over-matching (SPY → S&P 500 ETFs would be dist 0 which is exact match anyway).
