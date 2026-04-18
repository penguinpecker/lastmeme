import type { Cluster, Token, TokenStatus } from "./types";

/**
 * Local clustering engine — no OpenAI key required.
 *
 * Strategy:
 *  1. Normalize token name + symbol into a lowercase token bag + character bigrams
 *  2. Score pairwise similarity as (bigram Jaccard) * 0.65 + (substring containment) * 0.35
 *  3. Greedy single-pass: assign each token to the best-matching existing cluster
 *     if similarity >= THRESHOLD, else start a new cluster
 *  4. Cluster name = most frequent non-filler word among member names (fallback: first token's ticker)
 *
 * This is deliberately CPU-cheap. For the real product we'd use OpenAI embeddings
 * + pgvector but for <100 tokens this is visually indistinguishable and runs
 * in milliseconds server-side with zero API cost.
 */

const THRESHOLD = 0.55;
const FILLER = new Set([
  "coin",
  "token",
  "the",
  "bnb",
  "bsc",
  "meme",
  "memes",
  "pepe",
  "maxi",
  "base",
  "v2",
  "v3",
  "v4",
  "pump",
  "ai",
  "eth",
  "usd",
  "inu",
  "doge",
  "cat",
  "lord",
  "god",
  "king",
]);

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

function bigrams(s: string): Set<string> {
  const out = new Set<string>();
  const n = norm(s).replace(/\s/g, "");
  for (let i = 0; i < n.length - 1; i++) out.add(n.slice(i, i + 2));
  return out;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

function substringScore(a: string, b: string): number {
  const na = norm(a);
  const nb = norm(b);
  if (!na || !nb) return 0;
  const short = na.length < nb.length ? na : nb;
  const long = na.length < nb.length ? nb : na;
  if (short.length < 3) return 0;
  if (long.includes(short)) return 1;
  // longest common substring length / short length
  let best = 0;
  for (let i = 0; i < short.length; i++) {
    for (let j = i + 3; j <= short.length; j++) {
      if (long.includes(short.slice(i, j)) && j - i > best) best = j - i;
    }
  }
  return best / short.length;
}

function similarity(a: Token, b: Token): number {
  const aText = `${a.name ?? ""} ${a.symbol.replace("$", "")}`;
  const bText = `${b.name ?? ""} ${b.symbol.replace("$", "")}`;
  const jac = jaccard(bigrams(aText), bigrams(bText));
  const sub = substringScore(aText, bText);
  return jac * 0.65 + sub * 0.35;
}

function clusterAvgSimilarity(token: Token, cluster: Token[]): number {
  if (cluster.length === 0) return 0;
  const sims = cluster.map((m) => similarity(token, m));
  return sims.reduce((a, b) => a + b, 0) / sims.length;
}

function pickTheme(members: Token[]): string {
  const freq = new Map<string, number>();
  for (const m of members) {
    const words = norm(`${m.name ?? ""} ${m.symbol.replace("$", "")}`).split(" ");
    for (const w of words) {
      if (w.length < 3 || FILLER.has(w)) continue;
      freq.set(w, (freq.get(w) ?? 0) + 1);
    }
  }
  if (freq.size === 0) return members[0]?.symbol.replace("$", "") ?? "UNTITLED";
  const sorted = [...freq.entries()].sort((a, b) => b[1] - a[1] || b[0].length - a[0].length);
  return sorted[0][0].toUpperCase();
}

function statusForIdx(idx: number, total: number): TokenStatus {
  if (idx === 0 || idx === 1) return "IN_RING";
  if (idx < 4) return "NEXT_UP";
  if (idx >= total - 2 && total > 4) return "EATEN";
  return "QUEUED";
}

/**
 * @returns { clusters, tokens, unclustered } where `tokens` has updated clusterId + status
 */
export function clusterTokens(input: Token[]): {
  clusters: Cluster[];
  tokens: Token[];
  unclustered: Token[];
} {
  const buckets: Token[][] = [];

  // Greedy assignment
  for (const t of input) {
    let best = -1;
    let bestScore = 0;
    for (let i = 0; i < buckets.length; i++) {
      const score = clusterAvgSimilarity(t, buckets[i]);
      if (score > bestScore) {
        bestScore = score;
        best = i;
      }
    }
    if (best >= 0 && bestScore >= THRESHOLD) {
      buckets[best].push(t);
    } else {
      buckets.push([t]);
    }
  }

  // Only buckets with >= 2 members are "clusters"; singletons are unclustered.
  const clusters: Cluster[] = [];
  const outTokens: Token[] = [];
  const unclustered: Token[] = [];

  buckets.forEach((bucket, bIdx) => {
    if (bucket.length < 2) {
      for (const t of bucket) unclustered.push({ ...t, clusterId: "unclustered", status: "QUEUED" });
      return;
    }

    // Sort bucket members descending by liquidity (strongest = in-ring first)
    const sorted = [...bucket].sort((a, b) => (b.liquidityUsd ?? 0) - (a.liquidityUsd ?? 0));
    const theme = pickTheme(sorted);
    const id = theme.toLowerCase();

    // Average pairwise similarity for the overlap %
    let sumSim = 0;
    let pairs = 0;
    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        sumSim += similarity(sorted[i], sorted[j]);
        pairs++;
      }
    }
    const avgOverlap = pairs > 0 ? sumSim / pairs : THRESHOLD;

    // Pool = sum of top-2 member liquidity in BNB
    const poolBnb = (sorted[0]?.liquidityBnb ?? 0) + (sorted[1]?.liquidityBnb ?? 0);

    // Fight status: if we have 5+ members and top-2 both have >0.1 BNB liquidity → FIGHTING
    const fighting = sorted.length >= 2 && (sorted[0].liquidityBnb ?? 0) > 0.05 && (sorted[1].liquidityBnb ?? 0) > 0.05;
    const status: Cluster["status"] =
      sorted.length < 4 ? "NEW" : fighting ? "FIGHTING" : "QUEUED";

    // Earliest member = "the original" by pool_created_at
    const originalMember = [...sorted].sort((a, b) =>
      (a.createdAtIso ?? "").localeCompare(b.createdAtIso ?? ""),
    )[0];

    // Update each member token with cluster id + ring status
    const members: TokenStatus[] = [];
    sorted.forEach((t, idx) => {
      const status = statusForIdx(idx, sorted.length);
      outTokens.push({ ...t, clusterId: id, status, killedById: status === "EATEN" ? sorted[0]?.id : undefined });
      members.push(status);
    });

    // ETA labels — if FIGHTING, synth a countdown; else queued by bucket order
    const etaSeconds = status === "FIGHTING" ? 2400 + bIdx * 300 : status === "NEW" ? 0 : 900 + bIdx * 1800;
    const etaLabel = status === "NEW"
      ? "FORMING"
      : status === "FIGHTING"
      ? `${Math.floor(etaSeconds / 60)}:${(etaSeconds % 60).toString().padStart(2, "0")} LEFT`
      : etaSeconds < 3600
      ? `STARTS IN ${Math.floor(etaSeconds / 60)}M`
      : `STARTS IN ${Math.floor(etaSeconds / 3600)}H ${Math.floor((etaSeconds % 3600) / 60)}M`;

    const fightId = (47 + bIdx).toString().padStart(4, "0");

    clusters.push({
      id,
      theme,
      status,
      tokenCount: sorted.length,
      overlapPct: Math.round(avgOverlap * 100),
      poolBnb: Number(poolBnb.toFixed(2)),
      fightId: status === "FIGHTING" ? fightId : undefined,
      fighters: [sorted[0]?.symbol ?? "—", sorted[1]?.symbol ?? "—"],
      fighterAddresses: [sorted[0]?.address, sorted[1]?.address],
      members,
      etaLabel,
      etaSeconds,
      originalCreatedAt: originalMember?.createdAtIso,
      originalSymbol: originalMember?.symbol,
      tokenIds: sorted.map((t) => t.id),
    });
  });

  // Order clusters: fighting first, then new, then queued; and by most-members descending
  clusters.sort((a, b) => {
    const rank = (s: Cluster["status"]) =>
      s === "RESOLVING" ? 0 : s === "FIGHTING" ? 1 : s === "NEW" ? 2 : 3;
    if (rank(a.status) !== rank(b.status)) return rank(a.status) - rank(b.status);
    return b.tokenCount - a.tokenCount;
  });

  return { clusters, tokens: outTokens, unclustered };
}
