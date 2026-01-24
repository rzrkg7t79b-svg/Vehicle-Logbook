import { useState, useEffect, useCallback, useRef } from "react";
import { Lock, Timer, AlertTriangle, LogOut } from "lucide-react";
import { UserContext } from "@/contexts/UserContext";
import type { User } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

interface PinGateProps {
  children: React.ReactNode;
}

const STORAGE_KEY = "bodyshop_auth";
const LOCKOUT_STORAGE_KEY = "bodyshop_lockout";
const TIMEOUT_SECONDS = 5 * 60;
const LOCKOUT_SECONDS = 5 * 60;
const MAX_ATTEMPTS = 3;
const MASTER_RESET_CODE = "169949";

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
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);
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
    setIsEmergencyMode(false);
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
    sessionStorage.removeItem(STORAGE_KEY);
    setIsUnlocked(false);
    setCurrentUser(null);
    setPin("");
    setSecondsLeft(TIMEOUT_SECONDS);
  }, []);

  const resetTimer = useCallback(() => {
    setSecondsLeft(TIMEOUT_SECONDS);
  }, []);

  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const user = JSON.parse(stored) as User;
        setCurrentUser(user);
        setIsUnlocked(true);
      } catch {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    }
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
    if (isLocked && !isEmergencyMode) return;
    if (isLoading) return;

    if (isEmergencyMode) {
      const newPin = pin + digit;
      setPin(newPin);
      setError(false);
      
      if (newPin.length === 6) {
        if (newPin === MASTER_RESET_CODE) {
          clearLockoutState();
          setPin("");
        } else {
          setError(true);
          setTimeout(() => {
            setPin("");
            setError(false);
          }, 500);
        }
      }
      return;
    }

    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      setError(false);
      
      if (newPin.length === 4) {
        setIsLoading(true);
        try {
          const response = await apiRequest("POST", "/api/auth/login", { pin: newPin });
          const user = await response.json() as User;
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user));
          setCurrentUser(user);
          setIsUnlocked(true);
          clearLockoutState();
          setLocation("/");
        } catch {
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
        } finally {
          setIsLoading(false);
        }
      }
    }
  };

  const handleBackspace = () => {
    if (isLocked && !isEmergencyMode) return;
    if (!isLoading) {
      setPin(pin.slice(0, -1));
      setError(false);
    }
  };

  const handleEmergencyClick = () => {
    if (!isLocked) return;
    setIsEmergencyMode(true);
    setPin("");
  };

  const handleExitEmergency = () => {
    setIsEmergencyMode(false);
    setPin("");
  };

  if (isUnlocked && currentUser) {
    return (
      <UserContext.Provider value={{ user: currentUser, logout }}>
        <div className="relative pt-14">
          <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-2.5 bg-card/95 backdrop-blur border-b border-white/10">
            <span className="text-sm font-bold text-primary">{currentUser.initials}</span>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <Timer className="w-3.5 h-3.5 text-muted-foreground" />
                <span className={`text-xs font-mono font-bold ${secondsLeft <= 60 ? 'text-red-500' : 'text-muted-foreground'}`}>
                  {formatTime(secondsLeft)}
                </span>
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-white bg-white/5 hover:bg-white/10 rounded-md transition-colors"
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

  const pinDotsCount = isEmergencyMode ? 6 : 4;
  const currentPinLength = pin.length;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-xs">
        <div className="text-center mb-8">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
            isLocked 
              ? "bg-red-500/10 border border-red-500/20" 
              : isEmergencyMode 
                ? "bg-orange-500/10 border border-orange-500/20"
                : "bg-primary/10 border border-primary/20"
          }`}>
            {isLocked ? (
              <AlertTriangle className="w-8 h-8 text-red-500" />
            ) : isEmergencyMode ? (
              <AlertTriangle className="w-8 h-8 text-orange-500" />
            ) : (
              <Lock className="w-8 h-8 text-primary" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">
            {isEmergencyMode ? (
              "Emergency Reset"
            ) : (
              <>Master<span className="text-primary">SIXT</span></>
            )}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isEmergencyMode 
              ? "Enter 6-digit master reset code"
              : isLocked 
                ? "Login locked" 
                : "Enter PIN to access"
            }
          </p>
        </div>

        {isLocked && !isEmergencyMode && (
          <div className="text-center mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <p className="text-sm text-red-400 mb-2">Too many failed attempts</p>
            <p className="text-2xl font-mono font-bold text-red-500" data-testid="lockout-timer">
              {formatTime(lockoutSecondsLeft)}
            </p>
          </div>
        )}

        <div className="flex justify-center gap-3 mb-4">
          {Array.from({ length: pinDotsCount }).map((_, i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full border-2 transition-all ${
                error 
                  ? "bg-red-500 border-red-500" 
                  : currentPinLength > i 
                    ? isEmergencyMode 
                      ? "bg-orange-500 border-orange-500"
                      : "bg-primary border-primary" 
                    : "border-white/20"
              }`}
            />
          ))}
        </div>

        {!isLocked && !isEmergencyMode && failedAttempts > 0 && (
          <div className="text-center mb-4" data-testid="attempts-remaining">
            <span className="text-sm text-orange-400">
              {attemptsRemaining} attempt{attemptsRemaining !== 1 ? 's' : ''} left
            </span>
          </div>
        )}

        {isLocked && !isEmergencyMode && (
          <div className="text-center mb-4">
            <button
              onClick={handleEmergencyClick}
              className="px-4 py-2 bg-orange-500/20 border border-orange-500/40 rounded-lg text-orange-400 font-medium hover:bg-orange-500/30 active:scale-95 transition-all"
              data-testid="button-emergency"
            >
              Emergency
            </button>
          </div>
        )}

        {isEmergencyMode && (
          <div className="text-center mb-4">
            <button
              onClick={handleExitEmergency}
              className="text-sm text-muted-foreground hover:text-white transition-colors"
              data-testid="button-exit-emergency"
            >
              Cancel
            </button>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
            <button
              key={digit}
              onClick={() => handleDigit(digit.toString())}
              disabled={isLoading || (isLocked && !isEmergencyMode)}
              className={`h-16 rounded-xl border text-2xl font-bold transition-all disabled:opacity-50 ${
                isEmergencyMode 
                  ? "bg-orange-500/10 border-orange-500/20 text-orange-100 hover:bg-orange-500/20" 
                  : "bg-card border-white/10 text-white hover:bg-white/5"
              } active:scale-95`}
              data-testid={`pin-digit-${digit}`}
            >
              {digit}
            </button>
          ))}
          <button
            onClick={handleBackspace}
            disabled={isLoading || (isLocked && !isEmergencyMode)}
            className={`h-16 rounded-xl border text-lg font-medium transition-all disabled:opacity-50 ${
              isEmergencyMode 
                ? "bg-orange-500/10 border-orange-500/20 text-orange-300 hover:bg-orange-500/20" 
                : "bg-card border-white/10 text-muted-foreground hover:bg-white/5"
            } active:scale-95`}
            data-testid="pin-backspace"
          >
            Del
          </button>
          <button
            onClick={() => handleDigit("0")}
            disabled={isLoading || (isLocked && !isEmergencyMode)}
            className={`h-16 rounded-xl border text-2xl font-bold transition-all disabled:opacity-50 ${
              isEmergencyMode 
                ? "bg-orange-500/10 border-orange-500/20 text-orange-100 hover:bg-orange-500/20" 
                : "bg-card border-white/10 text-white hover:bg-white/5"
            } active:scale-95`}
            data-testid="pin-digit-0"
          >
            0
          </button>
          <div className="h-16" />
        </div>
        
        {isLoading && (
          <div className="text-center mt-4 text-sm text-muted-foreground">
            Authenticating...
          </div>
        )}
      </div>
    </div>
  );
}
