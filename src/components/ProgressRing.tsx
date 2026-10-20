interface Props { value: number; goal: number; size?: number; stroke?: number; }

export function ProgressRing({ value, goal, size = 180, stroke = 14 }: Props) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(value / Math.max(goal, 1), 1);
  const over = value > goal;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="hsl(var(--muted))" strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} strokeLinecap="round"
          stroke={over ? "hsl(var(--destructive))" : "hsl(var(--primary))"}
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)} className="transition-all duration-700" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold">{Math.round(value)}</span>
        <span className="text-xs text-muted-foreground">de {goal} kcal</span>
      </div>
    </div>
  );
}
