import { fetchFourMemeTokens } from "./fourmeme";
import { clusterTokens } from "./cluster";
import type { Cluster, Token } from "./types";

/**
 * Top-level data loader. Runs only on the server.
 *
 * Pipeline:
 *   1. Pull live tokens from Four.Meme's own REST API (no auth)
 *   2. Cluster them by OpenAI text-embedding-3-small (needs OPENAI_API_KEY)
 *      — fallback to bigram Jaccard if key is missing
 *   3. Return clusters + clustered tokens + unclustered ("lonely") tokens
 *
 * Next caches each page render for 60s via `revalidate = 60` on the pages,
 * so we're hitting Four.Meme once/minute and OpenAI once/minute regardless
 * of frontend traffic.
 */

export interface LiveData {
  clusters: Cluster[];
  clusteredTokens: Token[];
  unclustered: Token[];
  generatedAt: string;
  sourceCount: number;
  clusterEngine: "openai-embeddings" | "bigram-jaccard-fallback";
  bnbUsd: number;
  error?: string;
}

export async function loadLiveData(): Promise<LiveData> {
  try {
    const result = await fetchFourMemeTokens(80);
    if (result.tokens.length === 0) {
      return {
        clusters: [],
        clusteredTokens: [],
        unclustered: [],
        generatedAt: new Date().toISOString(),
        sourceCount: 0,
        clusterEngine: "openai-embeddings",
        bnbUsd: result.bnbUsd,
        error: result.error ?? "No tokens returned from Four.Meme API.",
      };
    }

    const clustered = await clusterTokens(result.tokens);

    return {
      clusters: clustered.clusters,
      clusteredTokens: clustered.clusteredTokens,
      unclustered: clustered.unclusteredTokens,
      generatedAt: new Date().toISOString(),
      sourceCount: result.tokens.length,
      clusterEngine: clustered.engine,
      bnbUsd: result.bnbUsd,
      error: result.error ?? clustered.error,
    };
  } catch (e) {
    return {
      clusters: [],
      clusteredTokens: [],
      unclustered: [],
      generatedAt: new Date().toISOString(),
      sourceCount: 0,
      clusterEngine: "openai-embeddings",
      bnbUsd: 600,
      error: e instanceof Error ? e.message : "Unknown error fetching live data",
    };
  }
}

export function findClusterByFightId(
  data: LiveData,
  fightId: string,
): Cluster | undefined {
  return data.clusters.find((c) => c.fightId === fightId);
}

export function findClusterById(data: LiveData, id: string): Cluster | undefined {
  return data.clusters.find((c) => c.id === id);
}

export function tokensForCluster(data: LiveData, clusterId: string): Token[] {
  return data.clusteredTokens.filter((t) => t.clusterId === clusterId);
}
