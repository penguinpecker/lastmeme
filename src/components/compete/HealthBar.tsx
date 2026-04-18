export function HealthBar({
  value,
  corner,
}: {
  value: number;
  corner: "R" | "B";
}) {
  const isRed = corner === "B";
  return (
    <div className="flex items-center gap-2.5">
      <span className="w-[50px] font-mono text-[14px] tracking-wider">HP</span>
      <div
        className="relative h-[18px] flex-1 overflow-hidden border-2"
        style={{
          borderColor: isRed ? "#f4f0e8" : "#0a0a08",
          background: isRed ? "#0a0a08" : "#f4f0e8",
        }}
      >
        <div
          className="h-full"
          style={{
            width: `${value}%`,
            background:
              "linear-gradient(to right, #d4e820 0%, #d4e820 55%, #e8a620 55%, #e8a620 80%, #e33e2e 80%, #e33e2e 100%)",
          }}
        />
        {[25, 50, 75].map((p) => (
          <span
            key={p}
            className="absolute top-0 bottom-0 w-px opacity-50"
            style={{ left: `${p}%`, background: isRed ? "#f4f0e8" : "#0a0a08" }}
          />
        ))}
        <span
          className="absolute -top-1 -bottom-1 w-[3px]"
          style={{
            left: "60%",
            background: isRed ? "#e8d93a" : "#e33e2e",
            transform: "skewX(-22deg)",
          }}
        />
      </div>
      <span className="w-[48px] text-right font-mono text-[16px]">{value}%</span>
    </div>
  );
}
