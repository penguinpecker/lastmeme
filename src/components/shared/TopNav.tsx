"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { CONSTANTS } from "@/lib/mock";

const LINKS: { href: string; label: string }[] = [
  { href: "/", label: "FIGHTS" },
  { href: "/queue", label: "QUEUE" },
  { href: "/shame", label: "HALL OF SHAME" },
  { href: "/docs", label: "DOCS" },
];

export function TopNav() {
  const pathname = usePathname();
  const active = (href: string) => {
    if (href === "/") return pathname === "/" || pathname.startsWith("/fights");
    return pathname.startsWith(href);
  };

  return (
    <div className="relative z-40 flex items-center justify-between gap-6 border-b border-bone bg-ink px-5 py-2.5 font-mono text-[17px]">
      <Link href="/" className="font-bold tracking-[0.12em] text-hazard-yellow">
        LASTMEME<span className="text-hazard-red">.</span>FM
      </Link>
      <div className="hidden gap-5 md:flex">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              "tracking-[0.1em] transition-colors",
              active(l.href)
                ? "border-b border-dashed border-hazard-yellow pb-0.5 text-hazard-yellow"
                : "text-bone opacity-75 hover:text-hazard-yellow hover:opacity-100",
            )}
          >
            {l.label}
          </Link>
        ))}
      </div>
      <span className="hidden text-hazard-red sm:inline-block">
        <span className="animate-blink inline-block">●</span> LIVE · {CONSTANTS.viewersLive} WATCHING
      </span>
      <span className="text-hazard-red sm:hidden">
        <span className="animate-blink inline-block">●</span> {CONSTANTS.viewersLive}
      </span>
    </div>
  );
}
