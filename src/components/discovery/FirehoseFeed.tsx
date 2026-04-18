"use client";

import { useEffect, useRef, useState } from "react";
import type { FirehoseEvent, Cluster, Token } from "@/lib/types";
import { cn } from "@/lib/utils";

function typeColor(t: FirehoseEvent["type"]) {
  switch (t) {
    case "NEW":
      return "text-signal-blue";
    case "MATCH":
      return "text-hazard-lime";
    case "UNCLUSTERED":
      return "text-hazard-amber";
    case "CLUSTER":
      return "text-hazard-amber";
  }
}

function FirehoseLine({ ev }: { ev: FirehoseEvent }) {
  const tag = `[${ev.type}]`;
  const branch = ev.type === "MATCH" || ev.type === "UNCLUSTERED";
  return (
    <p className="m-0 mb-1.5 leading-snug tracking-wider animate-feed-in">
      <span className="mr-2 text-hazard-yellow">{branch ? "         └─" : ev.time}</span>
      <span className={cn("mr-2", typeColor(ev.type))}>{branch ? "" : tag}</span>
      {ev.type === "MATCH" ? (
        <span className="text-hazard-lime">MATCH</span>
      ) : ev.type === "UNCLUSTERED" ? (
        <span className="text-hazard-amber">UNCLUSTERED</span>
      ) : null}
      {ev.type === "MATCH" ? <span className="mx-1">→</span> : null}
      {ev.type === "UNCLUSTERED" ? <span className="mx-1">·</span> : null}
      <span className="text-bone">{ev.primary}</span>
      {ev.secondary ? <span className="ml-1 text-bone/55"> · {ev.secondary}</span> : null}
      {ev.accent ? (
        <span className="ml-1 text-bone/90"> · {ev.accent}</span>
      ) : null}
    </p>
  );
}

function timeHms(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "--:--:--";
  return d.toTimeString().slice(0, 8);
}

/**
 * Build firehose events from real live data:
 *   - Every clustered token → [NEW] then [MATCH] → cluster theme with overlap%
 *   - Every unclustered token → [NEW] then [UNCLUSTERED]
 *   - Each cluster formation → [CLUSTER] NEW cluster formed: X (n members)
 *
 * Events sorted by token createdAtIso descending.
 */
function buildEventsFromData(
  clusters: Cluster[],
  clusteredTokens: Token[],
  unclustered: Token[],
): FirehoseEvent[] {
  const events: FirehoseEvent[] = [];
  const themeByClusterId = new Map(clusters.map((c) => [c.id, c] as const));

  for (const t of clusteredTokens) {
    const cluster = themeByClusterId.get(t.clusterId);
    if (!t.createdAtIso) continue;
    const time = timeHms(t.createdAtIso);
    events.push({
      id: `n-${t.id}`,
      time,
      type: "NEW",
      primary: t.symbol,
      secondary: "embedding...",
    });
    events.push({
      id: `m-${t.id}`,
      time,
      type: "MATCH",
      primary: `${cluster?.theme ?? "UNKNOWN"} cluster`,
      accent: `${cluster?.overlapPct ?? "--"}%`,
    });
  }

  for (const t of unclustered) {
    if (!t.createdAtIso) continue;
    const time = timeHms(t.createdAtIso);
    events.push({
      id: `n-u-${t.id}`,
      time,
      type: "NEW",
      primary: t.symbol,
      secondary: "embedding...",
    });
    events.push({
      id: `u-${t.id}`,
      time,
      type: "UNCLUSTERED",
      primary: "unique vector",
    });
  }

  for (const c of clusters) {
    if (!c.originalCreatedAt) continue;
    events.push({
      id: `c-${c.id}`,
      time: timeHms(c.originalCreatedAt),
      type: "CLUSTER",
      primary: `${c.theme} cluster · ${c.tokenCount} members`,
      accent: c.status === "FIGHTING" ? "FIGHT SCHEDULED" : c.status,
    });
  }

  // Order newest first by timestamp — fallback to original input order
  return events.sort((a, b) => b.time.localeCompare(a.time)).slice(0, 60);
}

export function FirehoseFeed({
  clusters,
  clusteredTokens,
  unclustered,
  generatedAt,
}: {
  clusters: Cluster[];
  clusteredTokens: Token[];
  unclustered: Token[];
  generatedAt: string;
}) {
  const initial = buildEventsFromData(clusters, clusteredTokens, unclustered);
  const [events, setEvents] = useState<FirehoseEvent[]>(initial);
  const tickRef = useRef(0);

  // Gentle local animation — simulate embedding-in-progress ticker
  // by rotating the top marker so the feed feels alive between server refreshes.
  useEffect(() => {
    const id = setInterval(() => {
      tickRef.current += 1;
    }, 2000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    setEvents(buildEventsFromData(clusters, clusteredTokens, unclustered));
  }, [clusters, clusteredTokens, unclustered]);

  return (
    <div className="border-bone bg-ink md:border-r">
      <div className="dashed-y flex items-center justify-between bg-ink-2 px-[18px] py-3 font-mono text-[16px] tracking-wider text-hazard-yellow">
        <span>&gt; FIREHOSE.LOG</span>
        <span className="animate-blink">▊</span>
        <span>TAILING · {new Date(generatedAt).toTimeString().slice(0, 8)}</span>
      </div>
      <div className="thin-scrollbar relative max-h-[860px] overflow-y-auto px-[18px] py-3 font-mono text-[16px] leading-[1.55]">
        {events.length === 0 ? (
          <p className="m-0 text-bone/50">&gt; waiting for four.meme data from GeckoTerminal...</p>
        ) : (
          events.map((ev) => <FirehoseLine key={ev.id} ev={ev} />)
        )}
        <div className="pointer-events-none sticky bottom-0 left-0 right-0 h-20 bg-gradient-to-b from-transparent to-ink" />
      </div>
    </div>
  );
}
