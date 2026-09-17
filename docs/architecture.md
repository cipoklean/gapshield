# GapShield AI Architecture

## Overview
GapShield AI is a weekend risk intelligence workbench for tokenized US stocks. It helps traders prepare for Monday by synthesizing weekend news, macro events, and historical gap patterns into a risk report.

Bitget Stocks 2.0 lists 500+ tokenized US stocks and ETFs using r+Ticker naming (e.g. rAAPL). GapShield's weekend-gap thesis applies to any 24/7-traded tokenized name and to Monday-open gap risk on native names.

## Product Position
- **Track**: Track 3 — AI Trading Desk (Bitget AI Base Camp Hackathon S2)
- **Sub-theme**: Information Extraction & Signal Generation
- **Positioning**: Human decision support tool, not autonomous execution
- **No mainnet**: Zero wallet connection, zero trading, zero real funds

## System Flow

```
User enters ticker → Validate input → Check cache → Fetch news RSS
    ↓
Fetch optional crypto sentiment → Get historical parallels
    ↓
Try Qwen LLM synthesis → If fails/no key, use heuristic engine
    ↓
Map to ShieldReport format → Cache result → Return to UI
```

### Step-by-Step Flow

1. **Input Validation**: Ticker regex check (`^[A-Z]{1,5}$`)
2. **Cache Check**: Return cached report if <15 minutes old
3. **News Fetch**: Google News RSS endpoint (server-side, no API key needed)
4. **Crypto Sentiment**: Alternative.me Fear & Greed Index (optional, degrades gracefully)
5. **Historical Matching**: Curated database of weekend gap scenarios
6. **LLM Synthesis**: Qwen API call with structured prompt (if key available)
7. **Heuristic Fallback**: Keyword analysis + pattern matching (always available)
8. **Report Mapping**: Convert to ShieldReport interface
9. **Cache Storage**: Store for 15-minute TTL

## Data Sources

### Primary: Google News RSS
- **Endpoint**: `https://news.google.com/rss/search?q={query}&when:3d`
- **Query Construction**: Ticker-specific keywords (e.g., "AAPL stock Apple earnings regulation China supply chain")
- **Limits**: Top 10 most relevant headlines
- **Headers**: Custom User-Agent to avoid blocking
- **Error Handling**: Returns empty array on failure, continues with heuristic

### Optional: Crypto Fear & Greed Index
- **Endpoint**: `https://api.alternative.me/fng/`
- **Data**: Score (0-100), classification, timestamp
- **Usage**: Adjusts heuristic risk score based on market sentiment
- **Error Handling**: Continues without crypto data if unavailable

### Optional: CoinGecko Prices
- **Endpoint**: `https://api.coingecko.com/api/v3/simple/price`
- **Data**: BTC/ETH 24h price change percentages
- **Usage**: Additional sentiment context
- **Error Handling**: Optional, doesn't affect core functionality

### Historical Parallels Database
- **Location**: `src/data/historical-parallels.json.ts`
- **Coverage**: AAPL, TSLA, NVDA, MSFT, AMZN, META, generic fallback
- **Entries**: 2-3 curated scenarios per ticker with dates, events, reactions
- **Purpose**: Provides context for historical pattern matching

## LLM Adapter

### Qwen Integration (Optional)
- **Environment**: `QWEN_API_KEY`, `QWEN_BASE_URL`, `QWEN_MODEL`
- **Prompt**: Structured JSON schema request with weekend context
- **Temperature**: 0.3 (balanced creativity/accuracy)
- **Max Tokens**: 1500 (enough for full report)
- **Output Parsing**: Extracts JSON from possible markdown code blocks
- **Error Handling**: Falls back to heuristic if API fails

### Heuristic Engine
- **Keyword Analysis**: Scans headlines for bullish/bearish terms
- **Scoring Algorithm**: Weighted sum of positive/negative signals
- **Crypto Adjustment**: Fear <30 adds bearish bias, greed >70 adds caution
- **Source Generation**: Creates evidence cards from headlines + sentiment
- **Action Checklist**: Bias-dependent recommendations
- **Confidence**: Based on headline count and signal strength

## Caching

- **Mechanism**: In-memory Map (resets on server restart)
- **TTL**: 15 minutes
- **Key**: Uppercase ticker symbol
- **Benefit**: Reduces redundant API calls during demo
- **Limitation**: Not persistent across deployments (acceptable for hackathon)

## Verification & Calibration Layer

GapShield AI includes a multi-stage verification engine (L2-L5) that audits LLM output against real data before presenting it to users. This ensures claims are grounded and confidence scores are evidence-based, not self-reported.

### Pipeline Stages

#### L2: Source Grounding (groundDrivers)
- Validates each key driver cites valid headline indices
- Computes token overlap between driver title and cited headlines
- Status: VERIFIED (overlap ≥ 20%) or UNGROUNDED (< 20%)

#### L3: Price Level Audit (auditPriceLevels)
- Extracts dollar amounts from action items and driver impacts via regex
- Calculates ratio: extracted_price / live_price
- Stale rule: bearish support levels with ratio < 0.5 or > 1.5 are STALE/IMPLAUSIBLE
- Auto-corrects stale levels to round(livePrice × 0.92) with recorded correction note
- Status: VERIFIED, AUTO-CORRECTED, or SKIPPED (no price data)

#### L4: Historical Parallel Matching (matchParallel)
- Searches curated database for matching scenarios
- Token overlap threshold: 30%
- Status: VERIFIED (DB match found) or ILLUSTRATIVE — UNVERIFIED

#### L5: Confidence Calibration (calibrateConfidence)
- Formula: `calibrated = clamp(round(model_confidence × (0.25 + 0.75 × verificationRate)), 5, 95)`
- Where `verificationRate = passedChecks / totalChecks`
- Passed checks include VERIFIED + AUTO-CORRECTED statuses
- Displays both model confidence and calibrated confidence side-by-side
- Adds explanatory note: "Confidence is computed from verified evidence, not model self-report"

### User-Facing Output

The **Verification Panel** shows:
- One row per check with status chip (green-gold for VERIFIED, amber for AUTO-CORRECTED, red for UNGROUNDED)
- Model → Calibrated confidence with one-sentence explanation
- Data Window summary: Claims audited, Verified count, Corrected count, Unverified count

This layer transforms GapShield from an AI black box into a transparent research workbench.

## File Structure

```
src/
├── app/
│   ├── actions.ts          # Main orchestrator + types
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── AIProcessingPipeline.tsx
│   ├── AnalyzeSection.tsx
│   ├── CinematicHero.tsx
│   ├── Navbar.tsx
│   ├── PinnedStorySection.tsx
│   ├── ShieldReportCard.tsx
│   └── TickerInput.tsx
├── lib/
│   ├── news.ts             # Google News RSS fetcher
│   ├── crypto.ts           # Fear & Greed + CoinGecko
│   ├── llm.ts              # Qwen API adapter
│   └── heuristic.ts        # Fallback engine
└── data/
    └── historical-parallels.json.ts  # Curated scenarios
```

## No-Mainnet Constraint

GapShield AI does not:
- Connect to wallets
- Execute trades
- Handle real funds
- Interact with blockchain networks

It is a research and education tool demonstrating the product vision.

## Error Handling Strategy

| Failure Point | Behavior |
|--------------|----------|
| News RSS fetch fails | Continue with empty headlines, heuristic uses historical data |
| Crypto API fails | Skip crypto sentiment, continue without it |
| Qwen API fails/unavailable | Fall back to heuristic engine |
| Heuristic fails (unlikely) | Return error to UI with friendly message |
| Invalid ticker | Client-side validation prevents submission |
| Cache miss | Regenerate all data fresh |

## Performance Considerations

- **Parallel Fetching**: News + crypto fetched concurrently via Promise.all
- **Streaming**: Not implemented (would require route handler refactor)
- **Bundle Size**: fast-xml-parser is lightweight (~10KB)
- **Server Actions**: All data fetching happens server-side, never exposed to client

## Future Integration Path

To enhance with real data:
1. Add SEC EDGAR API for filings (free, no key)
2. Add Federal Reserve Economic Data (FRED) for macro indicators
3. Add Bitget API for rToken liquidity snapshots
4. Enable streaming responses for LLM output
5. Add WebSocket price feeds for live updates
