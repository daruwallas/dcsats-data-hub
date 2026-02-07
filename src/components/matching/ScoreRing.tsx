interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
}

export function ScoreRing({ score, size = 64, strokeWidth = 6, label }: ScoreRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color =
    score >= 80 ? "text-green-500" :
    score >= 60 ? "text-blue-500" :
    score >= 40 ? "text-yellow-500" :
    "text-red-500";

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-muted/30"
          />
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={color}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
          {score}
        </span>
      </div>
      {label && <span className="text-xs text-muted-foreground">{label}</span>}
    </div>
  );
}
