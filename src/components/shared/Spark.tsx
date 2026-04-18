export function Spark({
  points,
  color = "#f4f0e8",
  width = 64,
  height = 18,
}: {
  points: number[];
  color?: string;
  width?: number;
  height?: number;
}) {
  if (points.length === 0) return null;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = Math.max(1, max - min);
  const step = (width - 4) / (points.length - 1);
  const coords = points
    .map((p, i) => {
      const x = 2 + i * step;
      const y = height - 2 - ((p - min) / range) * (height - 4);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className="inline-block align-middle"
    >
      <polyline fill="none" stroke={color} strokeWidth="1.5" points={coords} />
    </svg>
  );
}
