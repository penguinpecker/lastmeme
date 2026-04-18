"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Cluster, TokenStatus } from "@/lib/types";

function pillFor(status: Cluster["status"]) {
  switch (status) {
    case "FIGHTING":
      return (
        <span className="animate-blink inline-block border border-ink bg-ink px-2.5 py-[3px] font-mono text-[13px] tracking-[0.12em] text-hazard-yellow">
          ● FIGHT
        </span>
      );
    case "RESOLVING":
      return (
        <span className="inline-block border border-ink bg-hazard-red px-2.5 py-[3px] font-mono text-[13px] tracking-[0.12em] text-bone">
          RESOLVING
        </span>
      );
    case "QUEUED":
      return (
        <span className="inline-block border border-bone px-2.5 py-[3px] font-mono text-[13px] tracking-[0.12em] text-bone opacity-80">
          QUEUED
        </span>
      );
    case "NEW":
      return (
        <span className="inline-block border border-ink bg-ink px-2.5 py-[3px] font-mono text-[13px] tracking-[0.12em] text-hazard-lime">
          NEW
        </span>
      );
  }
}

function dotFor(status: TokenStatus, borderColor: string, key: number) {
  if (status === "IN_RING") {
    return (
      <span
        key={key}
        className="inline-block h-[14px] w-[14px] border border-ink bg-hazard-yellow"
      />
    );
  }
  if (status === "EATEN") {
    return (
      <span
        key={key}
        className="relative inline-block h-[14px] w-[14px] border border-ink bg-hazard-red"
      >
        <span className="font-impact pointer-events-none absolute inset-0 flex items-center justify-center text-[12px] leading-none text-ink">
          ×
        </span>
      </span>
    );
  }
  return (
    <span
      key={key}
      className="inline-block h-[14px] w-[14px] border"
      style={{ borderColor }}
    />
  );
}

function styleForStatus(status: Cluster["status"]) {
  switch (status) {
    case "FIGHTING":
      return "bg-hazard-yellow text-ink border-ink brut-shadow-sm";
    case "RESOLVING":
      return "bg-bone text-ink border-hazard-red shadow-[6px_6px_0_#e33e2e]";
    case "QUEUED":
      return "bg-ink-2 text-bone border-bone brut-shadow-light";
    case "NEW":
      return "bg-hazard-lime text-ink border-ink brut-shadow-sm";
  }
}

export function ClusterCard({ cluster }: { cluster: Cluster }) {
  const href = cluster.fightId ? `/fights/${cluster.fightId}` : `/clusters/${cluster.id}`;
  const inkBorder = cluster.status === "QUEUED" ? "#f4f0e8" : "#0a0a08";
  return (
    <Link
      href={href}
      className={cn(
        "group block cursor-pointer overflow-hidden border-2 p-4 transition-transform hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[4px_4px_0_#0a0a08]",
        styleForStatus(cluster.status),
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-impact m-0 text-[28px] leading-[0.9] tracking-[-0.02em]">
          {cluster.theme}
        </h3>
        {pillFor(cluster.status)}
      </div>

      <div className="my-2.5 grid grid-cols-3 gap-2 border-y border-dashed py-2" style={{ borderColor: "currentColor" }}>
        <div>
          <p className="m-0 font-mono text-[11px] uppercase tracking-[0.12em] opacity-65">
            TOKENS
          </p>
          <p className="font-impact m-0 mt-0.5 text-[17px] leading-none">
            {cluster.tokenCount.toString().padStart(2, "0")}
          </p>
        </div>
        <div>
          <p className="m-0 font-mono text-[11px] uppercase tracking-[0.12em] opacity-65">
            OVERLAP
          </p>
          <p className="font-impact m-0 mt-0.5 text-[17px] leading-none">
            {cluster.overlapPct}%
          </p>
        </div>
        <div>
          <p className="m-0 font-mono text-[11px] uppercase tracking-[0.12em] opacity-65">
            POOL
          </p>
          <p className="font-impact m-0 mt-0.5 text-[17px] leading-none">
            {cluster.poolBnb.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="mt-2 mb-2.5 flex items-center font-impact text-[15px] tracking-[-0.01em]">
        <div
          className="relative z-20 -mr-1.5 bg-ink px-2.5 py-1 text-hazard-yellow skew-l"
          style={{ transformOrigin: "right" }}
        >
          <span className="inline-block unskew-l">{cluster.fighters[0]}</span>
        </div>
        <div className="font-impact chroma-y-xs px-1.5 text-[14px] opacity-75">VS</div>
        <div
          className="relative z-20 -ml-1.5 bg-hazard-red px-2.5 py-1 text-bone skew-l"
          style={{ transformOrigin: "left" }}
        >
          <span className="inline-block unskew-l">{cluster.fighters[1]}</span>
        </div>
      </div>

      <div className="mb-2.5 flex min-h-[18px] flex-wrap gap-[3px]">
        {cluster.members.map((s, i) => dotFor(s, inkBorder, i))}
      </div>

      <div
        className="flex items-center justify-between border-t border-dashed pt-2 font-mono text-[14px] tracking-wide"
        style={{ borderColor: "currentColor" }}
      >
        <span className="font-bold">{cluster.etaLabel}</span>
        <span className="font-impact text-[18px] transition-transform group-hover:translate-x-0.5">
          →
        </span>
      </div>
    </Link>
  );
}
