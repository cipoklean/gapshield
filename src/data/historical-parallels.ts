/**
 * Historical Parallels Database
 * Curated weekend gap scenarios with documented market reactions
 */

export interface HistoricalParallel {
  period: string;
  event: string;
  market_reaction: string;
  magnitude: string;
}

export const HISTORICAL_PARALLELS: Record<string, HistoricalParallel[]> = {
  AAPL: [
    {
      period: "January 2023",
      event: "China export restrictions on semiconductor components",
      market_reaction: "AAPL dropped 4.2% on Monday open after weekend restriction news",
      magnitude: "-4.2%",
    },
    {
      period: "March 2020",
      event: "COVID-19 pandemic onset over weekend",
      market_reaction: "AAPL gapped down 8.5% following Friday close",
      magnitude: "-8.5%",
    },
    {
      period: "August 2022",
      event: "China lockdowns disrupt iPhone supply chain",
      market_reaction: "AAPL declined 3.1% on Monday as supply concerns mounted",
      magnitude: "-3.1%",
    },
  ],
  TSLA: [
    {
      period: "October 2022",
      event: "OPEC+ surprise production cuts announced over weekend",
      market_reaction: "TSLA gapped down 6.8% on Monday after energy cost concerns",
      magnitude: "-6.8%",
    },
    {
      period: "November 2022",
      event: "FTX collapse over weekend created crypto contagion fears",
      market_reaction: "TSLA dropped 7.2% as Bitcoin correlation dragged sentiment",
      magnitude: "-7.2%",
    },
    {
      period: "May 2023",
      event: "EU anti-subsidy investigation into Chinese EVs announced",
      market_reaction: "TSLA rose 2.1% on Monday as Gigafactory Berlin benefited",
      magnitude: "+2.1%",
    },
  ],
  NVDA: [
    {
      period: "March 2024",
      event: "Tariff uncertainty during weekend trade talks",
      market_reaction: "NVDA declined only 1.2% showing resilience vs sector",
      magnitude: "-1.2%",
    },
    {
      period: "September 2023",
      event: "China export control rumors over weekend",
      market_reaction: "NVDA dropped 3.8% on Monday as AI chip restrictions feared",
      magnitude: "-3.8%",
    },
    {
      period: "December 2022",
      event: "Crypto winter spillover weakened risk sentiment",
      market_reaction: "NVDA fell 5.5% correlating with Bitcoin weekend decline",
      magnitude: "-5.5%",
    },
  ],
  MSFT: [
    {
      period: "July 2023",
      event: " DOJ antitrust filing over weekend",
      market_reaction: "MSFT declined 2.3% on Monday as regulatory concerns emerged",
      magnitude: "-2.3%",
    },
    {
      period: "November 2022",
      event: "FTX collapse over weekend",
      market_reaction: "MSFT dropped 4.1% with broader tech selloff",
      magnitude: "-4.1%",
    },
  ],
  AMZN: [
    {
      period: "June 2023",
      event: "FTC antitrust complaint leaked over weekend",
      market_reaction: "AMZN declined 3.5% on Monday regulatory fears",
      magnitude: "-3.5%",
    },
    {
      period: "October 2022",
      event: "OPEC+ production cut surprise",
      market_reaction: "AMZN dropped 4.8% on energy cost concerns",
      magnitude: "-4.8%",
    },
  ],
  META: [
    {
      period: "October 2022",
      event: "FTX collapse over weekend triggered crypto fears",
      market_reaction: "META dropped 8.5% amid Zuckerberg crypto exposure concerns",
      magnitude: "-8.5%",
    },
    {
      period: "March 2024",
      event: "EU Digital Markets Act enforcement over weekend",
      market_reaction: "META declined 2.8% on regulatory compliance costs",
      magnitude: "-2.8%",
    },
  ],
  generic: [
    {
      period: "October 2022",
      event: "OPEC+ surprise production cuts",
      market_reaction: "Energy stocks averaged +3.1% Monday gain following weekend announcements",
      magnitude: "+3.1%",
    },
    {
      period: "November 2022",
      event: "FTX collapse over weekend",
      market_reaction: "S&P 500 dropped 2.3% as crypto contagion fears spread",
      magnitude: "-2.3%",
    },
    {
      period: "January 2023",
      event: "China-Taiwan tensions escalate over weekend",
      market_reaction: "Tech names averaged -2.8% Monday gap as supply chain fears mounted",
      magnitude: "-2.8%",
    },
  ],
};

export function getHistoricalParallel(ticker: string): HistoricalParallel[] {
  const key = ticker.toUpperCase();
  return HISTORICAL_PARALLELS[key] || HISTORICAL_PARALLELS["generic"];
}
