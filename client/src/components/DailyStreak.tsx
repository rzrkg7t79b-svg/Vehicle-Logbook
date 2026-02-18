interface DailyStreakProps {
  streak: number;
}

export function DailyStreak({ streak }: DailyStreakProps) {
  const displayStreak = Math.max(0, streak);
  const digitCount = String(displayStreak).length;
  const fontSize = digitCount >= 4 ? "9px" : digitCount === 3 ? "11px" : "14px";

  return (
    <div className="flex items-center gap-1.5" data-testid="daily-streak">
      <span style={{
        fontSize: "10px",
        fontWeight: "700",
        color: "rgba(255,255,255,0.4)",
        letterSpacing: "0.5px",
        lineHeight: "1.1",
        textAlign: "right" as const,
        whiteSpace: "nowrap" as const,
      }}>
        Daily<br />Streak
      </span>
      <div style={{ position: "relative", display: "flex", alignItems: "flex-end" }}>
        <div style={{
          position: "absolute",
          bottom: "-1px",
          left: "-4px",
          right: "-4px",
          height: "2px",
          background: "linear-gradient(90deg, transparent 0%, rgba(249, 115, 22, 0.4) 20%, rgba(249, 115, 22, 0.6) 50%, rgba(249, 115, 22, 0.4) 80%, transparent 100%)",
          borderRadius: "1px",
        }} />
        <div style={{
          position: "absolute",
          bottom: "-1px",
          left: "-4px",
          right: "-4px",
          height: "2px",
          background: "rgba(255,255,255,0.08)",
          borderRadius: "1px",
        }} />

        <svg
          viewBox="0 0 70 36"
          width="70"
          height="36"
          style={{ display: "block", position: "relative", zIndex: 1 }}
        >
          <g>
            {/* Cargo body - tall box */}
            <rect x="16" y="4" width="42" height="24" rx="2" ry="2"
              fill="rgba(249, 115, 22, 0.15)" stroke="rgba(249, 115, 22, 0.5)" strokeWidth="0.8" />
            {/* Cargo body side panel line */}
            <line x1="16" y1="16" x2="58" y2="16" stroke="rgba(249, 115, 22, 0.25)" strokeWidth="0.5" />

            {/* Cab */}
            <path d="M 4 14 L 4 28 L 18 28 L 18 14 L 12 8 L 4 8 Z"
              fill="rgba(249, 115, 22, 0.2)" stroke="rgba(249, 115, 22, 0.6)" strokeWidth="0.8" strokeLinejoin="round" />
            {/* Windshield */}
            <path d="M 6 10 L 11 10 L 14 15 L 6 15 Z"
              fill="rgba(249, 115, 22, 0.08)" stroke="rgba(249, 115, 22, 0.4)" strokeWidth="0.5" strokeLinejoin="round" />
            {/* Side mirror */}
            <rect x="1" y="13" width="3" height="4" rx="0.8" ry="0.8"
              fill="rgba(249, 115, 22, 0.3)" stroke="rgba(249, 115, 22, 0.5)" strokeWidth="0.4" />
            {/* Headlight */}
            <rect x="4" y="21" width="2.5" height="3" rx="0.5" ry="0.5"
              fill="rgba(249, 185, 22, 0.4)" stroke="rgba(249, 185, 22, 0.6)" strokeWidth="0.4" />

            {/* Bumper */}
            <rect x="2" y="27" width="8" height="2" rx="0.5" ry="0.5"
              fill="rgba(249, 115, 22, 0.15)" stroke="rgba(249, 115, 22, 0.35)" strokeWidth="0.4" />

            {/* Rear tail light */}
            <rect x="56" y="22" width="2" height="3" rx="0.5" ry="0.5"
              fill="rgba(239, 68, 68, 0.5)" stroke="rgba(239, 68, 68, 0.7)" strokeWidth="0.4" />

            {/* Front wheel */}
            <circle cx="14" cy="30" r="4" fill="rgba(30,30,30,0.8)" stroke="rgba(249, 115, 22, 0.6)" strokeWidth="0.8" />
            <circle cx="14" cy="30" r="1.5" fill="rgba(249, 115, 22, 0.3)" />

            {/* Rear wheel */}
            <circle cx="50" cy="30" r="4" fill="rgba(30,30,30,0.8)" stroke="rgba(249, 115, 22, 0.6)" strokeWidth="0.8" />
            <circle cx="50" cy="30" r="1.5" fill="rgba(249, 115, 22, 0.3)" />

            {/* Streak number on cargo body */}
            <text
              x="37"
              y="15"
              textAnchor="middle"
              fill="#f97316"
              fontWeight="900"
              fontSize={fontSize}
              fontFamily="system-ui, -apple-system, sans-serif"
              style={{ textShadow: "0 0 8px rgba(249, 115, 22, 0.6)" } as any}
            >
              {displayStreak}
            </text>
          </g>
        </svg>
      </div>
    </div>
  );
}

export function DailyStreakExport({ streak, scale = 1 }: { streak: number; scale?: number }) {
  const displayStreak = Math.max(0, streak);
  const digitCount = String(displayStreak).length;
  const numFontSize = digitCount >= 4 ? 16 : digitCount === 3 ? 20 : 26;
  const w = 130;
  const h = 66;

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: `${6 * scale}px`,
    }}>
      <div style={{
        fontSize: `${11 * scale}px`,
        fontWeight: "700",
        color: "rgba(255,255,255,0.4)",
        letterSpacing: "0.5px",
        lineHeight: "1.2",
        textAlign: "right" as const,
        whiteSpace: "nowrap" as const,
      }}>
        Daily<br />Streak
      </div>
      <div style={{ position: "relative", display: "flex", alignItems: "flex-end" }}>
        <div style={{
          position: "absolute",
          bottom: `${-2 * scale}px`,
          left: `${-6 * scale}px`,
          right: `${-6 * scale}px`,
          height: `${3 * scale}px`,
          background: "linear-gradient(90deg, transparent 0%, rgba(249, 115, 22, 0.4) 20%, rgba(249, 115, 22, 0.6) 50%, rgba(249, 115, 22, 0.4) 80%, transparent 100%)",
          borderRadius: `${2 * scale}px`,
        }} />
        <div style={{
          position: "absolute",
          bottom: `${-2 * scale}px`,
          left: `${-6 * scale}px`,
          right: `${-6 * scale}px`,
          height: `${3 * scale}px`,
          background: "rgba(255,255,255,0.06)",
          borderRadius: `${2 * scale}px`,
        }} />
        <svg
          viewBox={`0 0 ${w} ${h}`}
          width={w * scale}
          height={h * scale}
          style={{ display: "block", position: "relative", zIndex: 1 }}
        >
          <g>
            {/* Cargo body */}
            <rect x="30" y="6" width="78" height="44" rx="3" ry="3"
              fill="rgba(249, 115, 22, 0.15)" stroke="rgba(249, 115, 22, 0.5)" strokeWidth="1.2" />
            <line x1="30" y1="28" x2="108" y2="28" stroke="rgba(249, 115, 22, 0.2)" strokeWidth="0.8" />

            {/* Cab */}
            <path d="M 6 24 L 6 50 L 34 50 L 34 24 L 22 12 L 6 12 Z"
              fill="rgba(249, 115, 22, 0.2)" stroke="rgba(249, 115, 22, 0.6)" strokeWidth="1.2" strokeLinejoin="round" />
            {/* Windshield */}
            <path d="M 10 16 L 20 16 L 26 26 L 10 26 Z"
              fill="rgba(249, 115, 22, 0.08)" stroke="rgba(249, 115, 22, 0.4)" strokeWidth="0.8" strokeLinejoin="round" />
            {/* Side mirror */}
            <rect x="1" y="22" width="5" height="7" rx="1.2" ry="1.2"
              fill="rgba(249, 115, 22, 0.3)" stroke="rgba(249, 115, 22, 0.5)" strokeWidth="0.6" />
            {/* Headlight */}
            <rect x="6" y="38" width="5" height="5" rx="1" ry="1"
              fill="rgba(249, 185, 22, 0.4)" stroke="rgba(249, 185, 22, 0.6)" strokeWidth="0.6" />

            {/* Bumper */}
            <rect x="3" y="49" width="15" height="3.5" rx="1" ry="1"
              fill="rgba(249, 115, 22, 0.15)" stroke="rgba(249, 115, 22, 0.35)" strokeWidth="0.6" />

            {/* Rear tail light */}
            <rect x="105" y="38" width="3.5" height="6" rx="1" ry="1"
              fill="rgba(239, 68, 68, 0.5)" stroke="rgba(239, 68, 68, 0.7)" strokeWidth="0.6" />

            {/* Front wheel */}
            <circle cx="26" cy="55" r="7.5" fill="rgba(30,30,30,0.8)" stroke="rgba(249, 115, 22, 0.6)" strokeWidth="1.2" />
            <circle cx="26" cy="55" r="2.8" fill="rgba(249, 115, 22, 0.3)" />

            {/* Rear wheel */}
            <circle cx="92" cy="55" r="7.5" fill="rgba(30,30,30,0.8)" stroke="rgba(249, 115, 22, 0.6)" strokeWidth="1.2" />
            <circle cx="92" cy="55" r="2.8" fill="rgba(249, 115, 22, 0.3)" />

            {/* Streak number on cargo body */}
            <text
              x="69"
              y="24"
              textAnchor="middle"
              fill="#f97316"
              fontWeight="900"
              fontSize={numFontSize}
              fontFamily="system-ui, -apple-system, sans-serif"
            >
              {displayStreak}
            </text>
          </g>
        </svg>
      </div>
    </div>
  );
}
