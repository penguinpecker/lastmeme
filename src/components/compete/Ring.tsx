import { FighterCard } from "./FighterCard";
import { Collision } from "./Collision";
import type { FightDetail } from "@/lib/types";

export function Ring({ fight }: { fight: FightDetail }) {
  return (
    <div className="relative overflow-hidden border-t border-b border-dashed border-bone/15 px-5 pt-10 pb-8 md:px-7 md:pt-12 md:pb-10">
      <div className="absolute inset-0 z-0 hatch-bg" />
      <div className="absolute inset-0 z-0 radial-spot" />
      <div className="pointer-events-none absolute inset-0 z-[1] animate-flash bg-hazard-yellow mix-blend-screen" />

      <div className="relative z-[2] animate-shake">
        <div className="grid items-center gap-0" style={{ gridTemplateColumns: "1fr 150px 1fr" }}>
          <FighterCard
            token={fight.tokenA}
            corner="R"
            hp={74}
            pot={fight.poolA}
            odds={fight.oddsA}
          />
          <Collision />
          <FighterCard
            token={fight.tokenB}
            corner="B"
            hp={58}
            pot={fight.poolB}
            odds={fight.oddsB}
          />
        </div>
      </div>

      <div className="relative z-[5] mt-6 flex justify-center">
        <p className="font-impact chroma-y m-0 text-[34px] tracking-[-0.01em] text-hazard-yellow">
          ROUND 1 · FIGHT
        </p>
      </div>
    </div>
  );
}
