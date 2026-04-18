"use client";

const DEBRIS: { color: string; dx: number; dy: number; delay: number }[] = [
  { color: "#e8d93a", dx: -180, dy: -120, delay: 0 },
  { color: "#e33e2e", dx: 170, dy: -140, delay: 0.05 },
  { color: "#f4f0e8", dx: -200, dy: 80, delay: 0.1 },
  { color: "#d4e820", dx: 190, dy: 100, delay: 0.12 },
  { color: "#e8d93a", dx: -120, dy: -180, delay: 0.08 },
  { color: "#e33e2e", dx: 130, dy: 170, delay: 0.15 },
  { color: "#f4f0e8", dx: -210, dy: -40, delay: 0.18 },
  { color: "#d4e820", dx: 220, dy: 40, delay: 0.2 },
];

export function Collision() {
  return (
    <div className="relative z-[4] flex h-[220px] items-center justify-center md:h-[260px]">
      <style>{`
        @keyframes debris-fly {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          100% { transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(0.2) rotate(720deg); opacity: 0; }
        }
      `}</style>

      {/* Shockwaves */}
      {[0, 0.15, 0.3].map((delay, i) => (
        <span
          key={i}
          className="animate-shock absolute top-1/2 left-1/2 h-[80px] w-[80px] rounded-full border-4"
          style={{
            borderColor: i === 0 ? "#e8d93a" : i === 1 ? "#e33e2e" : "#f4f0e8",
            borderWidth: i === 0 ? 4 : i === 1 ? 3 : 2,
            animationDelay: `${delay}s`,
            transform: "translate(-50%, -50%) scale(0)",
          }}
        />
      ))}

      {/* Debris */}
      {DEBRIS.map((d, i) => (
        <span
          key={i}
          className="absolute top-1/2 left-1/2 h-2 w-2"
          style={
            {
              background: d.color,
              "--dx": `${d.dx}px`,
              "--dy": `${d.dy}px`,
              animation: `debris-fly 3s ease-out infinite`,
              animationDelay: `${d.delay}s`,
              transform: "translate(-50%, -50%)",
            } as React.CSSProperties
          }
        />
      ))}

      {/* Kapow star */}
      <div className="animate-kapow absolute top-1/2 left-1/2 z-[5]" style={{ transform: "translate(-50%, -50%)" }}>
        <svg width="260" height="260" viewBox="0 0 260 260">
          <polygon
            points="130,12 152,70 210,38 180,94 240,100 188,138 238,182 176,180 198,240 138,202 130,252 122,202 62,240 84,180 22,182 72,138 20,100 80,94 50,38 108,70"
            fill="#e8d93a"
            stroke="#0a0a08"
            strokeWidth="5"
            strokeLinejoin="miter"
          />
          <polygon
            points="130,44 146,88 188,68 166,108 208,118 172,142 204,176 160,172 176,216 134,188 130,228 126,188 84,216 100,172 56,176 88,142 52,118 94,108 72,68 114,88"
            fill="#e33e2e"
            stroke="#0a0a08"
            strokeWidth="3"
            strokeLinejoin="miter"
          />
        </svg>
      </div>

      {/* VS text */}
      <div className="font-impact animate-vs-pop chroma-y relative z-[6] text-[64px] leading-none text-bone md:text-[88px]">
        VS
      </div>
    </div>
  );
}
