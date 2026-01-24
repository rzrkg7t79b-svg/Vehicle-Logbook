import { Input } from "@/components/ui/input";

interface LicensePlateInputProps {
  city: string;
  letters: string;
  numbers: string;
  isEv: boolean;
  onCityChange: (value: string) => void;
  onLettersChange: (value: string) => void;
  onNumbersChange: (value: string) => void;
  onEvChange: (value: boolean) => void;
  showPreview?: boolean;
}

export function LicensePlateInput({
  city,
  letters,
  numbers,
  isEv,
  onCityChange,
  onLettersChange,
  onNumbersChange,
  onEvChange,
  showPreview = true,
}: LicensePlateInputProps) {
  const buildLicensePlate = () => {
    let plate = "";
    if (city && letters) {
      plate = `${city} - ${letters} ${numbers}`.trim();
    } else if (city) {
      plate = city;
    }
    if (isEv && plate) {
      plate += "E";
    }
    return plate.toUpperCase();
  };

  return (
    <div className="space-y-4">
      {showPreview && (
        <div className="flex justify-center">
          <div className="flex items-stretch rounded-md overflow-hidden border-2 border-black shadow-lg">
            <div className="w-10 bg-[#003399] flex flex-col items-center justify-center py-2">
              <div className="w-6 h-6 rounded-full border border-yellow-400 flex items-center justify-center mb-1 relative">
                {[...Array(12)].map((_, i) => (
                  <div 
                    key={i} 
                    className="absolute w-1 h-1 bg-yellow-400 rounded-full"
                    style={{
                      transform: `rotate(${i * 30}deg) translateY(-8px)`
                    }}
                  />
                ))}
              </div>
              <span className="text-white text-sm font-bold">D</span>
            </div>
            <div className="bg-white px-4 py-3 flex items-center min-w-[220px]">
              <span className="text-2xl font-bold tracking-wide text-black font-mono">
                {buildLicensePlate() || (
                  <span className="text-gray-300">M - AB 1234</span>
                )}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <div className="flex flex-col items-center">
          <Input
            maxLength={3}
            placeholder="M"
            value={city}
            onChange={(e) => onCityChange(e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase())}
            className="w-14 h-14 text-xl font-mono font-bold uppercase text-center bg-white text-black border-2 border-black rounded-sm focus:border-primary focus:ring-1 focus:ring-primary"
            data-testid="input-plate-city"
          />
          <span className="text-[10px] text-muted-foreground mt-1">City</span>
        </div>

        <span className="text-xl text-muted-foreground font-bold">-</span>

        <div className="flex flex-col items-center">
          <Input
            maxLength={2}
            placeholder="AB"
            value={letters}
            onChange={(e) => onLettersChange(e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase())}
            className="w-14 h-14 text-xl font-mono font-bold uppercase text-center bg-white text-black border-2 border-black rounded-sm focus:border-primary focus:ring-1 focus:ring-primary"
            data-testid="input-plate-letters"
          />
          <span className="text-[10px] text-muted-foreground mt-1">Letters</span>
        </div>

        <div className="flex flex-col items-center flex-1">
          <Input
            maxLength={4}
            placeholder="1234"
            value={numbers}
            onChange={(e) => onNumbersChange(e.target.value.replace(/[^0-9]/g, ''))}
            className="w-full h-14 text-xl font-mono font-bold text-center bg-white text-black border-2 border-black rounded-sm focus:border-primary focus:ring-1 focus:ring-primary"
            data-testid="input-plate-numbers"
          />
          <span className="text-[10px] text-muted-foreground mt-1">Numbers</span>
        </div>

        <div className="flex flex-col items-center">
          <label className={`flex items-center justify-center w-14 h-14 rounded-sm cursor-pointer transition-all border-2 ${isEv ? 'bg-green-500 border-green-600 text-white' : 'bg-white border-black text-gray-300 hover:border-primary/50'}`}>
            <input
              type="checkbox"
              checked={isEv}
              onChange={(e) => onEvChange(e.target.checked)}
              className="sr-only"
              data-testid="checkbox-plate-ev"
            />
            <span className="text-xl font-mono font-bold">
              E
            </span>
          </label>
          <span className="text-[10px] text-muted-foreground mt-1">EV</span>
        </div>
      </div>
    </div>
  );
}

export function buildPlateFromParts(city: string, letters: string, numbers: string, isEv: boolean): string {
  let plate = "";
  if (city && letters) {
    plate = `${city} - ${letters} ${numbers}`.trim();
  } else if (city) {
    plate = city;
  }
  if (isEv && plate) {
    plate += "E";
  }
  return plate.toUpperCase();
}
