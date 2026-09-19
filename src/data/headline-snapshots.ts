/**
 * Cached Headline Snapshots
 * Fallback data when Google News RSS is unavailable.
 * Each entry is a representative set of headlines for a major ticker.
 * Marked with source "Cached snapshot (demo)" so users know the data source.
 */

export interface CachedHeadline {
  title: string;
  link: string;
  source: string;
}

export const HEADLINE_SNAPSHOTS: Record<string, CachedHeadline[]> = {
  AAPL: [
    {
      title: "Apple faces new China export restrictions on semiconductor components",
      link: "https://news.google.com/search?q=AAPL+China+restrictions",
      source: "Reuters (cached snapshot — demo)",
    },
    {
      title: "Federal Reserve signals potential rate hike delay into Q2",
      link: "https://news.google.com/search?q=Apple+Fed+rates",
      source: "Bloomberg (cached)",
    },
    {
      title: "EU intensifies scrutiny on App Store policies affecting Apple revenue",
      link: "https://news.google.com/search?q=AAPL+EU+regulation",
      source: "Financial Times (cached)",
    },
    {
      title: "iPhone supply chain concerns mount as Taiwan tensions rise",
      link: "https://news.google.com/search?q=AAPL+Taiwan+supply",
      source: "CNBC (cached)",
    },
    {
      title: "Apple services growth slows amid regulatory headwinds",
      link: "https://news.google.com/search?q=AAPL+services+growth",
      source: "Wall Street Journal (cached)",
    },
  ],
  TSLA: [
    {
      title: "OPEC+ surprises with production cut announcement over weekend",
      link: "https://news.google.com/search?q=TSLA+OPEC+cuts",
      source: "Energy Institute (cached)",
    },
    {
      title: "BYD announces aggressive pricing strategy targeting Tesla market share",
      link: "https://news.google.com/search?q=TSLA+BYD+pricing",
      source: "Auto News (cached)",
    },
    {
      title: "EU anti-subsidy investigation into Chinese EV imports could impact Gigafactory Berlin",
      link: "https://news.google.com/search?q=TSLA+EU+investigation",
      source: "Politico (cached)",
    },
    {
      title: "Tesla delivery numbers miss analyst expectations for Q4",
      link: "https://news.google.com/search?q=TSLA+deliveries+Q4",
      source: "MarketWatch (cached)",
    },
    {
      title: "Musk faces regulatory scrutiny over Autopilot safety claims",
      link: "https://news.google.com/search?q=TSLA+Autopilot+investigation",
      source: "AP News (cached)",
    },
  ],
  NVDA: [
    {
      title: "Nvidia AI chip demand remains strong despite export control uncertainty",
      link: "https://news.google.com/search?q=NVDA+AI+chips",
      source: "TechCrunch (cached)",
    },
    {
      title: "Export controls discussion ongoing but no final decision this weekend",
      link: "https://news.google.com/search?q=NVDA+export+controls",
      source: "WSJ (cached)",
    },
    {
      title: "Data center demand sustains Nvidia's growth trajectory",
      link: "https://news.google.com/search?q=NVDA+data+center",
      source: "Barron's (cached)",
    },
    {
      title: "Nvidia competition from AMD and custom chips intensifies",
      link: "https://news.google.com/search?q=NVDA+AMD+competition",
      source: "The Information (cached)",
    },
    {
      title: "Semiconductor supply chain showing signs of stabilization",
      link: "https://news.google.com/search?q=NVDA+supply+chain",
      source: "Seeking Alpha (cached)",
    },
  ],
  MSFT: [
    {
      title: "Microsoft earnings beat expectations driven by cloud growth",
      link: "https://news.google.com/search?q=MSFT+earnings",
      source: "Reuters (cached)",
    },
    {
      title: "Azure AI infrastructure spending cycle continues to drive demand",
      link: "https://news.google.com/search?q=MSFT+Azure+AI",
      source: "Bloomberg (cached)",
    },
    {
      title: "Regulatory concerns over Microsoft-Activision integration persist",
      link: "https://news.google.com/search?q=MSFT+Activision+regulation",
      source: "Financial Times (cached)",
    },
    {
      title: "Microsoft Copilot adoption accelerates across enterprise customers",
      link: "https://news.google.com/search?q=MSFT+Copilot+enterprise",
      source: "CNBC (cached)",
    },
    {
      title: "Tech sector facing headwinds from global interest rate uncertainty",
      link: "https://news.google.com/search?q=MSFT+interest+rates",
      source: "MarketWatch (cached)",
    },
  ],
  AMZN: [
    {
      title: "Amazon retail margins pressured by competitive pricing environment",
      link: "https://news.google.com/search?q=AMZN+retail+margins",
      source: "WSJ (cached)",
    },
    {
      title: "AWS growth reaccelerates as enterprise AI adoption picks up",
      link: "https://news.google.com/search?q=AMZN+AWS+AI",
      source: "TechCrunch (cached)",
    },
    {
      title: "Antitrust scrutiny on Amazon marketplace practices intensifies",
      link: "https://news.google.com/search?q=AMZN+antitrust",
      source: "Reuters (cached)",
    },
    {
      title: "Amazon logistics expansion continues with new fulfillment centers",
      link: "https://news.google.com/search?q=AMZN+logistics",
      source: "Bloomberg (cached)",
    },
    {
      title: "Holiday shopping season outlook mixed for Amazon e-commerce",
      link: "https://news.google.com/search?q=AMZN+holidays",
      source: "CNBC (cached)",
    },
  ],
  META: [
    {
      title: "Meta earnings driven by AI-powered ad targeting improvements",
      link: "https://news.google.com/search?q=META+AI+ads",
      source: "Bloomberg (cached)",
    },
    {
      title: "Metaverse investment losses continue to weigh on Meta sentiment",
      link: "https://news.google.com/search?q=META+metaverse+losses",
      source: "Financial Times (cached)",
    },
    {
      title: "EU digital markets act compliance costs mount for Meta platforms",
      link: "https://news.google.com/search?q=META+EU+DMA",
      source: "Reuters (cached)",
    },
    {
      title: "Instagram Reels competition with TikTok intensifies globally",
      link: "https://news.google.com/search?q=META+Instagram+TikTok",
      source: "TechCrunch (cached)",
    },
    {
      title: "Meta whistleblower testimony raises privacy concerns ahead of regulation",
      link: "https://news.google.com/search?q=META+privacy+whistleblower",
      source: "AP News (cached)",
    },
  ],
};

const GENERIC_SNAPSHOT: CachedHeadline[] = [
  {
    title: "US stock market faces weekend uncertainty from geopolitical tensions",
    link: "https://news.google.com/search?q=US+stock+weekend",
    source: "MarketWatch (cached)",
  },
  {
    title: "Federal Reserve officials signal caution on future rate moves",
    link: "https://news.google.com/search?q=Fed+rates+weekend",
    source: "Reuters (cached)",
  },
  {
    title: "Global supply chain disruptions continue to affect corporate earnings",
    link: "https://news.google.com/search?q=supply+chain+earnings",
    source: "Bloomberg (cached)",
  },
  {
    title: "Crypto market volatility spillover risk to tokenized stocks increases",
    link: "https://news.google.com/search?q=crypto+rToken+risk",
    source: "CoinDesk (cached)",
  },
  {
    title: "Institutional investors adjust positioning ahead of Monday open",
    link: "https://news.google.com/search?q=institutional+positioning",
    source: "Financial Times (cached)",
  },
];

// KO-specific snapshot since it's a common demo ticker
const KO_SNAPSHOT: CachedHeadline[] = [
  {
    title: "Coca-Cola reports steady quarterly earnings despite inflation pressures",
    link: "https://news.google.com/search?q=KO+earnings",
    source: "CNN Business (cached)",
  },
  {
    title: "Consumer staples sector shows resilience in volatile markets",
    link: "https://news.google.com/search?q=CocaCola+sector",
    source: "Seeking Alpha (cached)",
  },
  {
    title: "KO maintains dividend growth streak as beverage demand holds",
    link: "https://news.google.com/search?q=KO+dividend",
    source: "Dividend.com (cached)",
  },
  {
    title: "Emerging market headwinds challenge Coca-Cola revenue outlook",
    link: "https://news.google.com/search?q=KO+emerging+markets",
    source: "Bloomberg (cached)",
  },
  {
    title: "Health-conscious consumer trends shift beverage industry dynamics",
    link: "https://news.google.com/search?q=CocaCola+trends",
    source: "Forbes (cached)",
  },
];

export function getHeadlineSnapshot(ticker: string): CachedHeadline[] {
  const upper = ticker.toUpperCase();
  const snapshots = upper === "KO" ? KO_SNAPSHOT : (HEADLINE_SNAPSHOTS[upper] || GENERIC_SNAPSHOT);
  return snapshots.map(s => ({ ...s, source: s.source.replace(" (cached)", " (cached snapshot — demo)") }));
}
