import { TopNav } from "@/components/shared/TopNav";
import { Marquee } from "@/components/shared/Marquee";
import { Hero } from "@/components/shared/Hero";
import { KpiBar } from "@/components/shared/KpiBar";
import { Footer } from "@/components/shared/Footer";
import { VerdictCard } from "@/components/shame/VerdictCard";
import { VERDICTS, CONSTANTS } from "@/lib/mock";

export default function ShamePage() {
  const totalEaten = VERDICTS.reduce((sum, v) => sum + v.losers.length, 0);
  const totalRedirected = VERDICTS.reduce((sum, v) => sum + v.feeRedirectBnb, 0);
  const biggest = [...VERDICTS].sort((a, b) => b.feeRedirectBnb - a.feeRedirectBnb)[0];

  return (
    <div className="relative min-h-screen border border-bone bg-ink text-bone scanlines">
      <TopNav />
      <Marquee
        items={[
          "THE HALL OF SHAME",
          `${CONSTANTS.fightsResolved.toLocaleString()} FIGHTS RESOLVED ALL-TIME`,
          `${totalEaten} TOKENS EATEN BELOW`,
          "NO REFUNDS · NO MERCY · RECEIPTS ON IPFS",
          `${CONSTANTS.feesRedirectedTotal} BNB REDIRECTED ALL-TIME`,
        ]}
      />

      <Hero
        kicker=">> HALL OF SHAME // THE RECEIPTS // APR 18 2026"
        line1="DERIVATIVES"
        line2="GO TO DIE HERE"
        sub={
          <>
            EVERY LOSING TOKEN. EVERY REDIRECTED FEE. EVERY IPFS HASH. SEARCHABLE,{" "}
            <span className="font-bold text-hazard-yellow">PERMANENT</span>, ON-CHAIN.
          </>
        }
      />

      <KpiBar
        cells={[
          {
            label: "FIGHTS LOGGED",
            value: VERDICTS.length.toString(),
            delta: "RECENT WINDOW",
          },
          {
            label: "TOKENS EATEN",
            value: totalEaten.toString(),
            delta: `${(totalEaten / VERDICTS.length).toFixed(1)} PER FIGHT AVG`,
          },
          {
            label: "FEES REDIRECTED",
            value: `${totalRedirected.toFixed(2)} BNB`,
            delta: "LAST 48H",
          },
          {
            label: "BIGGEST DRIP",
            value: `${biggest.feeRedirectBnb.toFixed(2)} BNB`,
            delta: `${biggest.winner} → ${biggest.losers.join(" ")}`,
          },
        ]}
      />

      <div className="relative z-10 mx-6 mt-4 border-2 border-hazard-amber bg-ink-2 p-4 md:mx-8">
        <p className="m-0 font-mono text-[15px] tracking-wider text-hazard-amber">
          &gt; SIMULATED VERDICTS · SETTLEMENT CONTRACT NOT YET DEPLOYED
        </p>
        <p className="m-0 mt-1 font-mono text-[13px] text-bone/65">
          &gt; discovery, clustering, and token data below are live from GeckoTerminal · verdict
          resolution, fee redirect, and IPFS pinning activate when the on-chain resolver ships ·
          see /docs for the mechanism
        </p>
      </div>

      <div className="relative z-10 px-6 pb-3 md:px-8">
        <div className="flex items-center justify-between border-t border-b border-hazard-red bg-ink px-0 py-3.5">
          <span className="font-mono text-[17px] tracking-[0.12em] text-hazard-red">
            &gt;&gt; VERDICTS.LOG · SORTED BY RESOLUTION TIME
          </span>
          <span className="font-mono text-[14px] tracking-wider text-bone/60">
            AUTO-REFRESH: DISABLED
          </span>
        </div>
      </div>

      <div className="relative z-10 px-6 pb-10 md:px-8">
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}
        >
          {VERDICTS.map((v) => (
            <VerdictCard key={v.id} v={v} />
          ))}
        </div>
      </div>

      <div className="relative z-10 border-t border-dashed border-bone/20 bg-ink-2 px-6 py-8 md:px-8">
        <p className="font-mono text-[17px] tracking-[0.06em] text-bone/70">
          &gt; graveyard runs deeper · {CONSTANTS.fightsResolved.toLocaleString()} fights on-chain ·{" "}
          <span className="text-hazard-yellow">pagination coming · for now, past 48h shown</span>
        </p>
        <p className="mt-2 font-mono text-[14px] tracking-wide text-bone/45">
          every row above is a receipt · every receipt is a smart-contract call ·{" "}
          every smart-contract call costs someone their creator fee stream for seven days
        </p>
      </div>

      <Footer extra={["HALL OF SHAME · MONOTONIC"]} />
    </div>
  );
}
