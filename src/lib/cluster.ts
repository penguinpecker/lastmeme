import type { Token, Cluster, TokenStatus } from "./types";

/**
 * OpenAI embeddings-based clusterer.
 *
 * SERVER-SIDE ONLY. Reads OPENAI_API_KEY from process.env.
 *
 * Strategy:
 *   1. Build a short text prompt per token (name + symbol + tag)
 *   2. Batch-embed via text-embedding-3-small (cheap, fast, dim=1536)
 *   3. Single-linkage agglomerative clustering on cosine similarity
 *   4. Rank clusters by leader's market cap
 *   5. Drop any cluster with < 2 members (surfaced separately as "lonely")
 *
 * Fallback: if OPENAI_API_KEY is unset or the API is unreachable, we fall back to
 * a simple bigram-Jaccard clusterer so the app still renders something useful.
 */

const SIMILARITY_THRESHOLD = 0.62; // tuned for text-embedding-3-small on short meme names
const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_DIM = 1536;
const MAX_BATCH = 96;

function tokenPromptText(t: Token): string {
  // Compress token identity into a stable prompt. Short names cluster poorly
  // so we also inject the tag (usually "Meme") and any notable tokens in the name.
  const parts = [
    t.name?.trim() || "",
    t.symbol.replace(/^\$/, ""),
    t.slug,
  ].filter(Boolean);
  return parts.join(" ").slice(0, 200);
}

async function fetchEmbeddings(texts: string[]): Promise<number[][] | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const results: number[][] = [];
  for (let i = 0; i < texts.length; i += MAX_BATCH) {
    const batch = texts.slice(i, i + MAX_BATCH);
    try {
      const res = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: EMBEDDING_MODEL,
          input: batch,
          dimensions: EMBEDDING_DIM,
        }),
      });
      if (!res.ok) {
        console.error("[cluster] OpenAI embeddings failed:", res.status, await res.text());
        return null;
      }
      const json = (await res.json()) as {
        data: { embedding: number[]; index: number }[];
      };
      const sorted = [...json.data].sort((a, b) => a.index - b.index);
      for (const item of sorted) results.push(item.embedding);
    } catch (e) {
      console.error("[cluster] OpenAI embeddings exception:", e);
      return null;
    }
  }
  return results;
}

function cosineSim(a: number[], b: number[]): number {
  let dot = 0,
    na = 0,
    nb = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/** Single-linkage agglomerative clustering on precomputed embeddings */
function clusterByEmbedding(
  embeddings: number[][],
  threshold: number,
): number[][] {
  const n = embeddings.length;
  const parent = Array.from({ length: n }, (_, i) => i);
  const find = (x: number): number => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  };
  const union = (a: number, b: number) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent[ra] = rb;
  };

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const sim = cosineSim(embeddings[i], embeddings[j]);
      if (sim >= threshold) union(i, j);
    }
  }

  const groups = new Map<number, number[]>();
  for (let i = 0; i < n; i++) {
    const r = find(i);
    if (!groups.has(r)) groups.set(r, []);
    groups.get(r)!.push(i);
  }
  return [...groups.values()];
}

/** Fallback clusterer — bigram Jaccard similarity on symbol+name. Used when OPENAI_API_KEY is absent. */
function bigramJaccardFallback(tokens: Token[]): number[][] {
  const bigramSet = (s: string): Set<string> => {
    const norm = s.toLowerCase().replace(/[^a-z0-9]/g, "");
    const out = new Set<string>();
    for (let i = 0; i < norm.length - 1; i++) out.add(norm.slice(i, i + 2));
    return out;
  };
  const jaccard = (a: Set<string>, b: Set<string>) => {
    if (a.size === 0 && b.size === 0) return 0;
    let inter = 0;
    for (const x of a) if (b.has(x)) inter++;
    return inter / (a.size + b.size - inter);
  };
  const sigs = tokens.map((t) => bigramSet((t.name ?? "") + " " + t.symbol));
  const n = tokens.length;
  const parent = Array.from({ length: n }, (_, i) => i);
  const find = (x: number): number => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  };
  const union = (a: number, b: number) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent[ra] = rb;
  };
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (jaccard(sigs[i], sigs[j]) >= 0.5) union(i, j);
    }
  }
  const groups = new Map<number, number[]>();
  for (let i = 0; i < n; i++) {
    const r = find(i);
    if (!groups.has(r)) groups.set(r, []);
    groups.get(r)!.push(i);
  }
  return [...groups.values()];
}

function deriveTheme(members: Token[]): string {
  // Pick the most common alphabetic word across the cluster's names
  const wordCounts = new Map<string, number>();
  for (const m of members) {
    const words = (m.name ?? m.symbol)
      .toLowerCase()
      .replace(/[^a-z\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 3);
    for (const w of words) wordCounts.set(w, (wordCounts.get(w) ?? 0) + 1);
  }
  let best = "";
  let bestCount = 0;
  for (const [w, c] of wordCounts) {
    if (c > bestCount) {
      bestCount = c;
      best = w;
    }
  }
  return (best || members[0].symbol.replace(/^\$/, "")).toUpperCase();
}

function avgPairSim(members: number[], embeddings: number[][]): number {
  if (members.length < 2) return 0;
  let total = 0;
  let count = 0;
  for (let i = 0; i < members.length; i++) {
    for (let j = i + 1; j < members.length; j++) {
      total += cosineSim(embeddings[members[i]], embeddings[members[j]]);
      count++;
    }
  }
  return count > 0 ? total / count : 0;
}

function statusFromAge(ageHours: number): TokenStatus {
  if (ageHours < 6) return "NEXT_UP";
  if (ageHours < 48) return "IN_RING";
  return "QUEUED";
}

function clusterStatus(members: Token[]): "FIGHTING" | "RESOLVING" | "QUEUED" | "NEW" {
  if (members.length >= 5) return "FIGHTING";
  if (members.length >= 3) return "QUEUED";
  return "NEW";
}

export interface ClusterResult {
  clusters: Cluster[];
  clusteredTokens: Token[];
  unclusteredTokens: Token[];
  engine: "openai-embeddings" | "bigram-jaccard-fallback";
  error?: string;
}

/**
 * Main clustering entry point. Takes normalized Four.Meme tokens, returns clusters
 * ordered by leader market cap. Tokens in clusters of size 1 are surfaced as
 * unclustered (the "Lonely" section).
 */
export async function clusterTokens(tokens: Token[]): Promise<ClusterResult> {
  if (tokens.length === 0) {
    return {
      clusters: [],
      clusteredTokens: [],
      unclusteredTokens: [],
      engine: "openai-embeddings",
    };
  }

  const prompts = tokens.map(tokenPromptText);
  let embeddings = await fetchEmbeddings(prompts);
  let engine: ClusterResult["engine"] = "openai-embeddings";
  let groups: number[][];
  let fallbackError: string | undefined;

  if (!embeddings) {
    engine = "bigram-jaccard-fallback";
    fallbackError = process.env.OPENAI_API_KEY
      ? "OpenAI embeddings unreachable, falling back to bigram similarity"
      : "OPENAI_API_KEY not set, using bigram similarity fallback";
    groups = bigramJaccardFallback(tokens);
    // Fake embeddings for avgPairSim — use 1.0 for same group, 0 otherwise
    embeddings = tokens.map((_, i) => {
      const v = new Array(EMBEDDING_DIM).fill(0);
      v[i % EMBEDDING_DIM] = 1;
      return v;
    });
  } else {
    groups = clusterByEmbedding(embeddings, SIMILARITY_THRESHOLD);
  }

  const clusters: Cluster[] = [];
  const clusteredTokens: Token[] = [];
  const unclusteredTokens: Token[] = [];

  for (const memberIdxs of groups) {
    if (memberIdxs.length < 2) {
      unclusteredTokens.push({ ...tokens[memberIdxs[0]], clusterId: "" });
      continue;
    }

    const members = memberIdxs.map((i) => tokens[i]);
    // Sort by market cap descending — first is the leader
    const sorted = [...members].sort((a, b) => (b.marketCapUsd ?? 0) - (a.marketCapUsd ?? 0));
    const leader = sorted[0];
    const theme = deriveTheme(sorted);
    const clusterId = `${theme.toLowerCase()}-${leader.address?.slice(2, 8) ?? "x"}`;

    const overlap =
      engine === "openai-embeddings" ? avgPairSim(memberIdxs, embeddings) : 0.65;

    const memberStatuses: TokenStatus[] = sorted.map((m, i) => {
      if (i === 0) return "IN_RING";
      if (i === 1) return "NEXT_UP";
      return statusFromAge(m.ageHours);
    });

    for (let i = 0; i < sorted.length; i++) {
      clusteredTokens.push({
        ...sorted[i],
        clusterId,
        status: memberStatuses[i],
      });
    }

    const poolBnb = sorted.reduce((s, m) => s + m.liquidityBnb, 0);
    const fighters: [string, string] = [
      sorted[0].symbol,
      sorted[1]?.symbol ?? sorted[0].symbol,
    ];
    const fighterAddresses: [string | undefined, string | undefined] = [
      sorted[0].address,
      sorted[1]?.address,
    ];

    clusters.push({
      id: clusterId,
      theme,
      status: clusterStatus(sorted),
      tokenCount: sorted.length,
      overlapPct: overlap * 100,
      poolBnb,
      fightId: `${(clusters.length + 47).toString().padStart(4, "0")}`,
      fighters,
      fighterAddresses,
      members: memberStatuses,
      etaLabel: "LIVE",
      etaSeconds: 0,
      originalCreatedAt: sorted[0].createdAtIso,
      originalSymbol: sorted[0].symbol,
      tokenIds: sorted.map((m) => m.id),
      leaderAddress: leader.address,
      leaderCreator: leader.creatorAddress,
      leaderSymbol: leader.symbol,
    });
  }

  // Order clusters by leader market cap descending
  clusters.sort((a, b) => {
    const capA =
      clusteredTokens.find((t) => t.address === a.leaderAddress)?.marketCapUsd ?? 0;
    const capB =
      clusteredTokens.find((t) => t.address === b.leaderAddress)?.marketCapUsd ?? 0;
    return capB - capA;
  });

  return {
    clusters,
    clusteredTokens,
    unclusteredTokens,
    engine,
    error: fallbackError,
  };
}
