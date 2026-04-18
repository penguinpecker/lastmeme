import type { FightDetail } from "@/lib/types";

export function TaleOfTheTape({ fight }: { fight: FightDetail }) {
  return (
    <div className="relative z-10">
      <div className="flex items-center justify-between border-t-2 border-b border-hazard-lime bg-ink px-5 py-3.5 font-mono text-[19px] text-hazard-lime md:px-7">
        <span>&gt;&gt; TALE_OF_THE_TAPE.LOG</span>
        <span className="animate-blink">█</span>
        <span>LIVE · 30s REFRESH</span>
      </div>

      <div className="px-6 pt-5 pb-2.5 md:px-8">
        {fight.statBars.map((row, idx) => (
          <div
            key={row.label}
            className={`grid items-center gap-4 py-2.5 tabular-nums ${
              idx !== fight.statBars.length - 1 ? "border-b border-dashed border-bone/20" : ""
            }`}
            style={{ gridTemplateColumns: "80px 1fr 140px 1fr 80px" }}
          >
            <span className="text-right font-bold text-hazard-lime" style={{ fontFamily: "var(--font-jetbrains)", fontSize: row.valueA.length > 3 ? 18 : 22 }}>
              {row.valueA}
            </span>
            <div className="h-[14px] border border-bone/20 bg-bone/[0.07]">
              <div
                className="ml-auto h-full bg-hazard-lime"
                style={{ width: `${row.fillA}%`, boxShadow: "inset 0 0 0 1px #0a0a08" }}
              />
            </div>
            <span className="text-center font-mono text-[15px] tracking-widest text-bone/60">
              {row.label}
            </span>
            <div className="h-[14px] border border-bone/20 bg-bone/[0.07]">
              <div
                className="h-full bg-hazard-red"
                style={{ width: `${row.fillB}%`, boxShadow: "inset 0 0 0 1px #0a0a08" }}
              />
            </div>
            <span className="font-bold text-hazard-red" style={{ fontFamily: "var(--font-jetbrains)", fontSize: row.valueB.length > 3 ? 18 : 22 }}>
              {row.valueB}
            </span>
          </div>
        ))}

        <div className="mt-5 flex items-baseline justify-between border border-dashed border-hazard-yellow bg-ink px-5 py-3.5">
          <span className="font-mono text-[18px] tracking-[0.1em] text-hazard-yellow">
            &gt; PROJECTED_SCORE
          </span>
          <span style={{ fontFamily: "var(--font-jetbrains)", fontSize: 26, fontWeight: 700 }}>
            <span className="text-hazard-lime">{fight.projectedScoreA}</span>{" "}
            <span className="text-bone/45">//</span>{" "}
            <span className="text-hazard-red">{fight.projectedScoreB}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
