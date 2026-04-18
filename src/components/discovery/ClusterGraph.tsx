"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import type { Cluster } from "@/lib/types";

interface Node extends d3.SimulationNodeDatum {
  id: string;
  cluster: string;
  clusterRef: Cluster;
  memberIdx: number;
  r: number;
  status: string;
}

interface Edge {
  source: string;
  target: string;
}

function colorFor(status: string): string {
  switch (status) {
    case "IN_RING":
      return "#e8d93a";
    case "NEXT_UP":
      return "#d4e820";
    case "QUEUED":
      return "#f4f0e8";
    case "EATEN":
      return "#e33e2e";
    default:
      return "#f4f0e8";
  }
}

function clusterColor(status: string): string {
  switch (status) {
    case "FIGHTING":
      return "#e8d93a";
    case "RESOLVING":
      return "#e33e2e";
    case "NEW":
      return "#d4e820";
    default:
      return "#f4f0e8";
  }
}

export function ClusterGraph({ clusters }: { clusters: Cluster[] }) {
  const ref = useRef<SVGSVGElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [dim, setDim] = useState<{ w: number; h: number }>({ w: 0, h: 420 });
  const [hover, setHover] = useState<Cluster | null>(null);

  useEffect(() => {
    const update = () => {
      if (wrapperRef.current) {
        setDim({
          w: wrapperRef.current.clientWidth,
          h: Math.max(380, Math.min(500, wrapperRef.current.clientWidth * 0.42)),
        });
      }
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const { nodes, edges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    clusters.forEach((c) => {
      const centerId = `${c.id}-core`;
      nodes.push({
        id: centerId,
        cluster: c.id,
        clusterRef: c,
        memberIdx: -1,
        r: 9 + Math.min(c.tokenCount * 0.8, 18),
        status: c.status,
      });
      c.members.forEach((m, i) => {
        const id = `${c.id}-${i}`;
        nodes.push({
          id,
          cluster: c.id,
          clusterRef: c,
          memberIdx: i,
          r: m === "EATEN" ? 2.5 : m === "IN_RING" ? 5.5 : 4,
          status: m,
        });
        edges.push({ source: centerId, target: id });
      });
    });
    return { nodes, edges };
  }, [clusters]);

  useEffect(() => {
    if (!ref.current || dim.w === 0) return;
    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();

    const width = dim.w;
    const height = dim.h;

    // Build a mutable copy for the simulation so d3 can set x/y without mutating memo
    const simNodes: Node[] = nodes.map((n) => ({ ...n }));
    const idMap = new Map(simNodes.map((n) => [n.id, n]));
    const simEdges = edges.map((e) => ({ source: idMap.get(e.source)!, target: idMap.get(e.target)! }));

    const simulation = d3
      .forceSimulation<Node>(simNodes)
      .force(
        "link",
        d3
          .forceLink<Node, { source: Node; target: Node }>(simEdges as unknown as { source: Node; target: Node }[])
          .id((d) => d.id)
          .distance(22)
          .strength(0.55),
      )
      .force("charge", d3.forceManyBody<Node>().strength((d) => (d.memberIdx === -1 ? -180 : -14)))
      .force("center", d3.forceCenter(width / 2, height / 2).strength(0.06))
      .force(
        "collision",
        d3.forceCollide<Node>().radius((d) => d.r + 2),
      )
      .force(
        "x",
        d3
          .forceX<Node>()
          .strength((d) => (d.memberIdx === -1 ? 0.08 : 0.02))
          .x((d) => {
            const idx = clusters.findIndex((c) => c.id === d.cluster);
            const cols = 4;
            const col = idx % cols;
            return ((col + 0.5) / cols) * width;
          }),
      )
      .force(
        "y",
        d3
          .forceY<Node>()
          .strength((d) => (d.memberIdx === -1 ? 0.08 : 0.02))
          .y((d) => {
            const idx = clusters.findIndex((c) => c.id === d.cluster);
            const cols = 4;
            const row = Math.floor(idx / cols);
            const rows = Math.ceil(clusters.length / cols);
            return ((row + 0.5) / rows) * height;
          }),
      );

    const linkGroup = svg
      .append("g")
      .attr("stroke-opacity", 0.25)
      .attr("stroke", "#f4f0e8")
      .attr("stroke-width", 0.7)
      .selectAll("line")
      .data(simEdges)
      .join("line");

    const nodeGroup = svg
      .append("g")
      .selectAll("g")
      .data(simNodes)
      .join("g")
      .attr("class", "cursor-pointer")
      .on("mouseenter", (_event, d) => {
        if (d.memberIdx === -1) setHover(d.clusterRef);
      })
      .on("mouseleave", () => setHover(null));

    nodeGroup
      .append("circle")
      .attr("r", (d) => d.r)
      .attr("fill", (d) => (d.memberIdx === -1 ? clusterColor(d.status) : colorFor(d.status)))
      .attr("stroke", "#0a0a08")
      .attr("stroke-width", (d) => (d.memberIdx === -1 ? 2 : 1));

    nodeGroup
      .filter((d) => d.memberIdx === -1)
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", (d) => d.r + 14)
      .attr("fill", "#f4f0e8")
      .attr("font-family", "var(--font-archivo-black), sans-serif")
      .attr("font-size", "11px")
      .attr("letter-spacing", "0.05em")
      .text((d) => d.clusterRef.theme);

    simulation.on("tick", () => {
      linkGroup
        .attr("x1", (d) => (d.source as Node).x ?? 0)
        .attr("y1", (d) => (d.source as Node).y ?? 0)
        .attr("x2", (d) => (d.target as Node).x ?? 0)
        .attr("y2", (d) => (d.target as Node).y ?? 0);
      nodeGroup.attr("transform", (d) => `translate(${d.x ?? 0}, ${d.y ?? 0})`);
    });

    return () => {
      simulation.stop();
    };
  }, [nodes, edges, dim]);

  return (
    <div
      ref={wrapperRef}
      className="relative z-10 mx-6 mb-6 overflow-hidden border border-dashed border-bone/30 bg-ink-2 md:mx-8"
    >
      <div className="dashed-y flex items-center justify-between bg-ink-2 px-4 py-3 font-mono text-[15px] tracking-[0.12em] text-hazard-yellow">
        <span>&gt; CLUSTER_MAP.SVG</span>
        <span className="text-bone/60">FORCE-DIRECTED · {clusters.length} CLUSTERS</span>
        <span className="animate-blink">▊</span>
      </div>
      <div className="relative">
        {clusters.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <p className="font-mono text-[15px] text-bone/60">
              &gt; no clusters yet · new tokens incoming, waiting to reach the threshold (≥2 similar)
            </p>
          </div>
        ) : (
          <svg ref={ref} width={dim.w} height={dim.h} className="block" />
        )}
        {hover ? (
          <div className="pointer-events-none absolute left-4 top-4 max-w-[260px] border border-hazard-yellow bg-ink/95 px-3 py-2 font-mono text-[14px] text-bone shadow-[4px_4px_0_rgba(232,217,58,0.3)]">
            <div className="font-impact text-[18px] tracking-[-0.02em] text-hazard-yellow">
              {hover.theme}
            </div>
            <div className="mt-1 text-[13px] tracking-wider text-bone/75">
              {hover.tokenCount} TOKENS · {hover.overlapPct}% OVERLAP
            </div>
            <div className="text-[13px] tracking-wider text-bone/55">{hover.etaLabel}</div>
          </div>
        ) : null}
        <div className="pointer-events-none absolute bottom-3 right-3 flex flex-wrap gap-2 font-mono text-[11px] tracking-widest text-bone/70">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-hazard-yellow" /> FIGHTING
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-hazard-red" /> RESOLVING
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-hazard-lime" /> NEW
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-bone" /> QUEUED
          </span>
        </div>
      </div>
    </div>
  );
}
