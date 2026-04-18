import { notFound } from "next/navigation";
import { TopNav } from "@/components/shared/TopNav";
import { Marquee } from "@/components/shared/Marquee";
import { Footer } from "@/components/shared/Footer";
import { Ring } from "@/components/compete/Ring";
import { TaleOfTheTape } from "@/components/compete/TaleOfTheTape";
import { PriorArt } from "@/components/compete/PriorArt";
import { Undercard } from "@/components/compete/Undercard";
import { CountdownStrip } from "@/components/compete/CountdownStrip";
import { BuyTokenButton } from "@/components/compete/BuyTokenButton";
import { loadLiveData } from "@/lib/loadData";
import { findFightInLive, buildFightFromCluster } from "@/lib/fightBuilder";

export const revalidate = 60;
export const dynamicParams = true;

export default async function FightPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await loadLiveData();

  // Try first as fightId, then as cluster id, then fall back to the biggest cluster
  let fight = findFightInLive(data, id);
  if (!fight) {
    const cluster = data.clusters.find((c) => c.id === id.toLowerCase());
    if (cluster) {
      const toks = data.clusteredTokens.filter((t) => t.clusterId === cluster.id);
      fight = buildFightFromCluster(cluster, toks);
    }
  }
  if (!fight && data.clusters[0]) {
    const cluster = data.clusters[0];
    const toks = data.clusteredTokens.filter((t) => t.clusterId === cluster.id);
    fight = buildFightFromCluster(cluster, toks);
  }
  if (!fight) notFound();

  const createdA = fight.tokenA.createdAtIso
    ? new Date(fight.tokenA.createdAtIso)
    : null;
  const createdB = fight.tokenB.createdAtIso
    ? new Date(fight.tokenB.createdAtIso)
    : null;

  const fmtTs = (d: Date | null) =>
    d
      ? d.toISOString().slice(0, 10) + " " + d.toISOString().slice(11, 19) + "Z"
      : "—";

  return (
    <div className="relative min-h-screen border border-bone bg-ink text-bone scanlines">
      <TopNav />
      <Marquee
        items={[
          `${fight.clusterTheme} · ${fight.undercard.length} TOKENS · ${fight.overlapPct}% AVG OVERLAP`,
          `ORIGINAL: ${fight.tokenA.symbol} · ${fmtTs(createdA)}`,
          `DERIVATIVE: ${fight.tokenB.symbol} · ${fmtTs(createdB)}`,
          "BUYS EXECUTE ON-CHAIN VIA FOUR.MEME TOKENMANAGER V2",
          "SELF-CUSTODY · YOU SIGN FROM YOUR WALLET",
        ]}
      />

      <div className="relative z-10 px-6 pt-8 md:px-8 md:pt-10">
        <p className="m-0 mb-2.5 font-mono text-[17px] tracking-[0.25em] text-hazard-yellow/90">
          &gt;&gt; FIGHT #{fight.id} // {fight.clusterTheme} // {new Date().toISOString().slice(0, 10)}
        </p>
        <h1 className="font-impact m-0 text-[54px] leading-[0.88] tracking-[-0.02em] uppercase text-bone md:text-[84px]">
          LAST MEME
        </h1>
        <h1 className="font-impact mt-1 text-[54px] leading-[0.88] tracking-[-0.02em] uppercase text-hazard-yellow chroma-y md:text-[84px]">
          STANDING
        </h1>
        <CountdownStrip
          initialSeconds={fight.secondsLeft}
          pool={fight.poolA + fight.poolB}
          overlap={fight.overlapPct}
        />

        {/* Exact pair-creation timestamps */}
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="border border-dashed border-hazard-lime/40 bg-ink-2 p-3 font-mono text-[13px]">
            <p className="m-0 mb-1 tracking-[0.14em] text-hazard-lime">
              &gt; {fight.tokenA.symbol} · PAIR CREATED
            </p>
            <p className="m-0 text-bone/80 tabular-nums">{fmtTs(createdA)}</p>
            <p className="m-0 mt-0.5 text-bone/55">
              pool: {fight.tokenA.poolAddress?.slice(0, 10)}... ·{" "}
              {fight.tokenA.ageHours?.toFixed(1)}h ago
            </p>
          </div>
          <div className="border border-dashed border-hazard-red/40 bg-ink-2 p-3 font-mono text-[13px]">
            <p className="m-0 mb-1 tracking-[0.14em] text-hazard-red">
              &gt; {fight.tokenB.symbol} · PAIR CREATED
            </p>
            <p className="m-0 text-bone/80 tabular-nums">{fmtTs(createdB)}</p>
            <p className="m-0 mt-0.5 text-bone/55">
              pool: {fight.tokenB.poolAddress?.slice(0, 10)}... ·{" "}
              {fight.tokenB.ageHours?.toFixed(1)}h ago
            </p>
          </div>
        </div>
      </div>

      <Ring fight={fight} />
      <TaleOfTheTape fight={fight} />

      {/* Real Buy CTAs */}
      <div className="relative z-10 px-6 pt-5 pb-7 md:px-8">
        <div className="grid gap-4 md:grid-cols-2">
          <BuyTokenButton
            tokenAddress={fight.tokenA.address ?? ""}
            tokenSymbol={fight.tokenA.symbol}
            color="lime"
            fourMemeUrl={fight.tokenA.fourMemeUrl}
          />
          <BuyTokenButton
            tokenAddress={fight.tokenB.address ?? ""}
            tokenSymbol={fight.tokenB.symbol}
            color="red"
            fourMemeUrl={fight.tokenB.fourMemeUrl}
          />
        </div>
        <p className="mt-3 font-mono text-[13px] tracking-wide text-bone/50">
          &gt; buys route through Four.Meme TokenManager V2 (0x5c95...0762b) on BSC mainnet ·
          self-custody · we never touch your funds
        </p>
      </div>

      <PriorArt fight={fight} />
      <Undercard tokens={fight.undercard} clusterTheme={fight.clusterTheme} />

      <Footer
        extra={[
          `CLUSTER · ${fight.clusterId.toUpperCase()}`,
        ]}
      />
    </div>
  );
}
