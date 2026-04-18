export interface KpiCell {
  label: string;
  value: string;
  delta?: string;
  deltaDown?: boolean;
}

export function KpiBar({ cells }: { cells: KpiCell[] }) {
  return (
    <div className="relative z-10 px-6 pb-6 md:px-8">
      <div
        className="grid gap-3.5"
        style={{ gridTemplateColumns: `repeat(${Math.min(cells.length, 5)}, minmax(0, 1fr))` }}
      >
        {cells.map((c) => (
          <div
            key={c.label}
            className="relative border border-dashed border-bone/30 px-4 py-3.5"
          >
            <div className="font-mono text-[14px] tracking-wider text-bone/55">{c.label}</div>
            <div className="font-impact mt-1 text-[28px] leading-none text-hazard-yellow">
              {c.value}
            </div>
            {c.delta ? (
              <div
                className={`mt-1 font-mono text-[14px] tracking-wide ${
                  c.deltaDown ? "text-hazard-red" : "text-hazard-lime"
                }`}
              >
                {c.delta}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
