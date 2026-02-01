import { useState, useEffect, useCallback, useRef } from "react";
import { Lock, Timer, AlertTriangle, LogOut } from "lucide-react";
import { UserContext } from "@/contexts/UserContext";
import type { User } from "@/types";
import { useLocation } from "wouter";

interface PinGateProps {
  children: React.ReactNode;
}

const LOCKOUT_STORAGE_KEY = "bodyshop_lockout";
const TIMEOUT_SECONDS = 5 * 60;
const LOCKOUT_SECONDS = 5 * 60;
const MAX_ATTEMPTS = 3;

interface LockoutState {
  failedAttempts: number;
  lockoutEndTime: number | null;
}

export function PinGate({ children }: PinGateProps) {
  const [, setLocation] = useLocation();
  const [pin, setPin] = useState("");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(TIMEOUT_SECONDS);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutEndTime, setLockoutEndTime] = useState<number | null>(null);
  const [lockoutSecondsLeft, setLockoutSecondsLeft] = useState(0);
  const lockoutCountdownRef = useRef<NodeJS.Timeout | null>(null);

  const isLocked = lockoutEndTime !== null && Date.now() < lockoutEndTime;
  const attemptsRemaining = MAX_ATTEMPTS - failedAttempts;

  const saveLockoutState = useCallback((attempts: number, endTime: number | null) => {
    const state: LockoutState = { failedAttempts: attempts, lockoutEndTime: endTime };
    localStorage.setItem(LOCKOUT_STORAGE_KEY, JSON.stringify(state));
  }, []);

  const clearLockoutState = useCallback(() => {
    setFailedAttempts(0);
    setLockoutEndTime(null);
    setLockoutSecondsLeft(0);
    localStorage.removeItem(LOCKOUT_STORAGE_KEY);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(LOCKOUT_STORAGE_KEY);
    if (stored) {
      try {
        const state: LockoutState = JSON.parse(stored);
        if (state.lockoutEndTime && Date.now() < state.lockoutEndTime) {
          setFailedAttempts(state.failedAttempts);
          setLockoutEndTime(state.lockoutEndTime);
          setLockoutSecondsLeft(Math.ceil((state.lockoutEndTime - Date.now()) / 1000));
        } else if (state.lockoutEndTime && Date.now() >= state.lockoutEndTime) {
          clearLockoutState();
        } else {
          setFailedAttempts(state.failedAttempts);
        }
      } catch {
        localStorage.removeItem(LOCKOUT_STORAGE_KEY);
      }
    }
  }, [clearLockoutState]);

  useEffect(() => {
    if (!lockoutEndTime) return;

    const updateLockoutCountdown = () => {
      const remaining = Math.ceil((lockoutEndTime - Date.now()) / 1000);
      if (remaining <= 0) {
        clearLockoutState();
      } else {
        setLockoutSecondsLeft(remaining);
      }
    };

    updateLockoutCountdown();
    lockoutCountdownRef.current = setInterval(updateLockoutCountdown, 1000);

    return () => {
      if (lockoutCountdownRef.current) {
        clearInterval(lockoutCountdownRef.current);
      }
    };
  }, [lockoutEndTime, clearLockoutState]);

  const logout = useCallback(() => {
    setIsUnlocked(false);
    setCurrentUser(null);
    setPin("");
    setSecondsLeft(TIMEOUT_SECONDS);
  }, []);

  const resetTimer = useCallback(() => {
    setSecondsLeft(TIMEOUT_SECONDS);
  }, []);

  useEffect(() => {
    if (!isUnlocked) return;

    const events = ["mousedown", "mousemove", "keydown", "touchstart", "scroll"];
    
    events.forEach(event => {
      document.addEventListener(event, resetTimer);
    });

    countdownRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          logout();
          return TIMEOUT_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetTimer);
      });
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, [isUnlocked, resetTimer, logout]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDigit = async (digit: string) => {
    if (isLocked) return;
    if (isLoading) return;

    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      setError(false);
      
      if (newPin.length === 4) {
        setIsLoading(true);
        
        try {
          const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pin: newPin }),
          });
          
          if (response.ok) {
            const user = await response.json() as User;
            setCurrentUser(user);
            setIsUnlocked(true);
            clearLockoutState();
            setLocation("/");
          } else {
            setError(true);
            const newFailedAttempts = failedAttempts + 1;
            setFailedAttempts(newFailedAttempts);
            
            if (newFailedAttempts >= MAX_ATTEMPTS) {
              const endTime = Date.now() + LOCKOUT_SECONDS * 1000;
              setLockoutEndTime(endTime);
              setLockoutSecondsLeft(LOCKOUT_SECONDS);
              saveLockoutState(newFailedAttempts, endTime);
            } else {
              saveLockoutState(newFailedAttempts, null);
            }
            
            setTimeout(() => {
              setPin("");
              setError(false);
            }, 500);
          }
        } catch {
          setError(true);
          setTimeout(() => {
            setPin("");
            setError(false);
          }, 500);
        }
        
        setIsLoading(false);
      }
    }
  };

  const handleBackspace = () => {
    if (isLocked) return;
    if (!isLoading) {
      setPin(pin.slice(0, -1));
      setError(false);
    }
  };

  if (isUnlocked && currentUser) {
    return (
      <UserContext.Provider value={{ user: currentUser, logout }}>
        <div className="relative pt-14">
          <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 header-glass">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center">
                <span className="text-sm font-bold text-primary">{currentUser.initials}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                <Timer className="w-3.5 h-3.5 text-white/50" />
                <span className={`text-xs font-mono font-semibold ${secondsLeft <= 60 ? 'text-red-400' : 'text-white/60'}`}>
                  {formatTime(secondsLeft)}
                </span>
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white/60 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] hover:border-white/[0.1] rounded-xl transition-all duration-200"
                data-testid="button-logout"
              >
                <LogOut className="w-3.5 h-3.5" />
                Logout
              </button>
            </div>
          </div>
          {children}
        </div>
      </UserContext.Provider>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A0A0A] to-[#111] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-xs">
        <div className="text-center mb-10">
          <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 ${
            isLocked 
              ? "bg-red-500/15 border border-red-500/25 shadow-[0_0_30px_rgba(239,68,68,0.15)]" 
              : "bg-primary/15 border border-primary/25 shadow-[0_0_30px_rgba(255,102,0,0.15)]"
          }`}>
            {isLocked ? (
              <AlertTriangle className="w-9 h-9 text-red-400" />
            ) : (
              <Lock className="w-9 h-9 text-primary" />
            )}
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Master<span className="text-primary text-glow">SIXT</span>
          </h1>
          <p className="text-sm text-white/50">
            {isLocked ? "Login locked" : "Enter PIN to access"}
          </p>
        </div>

        {isLocked && (
          <div className="text-center mb-8 p-5 rounded-2xl bg-red-500/10 border border-red-500/20 shadow-[inset_0_0_20px_rgba(239,68,68,0.1)]">
            <p className="text-sm text-red-300 mb-2">Too many failed attempts</p>
            <p className="text-3xl font-mono font-bold text-red-400" data-testid="lockout-timer">
              {formatTime(lockoutSecondsLeft)}
            </p>
          </div>
        )}

        <div className="flex justify-center gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-all duration-200 ${
                error 
                  ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" 
                  : pin.length > i 
                    ? "bg-primary shadow-[0_0_10px_rgba(255,102,0,0.5)]" 
                    : "bg-white/10 border border-white/20"
              }`}
            />
          ))}
        </div>

        {!isLocked && failedAttempts > 0 && (
          <div className="text-center mb-6" data-testid="attempts-remaining">
            <span className="text-sm text-orange-400">
              {attemptsRemaining} attempt{attemptsRemaining !== 1 ? 's' : ''} left
            </span>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
            <button
              key={digit}
              onClick={() => handleDigit(digit.toString())}
              disabled={isLoading || isLocked}
              className="h-[68px] rounded-2xl bg-gradient-to-b from-[rgba(40,40,40,0.8)] to-[rgba(25,25,25,0.9)] border border-white/[0.08] text-white hover:from-[rgba(50,50,50,0.85)] hover:to-[rgba(35,35,35,0.95)] hover:border-white/[0.12] text-2xl font-semibold transition-all duration-150 disabled:opacity-50 active:scale-[0.96] shadow-[0_4px_12px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)]"
              data-testid={`pin-digit-${digit}`}
            >
              {digit}
            </button>
          ))}
          <button
            onClick={handleBackspace}
            disabled={isLoading || isLocked}
            className="h-[68px] rounded-2xl bg-gradient-to-b from-[rgba(40,40,40,0.8)] to-[rgba(25,25,25,0.9)] border border-white/[0.08] text-white/60 hover:text-white hover:from-[rgba(50,50,50,0.85)] hover:to-[rgba(35,35,35,0.95)] hover:border-white/[0.12] text-lg font-medium transition-all duration-150 disabled:opacity-50 active:scale-[0.96] shadow-[0_4px_12px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)]"
            data-testid="pin-backspace"
          >
            Del
          </button>
          <button
            onClick={() => handleDigit("0")}
            disabled={isLoading || isLocked}
            className="h-[68px] rounded-2xl bg-gradient-to-b from-[rgba(40,40,40,0.8)] to-[rgba(25,25,25,0.9)] border border-white/[0.08] text-white hover:from-[rgba(50,50,50,0.85)] hover:to-[rgba(35,35,35,0.95)] hover:border-white/[0.12] text-2xl font-semibold transition-all duration-150 disabled:opacity-50 active:scale-[0.96] shadow-[0_4px_12px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)]"
            data-testid="pin-digit-0"
          >
            0
          </button>
          <div className="h-[68px]" />
        </div>
        
        {isLoading && (
          <div className="text-center mt-6 text-sm text-white/50">
            Authenticating...
          </div>
        )}
        
        <div className="text-center mt-10 text-xs text-white/30">
          v3.1.5
        </div>
      </div>
    </div>
  );
}
