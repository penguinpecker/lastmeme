import type { ReactNode } from "react";

export function Hero({
  kicker,
  line1,
  line2,
  sub,
}: {
  kicker: string;
  line1: string;
  line2: string;
  sub: ReactNode;
}) {
  return (
    <div className="relative z-10 px-6 py-8 md:px-8 md:pt-10">
      <p className="m-0 mb-2.5 font-mono text-[17px] tracking-[0.25em] text-hazard-yellow/90">
        {kicker}
      </p>
      <h1 className="font-impact m-0 text-[54px] leading-[0.88] tracking-[-0.02em] uppercase text-bone md:text-[84px]">
        {line1}
      </h1>
      <h1 className="font-impact mt-1 text-[54px] leading-[0.88] tracking-[-0.02em] uppercase text-hazard-yellow chroma-y md:text-[84px]">
        {line2}
      </h1>
      <p className="mt-3.5 font-mono text-[20px] tracking-wide text-bone/75">{sub}</p>
    </div>
  );
}
