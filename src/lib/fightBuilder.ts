import type { Cluster, FightDetail, Token } from "./types";
import type { LiveData } from "./loadData";

function buildStatBars(a: Token, b: Token): FightDetail["statBars"] {
  const total = (x: number, y: number) =>
    x + y === 0 ? [50, 50] : [(x / (x + y)) * 100, (y / (x + y)) * 100];

  const [holdA, holdB] = total(a.holders, b.holders);
  const [volA, volB] = total(a.volume24hUsd ?? 0, b.volume24hUsd ?? 0);
  const [liqA, liqB] = total(a.liquidityUsd ?? 0, b.liquidityUsd ?? 0);
  const [buyA, buyB] = total(a.buyersH1 ?? 0, b.buyersH1 ?? 0);
  const volLiqA = a.volLiqRatio;
  const volLiqB = b.volLiqRatio;
  const [vlA, vlB] = total(volLiqA, volLiqB);

  return [
    {
      label: "HOLDERS",
      valueA: a.holders.toString(),
      valueB: b.holders.toString(),
      fillA: Math.round(holdA),
      fillB: Math.round(holdB),
    },
    {
      label: "LIQ USD",
      valueA: `$${Math.round(a.liquidityUsd ?? 0).toLocaleString()}`,
      valueB: `$${Math.round(b.liquidityUsd ?? 0).toLocaleString()}`,
      fillA: Math.round(liqA),
      fillB: Math.round(liqB),
    },
    {
      label: "VOL 24H",
      valueA: `$${Math.round(a.volume24hUsd ?? 0).toLocaleString()}`,
      valueB: `$${Math.round(b.volume24hUsd ?? 0).toLocaleString()}`,
      fillA: Math.round(volA),
      fillB: Math.round(volB),
    },
    {
      label: "VOL ÷ LIQ",
      valueA: `${volLiqA.toFixed(1)}×`,
      valueB: `${volLiqB.toFixed(1)}×`,
      fillA: Math.round(vlA),
      fillB: Math.round(vlB),
    },
    {
      label: "BUYERS 1H",
      valueA: (a.buyersH1 ?? 0).toString(),
      valueB: (b.buyersH1 ?? 0).toString(),
      fillA: Math.round(buyA),
      fillB: Math.round(buyB),
    },
  ];
}

function scoreToken(t: Token): number {
  // Deterministic 0–100 score using the same weights from the docs page
  const holders = Math.min(1, t.holders / 500);
  const liqUsd = Math.min(1, (t.liquidityUsd ?? 0) / 20_000);
  const volUsd = Math.min(1, (t.volume24hUsd ?? 0) / 50_000);
  const buyers = Math.min(1, (t.buyersH1 ?? 0) / 30);
  const concentration = 1 - Math.min(1, (t.top10Pct || 30) / 100);
  return (
    holders * 0.3 +
    concentration * 0.25 +
    buyers * 0.2 +
    volUsd * 0.15 +
    liqUsd * 0.1
  ) * 100;
}

export function buildFightFromCluster(
  cluster: Cluster,
  tokens: Token[],
): FightDetail | null {
  if (tokens.length < 2) return null;
  // Sort by liquidity descending — first two are fighters
  const sorted = [...tokens].sort((a, b) => (b.liquidityUsd ?? 0) - (a.liquidityUsd ?? 0));
  const [a, b] = sorted;

  // Which launched first → "original", the other is the derivative
  const aFirst = (a.createdAtIso ?? "") < (b.createdAtIso ?? "");
  const original = aFirst ? a : b;
  const derivative = aFirst ? b : a;
  const hoursApart = Math.abs((a.ageHours ?? 0) - (b.ageHours ?? 0));

  const scoreA = scoreToken(a);
  const scoreB = scoreToken(b);
  const totalScore = scoreA + scoreB || 1;

  const poolA = a.liquidityBnb;
  const poolB = b.liquidityBnb;
  const totalPool = poolA + poolB || 1;
  const oddsA = (totalPool / poolA).toFixed(2);
  const oddsB = (totalPool / poolB).toFixed(2);

  const priorArt: string[] = [
    `cluster theme: ${cluster.theme.toLowerCase()} · ${cluster.tokenCount} derivative tokens identified`,
    `${cluster.overlapPct}% avg name/symbol overlap across cluster`,
    `${original.symbol} launched first · ${hoursApart.toFixed(1)}h before ${derivative.symbol}`,
    `${derivative.symbol} identified as derivative (later launch, ${cluster.overlapPct}% overlap)`,
    `verdict: DERIVATIVE_DETECTED_`,
  ];

  return {
    id: cluster.fightId ?? "0047",
    number: Number(cluster.fightId ?? 47),
    clusterId: cluster.id,
    clusterTheme: `${cluster.theme} CLUSTER`,
    tokenA: a,
    tokenB: b,
    poolA,
    poolB,
    oddsA: Number(oddsA),
    oddsB: Number(oddsB),
    secondsLeft: cluster.etaSeconds || 2400,
    projectedScoreA: Number(((scoreA / totalScore) * 100).toFixed(1)),
    projectedScoreB: Number(((scoreB / totalScore) * 100).toFixed(1)),
    overlapPct: cluster.overlapPct,
    priorArt,
    statBars: buildStatBars(a, b),
    undercard: sorted,
  };
}

export function findFightInLive(data: LiveData, id: string): FightDetail | null {
  const cluster = data.clusters.find((c) => c.fightId === id);
  if (!cluster) return null;
  const tokens = data.clusteredTokens.filter((t) => t.clusterId === cluster.id);
  return buildFightFromCluster(cluster, tokens);
}
