import { CONSTANTS } from "@/lib/mock";

export function Footer({ extra = [] }: { extra?: string[] }) {
  const items = [
    `BSC // TOKENMGR V2 · ${CONSTANTS.tokenMgrAddress.slice(0, 6)}...${CONSTANTS.tokenMgrAddress.slice(-4)}`,
    "DATA · FOUR.MEME API",
    "FEES → LEADER CREATOR",
    ...extra,
    "SELF-CUSTODY · ON-CHAIN",
  ];
  return (
    <div className="relative z-10 flex flex-wrap gap-2.5 border-t border-bone bg-ink px-6 py-3.5 font-mono text-[15px] text-bone/70">
      <div className="flex w-full flex-wrap justify-between gap-4">
        {items.map((t, i) => (
          <span key={i} className="tracking-wider">
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
