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
  const clusteredPct = totalTokens > 0
    ? Math.round((data.clusteredTokens.length / totalTokens) * 100)
    : 0;
  const fighting = data.clusters.filter(
    (c) => c.status === "FIGHTING" || c.status === "RESOLVING",
  ).length;
  const totalPool = data.clusters.reduce((s, c) => s + c.poolBnb, 0);
  const biggestCluster = [...data.clusters].sort((a, b) => b.tokenCount - a.tokenCount)[0];

  return (
    <div className="relative min-h-screen border border-bone bg-ink text-bone scanlines">
      <TopNav />
      <Marquee
        items={[
          "INDEXING FOUR.MEME / BSC FIREHOSE · LIVE",
          `${totalTokens} TOKENS IN WINDOW`,
          `${data.clusters.length} ACTIVE CLUSTERS`,
          `${fighting} FIGHTING NOW`,
          `${totalPool.toFixed(2)} BNB IN POOLS`,
          "SOURCE: GECKOTERMINAL · FOUR.MEME PROXY 0x5C95...0762B",
          "CLUSTERING: BIGRAM JACCARD · THRESHOLD 0.55",
          "BUYS SETTLE ON-CHAIN · SELF-CUSTODY",
        ]}
      />

      <Hero
        kicker=">> DISCOVERY // REAL-TIME PLAGIARISM DETECTION // LIVE ON BSC"
        line1="THE TRENCHES"
        line2="OF FOUR.MEME"
        sub={
          <>
            BSC LAUNCHES 1000+ TOKENS/DAY. MOST ARE DERIVATIVE.{" "}
            <span className="font-bold text-hazard-yellow">WE CLUSTER. WE FIGHT. WE SETTLE.</span>
          </>
        }
      />

      <KpiBar
        cells={[
          {
            label: "TOKENS IN WINDOW",
            value: totalTokens.toString(),
            delta: `SOURCE: GECKOTERMINAL`,
          },
          {
            label: "CLUSTERED",
            value: `${clusteredPct}%`,
            delta: `${data.clusteredTokens.length} OF ${totalTokens}`,
          },
          {
            label: "ACTIVE CLUSTERS",
            value: data.clusters.length.toString(),
            delta: `${fighting} FIGHTING NOW`,
          },
          {
            label: "POOL BNB",
            value: `${totalPool.toFixed(2)}`,
            delta: "SUM TOP-2 LIQ EACH CLUSTER",
          },
          {
            label: "BIGGEST CLUSTER",
            value: biggestCluster ? biggestCluster.theme.slice(0, 8) : "—",
            delta: biggestCluster ? `${biggestCluster.tokenCount} DERIVATIVES` : "awaiting",
          },
        ]}
      />

      {data.error ? (
        <div className="relative z-10 mx-6 mb-4 border-2 border-hazard-red bg-ink-2 p-4 md:mx-8">
          <p className="m-0 font-mono text-[15px] text-hazard-red">
            &gt; data source error: {data.error}
          </p>
          <p className="m-0 mt-1 font-mono text-[13px] text-bone/60">
            &gt; GeckoTerminal has a 30 req/min limit on the free tier · we revalidate every 60s
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
          "DATA · GECKOTERMINAL",
          "CLUSTERING · LOCAL",
        ]}
      />
    </div>
  );
}
