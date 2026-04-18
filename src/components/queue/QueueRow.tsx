import Link from "next/link";
import type { Cluster } from "@/lib/types";
import { cn } from "@/lib/utils";

function statusBadge(status: Cluster["status"]) {
  switch (status) {
    case "FIGHTING":
      return (
        <span className="animate-blink inline-block border border-ink bg-hazard-yellow px-2.5 py-[3px] font-mono text-[12px] tracking-[0.14em] text-ink">
          ● LIVE
        </span>
      );
    case "RESOLVING":
      return (
        <span className="inline-block border border-ink bg-hazard-red px-2.5 py-[3px] font-mono text-[12px] tracking-[0.14em] text-bone">
          RESOLVING
        </span>
      );
    case "QUEUED":
      return (
        <span className="inline-block border border-bone/40 px-2.5 py-[3px] font-mono text-[12px] tracking-[0.14em] text-bone opacity-80">
          QUEUED
        </span>
      );
    case "NEW":
      return (
        <span className="inline-block border border-ink bg-hazard-lime px-2.5 py-[3px] font-mono text-[12px] tracking-[0.14em] text-ink">
          FORMING
        </span>
      );
  }
}

export function QueueRow({ cluster, index }: { cluster: Cluster; index: number }) {
  const href = cluster.fightId ? `/fights/${cluster.fightId}` : "/fights/0047";
  const fighting = cluster.status === "FIGHTING" || cluster.status === "RESOLVING";
  const etaSecs = cluster.etaSeconds;
  const urgency =
    etaSecs < 300
      ? "text-hazard-red"
      : etaSecs < 3600
      ? "text-hazard-yellow"
      : "text-bone";

  return (
    <Link
      href={href}
      className={cn(
        "group grid items-center gap-4 border-b border-dashed border-bone/20 px-5 py-4 transition-colors hover:bg-hazard-yellow/[0.04] md:px-6",
        fighting && "bg-hazard-yellow/[0.03]",
      )}
      style={{ gridTemplateColumns: "40px 80px 1fr 110px 120px 100px 36px" }}
    >
      <span className="font-impact text-[18px] leading-none text-hazard-yellow tabular-nums">
        {index.toString().padStart(2, "0")}
      </span>

      <span className="font-impact text-[22px] leading-none tracking-[-0.01em]">
        {cluster.theme}
      </span>

      <div className="flex items-center">
        <div
          className="relative z-10 -mr-1.5 bg-ink px-2.5 py-1 text-hazard-yellow skew-l"
          style={{ transformOrigin: "right" }}
        >
          <span className="inline-block unskew-l font-impact text-[15px] leading-none tracking-[-0.01em]">
            {cluster.fighters[0]}
          </span>
        </div>
        <span className="font-impact chroma-y-xs px-1 text-[12px] opacity-75">VS</span>
        <div
          className="relative z-10 -ml-1.5 bg-hazard-red px-2.5 py-1 text-bone skew-l"
          style={{ transformOrigin: "left" }}
        >
          <span className="inline-block unskew-l font-impact text-[15px] leading-none tracking-[-0.01em]">
            {cluster.fighters[1]}
          </span>
        </div>
      </div>

      <span className="font-mono text-[15px] tabular-nums text-bone/70">
        {cluster.tokenCount} TOKENS
      </span>

      <span className="font-mono text-[15px] tabular-nums text-bone/70">
        {cluster.overlapPct}% OVERLAP
      </span>

      <span className={cn("font-mono text-[15px] tabular-nums tracking-wide", urgency)}>
        {cluster.etaLabel}
      </span>

      {statusBadge(cluster.status)}
    </Link>
  );
}
