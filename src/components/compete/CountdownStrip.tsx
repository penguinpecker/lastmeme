"use client";

import { useEffect, useState } from "react";
import { formatCountdown } from "@/lib/utils";

export function CountdownStrip({
  initialSeconds,
  pool,
  overlap,
}: {
  initialSeconds: number;
  pool: number;
  overlap: number;
}) {
  const [seconds, setSeconds] = useState(initialSeconds);
  useEffect(() => {
    const timer = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <p className="mt-3.5 font-mono text-[20px] tracking-wide text-bone/75">
      VERDICT IN{" "}
      <span className="font-bold tabular-nums text-hazard-yellow">
        {formatCountdown(seconds)}
      </span>{" "}
      · BET POOL{" "}
      <span className="font-bold text-hazard-yellow">{pool.toFixed(2)} BNB</span> ·{" "}
      {overlap}% PRIOR-ART OVERLAP
    </p>
  );
}
