import { useState, useEffect } from "react";
import { Lock } from "lucide-react";

interface PinGateProps {
  children: React.ReactNode;
}

const CORRECT_PIN = "4035";
const STORAGE_KEY = "bodyshop_auth";

export function PinGate({ children }: PinGateProps) {
  const [pin, setPin] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored === "true") {
      setIsUnlocked(true);
    }
  }, []);

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      setError(false);
      
      if (newPin.length === 4) {
        if (newPin === CORRECT_PIN) {
          sessionStorage.setItem(STORAGE_KEY, "true");
          setIsUnlocked(true);
        } else {
          setError(true);
          setTimeout(() => {
            setPin("");
            setError(false);
          }, 500);
        }
      }
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
    setError(false);
  };

  if (isUnlocked) {
    return <>{children}</>;
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
              className="h-16 rounded-xl bg-card border border-white/10 text-2xl font-bold text-white hover:bg-white/5 active:scale-95 transition-all"
              data-testid={`pin-digit-${digit}`}
            >
              {digit}
            </button>
          ))}
          <button
            onClick={handleBackspace}
            className="h-16 rounded-xl bg-card border border-white/10 text-lg font-medium text-muted-foreground hover:bg-white/5 active:scale-95 transition-all"
            data-testid="pin-backspace"
          >
            Del
          </button>
          <button
            onClick={() => handleDigit("0")}
            className="h-16 rounded-xl bg-card border border-white/10 text-2xl font-bold text-white hover:bg-white/5 active:scale-95 transition-all"
            data-testid="pin-digit-0"
          >
            0
          </button>
          <div className="h-16" />
        </div>
      </div>
    </div>
  );
}
