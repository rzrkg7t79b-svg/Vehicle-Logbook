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
    licensePlate: "",
    name: "",
    notes: "",
    isEv: false,
    countdownStart: format(new Date(), "yyyy-MM-dd"), // HTML date input format
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // License Plate Formatting Logic
    let plate = formData.licensePlate.toUpperCase().trim();
    
    // EV Logic: auto-append 'E' if not present
    if (formData.isEv && !plate.endsWith('E')) {
      plate += 'E';
    }

    try {
      await createVehicle.mutateAsync({
        ...formData,
        licensePlate: plate,
        countdownStart: new Date(formData.countdownStart), // Convert string to Date
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
          
          {/* License Plate Input */}
          <div className="space-y-2">
            <Label htmlFor="plate" className="text-muted-foreground text-xs uppercase tracking-widest font-bold">
              License Plate (Required)
            </Label>
            <Input
              id="plate"
              required
              placeholder="M - XX 1234"
              value={formData.licensePlate}
              onChange={(e) => setFormData(prev => ({ ...prev, licensePlate: e.target.value.toUpperCase() }))}
              className="h-16 text-2xl font-mono font-bold tracking-wider uppercase text-center bg-card border-white/10 focus:border-primary focus:ring-1 focus:ring-primary"
            />
            <p className="text-xs text-muted-foreground text-center">
              Format: City - Letters Numbers
            </p>
          </div>

          {/* EV Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-white/5">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">Electric Vehicle</Label>
              <p className="text-xs text-muted-foreground">Automatically appends 'E' to plate</p>
            </div>
            <Switch
              checked={formData.isEv}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isEv: checked }))}
            />
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
