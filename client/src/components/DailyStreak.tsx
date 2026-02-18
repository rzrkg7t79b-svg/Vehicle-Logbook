interface DailyStreakProps {
  streak: number;
}

const VAN_SRC = "/sprinter-van.webp";

export function DailyStreak({ streak }: DailyStreakProps) {
  const displayStreak = Math.max(0, streak);
  const digitCount = String(displayStreak).length;
  const fontSize = digitCount >= 4 ? "9px" : digitCount === 3 ? "12px" : digitCount === 2 ? "15px" : "17px";

  return (
    <div className="flex items-center" style={{ gap: "1px" }} data-testid="daily-streak">
      <span style={{
        fontSize: "13px",
        fontWeight: "900",
        color: "#f97316",
        letterSpacing: "0.3px",
        lineHeight: "1.05",
        textAlign: "right" as const,
        whiteSpace: "nowrap" as const,
        textTransform: "uppercase" as const,
      }}>
        Daily<br />Streak
      </span>
      <div style={{ position: "relative", width: "95px", height: "52px" }}>
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
        {/* Number overlay positioned on the dark cargo box area */}
        <div style={{
          position: "absolute",
          top: "7px",
          right: "17px",
          width: "40px",
          height: "28px",
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
  const numFontSize = digitCount >= 4 ? 18 : digitCount === 3 ? 24 : digitCount === 2 ? 30 : 34;
  const imgW = 180 * scale;
  const imgH = 100 * scale;

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: `${1 * scale}px`,
    }}>
      <div style={{
        fontSize: `${14 * scale}px`,
        fontWeight: "900",
        color: "#f97316",
        letterSpacing: "0.3px",
        lineHeight: "1.05",
        textAlign: "right" as const,
        whiteSpace: "nowrap" as const,
        textTransform: "uppercase" as const,
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
          top: `${13 * scale}px`,
          right: `${24 * scale}px`,
          width: `${76 * scale}px`,
          height: `${52 * scale}px`,
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
          }}>
            {displayStreak}
          </span>
        </div>
      </div>
    </div>
  );
}
