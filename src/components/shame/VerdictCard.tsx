import type { Verdict } from "@/lib/types";

export function VerdictCard({ v }: { v: Verdict }) {
  return (
    <div className="relative border-2 border-ink bg-ink-2 brut-shadow-light transition-transform hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[4px_4px_0_#f4f0e8]">
      <div className="flex items-center justify-between border-b border-dashed border-bone/25 bg-ink px-4 py-2.5 font-mono text-[14px] tracking-[0.12em] text-hazard-yellow">
        <span>FIGHT #{v.fightId}</span>
        <span className="text-bone/60">{v.clusterTheme}</span>
        <span className="text-hazard-red">RESOLVED · {v.resolvedAt}</span>
      </div>

      <div className="p-5">
        <div className="mb-3 flex items-start justify-between gap-4">
          <div>
            <p className="m-0 font-mono text-[13px] tracking-[0.2em] text-hazard-lime">
              WINNER
            </p>
            <p className="font-impact m-0 mt-1 text-[34px] leading-none tracking-[-0.02em] text-hazard-yellow chroma-y-sm">
              {v.winner}
            </p>
          </div>
          <div className="text-right">
            <p className="m-0 font-mono text-[13px] tracking-[0.2em] text-bone/55">ABSORBED</p>
            <p className="font-impact m-0 mt-1 text-[26px] leading-none tracking-[-0.01em] text-hazard-yellow">
              {v.feeRedirectBnb.toFixed(2)} BNB
            </p>
          </div>
        </div>

        <div className="my-4 border-y border-dashed border-bone/20 py-3">
          <p className="mb-2 font-mono text-[13px] tracking-[0.18em] text-bone/55">
            EATEN · STRIKETHROUGH
          </p>
          <div className="flex flex-wrap gap-2">
            {v.losers.map((l) => (
              <span
                key={l}
                className="font-impact border border-hazard-red bg-hazard-red/10 px-2.5 py-1 text-[16px] tracking-[-0.01em] text-hazard-red line-through decoration-2"
              >
                {l}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 font-mono text-[14px]">
          <div>
            <p className="m-0 text-[12px] tracking-[0.12em] text-bone/55">SCORE</p>
            <p className="m-0 mt-0.5 tabular-nums">
              <span className="text-hazard-lime">{v.scoreA}</span>{" "}
              <span className="text-bone/45">//</span>{" "}
              <span className="text-hazard-red">{v.scoreB}</span>
            </p>
          </div>
          <div>
            <p className="m-0 text-[12px] tracking-[0.12em] text-bone/55">OVERLAP</p>
            <p className="m-0 mt-0.5 tabular-nums">{v.overlapPct}%</p>
          </div>
          <div>
            <p className="m-0 text-[12px] tracking-[0.12em] text-bone/55">FEE DRIP</p>
            <p className="m-0 mt-0.5 text-hazard-yellow tabular-nums">
              {v.daysLeft}d LEFT
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-dashed border-bone/15 pt-3 font-mono text-[13px] tracking-wide text-bone/50">
          <span>IPFS: {v.ipfsHash}</span>
          <span className="text-hazard-yellow">→</span>
        </div>
      </div>
    </div>
  );
}
