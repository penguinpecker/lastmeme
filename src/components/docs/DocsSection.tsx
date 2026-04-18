import type { ReactNode } from "react";

export function DocsSection({
  tag,
  title,
  children,
}: {
  tag: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mb-10 border-l-4 border-hazard-yellow pl-5">
      <p className="m-0 font-mono text-[14px] tracking-[0.2em] text-hazard-yellow">{tag}</p>
      <h2 className="font-impact m-0 mb-3 mt-1 text-[32px] leading-[1.05] tracking-[-0.02em] text-bone md:text-[38px]">
        {title}
      </h2>
      <div className="font-mono text-[17px] leading-[1.6] tracking-wide text-bone/80">
        {children}
      </div>
    </section>
  );
}

export function CodeBlock({ children }: { children: ReactNode }) {
  return (
    <pre className="my-3 overflow-x-auto border border-dashed border-bone/30 bg-ink-2 p-4 font-mono text-[14px] leading-[1.6] tracking-wide text-hazard-lime">
      <code>{children}</code>
    </pre>
  );
}

export function StepRow({
  n,
  title,
  body,
}: {
  n: string;
  title: string;
  body: ReactNode;
}) {
  return (
    <div className="mb-4 grid gap-4" style={{ gridTemplateColumns: "48px 1fr" }}>
      <div className="font-impact border-2 border-ink bg-hazard-yellow px-1 py-2 text-center text-[22px] leading-none text-ink brut-shadow-sm">
        {n}
      </div>
      <div>
        <p className="font-impact m-0 text-[20px] leading-tight tracking-[-0.01em] text-hazard-yellow">
          {title}
        </p>
        <div className="mt-1 font-mono text-[16px] leading-[1.55] text-bone/80">{body}</div>
      </div>
    </div>
  );
}
