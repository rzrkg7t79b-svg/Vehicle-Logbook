import { useState, useEffect, useCallback, useRef } from "react";
import { Lock, Timer } from "lucide-react";
import { UserContext } from "@/contexts/UserContext";
import type { User } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface PinGateProps {
  children: React.ReactNode;
}

const STORAGE_KEY = "bodyshop_auth";
const TIMEOUT_SECONDS = 5 * 60;

export function PinGate({ children }: PinGateProps) {
  const [pin, setPin] = useState("");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(TIMEOUT_SECONDS);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

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
    if (pin.length < 4 && !isLoading) {
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
        } catch {
          setError(true);
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
    if (!isLoading) {
      setPin(pin.slice(0, -1));
      setError(false);
    }
  };

  if (isUnlocked && currentUser) {
    return (
      <UserContext.Provider value={{ user: currentUser, logout }}>
        <div className="relative">
          <div className="fixed top-3 right-3 z-50 flex items-center gap-2.5 px-2.5 py-1.5 bg-card/90 backdrop-blur border border-white/10 rounded-lg shadow-lg">
            <span className="text-xs font-bold text-primary">{currentUser.initials}</span>
            <div className="w-px h-3 bg-white/10" />
            <Timer className="w-3.5 h-3.5 text-muted-foreground" />
            <span className={`text-xs font-mono font-bold ${secondsLeft <= 60 ? 'text-red-500' : 'text-muted-foreground'}`}>
              {formatTime(secondsLeft)}
            </span>
          </div>
          {children}
        </div>
      </UserContext.Provider>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-xs">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">
            Bodyshop<span className="text-primary">SIXT</span>
          </h1>
          <p className="text-sm text-muted-foreground">Enter PIN to access</p>
        </div>

        <div className="flex justify-center gap-3 mb-8">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full border-2 transition-all ${
                error 
                  ? "bg-red-500 border-red-500" 
                  : pin.length > i 
                    ? "bg-primary border-primary" 
                    : "border-white/20"
              }`}
            />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
            <button
              key={digit}
              onClick={() => handleDigit(digit.toString())}
              disabled={isLoading}
              className="h-16 rounded-xl bg-card border border-white/10 text-2xl font-bold text-white hover:bg-white/5 active:scale-95 transition-all disabled:opacity-50"
              data-testid={`pin-digit-${digit}`}
            >
              {digit}
            </button>
          ))}
          <button
            onClick={handleBackspace}
            disabled={isLoading}
            className="h-16 rounded-xl bg-card border border-white/10 text-lg font-medium text-muted-foreground hover:bg-white/5 active:scale-95 transition-all disabled:opacity-50"
            data-testid="pin-backspace"
          >
            Del
          </button>
          <button
            onClick={() => handleDigit("0")}
            disabled={isLoading}
            className="h-16 rounded-xl bg-card border border-white/10 text-2xl font-bold text-white hover:bg-white/5 active:scale-95 transition-all disabled:opacity-50"
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
