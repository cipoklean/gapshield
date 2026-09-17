# GapShield AI — Weekend Risk Intelligence for Tokenized Stocks

## Problem
US equity markets close Friday at 4pm ET, but tokenized stocks (rTokens) on platforms like Bitget trade 24/7. Retail traders miss critical weekend news — geopolitical events, earnings signals, regulatory changes — creating a "weekend gap" that leads to reactive positioning and avoidable losses on Monday open.

## Solution
GapShield AI is an AI-powered research workbench that ingests weekend news sources and generates comprehensive Monday Prep Reports with visible AI processing, source evidence, and actionable checklists.

## Functional Demo Mode

### Live Data Fetching
- **Google News RSS**: Fetches recent headlines for any ticker (server-side, no API key required)
- **Crypto Fear & Greed Index**: Optional sentiment signal from alternative.me
- **CoinGecko Prices**: Optional BTC/ETH 24h change data
- **Historical Database**: Curated weekend gap scenarios for major tickers

### AI Synthesis (Two Modes)

#### Qwen Mode (Full AI)
If `QWEN_API_KEY` is configured in environment:
- Structured prompt sent to Qwen LLM
- Strict JSON output with risk score, bias, drivers, sources
- Model note with synthesis summary
- Highest confidence reports

#### Heuristic Mode (Demo Fallback)
If no API key is set:
- Keyword-based sentiment analysis of headlines
- Crypto sentiment adjustment
- Historical pattern matching
- Clearly labeled as "Heuristic mode" in UI
- All data sources still displayed

### No-Mainnet Constraint
- Zero wallet connection
- Zero trading execution
- Zero real funds
- Research and education tool only

## Features
- **Cinematic Hero**: Explains the weekend gap problem with parallax animations
- **Chrono-Sync Timeline**: Visualizes Friday close → Monday open risk window
- **AI Processing Pipeline**: Shows 4-step LLM workflow (Extract → Classify → Cross-reference → Synthesize)
- **Interactive Terminal**: Enter any ticker to generate a shield report
- **Source Evidence Cards**: Transparent data attribution for every claim
- **Data Window Panel**: Shows news scanned, crypto sentiment, historical cases, model used
- **Verification Layer**: Multi-stage L2-L5 engine that audits LLM output against real data
- **Premium Design**: Deep navy (#080C14) + gold (#C9A227) editorial aesthetic
- **rToken Context**: Bitget Stocks 2.0 lists 500+ tokenized US stocks and ETFs using r+Ticker naming (e.g. rAAPL); GapShield's weekend-gap thesis applies to any 24/7-traded tokenized name and to Monday-open gap risk on native names

## Tech Stack
- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS v4
- Framer Motion (animations)
- Lucide React (icons)
- fast-xml-parser (RSS parsing)
- Playfair Display + Inter + IBM Plex Mono (typography)

## Environment Variables

Create `.env.local` (gitignored) with:
```
# Qwen API (optional - enables full AI synthesis)
QWEN_API_KEY=your_key_here
QWEN_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
QWEN_MODEL=qwen-max
```

If not set, the app runs in heuristic demo mode with live news fetching.

## LLM Role
The model performs multi-stage analysis:
1. **Extract**: Pull entities and events from unstructured news
2. **Classify**: Score impact severity (high/medium/low)
3. **Cross-reference**: Match against historical patterns
4. **Synthesize**: Generate coherent risk narrative with citations

## Target User
Retail traders and small funds active in tokenized US stocks who need institutional-grade weekend intelligence without a dedicated news desk.

## Hackathon Context
Project 1 for Bitget AI Base Camp Hackathon S2, Track 3: AI Trading Desk.

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:3000

To enable Qwen mode, add `.env.local` with your API key.

## Demo Script
See [docs/demo-script.md](./docs/demo-script.md)

## Architecture
See [docs/architecture.md](./docs/architecture.md)

## License
MIT
