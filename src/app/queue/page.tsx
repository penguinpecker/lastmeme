import { TopNav } from "@/components/shared/TopNav";
import { Marquee } from "@/components/shared/Marquee";
import { Hero } from "@/components/shared/Hero";
import { KpiBar } from "@/components/shared/KpiBar";
import { Footer } from "@/components/shared/Footer";
import { QueueRow } from "@/components/queue/QueueRow";
import { loadLiveData } from "@/lib/loadData";

export const revalidate = 60;

export default async function QueuePage() {
  const data = await loadLiveData();
  const sorted = [...data.clusters].sort((a, b) => {
    const rank = (s: typeof a.status) =>
      s === "RESOLVING" ? 0 : s === "FIGHTING" ? 1 : s === "NEW" ? 2 : 3;
    if (rank(a.status) !== rank(b.status)) return rank(a.status) - rank(b.status);
    return a.etaSeconds - b.etaSeconds;
  });

  const fighting = data.clusters.filter(
    (c) => c.status === "FIGHTING" || c.status === "RESOLVING",
  ).length;
  const queued = data.clusters.filter((c) => c.status === "QUEUED").length;
  const forming = data.clusters.filter((c) => c.status === "NEW").length;
  const totalTokens = data.clusters.reduce((s, c) => s + c.tokenCount, 0);
  const nextUp = sorted[0];

  const fmtCountdown = (secs: number) => {
    if (secs <= 0) return "NOW";
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    if (m < 60) return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    const h = Math.floor(m / 60);
    return `${h}H ${(m % 60).toString().padStart(2, "0")}M`;
  };

  return (
    <div className="relative min-h-screen border border-bone bg-ink text-bone scanlines">
      <TopNav />
      <Marquee
        items={[
          "THE QUEUE · UPCOMING FIGHTS · LIVE",
          `${data.clusters.length} CLUSTERS LINED UP`,
          `${totalTokens} TOKENS WAITING TO BRAWL`,
          "RESOLVE ORDER · MATCHMAKING TIMESTAMP",
          `${fighting} FIGHTING NOW`,
          "DATA: GECKOTERMINAL + LOCAL CLUSTERING",
        ]}
      />

      <Hero
        kicker=">> QUEUE // UPCOMING FIGHTS // LIVE ON BSC"
        line1="THE WAITING"
        line2="ROOM"
        sub={
          <>
            {fighting} FIGHTING · {queued} QUEUED · {forming} FORMING · EVERY DERIVATIVE GETS{" "}
            <span className="font-bold text-hazard-yellow">ITS DAY IN COURT.</span>
          </>
        }
      />

      <KpiBar
        cells={[
          {
            label: "FIGHTING NOW",
            value: fighting.toString(),
            delta: "IN RING",
          },
          {
            label: "QUEUED",
            value: queued.toString(),
            delta: "AWAITING SLOT",
          },
          {
            label: "FORMING",
            value: forming.toString(),
            delta: "< THRESHOLD",
          },
          {
            label: "NEXT FIGHT IN",
            value: nextUp ? fmtCountdown(nextUp.etaSeconds) : "—",
            delta: nextUp ? `CLUSTER: ${nextUp.theme}` : "—",
          },
        ]}
      />

      {data.error ? (
        <div className="relative z-10 mx-6 mb-4 border-2 border-hazard-red bg-ink-2 p-4 md:mx-8">
          <p className="m-0 font-mono text-[15px] text-hazard-red">
            &gt; data source error: {data.error}
          </p>
        </div>
      ) : null}

      <div className="relative z-10 px-6 pb-2 md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-b border-hazard-yellow bg-ink px-0 py-3">
          <span className="font-mono text-[17px] tracking-[0.12em] text-hazard-yellow">
            &gt;&gt; QUEUE.LOG · LIVE
          </span>
          <div className="flex gap-2 font-mono text-[13px] tracking-wider text-bone/60">
            <span className="border border-bone/30 px-2 py-0.5">SORT: ETA ▾</span>
            <span className="border border-bone/30 px-2 py-0.5">FILTER: ALL</span>
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-6 mb-6 border border-dashed border-bone/30 md:mx-8">
        <div
          className="grid gap-4 border-b border-dashed border-hazard-yellow/40 bg-ink-2 px-5 py-3 font-mono text-[13px] uppercase tracking-[0.14em] text-hazard-yellow md:px-6"
          style={{ gridTemplateColumns: "40px 80px 1fr 110px 120px 100px 36px" }}
        >
          <span>#</span>
          <span>CLUSTER</span>
          <span>MATCHUP</span>
          <span>SIZE</span>
          <span>SIMILARITY</span>
          <span>ETA</span>
          <span className="text-right">STATUS</span>
        </div>
        {sorted.length === 0 ? (
          <div className="px-5 py-8 text-center font-mono text-[15px] text-bone/60">
            &gt; queue empty · clustering is waiting for enough similar tokens to meet the threshold
          </div>
        ) : (
          sorted.map((c, i) => <QueueRow key={c.id} cluster={c} index={i + 1} />)
        )}
      </div>

      <div className="relative z-10 border-t border-dashed border-bone/20 bg-ink-2 px-6 py-8 md:px-8">
        <p className="font-mono text-[17px] tracking-[0.06em] text-bone/70">
          &gt; how does scheduling work?
        </p>
        <p className="mt-2 max-w-[70ch] font-mono text-[15px] leading-[1.6] tracking-wide text-bone/55">
          Clusters enter the queue when their member count crosses the fight threshold (≥2 similar
          tokens by bigram Jaccard + substring similarity on name/symbol). The top 2 by liquidity
          enter the ring first; the rest wait in the undercard. Resolved fights trigger the next
          matchup in the same cluster until only one token remains. We do not reschedule — if you
          miss your slot, your token has already lost.
        </p>
      </div>

      <Footer extra={["QUEUE · FIFO"]} />
    </div>
  );
}
