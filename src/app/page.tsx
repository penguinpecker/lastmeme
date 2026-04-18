import { TopNav } from "@/components/shared/TopNav";
import { Marquee } from "@/components/shared/Marquee";
import { Hero } from "@/components/shared/Hero";
import { KpiBar } from "@/components/shared/KpiBar";
import { Footer } from "@/components/shared/Footer";
import { FirehoseFeed } from "@/components/discovery/FirehoseFeed";
import { ClusterGrid } from "@/components/discovery/ClusterGrid";
import { ClusterGraph } from "@/components/discovery/ClusterGraph";
import { UnclusteredGrid } from "@/components/discovery/UnclusteredGrid";
import { loadLiveData } from "@/lib/loadData";

export const revalidate = 60;

export default async function DiscoveryPage() {
  const data = await loadLiveData();
  const totalTokens = data.clusteredTokens.length + data.unclustered.length;
  const clusteredPct =
    totalTokens > 0 ? Math.round((data.clusteredTokens.length / totalTokens) * 100) : 0;
  const bigClusters = data.clusters.filter((c) => c.tokenCount >= 3).length;
  const totalPool = data.clusters.reduce((s, c) => s + c.poolBnb, 0);
  const biggestCluster = [...data.clusters].sort((a, b) => b.tokenCount - a.tokenCount)[0];

  const engineLabel =
    data.clusterEngine === "openai-embeddings"
      ? "OPENAI TEXT-EMBEDDING-3-SMALL"
      : "BIGRAM JACCARD · FALLBACK";

  return (
    <div className="relative min-h-screen border border-bone bg-ink text-bone scanlines">
      <TopNav />
      <Marquee
        items={[
          "FOUR.MEME / BSC FIREHOSE · LIVE",
          `${totalTokens} TOKENS IN WINDOW`,
          `${data.clusters.length} SIMILAR-TOKEN CLUSTERS`,
          `${bigClusters} WITH 3+ MEMBERS`,
          `${totalPool.toFixed(2)} BNB LIQUIDITY SUM`,
          "SOURCE: FOUR.MEME REST API",
          `CLUSTERING: ${engineLabel}`,
          "BUYS + SELLS SETTLE ON-CHAIN · SELF-CUSTODY",
        ]}
      />

      <Hero
        kicker=">> DISCOVERY // SIMILAR-TOKEN CLUSTERING // LIVE ON BSC"
        line1="THE TRENCHES"
        line2="OF FOUR.MEME"
        sub={
          <>
            BSC LAUNCHES 1000+ TOKENS/DAY. MOST ARE CARBON COPIES.{" "}
            <span className="font-bold text-hazard-yellow">
              WE CLUSTER THEM. WE FLAG THE LEADER. YOU TRADE THE WINNER.
            </span>
          </>
        }
      />

      <KpiBar
        cells={[
          {
            label: "TOKENS IN WINDOW",
            value: totalTokens.toString(),
            delta: "FROM FOUR.MEME API",
          },
          {
            label: "CLUSTERED",
            value: `${clusteredPct}%`,
            delta: `${data.clusteredTokens.length} OF ${totalTokens}`,
          },
          {
            label: "CLUSTERS",
            value: data.clusters.length.toString(),
            delta: `${bigClusters} WITH 3+ MEMBERS`,
          },
          {
            label: "LIQ BNB",
            value: `${totalPool.toFixed(1)}`,
            delta: "SUM ACROSS ALL CLUSTERS",
          },
          {
            label: "BIGGEST CLUSTER",
            value: biggestCluster ? biggestCluster.theme.slice(0, 8) : "—",
            delta: biggestCluster
              ? `${biggestCluster.tokenCount} SIMILAR TOKENS`
              : "awaiting",
          },
        ]}
      />

      {data.error ? (
        <div className="relative z-10 mx-6 mb-4 border-2 border-hazard-red bg-ink-2 p-4 md:mx-8">
          <p className="m-0 font-mono text-[15px] text-hazard-red">
            &gt; data source notice: {data.error}
          </p>
          <p className="m-0 mt-1 font-mono text-[13px] text-bone/60">
            &gt; we revalidate every 60s · if you see this often, check Four.Meme API status
          </p>
        </div>
      ) : null}

      <ClusterGraph clusters={data.clusters} />

      <div className="relative z-10 grid border-t border-bone md:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        <FirehoseFeed
          clusters={data.clusters}
          clusteredTokens={data.clusteredTokens}
          unclustered={data.unclustered}
          generatedAt={data.generatedAt}
        />
        <ClusterGrid clusters={data.clusters} />
      </div>

      <UnclusteredGrid tokens={data.unclustered} />

      <Footer
        extra={[
          "DATA · FOUR.MEME API",
          `CLUSTERING · ${data.clusterEngine === "openai-embeddings" ? "OPENAI EMBEDDINGS" : "JACCARD FALLBACK"}`,
        ]}
      />
    </div>
  );
}
