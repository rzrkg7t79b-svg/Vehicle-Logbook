import { storage } from "./storage";

function getMillisecondsUntilMidnightBerlin(): number {
  const now = new Date();
  const berlinFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  
  const parts = berlinFormatter.formatToParts(now);
  const getPart = (type: string) => parts.find(p => p.type === type)?.value || '0';
  
  const berlinHour = parseInt(getPart('hour'), 10);
  const berlinMinute = parseInt(getPart('minute'), 10);
  const berlinSecond = parseInt(getPart('second'), 10);
  
  const secondsUntilMidnight = (24 * 60 * 60) - (berlinHour * 3600 + berlinMinute * 60 + berlinSecond);
  return secondsUntilMidnight * 1000;
}

async function performMidnightReset(): Promise<void> {
  console.log(`[scheduler] Performing midnight reset at ${new Date().toISOString()}`);
  
  try {
    await storage.performMidnightReset();
    console.log('[scheduler] Midnight reset completed successfully');
  } catch (error) {
    console.error('[scheduler] Midnight reset failed:', error);
  }
}

function scheduleMidnightReset(): void {
  const msUntilMidnight = getMillisecondsUntilMidnightBerlin();
  const hoursUntilMidnight = Math.floor(msUntilMidnight / (1000 * 60 * 60));
  const minutesUntilMidnight = Math.floor((msUntilMidnight % (1000 * 60 * 60)) / (1000 * 60));
  
  console.log(`[scheduler] Next midnight reset in ${hoursUntilMidnight}h ${minutesUntilMidnight}m (Berlin time)`);
  
  setTimeout(async () => {
    await performMidnightReset();
    scheduleMidnightReset();
  }, msUntilMidnight + 1000);
}

export function initScheduler(): void {
  console.log('[scheduler] Initializing midnight reset scheduler');
  scheduleMidnightReset();
}
