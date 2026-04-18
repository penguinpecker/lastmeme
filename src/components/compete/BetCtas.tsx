"use client";

import { useState } from "react";
import type { FightDetail } from "@/lib/types";
import { cn } from "@/lib/utils";

export function BetCtas({ fight }: { fight: FightDetail }) {
  const [active, setActive] = useState<"A" | "B" | null>(null);
  const [amount, setAmount] = useState("0.1");

  return (
    <div className="relative z-10 px-6 pt-5 pb-7 md:px-8">
      <div className="grid gap-4 md:grid-cols-2">
        <button
          onClick={() => setActive(active === "A" ? null : "A")}
          className={cn(
            "btn-brut bg-hazard-lime px-5 py-6 text-[30px] leading-none tracking-[-0.01em] text-ink",
            active === "A" && "translate-x-1 translate-y-1 shadow-[5px_5px_0_#0a0a08]",
          )}
        >
          <span className="mb-1 block font-mono text-[15px] font-normal tracking-[0.2em] opacity-75">
            &gt; BACK_RED_CORNER
          </span>
          {fight.tokenA.symbol}{" "}
          <span className="float-right font-impact">→</span>
        </button>
        <button
          onClick={() => setActive(active === "B" ? null : "B")}
          className={cn(
            "btn-brut bg-hazard-red px-5 py-6 text-[30px] leading-none tracking-[-0.01em] text-bone",
            active === "B" && "translate-x-1 translate-y-1 shadow-[5px_5px_0_#0a0a08]",
          )}
        >
          <span className="mb-1 block font-mono text-[15px] font-normal tracking-[0.2em] opacity-80">
            &gt; BACK_BLUE_CORNER
          </span>
          {fight.tokenB.symbol}{" "}
          <span className="float-right font-impact">→</span>
        </button>
      </div>

      {active ? (
        <div className="mt-4 border-2 border-ink bg-ink-2 p-4 animate-feed-in">
          <div className="mb-3 flex items-center justify-between font-mono text-[15px] tracking-wider text-hazard-yellow">
            <span>
              &gt; STAKE_BNB on{" "}
              <span className={active === "A" ? "text-hazard-lime" : "text-hazard-red"}>
                {active === "A" ? fight.tokenA.symbol : fight.tokenB.symbol}
              </span>
            </span>
            <button
              onClick={() => setActive(null)}
              className="cursor-pointer text-bone/60 hover:text-bone"
            >
              [ close ]
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {["0.01", "0.05", "0.1", "0.5", "1.0"].map((a) => (
              <button
                key={a}
                onClick={() => setAmount(a)}
                className={cn(
                  "cursor-pointer border px-3 py-1.5 font-mono text-[14px]",
                  amount === a
                    ? "border-hazard-yellow bg-hazard-yellow text-ink"
                    : "border-bone/40 text-bone hover:border-hazard-yellow",
                )}
              >
                {a} BNB
              </button>
            ))}
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-[100px] border border-bone/30 bg-ink px-3 py-1.5 font-mono text-[14px] text-bone outline-none focus:border-hazard-yellow"
            />
            <button
              className={cn(
                "cursor-pointer border-2 border-ink px-5 py-2 font-impact text-[18px] uppercase shadow-[4px_4px_0_#0a0a08] transition-transform hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[3px_3px_0_#0a0a08] active:translate-x-1 active:translate-y-1 active:shadow-none",
                active === "A" ? "bg-hazard-lime text-ink" : "bg-hazard-red text-bone",
              )}
            >
              CONFIRM →
            </button>
          </div>
          <p className="mt-3 font-mono text-[13px] tracking-wide text-bone/55">
            &gt; pool now {fight.poolA + fight.poolB} BNB · winners split loser pool pro-rata minus 2% platform cut
          </p>
        </div>
      ) : null}
    </div>
  );
}
