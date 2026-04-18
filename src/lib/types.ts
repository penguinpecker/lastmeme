export type ClusterStatus = "FIGHTING" | "RESOLVING" | "QUEUED" | "NEW";
export type TokenStatus = "IN_RING" | "NEXT_UP" | "QUEUED" | "EATEN";

export interface Token {
  id: string;
  symbol: string;
  name?: string;
  address?: string;
  poolAddress?: string;
  slug: string;
  createdAt?: string;
  createdAtIso?: string;
  ageHours: number;
  holders: number;
  top10Pct: number;
  volLiqRatio: number;
  liquidityBnb: number;
  liquidityUsd?: number;
  volume24hBnb: number;
  volume24hUsd?: number;
  bondingPct: number;
  priceUsd?: number;
  priceChange24h?: number;
  marketCapUsd?: number;
  buyersH1?: number;
  sellersH1?: number;
  status: TokenStatus;
  spark: number[];
  clusterId: string;
  embedding?: [number, number];
  killedById?: string;
  graduatedAt?: number | null;
  fourMemeUrl?: string;
}

export interface Cluster {
  id: string;
  theme: string;
  status: ClusterStatus;
  tokenCount: number;
  overlapPct: number;
  poolBnb: number;
  fightId?: string;
  fighters: [string, string];
  fighterAddresses?: [string | undefined, string | undefined];
  members: TokenStatus[];
  etaLabel: string;
  etaSeconds: number;
  originalCreatedAt?: string;
  originalSymbol?: string;
  tokenIds?: string[];
}

export interface Verdict {
  id: string;
  fightId: string;
  clusterTheme: string;
  winner: string;
  losers: string[];
  resolvedAt: string;
  feeRedirectBnb: number;
  overlapPct: number;
  daysLeft: number;
  scoreA: number;
  scoreB: number;
  ipfsHash: string;
}

export interface FirehoseEvent {
  id: string;
  time: string;
  type: "NEW" | "MATCH" | "UNCLUSTERED" | "CLUSTER" | "VERDICT";
  primary: string;
  secondary?: string;
  accent?: string;
}

export interface UnclusteredToken {
  symbol: string;
  ageLabel: string;
}

export interface FightDetail {
  id: string;
  number: number;
  clusterId: string;
  clusterTheme: string;
  tokenA: Token;
  tokenB: Token;
  poolA: number;
  poolB: number;
  oddsA: number;
  oddsB: number;
  secondsLeft: number;
  projectedScoreA: number;
  projectedScoreB: number;
  overlapPct: number;
  priorArt: string[];
  statBars: {
    label: string;
    valueA: string;
    valueB: string;
    fillA: number;
    fillB: number;
  }[];
  undercard: Token[];
}
