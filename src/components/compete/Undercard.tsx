import type { Token } from "@/lib/types";
import { Spark } from "@/components/shared/Spark";

function statusPill(status: Token["status"]) {
  switch (status) {
    case "IN_RING":
      return (
        <span className="inline-block border border-ink bg-hazard-yellow px-2.5 py-[3px] font-mono text-[13px] tracking-[0.16em] text-ink">
          IN RING
        </span>
      );
    case "NEXT_UP":
      return (
        <span className="inline-block border border-hazard-yellow px-2.5 py-[3px] font-mono text-[13px] tracking-[0.16em] text-hazard-yellow">
          NEXT UP
        </span>
      );
    case "QUEUED":
      return (
        <span className="inline-block border border-bone/40 px-2.5 py-[3px] font-mono text-[13px] tracking-[0.16em] text-bone opacity-75">
          QUEUED
        </span>
      );
    case "EATEN":
      return (
        <span className="inline-block border border-ink bg-hazard-red px-2.5 py-[3px] font-mono text-[13px] tracking-[0.16em] text-ink">
          EATEN
        </span>
      );
  }
}

function fmtAge(hours: number | undefined): string {
  if (typeof hours !== "number") return "—";
  if (hours < 1) return `${Math.round(hours * 60)}m old`;
  if (hours < 24) return `${hours.toFixed(1)}h old`;
  return `${Math.round(hours / 24)}d old`;
}

function fmtTs(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.toISOString().slice(0, 10)} ${d.toISOString().slice(11, 19)}Z`;
}

export function Undercard({
  tokens,
  clusterTheme,
}: {
  tokens: Token[];
  clusterTheme: string;
}) {
  const counts = tokens.reduce(
    (acc, t) => {
      acc[t.status] = (acc[t.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<Token["status"], number>,
  );

  // Build killedBy map: eaten tokens point to their killer id → show killer symbol
  const bySymbol = new Map(tokens.map((t) => [t.id, t.symbol] as const));
  const inRingToken = tokens.find((t) => t.status === "IN_RING");

  return (
    <div className="relative z-10">
      <div className="border-t-2 border-b border-hazard-red bg-ink px-6 py-4 md:px-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-impact m-0 text-[26px] tracking-[-0.01em] text-bone">
              &gt; THE UNDERCARD_
            </h2>
            <p className="mt-1 font-mono text-[17px] tracking-[0.12em] text-hazard-red">
              {clusterTheme} · ALL {tokens.length} CHALLENGERS · ONE CLUSTER ENTERS, ONE LEAVES
            </p>
          </div>
          <div className="text-right">
            <div
              className="font-impact leading-[0.88] text-hazard-yellow"
              style={{ fontSize: 52, textShadow: "3px 0 0 #e33e2e" }}
            >
              {tokens.length.toString().padStart(2, "0")}
            </div>
            <div className="font-mono text-[15px] tracking-[0.12em] text-bone/70">
              TOKENS IN BUCKET
            </div>
          </div>
        </div>
      </div>

      <div className="border-b border-dashed border-bone/20 px-6 py-5 md:px-8">
        <div className="thin-scrollbar overflow-x-auto border border-dashed border-bone/30">
          <table
            className="w-full border-collapse text-[14px]"
            style={{ minWidth: 920, fontFamily: "var(--font-jetbrains)" }}
          >
            <thead className="bg-ink-2">
              <tr>
                <th className="dashed-y py-2.5 px-3 text-left font-mono text-[14px] font-normal tracking-[0.14em] text-hazard-yellow" style={{ width: 36 }}>
                  #
                </th>
                <th className="dashed-y py-2.5 px-3 text-left font-mono text-[14px] font-normal tracking-[0.14em] text-hazard-yellow" style={{ minWidth: 170 }}>
                  TOKEN
                </th>
                <th className="dashed-y py-2.5 px-3 text-left font-mono text-[14px] font-normal tracking-[0.14em] text-hazard-yellow" style={{ width: 120 }}>
                  STATUS
                </th>
                <th className="dashed-y py-2.5 px-3 text-left font-mono text-[14px] font-normal tracking-[0.14em] text-hazard-yellow" style={{ minWidth: 170 }}>
                  PAIR CREATED
                </th>
                <th className="dashed-y py-2.5 px-3 text-right font-mono text-[14px] font-normal tracking-[0.14em] text-hazard-yellow">
                  HOLDERS
                </th>
                <th className="dashed-y py-2.5 px-3 text-right font-mono text-[14px] font-normal tracking-[0.14em] text-hazard-yellow">
                  LIQ (USD)
                </th>
                <th className="dashed-y py-2.5 px-3 text-right font-mono text-[14px] font-normal tracking-[0.14em] text-hazard-yellow">
                  VOL/LIQ
                </th>
                <th className="dashed-y py-2.5 px-3 text-left font-mono text-[14px] font-normal tracking-[0.14em] text-hazard-yellow" style={{ width: 80 }}>
                  TREND
                </th>
                <th className="dashed-y py-2.5 px-3 text-left font-mono text-[14px] font-normal tracking-[0.14em] text-hazard-yellow" style={{ minWidth: 160 }}>
                  NEXT
                </th>
              </tr>
            </thead>
            <tbody>
              {tokens.map((t, idx) => {
                const dead = t.status === "EATEN";
                const fighting = t.status === "IN_RING";
                const sparkColor = dead ? "#e33e2e" : fighting ? "#e8d93a" : "rgba(244,240,232,0.4)";
                const killerSymbol = t.killedById ? bySymbol.get(t.killedById) ?? inRingToken?.symbol : undefined;
                return (
                  <tr
                    key={t.id}
                    className={`hover:bg-hazard-yellow/[0.04] ${dead ? "opacity-50" : ""}`}
                  >
                    <td className="border-b border-dashed border-bone/10 px-3 py-3 align-middle font-impact text-[18px] text-hazard-yellow">
                      {(idx + 1).toString().padStart(2, "0")}
                    </td>
                    <td className="border-b border-dashed border-bone/10 px-3 py-3 align-middle">
                      <div
                        className={`font-impact text-[18px] tracking-[-0.01em] ${
                          dead ? "text-hazard-red line-through" : fighting ? "text-hazard-yellow" : "text-bone"
                        }`}
                      >
                        {t.symbol}
                      </div>
                      <div className="font-mono text-[13px] tracking-wide text-bone/55">
                        {t.slug} · {fmtAge(t.ageHours)}
                      </div>
                    </td>
                    <td className="border-b border-dashed border-bone/10 px-3 py-3 align-middle">
                      {statusPill(t.status)}
                    </td>
                    <td className="border-b border-dashed border-bone/10 px-3 py-3 align-middle font-mono text-[12.5px] tabular-nums text-bone/75">
                      {fmtTs(t.createdAtIso)}
                    </td>
                    <td className="border-b border-dashed border-bone/10 px-3 py-3 text-right align-middle tabular-nums">
                      {t.holders}
                    </td>
                    <td className="border-b border-dashed border-bone/10 px-3 py-3 text-right align-middle tabular-nums">
                      {t.liquidityUsd
                        ? `$${Math.round(t.liquidityUsd).toLocaleString()}`
                        : "—"}
                    </td>
                    <td className="border-b border-dashed border-bone/10 px-3 py-3 text-right align-middle tabular-nums">
                      {t.volLiqRatio ? `${t.volLiqRatio.toFixed(1)}×` : "—"}
                    </td>
                    <td className="border-b border-dashed border-bone/10 px-3 py-3 align-middle">
                      <Spark points={t.spark} color={sparkColor} />
                    </td>
                    <td className="border-b border-dashed border-bone/10 px-3 py-3 align-middle font-mono text-[14px] tracking-wide">
                      {t.status === "IN_RING" ? (
                        <span className="text-hazard-yellow">IN RING NOW</span>
                      ) : t.status === "NEXT_UP" ? (
                        <span className="text-hazard-yellow">AFTER CURRENT</span>
                      ) : t.status === "EATEN" && killerSymbol ? (
                        <span className="text-bone/50">LOST TO {killerSymbol}</span>
                      ) : t.status === "EATEN" ? (
                        <span className="text-bone/50">ELIMINATED</span>
                      ) : (
                        <span className="text-bone/50">QUEUED · #{idx + 1}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-3.5 flex flex-wrap justify-between gap-2 font-mono text-[16px] tracking-[0.06em] text-bone/70">
          <span>
            &gt; {counts.IN_RING ?? 0} FIGHTING · {counts.NEXT_UP ?? 0} NEXT · {counts.QUEUED ?? 0} QUEUED · {counts.EATEN ?? 0} EATEN
          </span>
          <span>SORT: LIQUIDITY ▾</span>
          <span>REVALIDATE: 60s</span>
        </div>
      </div>
    </div>
  );
}
