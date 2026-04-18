export function Marquee({ items }: { items: string[] }) {
  const content = items.join(" ✦ ");
  return (
    <div className="relative z-10 overflow-hidden border-y border-ink bg-hazard-yellow py-1.5 font-mono text-[19px] tracking-[0.08em] text-ink">
      <div className="flex whitespace-nowrap animate-scroll">
        <span className="shrink-0 pl-8">{content} ✦</span>
        <span className="shrink-0 pl-8">{content} ✦</span>
      </div>
    </div>
  );
}
