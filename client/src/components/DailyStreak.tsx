import sprinterVanImg from "@assets/3EECF2D5-BA95-41EC-B273-E66A4A30A71D_1771440003631.png";

interface DailyStreakProps {
  streak: number;
}

export function DailyStreak({ streak }: DailyStreakProps) {
  const displayStreak = Math.max(0, streak);
  const digitCount = String(displayStreak).length;
  const fontSize = digitCount >= 4 ? "10px" : digitCount === 3 ? "12px" : "15px";

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
      <div style={{ position: "relative", width: "80px", height: "44px" }}>
        <img
          src={sprinterVanImg}
          alt="Sprinter Van"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            filter: "drop-shadow(0 0 6px rgba(249, 115, 22, 0.3))",
          }}
        />
        <div style={{
          position: "absolute",
          top: "6px",
          right: "3px",
          width: "34px",
          height: "24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <span style={{
            fontSize,
            fontWeight: "900",
            color: "#f97316",
            textShadow: "0 0 8px rgba(249, 115, 22, 0.8), 0 1px 2px rgba(0,0,0,0.5)",
            fontFamily: "system-ui, -apple-system, sans-serif",
            lineHeight: 1,
          }}>
            {displayStreak}
          </span>
        </div>
      </div>
    </div>
  );
}

export function DailyStreakExport({ streak, scale = 1 }: { streak: number; scale?: number }) {
  const displayStreak = Math.max(0, streak);
  const digitCount = String(displayStreak).length;
  const numFontSize = digitCount >= 4 ? 18 : digitCount === 3 ? 22 : 28;
  const imgW = 150 * scale;
  const imgH = 82 * scale;

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
      <div style={{ position: "relative", width: `${imgW}px`, height: `${imgH}px` }}>
        <img
          src={sprinterVanImg}
          alt="Sprinter Van"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            filter: "drop-shadow(0 0 10px rgba(249, 115, 22, 0.4))",
          }}
        />
        <div style={{
          position: "absolute",
          top: `${10 * scale}px`,
          right: `${5 * scale}px`,
          width: `${64 * scale}px`,
          height: `${44 * scale}px`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <span style={{
            fontSize: `${numFontSize}px`,
            fontWeight: "900",
            color: "#f97316",
            textShadow: "0 0 12px rgba(249, 115, 22, 0.8), 0 2px 4px rgba(0,0,0,0.6)",
            fontFamily: "system-ui, -apple-system, sans-serif",
            lineHeight: 1,
          }}>
            {displayStreak}
          </span>
        </div>
      </div>
    </div>
  );
}
