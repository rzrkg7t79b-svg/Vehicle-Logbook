import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateVehicle } from "@/hooks/use-vehicles";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function AddVehicle() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createVehicle = useCreateVehicle();

  const [formData, setFormData] = useState({
    city: "",
    letters: "",
    numbers: "",
    name: "",
    notes: "",
    isEv: false,
    countdownStart: format(new Date(), "yyyy-MM-dd"), // HTML date input format
  });

  // Build license plate from parts
  const buildLicensePlate = () => {
    const parts = [formData.city, formData.letters, formData.numbers].filter(Boolean);
    let plate = parts.join(" - ").replace(" - ", " - ");
    if (formData.city && formData.letters) {
      plate = `${formData.city} - ${formData.letters} ${formData.numbers}`.trim();
    } else if (formData.city) {
      plate = formData.city;
    } else {
      plate = "";
    }
    if (formData.isEv && plate) {
      plate += "E";
    }
    return plate.toUpperCase();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.city || !formData.letters || !formData.numbers) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all license plate fields.",
        variant: "destructive",
      });
      return;
    }

    const plate = buildLicensePlate();

    try {
      await createVehicle.mutateAsync({
        licensePlate: plate,
        name: formData.name || null,
        notes: formData.notes || null,
        isEv: formData.isEv,
        countdownStart: new Date(formData.countdownStart),
      });
      
      toast({
        title: "Vehicle Added",
        description: `Registered ${plate} successfully.`,
        variant: "default",
      });
      
      setLocation("/");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create vehicle",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-white/5 px-4 h-16 flex items-center gap-4">
        <button 
          onClick={() => setLocation("/")}
          className="p-2 -ml-2 rounded-full hover:bg-white/5 active:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <h1 className="text-lg font-display font-bold">Add New Vehicle</h1>
      </header>

      <main className="p-4 max-w-lg mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* License Plate Input - Split Fields */}
          <div className="space-y-3">
            <Label className="text-muted-foreground text-xs uppercase tracking-widest font-bold">
              License Plate (Required)
            </Label>
            
            {/* Preview */}
            <div className="p-4 rounded-xl bg-card border border-white/10 text-center">
              <span className="text-2xl font-mono font-bold tracking-wider text-primary">
                {buildLicensePlate() || "_ - __ ____"}
              </span>
            </div>

            {/* Input Row */}
            <div className="flex items-center gap-2">
              {/* City - 1 Letter */}
              <div className="flex flex-col items-center">
                <Input
                  id="city"
                  maxLength={1}
                  placeholder="M"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase() }))}
                  className="w-12 h-14 text-xl font-mono font-bold uppercase text-center bg-card border-white/10 focus:border-primary focus:ring-1 focus:ring-primary"
                  data-testid="input-city"
                />
                <span className="text-[10px] text-muted-foreground mt-1">City</span>
              </div>

              <span className="text-xl text-muted-foreground font-bold">-</span>

              {/* Letters - 2 Letters */}
              <div className="flex flex-col items-center">
                <Input
                  id="letters"
                  maxLength={2}
                  placeholder="XX"
                  value={formData.letters}
                  onChange={(e) => setFormData(prev => ({ ...prev, letters: e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase() }))}
                  className="w-16 h-14 text-xl font-mono font-bold uppercase text-center bg-card border-white/10 focus:border-primary focus:ring-1 focus:ring-primary"
                  data-testid="input-letters"
                />
                <span className="text-[10px] text-muted-foreground mt-1">Letters</span>
              </div>

              {/* Numbers - up to 4 */}
              <div className="flex flex-col items-center flex-1">
                <Input
                  id="numbers"
                  maxLength={4}
                  placeholder="1234"
                  value={formData.numbers}
                  onChange={(e) => setFormData(prev => ({ ...prev, numbers: e.target.value.replace(/[^0-9]/g, '') }))}
                  className="w-full h-14 text-xl font-mono font-bold text-center bg-card border-white/10 focus:border-primary focus:ring-1 focus:ring-primary"
                  data-testid="input-numbers"
                />
                <span className="text-[10px] text-muted-foreground mt-1">Numbers</span>
              </div>

              {/* EV Checkbox */}
              <div className="flex flex-col items-center">
                <label className="flex items-center justify-center w-14 h-14 rounded-lg bg-card border border-white/10 cursor-pointer hover:border-primary/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.isEv}
                    onChange={(e) => setFormData(prev => ({ ...prev, isEv: e.target.checked }))}
                    className="sr-only"
                    data-testid="checkbox-ev"
                  />
                  <span className={`text-xl font-mono font-bold transition-colors ${formData.isEv ? 'text-primary' : 'text-muted-foreground/40'}`}>
                    E
                  </span>
                </label>
                <span className="text-[10px] text-muted-foreground mt-1">EV</span>
              </div>
            </div>
          </div>

          {/* Vehicle Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-muted-foreground text-xs uppercase tracking-widest font-bold">
              Vehicle Model / Name
            </Label>
            <Input
              id="name"
              placeholder="e.g. Ford Transit Custom"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="bg-card border-white/10 h-12"
            />
          </div>

          {/* Start Date */}
          <div className="space-y-2">
            <Label htmlFor="date" className="text-muted-foreground text-xs uppercase tracking-widest font-bold">
              Start Date
            </Label>
            <Input
              id="date"
              type="date"
              required
              value={formData.countdownStart}
              onChange={(e) => setFormData(prev => ({ ...prev, countdownStart: e.target.value }))}
              className="bg-card border-white/10 h-12 text-center font-mono"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-muted-foreground text-xs uppercase tracking-widest font-bold">
              Initial Notes
            </Label>
            <Textarea
              id="notes"
              placeholder="Any initial observations..."
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="bg-card border-white/10 min-h-[100px] resize-none"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <Button 
              type="submit" 
              disabled={createVehicle.isPending}
              className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 rounded-xl"
            >
              {createVehicle.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <Save className="w-5 h-5 mr-2" />
              )}
              {createVehicle.isPending ? "Saving..." : "Save Vehicle"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
