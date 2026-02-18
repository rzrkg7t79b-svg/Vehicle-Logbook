interface DailyStreakProps {
  streak: number;
}

const VAN_SRC = "/sprinter-van.webp";

function StreakVan({ streak, imgW, imgH, labelSize, numSize, glowSize }: {
  streak: number;
  imgW: number;
  imgH: number;
  labelSize: number;
  numSize: number;
  glowSize: number;
}) {
  const displayStreak = Math.max(0, streak);
  const digitCount = String(displayStreak).length;
  const fontSize = digitCount >= 4 ? numSize * 0.53 : digitCount === 3 ? numSize * 0.7 : digitCount === 2 ? numSize * 0.88 : numSize;

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: "1px",
    }}>
      <span style={{
        fontSize: `${labelSize}px`,
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
      <div style={{ position: "relative", width: `${imgW}px`, height: `${imgH}px` }}>
        <img
          src={VAN_SRC}
          alt=""
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            filter: `drop-shadow(0 0 ${glowSize}px rgba(249, 115, 22, 0.35))`,
          }}
        />
        <div style={{
          position: "absolute",
          top: `${imgH * 0.13}px`,
          right: `${imgW * 0.133}px`,
          width: `${imgW * 0.42}px`,
          height: `${imgH * 0.52}px`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <span style={{
            fontSize: `${fontSize}px`,
            fontWeight: "900",
            color: "#f97316",
            textShadow: `0 0 ${glowSize * 1.5}px rgba(249, 115, 22, 0.9), 0 0 ${glowSize * 3}px rgba(249, 115, 22, 0.4)`,
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

export function DailyStreak({ streak }: DailyStreakProps) {
  return (
    <div data-testid="daily-streak">
      <StreakVan streak={streak} imgW={180} imgH={100} labelSize={13} numSize={34} glowSize={6} />
    </div>
  );
}

export function DailyStreakExport({ streak, scale = 1 }: { streak: number; scale?: number }) {
  return (
    <StreakVan streak={streak} imgW={180 * scale} imgH={100 * scale} labelSize={14 * scale} numSize={34 * scale} glowSize={10 * scale} />
  );
}
