import { useState, useEffect } from "react";
import { Link } from "wouter";
import { ArrowLeft, Users, Calculator, Clock, Edit2, Check, RefreshCw, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUser } from "@/contexts/UserContext";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { getGermanDateString } from "@/lib/germanTime";

const DEFAULT_BUDGET_PER_RENTAL = "16.39";

type DriverResult = { 
  id: number; 
  initials: string; 
  maxHours: number; 
  hourlyRate: number; 
  assignedHours: number; 
  assignedMinutes: number; 
  percent: number;
  overflowHours?: number;
  overflowMinutes?: number;
};

export default function TimeDriver() {
  const { user } = useUser();
  const isAdmin = user?.isAdmin;
  const isCounter = user?.roles?.includes("Counter");
  const canView = isAdmin || isCounter;
  
  const todayDate = getGermanDateString();
  
  const [rentalsToday, setRentalsToday] = useState("");
  const [selectedDrivers, setSelectedDrivers] = useState<number[]>([]);
  const [isCalculated, setIsCalculated] = useState(false);
  const [calculationResult, setCalculationResult] = useState<{
    totalBudget: number;
    drivers: DriverResult[];
  } | null>(null);
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [tempBudget, setTempBudget] = useState("");
  
  const adminHeaders: Record<string, string> = user?.pin ? { "x-admin-pin": user.pin } : {};
  
  const { data: savedCalculation, isLoading: isLoadingSaved } = useQuery<{
    id: number;
    date: string;
    rentals: number;
    budgetPerRental: number;
    totalBudget: number;
    driversData: string;
    calculatedBy: string | null;
    calculatedAt: string | null;
  } | null>({
    queryKey: ["/api/timedriver-calculations", todayDate],
    queryFn: async () => {
      const res = await fetch(`/api/timedriver-calculations/${todayDate}`);
      return res.json();
    },
  });

  const { data: budgetSetting } = useQuery<{ value: string | null }>({
    queryKey: ["/api/settings/budgetPerRental"],
    queryFn: async () => {
      const res = await fetch("/api/settings/budgetPerRental");
      return res.json();
    },
  });

  const budgetPerRental = budgetSetting?.value || DEFAULT_BUDGET_PER_RENTAL;
  
  const { data: driverUsers = [] } = useQuery<{ id: number; initials: string; maxDailyHours: number | null; hourlyRate: number | null }[]>({
    queryKey: ["/api/drivers"],
    queryFn: async () => {
      const res = await fetch("/api/drivers");
      return res.json();
    },
  });

  useEffect(() => {
    if (savedCalculation && driverUsers.length > 0) {
      const savedDrivers: DriverResult[] = JSON.parse(savedCalculation.driversData);
      setRentalsToday(savedCalculation.rentals.toString());
      setSelectedDrivers(savedDrivers.map(d => d.id));
      setCalculationResult({
        totalBudget: savedCalculation.totalBudget,
        drivers: savedDrivers,
      });
      setIsCalculated(true);
    }
  }, [savedCalculation, driverUsers.length]);

  const saveBudgetMutation = useMutation({
    mutationFn: async (value: string) => {
      await apiRequest("PUT", "/api/settings/budgetPerRental", { value }, adminHeaders);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/budgetPerRental"] });
      setIsEditingBudget(false);
    },
  });
  
  const saveCalculationMutation = useMutation({
    mutationFn: async (data: {
      date: string;
      rentals: number;
      budgetPerRental: number;
      totalBudget: number;
      driversData: string;
      calculatedBy?: string;
    }) => {
      return await apiRequest("POST", "/api/timedriver-calculations", data, adminHeaders);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/timedriver-calculations", todayDate] });
    },
  });
  
  const deleteCalculationMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/timedriver-calculations/${todayDate}`, undefined, adminHeaders);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/timedriver-calculations", todayDate] });
    },
  });

  const toggleDriver = (userId: number) => {
    if (isCalculated) return;
    if (selectedDrivers.includes(userId)) {
      setSelectedDrivers(selectedDrivers.filter(id => id !== userId));
    } else {
      setSelectedDrivers([...selectedDrivers, userId]);
    }
  };

  const selectAllDrivers = () => {
    if (isCalculated) return;
    if (selectedDrivers.length === driverUsers.length) {
      setSelectedDrivers([]);
    } else {
      setSelectedDrivers(driverUsers.map(u => u.id));
    }
  };

  const handleCalculate = () => {
    const rentals = Number(rentalsToday);
    const budget = Number(budgetPerRental);
    
    if (!rentals || rentals <= 0) return;
    if (selectedDrivers.length === 0) return;

    const totalBudget = rentals * budget;
    const selectedDriverData = driverUsers.filter(u => selectedDrivers.includes(u.id));
    const totalMaxHours = selectedDriverData.reduce((sum, d) => sum + (d.maxDailyHours || 0), 0);

    if (totalMaxHours === 0) return;

    const drivers = selectedDriverData.map(driver => {
      const maxHours = driver.maxDailyHours || 0;
      const hourlyRate = driver.hourlyRate || 27.08;
      
      const proportion = maxHours / totalMaxHours;
      const driverBudget = proportion * totalBudget;
      
      const calculatedHours = driverBudget / hourlyRate;
      const cappedHours = Math.min(calculatedHours, maxHours);
      
      const assignedHours = Math.floor(cappedHours);
      const assignedMinutes = Math.round((cappedHours - assignedHours) * 60);
      const percent = Math.round((cappedHours / maxHours) * 100);

      // Calculate overflow: if calculated exceeds max, show extra needed (minus 30min grace)
      let overflowHours: number | undefined;
      let overflowMinutes: number | undefined;
      if (calculatedHours > maxHours) {
        const GRACE_TIME_HOURS = 0.5; // 30 minutes grace time
        const rawOverflow = calculatedHours - maxHours - GRACE_TIME_HOURS;
        if (rawOverflow > 0) {
          overflowHours = Math.floor(rawOverflow);
          overflowMinutes = Math.round((rawOverflow - overflowHours) * 60);
        }
      }

      return {
        id: driver.id,
        initials: driver.initials,
        maxHours,
        hourlyRate,
        assignedHours,
        assignedMinutes,
        percent,
        overflowHours,
        overflowMinutes,
      };
    });

    setCalculationResult({ totalBudget, drivers });
    setIsCalculated(true);
    
    saveCalculationMutation.mutate({
      date: todayDate,
      rentals,
      budgetPerRental: budget,
      totalBudget,
      driversData: JSON.stringify(drivers),
      calculatedBy: user?.initials,
    });
  };

  const handleNewCalculation = () => {
    deleteCalculationMutation.mutate();
    setRentalsToday("");
    setSelectedDrivers([]);
    setCalculationResult(null);
    setIsCalculated(false);
  };

  const startEditBudget = () => {
    setTempBudget(budgetPerRental);
    setIsEditingBudget(true);
  };

  const saveBudget = () => {
    const value = tempBudget.replace(",", ".");
    if (!isNaN(Number(value)) && Number(value) > 0) {
      saveBudgetMutation.mutate(value);
    }
  };

  return (
    <div className="pb-24">
      <div className="relative overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-b ${isCalculated ? 'from-green-500/15' : 'from-green-500/10'} via-green-500/5 to-transparent transition-colors`} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[200px] bg-green-500/15 blur-[100px] rounded-full" />
        <div className="relative p-6 pt-8">
          <Link href="/">
            <button className="flex items-center gap-2 text-white/50 hover:text-white mb-4 transition-colors rounded-xl px-3 py-1.5 -ml-3 hover:bg-white/[0.04]" data-testid="button-back">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back to Master</span>
            </button>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">
                TimeDriver<span className="text-green-400">SIXT</span>
              </h1>
              <p className="text-sm text-white/50">
                {isCalculated ? "Calculation Complete" : "Labor Planning Budget Tool"}
              </p>
            </div>
            {isCalculated && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-green-500/15 border border-green-500/25">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-green-400 font-medium text-sm">Done</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {isLoadingSaved ? (
          <Card className="p-8 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
          </Card>
        ) : (
        <>
        <Card className="p-4">
          <h3 className="font-medium text-white mb-3 flex items-center gap-2">
            <Calculator className="w-4 h-4 text-blue-400" />
            Budget Settings
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Rentals Today</label>
              <Input
                type="number"
                value={rentalsToday}
                onChange={(e) => setRentalsToday(e.target.value.replace(/\D/g, ""))}
                placeholder="Enter number of rentals"
                className="bg-background"
                min={0}
                disabled={isCalculated}
                data-testid="input-rentals-today"
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Budget per Rental (EUR) {!isAdmin && <span className="text-muted-foreground">(Admin only)</span>}
              </label>
              {isEditingBudget && isAdmin ? (
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={tempBudget}
                    onChange={(e) => setTempBudget(e.target.value)}
                    className="bg-background"
                    data-testid="input-budget-per-rental"
                  />
                  <Button size="sm" onClick={saveBudget} disabled={saveBudgetMutation.isPending} data-testid="button-save-budget">
                    <Check className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3 py-2 bg-background border border-white/10 rounded-md text-white font-mono">
                    {budgetPerRental} EUR
                  </div>
                  {isAdmin && !isCalculated && (
                    <Button size="icon" variant="outline" onClick={startEditBudget} data-testid="button-edit-budget">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" />
              Select Drivers
            </h3>
            {!isCalculated && (
              <Button size="sm" variant="outline" onClick={selectAllDrivers} data-testid="button-select-all">
                {selectedDrivers.length === driverUsers.length ? "Deselect All" : "Select All"}
              </Button>
            )}
          </div>

          {driverUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No drivers with max daily hours set. Add drivers in User Management.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {driverUsers.map(driver => (
                <button
                  key={driver.id}
                  onClick={() => toggleDriver(driver.id)}
                  disabled={isCalculated}
                  className={`p-3 rounded-lg text-center transition-all ${
                    selectedDrivers.includes(driver.id)
                      ? isCalculated
                        ? "bg-green-500/20 text-green-400 border-2 border-green-500"
                        : "bg-blue-500 text-white border-2 border-blue-400"
                      : "bg-card border border-white/10 text-muted-foreground hover:bg-white/5"
                  } ${isCalculated ? "cursor-default" : ""}`}
                  data-testid={`button-driver-${driver.id}`}
                >
                  <div className="font-bold text-lg">{driver.initials}</div>
                  <div className="text-[10px] opacity-70">
                    {Math.floor(driver.maxDailyHours || 0)}h{(driver.maxDailyHours || 0) % 1 > 0 ? ` ${Math.round(((driver.maxDailyHours || 0) % 1) * 60)}min` : ""}/day
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>

        {!isCalculated ? (
          <Button 
            onClick={handleCalculate} 
            className="w-full" 
            disabled={!rentalsToday || selectedDrivers.length === 0}
            data-testid="button-calculate"
          >
            <Calculator className="w-4 h-4 mr-2" />
            Calculate Working Time
          </Button>
        ) : (
          <Button 
            onClick={handleNewCalculation} 
            className="w-full" 
            variant="outline"
            data-testid="button-new-calculation"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            New Calculation
          </Button>
        )}

        {calculationResult && canView && (
          <Card className="p-4 border-2 border-green-500/30 bg-green-500/5">
            <h3 className="font-medium text-white mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4 text-green-400" />
              Working Time Distribution
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Total Budget: {calculationResult.totalBudget.toFixed(2)} EUR for {rentalsToday} rentals
            </p>

            <div className="space-y-4">
              {calculationResult.drivers.map(driver => (
                <div key={driver.id} className="space-y-2" data-testid={`result-driver-${driver.id}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{driver.initials}</span>
                      <span className="text-xs text-muted-foreground">
                        (max {Math.floor(driver.maxHours)}h{driver.maxHours % 1 > 0 ? ` ${Math.round((driver.maxHours % 1) * 60)}min` : ""}/day)
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-green-400">
                        {driver.assignedHours}h {driver.assignedMinutes}min
                      </span>
                      {(driver.overflowHours !== undefined || driver.overflowMinutes !== undefined) && (
                        <span className="ml-2 text-xs text-orange-400 font-medium" data-testid={`overflow-${driver.id}`}>
                          if needed +{driver.overflowHours || 0}h {driver.overflowMinutes || 0}min
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="relative h-6 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ${
                        driver.percent >= 100 ? 'bg-red-500' : driver.percent >= 80 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(100, driver.percent)}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-bold text-white drop-shadow-lg">
                        {driver.percent}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
        </>
        )}

        <footer className="mt-8 pt-8 border-t border-white/10 text-center space-y-1">
          <p className="text-xs text-muted-foreground">Version v3.1.8</p>
          <p className="text-xs text-muted-foreground">&copy; 2026 by Nathanael Prem</p>
        </footer>
      </div>
    </div>
  );
}
