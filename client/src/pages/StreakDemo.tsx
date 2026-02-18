import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Truck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function FireStreak({ streak }: { streak: number }) {
  const intensity = Math.min(streak / 30, 1);
  return (
    <div className="flex items-center gap-1.5" style={{ position: "relative" }}>
      <div style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
      }}>
        <div style={{
          position: "absolute",
          inset: "-6px",
          background: `radial-gradient(ellipse, rgba(249, 115, 22, ${0.3 + intensity * 0.4}) 0%, transparent 70%)`,
          filter: "blur(4px)",
          borderRadius: "50%",
        }} />
        <div style={{
          position: "absolute",
          left: "-8px",
          top: "-10px",
          fontSize: "16px",
          filter: `brightness(${1 + intensity * 0.5})`,
          transform: `scale(${0.8 + intensity * 0.6})`,
        }}>
          🔥
        </div>
        <Truck style={{
          width: "22px",
          height: "22px",
          color: `rgb(${249 - intensity * 100}, ${115 - intensity * 50}, 22)`,
          position: "relative",
          zIndex: 1,
        }} />
      </div>
      <span style={{
        fontSize: "14px",
        fontWeight: "800",
        color: "#f97316",
        textShadow: `0 0 ${6 + intensity * 10}px rgba(249, 115, 22, ${0.5 + intensity * 0.5})`,
        minWidth: "20px",
        position: "relative",
        zIndex: 1,
      }}>
        {streak}
      </span>
    </div>
  );
}

function RoadTripStreak({ streak }: { streak: number }) {
  const milestone = streak >= 30 ? 30 : streak >= 14 ? 14 : streak >= 7 ? 7 : 0;
  const nextMilestone = streak >= 30 ? 60 : streak >= 14 ? 30 : streak >= 7 ? 14 : 7;
  const roadProgress = ((streak - milestone) / (nextMilestone - milestone)) * 100;

  return (
    <div className="flex items-center gap-2" style={{ position: "relative" }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "4px",
        background: "rgba(255,255,255,0.05)",
        borderRadius: "12px",
        padding: "4px 10px 4px 6px",
        border: "1px solid rgba(255,255,255,0.1)",
      }}>
        <div style={{ position: "relative", width: "60px", height: "20px" }}>
          <div style={{
            position: "absolute",
            bottom: "6px",
            left: "0",
            right: "0",
            height: "3px",
            background: "rgba(255,255,255,0.15)",
            borderRadius: "2px",
          }} />
          <div style={{
            position: "absolute",
            bottom: "6px",
            left: "0",
            width: `${Math.min(roadProgress, 100)}%`,
            height: "3px",
            background: "linear-gradient(90deg, #f97316, #22c55e)",
            borderRadius: "2px",
          }} />
          {[0, 33, 66, 100].map((pos, i) => (
            <div key={i} style={{
              position: "absolute",
              bottom: "4px",
              left: `${pos}%`,
              width: "2px",
              height: "7px",
              background: roadProgress >= pos ? "#22c55e" : "rgba(255,255,255,0.2)",
              borderRadius: "1px",
              transform: "translateX(-1px)",
            }} />
          ))}
          <div style={{
            position: "absolute",
            bottom: "8px",
            left: `${Math.min(roadProgress, 95)}%`,
            transform: "translateX(-50%)",
            transition: "left 0.3s ease",
          }}>
            <Truck style={{ width: "14px", height: "14px", color: "#f97316", transform: "scaleX(-1)" }} />
          </div>
        </div>
        <div style={{
          background: "linear-gradient(135deg, #f97316, #ea580c)",
          borderRadius: "4px",
          padding: "1px 5px",
          fontSize: "11px",
          fontWeight: "800",
          color: "white",
          minWidth: "22px",
          textAlign: "center" as const,
        }}>
          {streak}
        </div>
      </div>
    </div>
  );
}

function ShieldStreak({ streak }: { streak: number }) {
  const tier = streak >= 30 ? "diamond" : streak >= 14 ? "gold" : streak >= 7 ? "silver" : "bronze";
  const tierColors = {
    bronze: { border: "#cd7f32", glow: "205, 127, 50", bg: "rgba(205, 127, 50, 0.15)" },
    silver: { border: "#c0c0c0", glow: "192, 192, 192", bg: "rgba(192, 192, 192, 0.15)" },
    gold: { border: "#ffd700", glow: "255, 215, 0", bg: "rgba(255, 215, 0, 0.15)" },
    diamond: { border: "#b9f2ff", glow: "185, 242, 255", bg: "rgba(185, 242, 255, 0.2)" },
  };
  const colors = tierColors[tier];

  return (
    <div className="flex items-center gap-1">
      <div style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <div style={{
          position: "absolute",
          inset: "-4px",
          background: `radial-gradient(ellipse, rgba(${colors.glow}, 0.4) 0%, transparent 70%)`,
          filter: "blur(3px)",
        }} />
        <div style={{
          position: "relative",
          width: "32px",
          height: "36px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <svg viewBox="0 0 32 36" width="32" height="36" style={{ position: "absolute" }}>
            <path
              d="M16 2 L28 8 L28 18 C28 26 22 32 16 34 C10 32 4 26 4 18 L4 8 Z"
              fill={colors.bg}
              stroke={colors.border}
              strokeWidth="1.5"
            />
          </svg>
          <Truck style={{
            width: "12px",
            height: "12px",
            color: colors.border,
            position: "relative",
            zIndex: 1,
            marginTop: "-2px",
          }} />
        </div>
      </div>
      <span style={{
        fontSize: "13px",
        fontWeight: "800",
        color: colors.border,
        textShadow: `0 0 8px rgba(${colors.glow}, 0.6)`,
      }}>
        {streak}
      </span>
    </div>
  );
}

function SpeedometerStreak({ streak }: { streak: number }) {
  const nextMilestone = streak >= 30 ? 60 : streak >= 14 ? 30 : streak >= 7 ? 14 : 7;
  const prevMilestone = streak >= 30 ? 30 : streak >= 14 ? 14 : streak >= 7 ? 7 : 0;
  const progress = (streak - prevMilestone) / (nextMilestone - prevMilestone);
  const angle = -135 + (progress * 270);
  const arcEnd = progress * 270;

  const polarToCartesian = (cx: number, cy: number, r: number, angleDeg: number) => {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  const describeArc = (cx: number, cy: number, r: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(cx, cy, r, startAngle);
    const end = polarToCartesian(cx, cy, r, endAngle);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
  };

  return (
    <div className="flex items-center gap-1">
      <div style={{ position: "relative", width: "34px", height: "34px" }}>
        <svg viewBox="0 0 34 34" width="34" height="34">
          <path
            d={describeArc(17, 17, 14, -135, 135)}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d={describeArc(17, 17, 14, -135, -135 + arcEnd)}
            fill="none"
            stroke="url(#gaugeGrad)"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#22c55e" />
            </linearGradient>
          </defs>
          <line
            x1="17"
            y1="17"
            x2={17 + 9 * Math.cos((angle - 90) * Math.PI / 180)}
            y2={17 + 9 * Math.sin((angle - 90) * Math.PI / 180)}
            stroke="#f97316"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <circle cx="17" cy="17" r="2" fill="#f97316" />
        </svg>
        <div style={{
          position: "absolute",
          bottom: "2px",
          left: "50%",
          transform: "translateX(-50%)",
          fontSize: "7px",
          color: "rgba(255,255,255,0.4)",
          fontWeight: "600",
        }}>
          {nextMilestone}
        </div>
      </div>
      <span style={{
        fontSize: "14px",
        fontWeight: "800",
        color: "#f97316",
      }}>
        {streak}
      </span>
    </div>
  );
}

export default function StreakDemo() {
  const [streak, setStreak] = useState(12);

  const streakValues = [1, 3, 7, 12, 14, 21, 30, 45];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto p-4 space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/">
            <Button size="icon" variant="ghost" data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Streak Design Concepts</h1>
        </div>

        <Card className="p-4 space-y-3">
          <p className="text-sm text-muted-foreground">Test with different streak values:</p>
          <div className="flex gap-2 flex-wrap">
            {streakValues.map((v) => (
              <Button
                key={v}
                size="sm"
                variant={streak === v ? "default" : "outline"}
                onClick={() => setStreak(v)}
                data-testid={`button-streak-${v}`}
              >
                {v}
              </Button>
            ))}
          </div>
        </Card>

        <Card className="p-4 space-y-1">
          <h2 className="text-lg font-bold mb-3">Option 1: Fire Streak</h2>
          <p className="text-xs text-muted-foreground mb-4">Van with fire effect. Flame grows with streak intensity.</p>
          <div style={{
            background: "linear-gradient(135deg, rgba(249, 115, 22, 0.08) 0%, transparent 50%)",
            borderRadius: "16px",
            padding: "16px 20px",
            border: "1px solid rgba(255,255,255,0.1)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <div>
              <span style={{ fontSize: "24px", fontWeight: "bold", color: "white" }}>
                Master<span style={{ color: "#f97316" }}>SIXT</span>
              </span>
            </div>
            <FireStreak streak={streak} />
          </div>
        </Card>

        <Card className="p-4 space-y-1">
          <h2 className="text-lg font-bold mb-3">Option 2: Road Trip</h2>
          <p className="text-xs text-muted-foreground mb-4">Van driving along a road toward the next milestone.</p>
          <div style={{
            background: "linear-gradient(135deg, rgba(249, 115, 22, 0.08) 0%, transparent 50%)",
            borderRadius: "16px",
            padding: "16px 20px",
            border: "1px solid rgba(255,255,255,0.1)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <div>
              <span style={{ fontSize: "24px", fontWeight: "bold", color: "white" }}>
                Master<span style={{ color: "#f97316" }}>SIXT</span>
              </span>
            </div>
            <RoadTripStreak streak={streak} />
          </div>
        </Card>

        <Card className="p-4 space-y-1">
          <h2 className="text-lg font-bold mb-3">Option 3: Shield Badge</h2>
          <p className="text-xs text-muted-foreground mb-4">Achievement badge. Bronze → Silver → Gold → Diamond tiers.</p>
          <div style={{
            background: "linear-gradient(135deg, rgba(249, 115, 22, 0.08) 0%, transparent 50%)",
            borderRadius: "16px",
            padding: "16px 20px",
            border: "1px solid rgba(255,255,255,0.1)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <div>
              <span style={{ fontSize: "24px", fontWeight: "bold", color: "white" }}>
                Master<span style={{ color: "#f97316" }}>SIXT</span>
              </span>
            </div>
            <ShieldStreak streak={streak} />
          </div>
        </Card>

        <Card className="p-4 space-y-1">
          <h2 className="text-lg font-bold mb-3">Option 4: Speedometer</h2>
          <p className="text-xs text-muted-foreground mb-4">Racing gauge filling up toward the next milestone.</p>
          <div style={{
            background: "linear-gradient(135deg, rgba(249, 115, 22, 0.08) 0%, transparent 50%)",
            borderRadius: "16px",
            padding: "16px 20px",
            border: "1px solid rgba(255,255,255,0.1)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <div>
              <span style={{ fontSize: "24px", fontWeight: "bold", color: "white" }}>
                Master<span style={{ color: "#f97316" }}>SIXT</span>
              </span>
            </div>
            <SpeedometerStreak streak={streak} />
          </div>
        </Card>

        <footer className="mt-8 pt-8 border-t border-white/10 text-center space-y-1">
          <p className="text-xs text-muted-foreground">Pick your favorite and let me know!</p>
        </footer>
      </div>
    </div>
  );
}
