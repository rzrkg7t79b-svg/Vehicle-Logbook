export function getGermanTime(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Berlin" }));
}

export function getGermanDateString(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Berlin" });
}

export function getSecondsUntilGermanTime(targetHour: number, targetMinute: number): number {
  const now = new Date();
  const germanNow = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Berlin" }));
  
  const target = new Date(germanNow);
  target.setHours(targetHour, targetMinute, 0, 0);
  
  if (germanNow >= target) {
    return 0;
  }
  
  return Math.floor((target.getTime() - germanNow.getTime()) / 1000);
}

export function formatCountdown(totalSeconds: number): string {
  if (totalSeconds <= 0) return "00:00:00";
  
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export function isOverdue(targetHour: number, targetMinute: number): boolean {
  const now = new Date();
  const germanNow = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Berlin" }));
  
  const target = new Date(germanNow);
  target.setHours(targetHour, targetMinute, 0, 0);
  
  return germanNow >= target;
}
