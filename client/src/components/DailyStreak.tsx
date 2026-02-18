interface DailyStreakProps {
  streak: number;
}

const VAN_SRC = "/sprinter-van.webp";

export function DailyStreak({ streak }: DailyStreakProps) {
  const displayStreak = Math.max(0, streak);
  const digitCount = String(displayStreak).length;
  const fontSize = digitCount >= 4 ? "11px" : digitCount === 3 ? "14px" : digitCount === 2 ? "18px" : "20px";

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
      <div style={{ position: "relative", width: "110px", height: "60px" }}>
        <img
          src={VAN_SRC}
          alt=""
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            filter: "drop-shadow(0 0 6px rgba(249, 115, 22, 0.3))",
          }}
        />
        <div style={{
          position: "absolute",
          top: "8px",
          right: "4px",
          width: "46px",
          height: "32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <span style={{
            fontSize,
            fontWeight: "900",
            color: "#f97316",
            textShadow: "0 0 10px rgba(249, 115, 22, 0.9), 0 0 20px rgba(249, 115, 22, 0.4)",
            fontFamily: "system-ui, -apple-system, sans-serif",
            lineHeight: 1,
            letterSpacing: "-0.5px",
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
  const numFontSize = digitCount >= 4 ? 20 : digitCount === 3 ? 26 : digitCount === 2 ? 34 : 38;
  const imgW = 200 * scale;
  const imgH = 110 * scale;

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: `${8 * scale}px`,
    }}>
      <div style={{
        fontSize: `${12 * scale}px`,
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
          src={VAN_SRC}
          alt=""
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            filter: "drop-shadow(0 0 12px rgba(249, 115, 22, 0.4))",
          }}
        />
        <div style={{
          position: "absolute",
          top: `${14 * scale}px`,
          right: `${8 * scale}px`,
          width: `${84 * scale}px`,
          height: `${56 * scale}px`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <span style={{
            fontSize: `${numFontSize}px`,
            fontWeight: "900",
            color: "#f97316",
            textShadow: "0 0 14px rgba(249, 115, 22, 0.9), 0 0 28px rgba(249, 115, 22, 0.4)",
            fontFamily: "system-ui, -apple-system, sans-serif",
            lineHeight: 1,
            letterSpacing: "-1px",
          }}>
            {displayStreak}
          </span>
        </div>
      </div>
    </div>
  );
}
