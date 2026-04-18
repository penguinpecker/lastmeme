import type { FightDetail } from "@/lib/types";

export function PriorArt({ fight }: { fight: FightDetail }) {
  return (
    <div className="relative z-10 px-6 pt-6 pb-4 md:px-8">
      <div className="mb-3 flex items-center justify-between border-b border-dashed border-hazard-yellow/45 pb-1.5">
        <span className="font-mono text-[20px] tracking-[0.18em] text-hazard-yellow">
          &gt; PRIOR_ART_CHECK.LOG
        </span>
        <span className="font-mono text-[20px] tracking-[0.18em] text-hazard-yellow">
          {fight.overlapPct}% OVERLAP
        </span>
      </div>
      <div className="border-l-4 border-hazard-yellow bg-ink-2 px-5 py-4 font-mono text-[20px] leading-[1.55] text-bone">
        {fight.priorArt.map((line, i) => {
          const isVerdict = line.toLowerCase().startsWith("verdict:");
          return (
            <div key={i}>
              <span className="text-hazard-yellow">&gt;</span>{" "}
              {isVerdict ? (
                <>
                  verdict:{" "}
                  <span className="text-hazard-lime">
                    {line.split(": ")[1]}
                  </span>
                  <span className="animate-blink">█</span>
                </>
              ) : (
                <span
                  dangerouslySetInnerHTML={{
                    __html: line
                      .replace(/\$PEPE3/g, '<span style="color:#e33e2e">$PEPE3</span>')
                      .replace(/\$PEPE2/g, '<span style="color:#d4e820">$PEPE2</span>'),
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
