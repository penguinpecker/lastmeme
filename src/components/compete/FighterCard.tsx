import { HealthBar } from "./HealthBar";
import type { Token } from "@/lib/types";

export function FighterCard({
  token,
  corner,
  hp,
  pot,
  odds,
}: {
  token: Token;
  corner: "R" | "B";
  hp: number;
  pot: number;
  odds: number;
}) {
  const isBlue = corner === "B";
  return (
    <div
      className={`relative z-20 border-2 border-ink p-5 md:p-6 ${
        isBlue ? "-ml-5 bg-hazard-red text-bone brut-shadow-l skew-r" : "-mr-5 bg-hazard-lime text-ink brut-shadow skew-l"
      }`}
      style={{ transformOrigin: isBlue ? "left center" : "right center" }}
    >
      <div className={isBlue ? "unskew-r" : "unskew-l"}>
        <div className="mb-3 flex items-center justify-between font-mono text-[16px]">
          <span
            className="border border-current bg-ink px-2.5 py-[3px] tracking-[0.15em]"
            style={{ color: isBlue ? "#f4f0e8" : "#f4f0e8" }}
          >
            {corner}-CORNER
          </span>
          <span className="opacity-80">{token.ageHours}H OLD</span>
        </div>

        <div
          className="mb-3 flex h-[68px] w-[68px] items-center justify-center border-2 bg-ink font-impact text-[26px] text-bone"
          style={{ borderColor: isBlue ? "#f4f0e8" : "#0a0a08" }}
        >
          {token.symbol.replace("$", "").slice(0, 2)}
        </div>

        <p className="font-impact m-0 text-[48px] leading-[0.9] tracking-[-0.02em]">
          {token.symbol}
        </p>
        <p className="mt-1 mb-4 font-mono text-[17px] opacity-75">{token.slug}</p>

        <HealthBar value={hp} corner={corner} />

        <div
          className="mt-3.5 flex items-baseline justify-between border-t border-dashed pt-3 font-mono text-[17px]"
          style={{ borderColor: "currentColor" }}
        >
          <span>POT</span>
          <span className="font-impact text-[24px] tracking-[-0.01em]">
            {pot.toFixed(2)} BNB
          </span>
          <span>{odds.toFixed(2)}×</span>
        </div>
      </div>
    </div>
  );
}
