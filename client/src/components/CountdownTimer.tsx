import { useState, useEffect } from "react";
import { addDays } from "date-fns";
import { AlertTriangle } from "lucide-react";

interface CountdownTimerProps {
  startDate: Date | string;
  size?: "sm" | "lg";
  hasCommentToday?: boolean;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

function calculateTimeLeft(startDate: Date | string): TimeLeft {
  const start = new Date(startDate);
  const end = addDays(start, 7);
  const now = new Date();
  const total = end.getTime() - now.getTime();
  
  if (total <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  }
  
  return {
    days: Math.floor(total / (1000 * 60 * 60 * 24)),
    hours: Math.floor((total / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((total / 1000 / 60) % 60),
    seconds: Math.floor((total / 1000) % 60),
    total,
  };
}

function isWorkingDay(): boolean {
  const day = new Date().getDay();
  return day >= 1 && day <= 5;
}

export function CountdownTimer({ startDate, size = "sm", hasCommentToday = true }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => calculateTimeLeft(startDate));
  
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(startDate));
    }, 1000);
    
    return () => clearInterval(timer);
  }, [startDate]);
  
  const isExpired = timeLeft.total <= 0;
  const isWarning = timeLeft.days <= 3 && !isExpired;
  const needsAttention = isWorkingDay() && !hasCommentToday && !isExpired;

  let colorClass = "text-emerald-400";
  let bgClass = "bg-emerald-500/10";
  let borderClass = "border-emerald-500/20";

  if (isExpired) {
    colorClass = "text-red-500";
    bgClass = "bg-red-500/10";
    borderClass = "border-red-500/20";
  } else if (isWarning) {
    colorClass = "text-orange-500";
    bgClass = "bg-orange-500/10";
    borderClass = "border-orange-500/20";
  }

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (size === "lg") {
    return (
      <div className="flex flex-col items-center gap-3">
        <div className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 ${bgClass} ${borderClass}`}>
          <span className="text-sm font-medium uppercase tracking-widest text-muted-foreground mb-2">
            Time Remaining
          </span>
          {isExpired ? (
            <div className={`text-5xl font-black font-mono tracking-tight ${colorClass}`}>
              EXPIRED
            </div>
          ) : (
            <div className="flex items-baseline gap-1">
              <div className="flex flex-col items-center">
                <span className={`text-5xl font-black font-mono ${colorClass}`}>{timeLeft.days}</span>
                <span className="text-[10px] uppercase text-muted-foreground">days</span>
              </div>
              <span className={`text-3xl font-bold ${colorClass}`}>:</span>
              <div className="flex flex-col items-center">
                <span className={`text-5xl font-black font-mono ${colorClass}`}>{pad(timeLeft.hours)}</span>
                <span className="text-[10px] uppercase text-muted-foreground">hrs</span>
              </div>
              <span className={`text-3xl font-bold ${colorClass}`}>:</span>
              <div className="flex flex-col items-center">
                <span className={`text-5xl font-black font-mono ${colorClass}`}>{pad(timeLeft.minutes)}</span>
                <span className="text-[10px] uppercase text-muted-foreground">min</span>
              </div>
              <span className={`text-3xl font-bold ${colorClass}`}>:</span>
              <div className="flex flex-col items-center">
                <span className={`text-5xl font-black font-mono ${colorClass}`}>{pad(timeLeft.seconds)}</span>
                <span className="text-[10px] uppercase text-muted-foreground">sec</span>
              </div>
            </div>
          )}
        </div>
        
        {needsAttention && (
          <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 border border-yellow-500/40 rounded-xl animate-pulse">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            <span className="text-sm font-bold text-yellow-500">Attention: Add daily update!</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {needsAttention && (
        <AlertTriangle className="w-4 h-4 text-yellow-500 animate-pulse" />
      )}
      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${bgClass} ${borderClass}`}>
        {isExpired ? (
          <>
            <span className={`text-xl font-bold font-mono ${colorClass}`}>!</span>
            <span className={`text-[10px] uppercase font-bold tracking-wider ${colorClass}`}>Exp</span>
          </>
        ) : (
          <span className={`text-sm font-bold font-mono ${colorClass}`}>
            {timeLeft.days}d {pad(timeLeft.hours)}:{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}
          </span>
        )}
      </div>
    </div>
  );
}
