import { fetchBscTokenSample } from "./fourmeme";
import { clusterTokens } from "./cluster";
import type { Cluster, Token } from "./types";

/**
 * Top-level data loader. Runs only on the server (uses fetch with `next.revalidate`).
 * Returns fully-clustered tokens + clusters + unclustered in a single call.
 *
 * Pages import { loadLiveData } and use await — Next caches the response for 60s so
 * we're well under the 30 req/min GT rate limit.
 */

export interface LiveData {
  clusters: Cluster[];
  clusteredTokens: Token[];
  unclustered: Token[];
  generatedAt: string;
  sourceCount: number;
  error?: string;
}

export async function loadLiveData(): Promise<LiveData> {
  try {
    const sample = await fetchBscTokenSample();
    if (sample.length === 0) {
      return {
        clusters: [],
        clusteredTokens: [],
        unclustered: [],
        generatedAt: new Date().toISOString(),
        sourceCount: 0,
        error: "No tokens returned from GeckoTerminal. API may be rate-limiting.",
      };
    }
    const { clusters, tokens, unclustered } = clusterTokens(sample);
    return {
      clusters,
      clusteredTokens: tokens,
      unclustered,
      generatedAt: new Date().toISOString(),
      sourceCount: sample.length,
    };
  } catch (e) {
    return {
      clusters: [],
      clusteredTokens: [],
      unclustered: [],
      generatedAt: new Date().toISOString(),
      sourceCount: 0,
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
