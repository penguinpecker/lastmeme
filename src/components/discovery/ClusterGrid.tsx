"use client";

import { useState } from "react";
import type { Cluster } from "@/lib/types";
import { ClusterCard } from "./ClusterCard";
import { cn } from "@/lib/utils";

type Filter = "ALL" | "FIGHTING" | "QUEUED" | "NEW";

const FILTERS: Filter[] = ["ALL", "FIGHTING", "QUEUED", "NEW"];

export function ClusterGrid({ clusters }: { clusters: Cluster[] }) {
  const [filter, setFilter] = useState<Filter>("ALL");

  const filtered = clusters.filter((c: Cluster) => {
    if (filter === "ALL") return true;
    if (filter === "FIGHTING") return c.status === "FIGHTING" || c.status === "RESOLVING";
    if (filter === "QUEUED") return c.status === "QUEUED";
    if (filter === "NEW") return c.status === "NEW";
    return true;
  });

  const fighting = clusters.filter(
    (c) => c.status === "FIGHTING" || c.status === "RESOLVING",
  ).length;
  const queued = clusters.filter((c) => c.status === "QUEUED").length;
  const forming = clusters.filter((c) => c.status === "NEW").length;

  return (
    <div className="relative px-6 py-5 md:px-8">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-impact m-0 text-[30px] tracking-[-0.01em] text-bone">
            &gt; ACTIVE CLUSTERS_
          </h2>
          <p className="mt-1 font-mono text-[16px] tracking-[0.12em] text-hazard-red">
            {clusters.length} CLUSTERS · {fighting} FIGHTING · {queued} QUEUED · {forming} FORMING
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "cursor-pointer border px-3 py-1.5 font-mono text-[14px] tracking-[0.12em] transition-all",
                filter === f
                  ? "border-ink bg-hazard-yellow text-ink shadow-[3px_3px_0_#0a0a08]"
                  : "border-bone/40 bg-transparent text-bone hover:border-hazard-yellow hover:text-hazard-yellow",
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="border border-dashed border-bone/30 bg-ink-2 px-5 py-8 text-center">
          <p className="font-mono text-[16px] text-bone/70">
            &gt; no clusters yet — waiting for the firehose to deliver similar tokens
          </p>
          <p className="mt-2 font-mono text-[13px] text-bone/45">
            new pools arrive every ~30s · clustering threshold: 0.55 bigram jaccard + substring
          </p>
        </div>
      ) : (
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}
        >
          {filtered.map((c) => (
            <ClusterCard key={c.id} cluster={c} />
          ))}
        </div>
      )}
    </div>
  );
}
