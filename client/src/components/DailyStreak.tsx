interface DailyStreakProps {
  streak: number;
}

export function DailyStreak({ streak }: DailyStreakProps) {
  const displayStreak = Math.max(0, streak);
  const digitCount = String(displayStreak).length;
  const fontSize = digitCount >= 4 ? "8px" : digitCount === 3 ? "10px" : "13px";

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

        <svg
          viewBox="0 0 64 32"
          width="64"
          height="32"
          style={{ display: "block", position: "relative", zIndex: 1 }}
        >
          <g>
            {/* Body - one unified rounded shape like a Sprinter van */}
            <path d="M 8 6 C 8 4, 10 2, 12 2 L 54 2 C 58 2, 60 4, 60 6 L 60 22 C 60 24, 58 24, 56 24 L 10 24 C 8 24, 8 22, 8 22 Z"
              fill="rgba(249, 115, 22, 0.18)" stroke="rgba(249, 115, 22, 0.55)" strokeWidth="0.9" strokeLinejoin="round" />

            {/* Roof line - gentle curve giving that high-roof Sprinter look */}
            <path d="M 12 2 C 12 2, 35 0, 54 2"
              fill="none" stroke="rgba(249, 115, 22, 0.3)" strokeWidth="0.5" />

            {/* Cab divider line */}
            <line x1="20" y1="2" x2="20" y2="24" stroke="rgba(249, 115, 22, 0.3)" strokeWidth="0.6" />

            {/* Windshield - big and angled like a real Sprinter */}
            <path d="M 9 8 L 9 18 L 19 18 L 19 6 Z"
              fill="rgba(180, 220, 255, 0.15)" stroke="rgba(180, 220, 255, 0.4)" strokeWidth="0.6" strokeLinejoin="round" />

            {/* Side window on cargo - small rectangle */}
            <rect x="23" y="6" width="8" height="6" rx="1" ry="1"
              fill="rgba(180, 220, 255, 0.08)" stroke="rgba(180, 220, 255, 0.25)" strokeWidth="0.4" />

            {/* Side mirror */}
            <path d="M 6 11 L 8 10 L 8 16 L 6 15 Z"
              fill="rgba(249, 115, 22, 0.3)" stroke="rgba(249, 115, 22, 0.5)" strokeWidth="0.4" strokeLinejoin="round" />

            {/* Headlight */}
            <circle cx="9" cy="20" r="1.5"
              fill="rgba(255, 230, 100, 0.5)" stroke="rgba(255, 230, 100, 0.7)" strokeWidth="0.4" />

            {/* Rear light */}
            <rect x="58.5" y="17" width="1.5" height="4" rx="0.5" ry="0.5"
              fill="rgba(239, 68, 68, 0.5)" stroke="rgba(239, 68, 68, 0.6)" strokeWidth="0.3" />

            {/* Door handle on cargo */}
            <line x1="55" y1="13" x2="55" y2="17" stroke="rgba(249, 115, 22, 0.4)" strokeWidth="0.6" strokeLinecap="round" />

            {/* Wheel arches - rounded bumps */}
            <path d="M 11 24 Q 11 20, 16 20 Q 21 20, 21 24"
              fill="rgba(20,20,20,0.6)" stroke="rgba(249, 115, 22, 0.4)" strokeWidth="0.5" />
            <path d="M 45 24 Q 45 20, 50 20 Q 55 20, 55 24"
              fill="rgba(20,20,20,0.6)" stroke="rgba(249, 115, 22, 0.4)" strokeWidth="0.5" />

            {/* Front wheel */}
            <circle cx="16" cy="25" r="3.8" fill="rgba(40,40,40,0.9)" stroke="rgba(249, 115, 22, 0.5)" strokeWidth="0.7" />
            <circle cx="16" cy="25" r="1.8" fill="rgba(80,80,80,0.6)" stroke="rgba(249, 115, 22, 0.3)" strokeWidth="0.4" />
            <circle cx="16" cy="25" r="0.6" fill="rgba(249, 115, 22, 0.4)" />

            {/* Rear wheel */}
            <circle cx="50" cy="25" r="3.8" fill="rgba(40,40,40,0.9)" stroke="rgba(249, 115, 22, 0.5)" strokeWidth="0.7" />
            <circle cx="50" cy="25" r="1.8" fill="rgba(80,80,80,0.6)" stroke="rgba(249, 115, 22, 0.3)" strokeWidth="0.4" />
            <circle cx="50" cy="25" r="0.6" fill="rgba(249, 115, 22, 0.4)" />

            {/* Ground shadow */}
            <ellipse cx="33" cy="29.5" rx="24" ry="1.5"
              fill="rgba(249, 115, 22, 0.08)" />

            {/* Streak number on cargo body side */}
            <text
              x="40"
              y="17"
              textAnchor="middle"
              fill="#f97316"
              fontWeight="900"
              fontSize={fontSize}
              fontFamily="system-ui, -apple-system, sans-serif"
              style={{ textShadow: "0 0 6px rgba(249, 115, 22, 0.5)" } as any}
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
  const numFontSize = digitCount >= 4 ? 14 : digitCount === 3 ? 18 : 24;
  const w = 120;
  const h = 58;

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
        <svg
          viewBox={`0 0 ${w} ${h}`}
          width={w * scale}
          height={h * scale}
          style={{ display: "block", position: "relative", zIndex: 1 }}
        >
          <g>
            {/* Body - unified rounded Sprinter shape */}
            <path d="M 14 10 C 14 6, 18 3, 22 3 L 100 3 C 108 3, 112 6, 112 10 L 112 40 C 112 43, 110 44, 106 44 L 18 44 C 15 44, 14 42, 14 40 Z"
              fill="rgba(249, 115, 22, 0.18)" stroke="rgba(249, 115, 22, 0.55)" strokeWidth="1.2" strokeLinejoin="round" />

            {/* Roof curve */}
            <path d="M 22 3 C 22 3, 60 0, 100 3"
              fill="none" stroke="rgba(249, 115, 22, 0.3)" strokeWidth="0.8" />

            {/* Cab divider */}
            <line x1="38" y1="3" x2="38" y2="44" stroke="rgba(249, 115, 22, 0.3)" strokeWidth="1" />

            {/* Windshield */}
            <path d="M 16 14 L 16 33 L 36 33 L 36 10 Z"
              fill="rgba(180, 220, 255, 0.15)" stroke="rgba(180, 220, 255, 0.4)" strokeWidth="0.8" strokeLinejoin="round" />

            {/* Side window on cargo */}
            <rect x="42" y="10" width="14" height="10" rx="2" ry="2"
              fill="rgba(180, 220, 255, 0.08)" stroke="rgba(180, 220, 255, 0.25)" strokeWidth="0.6" />

            {/* Side mirror */}
            <path d="M 10 20 L 14 18 L 14 28 L 10 26 Z"
              fill="rgba(249, 115, 22, 0.3)" stroke="rgba(249, 115, 22, 0.5)" strokeWidth="0.6" strokeLinejoin="round" />

            {/* Headlight */}
            <circle cx="16" cy="37" r="2.5"
              fill="rgba(255, 230, 100, 0.5)" stroke="rgba(255, 230, 100, 0.7)" strokeWidth="0.6" />

            {/* Rear light */}
            <rect x="110" y="30" width="2.5" height="7" rx="0.8" ry="0.8"
              fill="rgba(239, 68, 68, 0.5)" stroke="rgba(239, 68, 68, 0.6)" strokeWidth="0.5" />

            {/* Door handle */}
            <line x1="103" y1="23" x2="103" y2="30" stroke="rgba(249, 115, 22, 0.4)" strokeWidth="1" strokeLinecap="round" />

            {/* Wheel arches */}
            <path d="M 20 44 Q 20 36, 30 36 Q 40 36, 40 44"
              fill="rgba(20,20,20,0.6)" stroke="rgba(249, 115, 22, 0.4)" strokeWidth="0.8" />
            <path d="M 84 44 Q 84 36, 94 36 Q 104 36, 104 44"
              fill="rgba(20,20,20,0.6)" stroke="rgba(249, 115, 22, 0.4)" strokeWidth="0.8" />

            {/* Front wheel */}
            <circle cx="30" cy="46" r="7" fill="rgba(40,40,40,0.9)" stroke="rgba(249, 115, 22, 0.5)" strokeWidth="1" />
            <circle cx="30" cy="46" r="3.2" fill="rgba(80,80,80,0.6)" stroke="rgba(249, 115, 22, 0.3)" strokeWidth="0.6" />
            <circle cx="30" cy="46" r="1" fill="rgba(249, 115, 22, 0.4)" />

            {/* Rear wheel */}
            <circle cx="94" cy="46" r="7" fill="rgba(40,40,40,0.9)" stroke="rgba(249, 115, 22, 0.5)" strokeWidth="1" />
            <circle cx="94" cy="46" r="3.2" fill="rgba(80,80,80,0.6)" stroke="rgba(249, 115, 22, 0.3)" strokeWidth="0.6" />
            <circle cx="94" cy="46" r="1" fill="rgba(249, 115, 22, 0.4)" />

            {/* Ground shadow */}
            <ellipse cx="62" cy="54" rx="44" ry="2.5"
              fill="rgba(249, 115, 22, 0.08)" />

            {/* Streak number on cargo body */}
            <text
              x="75"
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
