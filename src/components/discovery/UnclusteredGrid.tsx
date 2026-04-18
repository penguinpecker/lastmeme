import type { Token } from "@/lib/types";

function ageLabel(hours: number | undefined): string {
  if (typeof hours !== "number") return "—";
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 24) return `${Math.round(hours)}h`;
  return `${Math.round(hours / 24)}d`;
}

export function UnclusteredGrid({ tokens }: { tokens: Token[] }) {
  const total = tokens.length;
  const display = tokens.slice(0, 18);
  return (
    <div className="relative z-10 border-t border-dashed border-bone/20 px-6 py-5 md:px-8">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2.5">
        <h2 className="font-impact m-0 text-[22px] tracking-[-0.01em] text-bone">
          &gt; UNCLUSTERED · THE LONELY_
        </h2>
        <span className="font-mono text-[15px] tracking-[0.08em] text-hazard-yellow">
          {total} TOKENS · NO MATCH FOUND · YET
        </span>
      </div>
      {display.length === 0 ? (
        <p className="font-mono text-[15px] text-bone/50">
          &gt; every incoming token matched a cluster · suspiciously copycat day
        </p>
      ) : (
        <div className="grid gap-2.5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
          {display.map((t) => (
            <a
              key={t.id}
              href={t.fourMemeUrl ?? `https://bscscan.com/token/${t.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-2 border border-dashed border-bone/35 bg-ink px-3 py-2.5 font-mono text-[15px] text-bone/80 transition-colors hover:border-hazard-yellow hover:text-hazard-yellow"
            >
              <span className="font-impact truncate text-[16px] tracking-[-0.01em] text-bone">
                {t.symbol}
              </span>
              <span className="shrink-0 text-[13px] text-bone/55">{ageLabel(t.ageHours)}</span>
            </a>
          ))}
        </div>
      )}
      {total > display.length ? (
        <p className="mt-3 font-mono text-[13px] text-bone/50">
          &gt; + {total - display.length} more unmatched · embedding-pending
        </p>
      ) : null}
    </div>
  );
}
