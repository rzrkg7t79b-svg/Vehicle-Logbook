import { differenceInDays, addDays } from "date-fns";

interface CountdownTimerProps {
  startDate: Date | string;
  size?: "sm" | "lg";
}

export function CountdownTimer({ startDate, size = "sm" }: CountdownTimerProps) {
  const start = new Date(startDate);
  const end = addDays(start, 7);
  const now = new Date();
  const daysLeft = differenceInDays(end, now);
  
  // Status logic
  const isExpired = daysLeft <= 0;
  const isWarning = daysLeft <= 3 && !isExpired;

  // Visual classes
  let colorClass = "text-white";
  let bgClass = "bg-secondary";
  let borderClass = "border-transparent";

  if (isExpired) {
    colorClass = "text-red-500";
    bgClass = "bg-red-500/10";
    borderClass = "border-red-500/20";
  } else if (isWarning) {
    colorClass = "text-orange-500";
    bgClass = "bg-orange-500/10";
    borderClass = "border-orange-500/20";
  } else {
    colorClass = "text-emerald-400";
    bgClass = "bg-emerald-500/10";
    borderClass = "border-emerald-500/20";
  }

  if (size === "lg") {
    return (
      <div className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 ${bgClass} ${borderClass}`}>
        <span className="text-sm font-medium uppercase tracking-widest text-muted-foreground mb-1">
          Time Remaining
        </span>
        <div className={`text-6xl font-black font-mono tracking-tight ${colorClass}`}>
          {isExpired ? "EXPIRED" : `${daysLeft}`}
        </div>
        {!isExpired && (
          <span className={`text-lg font-bold uppercase ${colorClass}`}>Days</span>
        )}
      </div>
    );
  }

  return (
    <div className={`
      flex items-center gap-2 px-3 py-1.5 rounded-lg border ${bgClass} ${borderClass}
    `}>
      <span className={`text-xl font-bold font-mono ${colorClass}`}>
        {isExpired ? "!" : daysLeft}
      </span>
      <span className={`text-[10px] uppercase font-bold tracking-wider ${colorClass}`}>
        {isExpired ? "Exp" : "Days"}
      </span>
    </div>
  );
}
