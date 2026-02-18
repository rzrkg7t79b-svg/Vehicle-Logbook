interface DailyStreakProps {
  streak: number;
}

export function DailyStreak({ streak }: DailyStreakProps) {
  const displayStreak = Math.max(0, streak);
  const digitCount = String(displayStreak).length;
  const fontSize = digitCount >= 4 ? "11px" : digitCount === 3 ? "13px" : "16px";
  const boxWidth = digitCount >= 4 ? "36px" : digitCount === 3 ? "32px" : "28px";

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
          viewBox="0 0 62 28"
          width="62"
          height="28"
          style={{ display: "block", position: "relative", zIndex: 1 }}
        >
          <g transform="translate(0, 0)">
            <rect x="18" y="4" width={boxWidth === "36px" ? "34" : boxWidth === "32px" ? "30" : "26"} rx="2" ry="2" height="18" fill="rgba(249, 115, 22, 0.15)" stroke="rgba(249, 115, 22, 0.5)" strokeWidth="0.8" />

            <rect x="2" y="10" width="22" height="14" rx="2" ry="2" fill="rgba(249, 115, 22, 0.2)" stroke="rgba(249, 115, 22, 0.6)" strokeWidth="0.8" />

            <rect x="2" y="10" width="8" height="10" rx="1" ry="1" fill="rgba(249, 115, 22, 0.1)" stroke="rgba(249, 115, 22, 0.4)" strokeWidth="0.5" />

            <rect x="18" y="24" width="4" height="3" rx="1.5" ry="1.5" fill="rgba(249, 115, 22, 0.5)" stroke="rgba(249, 115, 22, 0.7)" strokeWidth="0.5" />

            <line x1="1" y1="24" x2="7" y2="24" stroke="rgba(249, 115, 22, 0.4)" strokeWidth="0.8" strokeLinecap="round" />

            <circle cx="10" cy="26" r="3" fill="none" stroke="rgba(249, 115, 22, 0.6)" strokeWidth="0.8" />
            <circle cx="10" cy="26" r="1.2" fill="rgba(249, 115, 22, 0.4)" />

            {digitCount >= 4 ? (
              <circle cx="42" cy="26" r="3" fill="none" stroke="rgba(249, 115, 22, 0.6)" strokeWidth="0.8" />
            ) : digitCount === 3 ? (
              <circle cx="40" cy="26" r="3" fill="none" stroke="rgba(249, 115, 22, 0.6)" strokeWidth="0.8" />
            ) : (
              <circle cx="36" cy="26" r="3" fill="none" stroke="rgba(249, 115, 22, 0.6)" strokeWidth="0.8" />
            )}
            {digitCount >= 4 ? (
              <circle cx="42" cy="26" r="1.2" fill="rgba(249, 115, 22, 0.4)" />
            ) : digitCount === 3 ? (
              <circle cx="40" cy="26" r="1.2" fill="rgba(249, 115, 22, 0.4)" />
            ) : (
              <circle cx="36" cy="26" r="1.2" fill="rgba(249, 115, 22, 0.4)" />
            )}

            <rect x="1" y="14" width="3" height="6" rx="0.5" ry="0.5" fill="rgba(249, 115, 22, 0.3)" />

            <text
              x={digitCount >= 4 ? "35" : digitCount === 3 ? "33" : "31"}
              y="17"
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
  const numFontSize = digitCount >= 4 ? 20 : digitCount === 3 ? 24 : 30;
  const boxW = digitCount >= 4 ? 68 : digitCount === 3 ? 60 : 50;
  const totalW = 120;

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
          viewBox={`0 0 ${totalW} 52`}
          width={totalW * scale}
          height={52 * scale}
          style={{ display: "block", position: "relative", zIndex: 1 }}
        >
          <g>
            <rect x="34" y="6" width={boxW} rx="3" ry="3" height="34" fill="rgba(249, 115, 22, 0.15)" stroke="rgba(249, 115, 22, 0.5)" strokeWidth="1.2" />

            <rect x="2" y="16" width="42" height="26" rx="3" ry="3" fill="rgba(249, 115, 22, 0.2)" stroke="rgba(249, 115, 22, 0.6)" strokeWidth="1.2" />

            <rect x="2" y="16" width="14" height="18" rx="2" ry="2" fill="rgba(249, 115, 22, 0.1)" stroke="rgba(249, 115, 22, 0.4)" strokeWidth="0.8" />

            <rect x="34" y="42" width="8" height="6" rx="2.5" ry="2.5" fill="rgba(249, 115, 22, 0.5)" stroke="rgba(249, 115, 22, 0.7)" strokeWidth="0.8" />

            <line x1="0" y1="42" x2="12" y2="42" stroke="rgba(249, 115, 22, 0.4)" strokeWidth="1.2" strokeLinecap="round" />

            <circle cx="18" cy="46" r="5.5" fill="none" stroke="rgba(249, 115, 22, 0.6)" strokeWidth="1.2" />
            <circle cx="18" cy="46" r="2" fill="rgba(249, 115, 22, 0.4)" />

            <circle cx={digitCount >= 4 ? 82 : digitCount === 3 ? 76 : 68} cy="46" r="5.5" fill="none" stroke="rgba(249, 115, 22, 0.6)" strokeWidth="1.2" />
            <circle cx={digitCount >= 4 ? 82 : digitCount === 3 ? 76 : 68} cy="46" r="2" fill="rgba(249, 115, 22, 0.4)" />

            <rect x="0" y="22" width="5" height="10" rx="1" ry="1" fill="rgba(249, 115, 22, 0.3)" />

            <text
              x={34 + boxW / 2}
              y="30"
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
