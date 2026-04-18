import type { FightDetail } from "@/lib/types";

export function PriorArt({ fight }: { fight: FightDetail }) {
  return (
    <div className="relative z-10 px-6 pt-6 pb-4 md:px-8">
      <div className="mb-3 flex items-center justify-between border-b border-dashed border-hazard-yellow/45 pb-1.5">
        <span className="font-mono text-[20px] tracking-[0.18em] text-hazard-yellow">
          &gt; CLUSTER_ANALYSIS.LOG
        </span>
        <span className="font-mono text-[20px] tracking-[0.18em] text-hazard-yellow">
          {fight.overlapPct.toFixed(0)}% OVERLAP
        </span>
      </div>
      <div className="border-l-4 border-hazard-yellow bg-ink-2 px-5 py-4 font-mono text-[20px] leading-[1.55] text-bone">
        {fight.priorArt.map((line, i) => (
          <div key={i}>
            <span className="text-hazard-yellow">&gt;</span> <span>{line}</span>
            {i === fight.priorArt.length - 1 ? (
              <span className="animate-blink text-hazard-lime">█</span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
