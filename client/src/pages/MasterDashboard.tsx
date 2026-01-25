import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Clock, Car, ClipboardCheck, CheckSquare, AlertTriangle, CheckCircle, Workflow, Share2, TrendingUp, Truck, Lock, Plane, RotateCcw } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { getSecondsUntilGermanTime, formatCountdown, isOverdue, getGermanDateString, isAfterGermanTime } from "@/lib/germanTime";
import { useUser } from "@/contexts/UserContext";
import { ExportPreview } from "@/components/ExportPreview";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Todo, DriverTask, FlowTask, FuturePlanning } from "@shared/schema";

type PendingUpgradeVehicle = {
  id: number;
  licensePlate: string;
  model: string;
  isVan: boolean;
};

type DashboardStatus = {
  timedriver: { isDone: boolean; details?: string };
  upgrade: { isDone: boolean; hasPending: boolean; isOverdue: boolean; pendingVehicles?: PendingUpgradeVehicle[] };
  flow: { isDone: boolean; pending: number; total: number };
  todo: { isDone: boolean; completed: number; total: number; postponed?: number };
  quality: { isDone: boolean; passedChecks: number; incompleteTasks: number };
  bodyshop: { isDone: boolean; vehiclesWithoutComment: number; total: number };
  future: { isDone: boolean; isLocked: boolean; data?: FuturePlanning };
  overallProgress: number;
  hasPostponedTasks?: boolean;
};

const MODULES = [
  { id: "timedriver", name: "TimeDriverSIXT", icon: Clock, path: "/timedriver", targetHour: 8, targetMinute: 0 },
  { id: "upgrade", name: "UpgradeSIXT", icon: TrendingUp, path: "/upgrade", targetHour: 8, targetMinute: 30 },
  { id: "flow", name: "FlowSIXT", icon: Workflow, path: "/flow", targetHour: null, targetMinute: null },
  { id: "bodyshop", name: "BodyshopSIXT", icon: Car, path: "/bodyshop", targetHour: null, targetMinute: null },
  { id: "todo", name: "ToDoSIXT", icon: CheckSquare, path: "/todo", targetHour: null, targetMinute: null },
  { id: "quality", name: "QualitySIXT", icon: ClipboardCheck, path: "/quality", targetHour: null, targetMinute: null },
];

export default function MasterDashboard() {
  const { user } = useUser();
  const { toast } = useToast();
  const [masterCountdown, setMasterCountdown] = useState(getSecondsUntilGermanTime(16, 30));
  const [masterOverdue, setMasterOverdue] = useState(isOverdue(16, 30));
  const [showExportPreview, setShowExportPreview] = useState(false);
  const [futureUnlocked, setFutureUnlocked] = useState(isAfterGermanTime(15, 0));
  const [futureAdminUnlocked, setFutureAdminUnlocked] = useState(false);
  const [futureTapCount, setFutureTapCount] = useState(0);
  const [showFutureUnlockDialog, setShowFutureUnlockDialog] = useState(false);
  const [futureUnlockPin, setFutureUnlockPin] = useState("");
  const todayDate = getGermanDateString();

  const [futureForm, setFutureForm] = useState({
    reservationsTotal: "",
    reservationsCar: "",
    reservationsVan: "",
    reservationsTas: "",
    deliveriesTomorrow: "",
    collectionsOpen: "",
  });
  const [futureValidationError, setFutureValidationError] = useState(false);

  const futureTapTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleFutureCardTap = () => {
    if (futureUnlocked || futureAdminUnlocked || futureIsDone) return;
    
    if (futureTapTimeoutRef.current) {
      clearTimeout(futureTapTimeoutRef.current);
    }
    
    const newCount = futureTapCount + 1;
    setFutureTapCount(newCount);
    
    if (newCount >= 3) {
      setShowFutureUnlockDialog(true);
      setFutureTapCount(0);
    } else {
      futureTapTimeoutRef.current = setTimeout(() => {
        setFutureTapCount(0);
      }, 1500);
    }
  };

  const handleFutureUnlockSubmit = async () => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: futureUnlockPin }),
      });
      
      if (res.ok) {
        const userData = await res.json();
        if (userData.isAdmin) {
          setFutureAdminUnlocked(true);
          setShowFutureUnlockDialog(false);
          setFutureUnlockPin("");
          toast({ title: "FutureSIXT unlocked by admin" });
        } else {
          toast({ title: "Admin access required", variant: "destructive" });
        }
      } else {
        toast({ title: "Invalid PIN", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error verifying PIN", variant: "destructive" });
    }
  };

  const { data: todos = [] } = useQuery<Todo[]>({
    queryKey: ["/api/todos"],
  });

  const { data: driverTasks = [] } = useQuery<DriverTask[]>({
    queryKey: ["/api/driver-tasks"],
  });

  const { data: flowTasks = [] } = useQuery<FlowTask[]>({
    queryKey: ["/api/flow-tasks"],
  });

  const { data: dashboardStatus } = useQuery<DashboardStatus>({
    queryKey: ["/api/dashboard/status", todayDate],
    queryFn: async () => {
      const res = await fetch(`/api/dashboard/status?date=${todayDate}`);
      return res.json();
    },
    refetchInterval: 30000,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setMasterCountdown(getSecondsUntilGermanTime(16, 30));
      setMasterOverdue(isOverdue(16, 30));
      setFutureUnlocked(isAfterGermanTime(15, 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const saveFutureMutation = useMutation({
    mutationFn: async (data: {
      date: string;
      reservationsTotal: number;
      reservationsCar: number;
      reservationsVan: number;
      reservationsTas: number;
      deliveriesTomorrow: number;
      collectionsOpen: number;
      savedBy?: string;
    }) => {
      return apiRequest("POST", "/api/future-planning", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/future-planning"] });
      toast({ title: "FutureSIXT saved successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error saving", description: error.message, variant: "destructive" });
    },
  });

  const deleteFutureMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/future-planning/${todayDate}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/future-planning"] });
      setFutureForm({
        reservationsTotal: "",
        reservationsCar: "",
        reservationsVan: "",
        reservationsTas: "",
        deliveriesTomorrow: "",
        collectionsOpen: "",
      });
      setFutureValidationError(false);
    },
  });

  const getModuleStatus = (moduleId: string): boolean => {
    if (!dashboardStatus) return false;
    switch (moduleId) {
      case "timedriver": return dashboardStatus.timedriver.isDone;
      case "upgrade": return dashboardStatus.upgrade.isDone;
      case "flow": return dashboardStatus.flow.isDone;
      case "todo": return dashboardStatus.todo.isDone;
      case "quality": return dashboardStatus.quality.isDone;
      case "bodyshop": return dashboardStatus.bodyshop.isDone;
      default: return false;
    }
  };

  const getModuleDetails = (moduleId: string): string | null => {
    if (!dashboardStatus) return null;
    switch (moduleId) {
      case "timedriver": 
        return dashboardStatus.timedriver.isDone ? "Calculation saved" : "Due before 8:00";
      case "upgrade":
        if (dashboardStatus.upgrade.isDone) return "Sale completed";
        if (dashboardStatus.upgrade.hasPending) return "Pending sale";
        if (dashboardStatus.upgrade.isOverdue) return "Overdue!";
        return "Define UP by 08:30";
      case "flow":
        if (dashboardStatus.flow.total === 0) return "No tasks";
        return dashboardStatus.flow.isDone 
          ? "All done" 
          : `${dashboardStatus.flow.pending} pending`;
      case "todo": 
        const postponed = dashboardStatus.todo.postponed || 0;
        const todoText = `${dashboardStatus.todo.completed}/${dashboardStatus.todo.total} tasks`;
        return postponed > 0 ? `${todoText}, ${postponed} postponed` : todoText;
      case "quality": 
        return `${dashboardStatus.quality.passedChecks}/5 checks, ${dashboardStatus.quality.incompleteTasks} pending`;
      case "bodyshop": 
        if (dashboardStatus.bodyshop.total === 0) return "No vehicles";
        return dashboardStatus.bodyshop.isDone 
          ? "All commented" 
          : `${dashboardStatus.bodyshop.vehiclesWithoutComment} need comment`;
      default: return null;
    }
  };

  const totalProgress = dashboardStatus?.overallProgress ?? 0;

  const completedTodos = dashboardStatus?.todo.completed ?? 0;
  const totalTodos = dashboardStatus?.todo.total ?? 0;
  const todoProgress = totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0;

  const pendingDriverTasks = driverTasks.filter(t => !t.completed);
  const pendingFlowTasks = flowTasks.filter(t => !t.completed);
  const isDriver = user?.roles?.includes("Driver");
  const isAdminOrCounter = user?.isAdmin || user?.roles?.includes("Counter");

  const futureIsDone = dashboardStatus?.future?.isDone ?? false;
  const futureData = dashboardStatus?.future?.data;

  const handleFutureInputChange = (field: keyof typeof futureForm, value: string) => {
    const numValue = value.replace(/\D/g, "").slice(0, 2);
    setFutureForm(prev => ({ ...prev, [field]: numValue }));
    setFutureValidationError(false);
  };

  const validateFutureForm = (): boolean => {
    const total = parseInt(futureForm.reservationsTotal) || 0;
    const car = parseInt(futureForm.reservationsCar) || 0;
    const van = parseInt(futureForm.reservationsVan) || 0;
    const tas = parseInt(futureForm.reservationsTas) || 0;
    return car + van + tas === total;
  };

  const handleSaveFuture = () => {
    if (!validateFutureForm()) {
      setFutureValidationError(true);
      toast({ title: "Validation Error", description: "Car + Van + TAS must equal Total", variant: "destructive" });
      return;
    }

    saveFutureMutation.mutate({
      date: todayDate,
      reservationsTotal: parseInt(futureForm.reservationsTotal) || 0,
      reservationsCar: parseInt(futureForm.reservationsCar) || 0,
      reservationsVan: parseInt(futureForm.reservationsVan) || 0,
      reservationsTas: parseInt(futureForm.reservationsTas) || 0,
      deliveriesTomorrow: parseInt(futureForm.deliveriesTomorrow) || 0,
      collectionsOpen: parseInt(futureForm.collectionsOpen) || 0,
      savedBy: user?.initials,
    });
  };

  return (
    <div className="pb-24">
      <div className="bg-gradient-to-b from-primary/20 to-transparent p-6">
        <h1 className="text-2xl font-bold text-white mb-1">
          Master<span className="text-primary">SIXT</span>
        </h1>
        <p className="text-sm text-muted-foreground">Daily Task Overview</p>
      </div>

      <div className="p-4 space-y-4">
        <Card className={`p-4 ${totalProgress === 100 ? 'border-green-500/50 bg-green-500/10' : ''}`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted-foreground">Daily Progress</span>
            <span className={`text-sm font-bold ${totalProgress === 100 ? 'text-green-500' : 'text-primary'}`}>
              {totalProgress}%
            </span>
          </div>
          <div className="relative h-3 bg-white/10 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                totalProgress === 100 ? 'bg-green-500' : 'bg-primary'
              }`}
              style={{ width: `${totalProgress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {totalProgress === 100 ? 'All modules completed' : 'Complete all modules before 16:30'}
          </p>
          {dashboardStatus?.hasPostponedTasks && 
           dashboardStatus?.todo.completed === dashboardStatus?.todo.total && 
           totalProgress < 100 && (
            <p className="text-xs text-orange-400 mt-1">
              Finish postponed tasks for 100%
            </p>
          )}
        </Card>

        <Card className={`p-4 ${masterOverdue ? 'border-red-500/50 bg-red-500/10' : ''}`}>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-muted-foreground">Daily Deadline</span>
              <p className="text-xs text-muted-foreground">16:30 German Time</p>
            </div>
            <div className="text-right">
              {masterOverdue ? (
                <div className="flex items-center gap-2 text-red-500">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="text-lg font-bold">OVERDUE</span>
                </div>
              ) : (
                <span className="text-2xl font-mono font-bold text-primary" data-testid="master-countdown">
                  {formatCountdown(masterCountdown)}
                </span>
              )}
            </div>
          </div>
        </Card>

        <Button
          onClick={() => setShowExportPreview(true)}
          variant="outline"
          className="w-full"
          data-testid="button-export-teams"
        >
          <Share2 className="w-4 h-4 mr-2" />
          Export for Teams
        </Button>

        {isDriver && pendingDriverTasks.length > 0 && (
          <Card className="p-4 border-orange-500/50 bg-orange-500/10">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm font-medium text-orange-400">Driver Tasks Pending</p>
                <p className="text-xs text-muted-foreground">
                  {pendingDriverTasks.length} quality issue{pendingDriverTasks.length !== 1 ? 's' : ''} to address
                </p>
              </div>
            </div>
          </Card>
        )}

        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground px-1">Modules</h2>
          
          {MODULES.map((module, index) => {
            const isDone = getModuleStatus(module.id);
            const details = getModuleDetails(module.id);
            const Icon = module.icon;
            
            return (
              <motion.div
                key={module.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={module.path}>
                  <Card 
                    className={`p-4 hover-elevate cursor-pointer transition-all ${
                      isDone ? 'border-green-500/30 bg-green-500/5' : ''
                    }`}
                    data-testid={`module-card-${module.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          isDone ? 'bg-green-500/20' : 'bg-primary/10'
                        }`}>
                          <Icon className={`w-5 h-5 ${isDone ? 'text-green-500' : 'text-primary'}`} />
                        </div>
                        <div>
                          <p className="font-medium text-white">{module.name}</p>
                          {details && (
                            <p className={`text-xs ${isDone ? 'text-green-400' : 'text-muted-foreground'}`}>
                              {details}
                            </p>
                          )}
                          {module.id === "upgrade" && dashboardStatus?.upgrade.pendingVehicles && dashboardStatus.upgrade.pendingVehicles.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {dashboardStatus.upgrade.pendingVehicles.map((v) => (
                                <div key={v.id} className="flex items-center gap-1 text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded" data-testid={`pending-upgrade-${v.id}`}>
                                  {v.isVan ? <Truck className="w-3 h-3" /> : <Car className="w-3 h-3" />}
                                  <span>{v.licensePlate}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      {isDone ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                      )}
                    </div>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-6 space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground px-1">Tomorrow's Planning</h2>
          
          <Card 
            className={`p-4 ${!(futureUnlocked || futureAdminUnlocked) ? 'border-muted opacity-60 cursor-pointer' : futureIsDone ? 'border-green-500/30 bg-green-500/5' : ''}`}
            data-testid="future-sixt-card"
            onClick={handleFutureCardTap}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  futureIsDone ? 'bg-green-500/20' : !(futureUnlocked || futureAdminUnlocked) ? 'bg-muted/20' : 'bg-primary/10'
                }`}>
                  {!(futureUnlocked || futureAdminUnlocked) ? (
                    <Lock className="w-5 h-5 text-muted-foreground" />
                  ) : futureIsDone ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <Clock className="w-5 h-5 text-primary" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-white">Future<span className="text-primary">SIXT</span></p>
                  <p className={`text-xs ${futureIsDone ? 'text-green-400' : futureAdminUnlocked ? 'text-primary' : 'text-muted-foreground'}`}>
                    {!(futureUnlocked || futureAdminUnlocked)
                      ? "Available after 15:00" 
                      : futureIsDone 
                        ? "Planning saved" 
                        : futureAdminUnlocked 
                          ? "Unlocked by admin"
                          : "Enter tomorrow's numbers"
                    }
                  </p>
                </div>
              </div>
              {futureIsDone && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={(e) => { e.stopPropagation(); deleteFutureMutation.mutate(); }}
                  disabled={deleteFutureMutation.isPending}
                  data-testid="button-future-new"
                >
                  <RotateCcw className="w-4 h-4 mr-1" />
                  New
                </Button>
              )}
            </div>

            {(futureUnlocked || futureAdminUnlocked) && !futureIsDone && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Overall Reservations</Label>
                  <div className="grid grid-cols-1 gap-2">
                    <div>
                      <Label className="text-xs">TOTAL</Label>
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={futureForm.reservationsTotal}
                        onChange={(e) => handleFutureInputChange("reservationsTotal", e.target.value)}
                        className={`text-center ${futureValidationError ? 'border-red-500' : ''}`}
                        placeholder="00"
                        maxLength={2}
                        data-testid="input-future-total"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Split by Type</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <div className="flex items-center gap-1 mb-1">
                        <Car className="w-3 h-3" />
                        <Label className="text-xs">Car</Label>
                      </div>
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={futureForm.reservationsCar}
                        onChange={(e) => handleFutureInputChange("reservationsCar", e.target.value)}
                        className={`text-center ${futureValidationError ? 'border-red-500' : ''}`}
                        placeholder="00"
                        maxLength={2}
                        data-testid="input-future-car"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-1 mb-1">
                        <Truck className="w-3 h-3" />
                        <Label className="text-xs">Van</Label>
                      </div>
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={futureForm.reservationsVan}
                        onChange={(e) => handleFutureInputChange("reservationsVan", e.target.value)}
                        className={`text-center ${futureValidationError ? 'border-red-500' : ''}`}
                        placeholder="00"
                        maxLength={2}
                        data-testid="input-future-van"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-1 mb-1">
                        <Plane className="w-3 h-3" />
                        <Label className="text-xs">TAS</Label>
                      </div>
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={futureForm.reservationsTas}
                        onChange={(e) => handleFutureInputChange("reservationsTas", e.target.value)}
                        className={`text-center ${futureValidationError ? 'border-red-500' : ''}`}
                        placeholder="00"
                        maxLength={2}
                        data-testid="input-future-tas"
                      />
                    </div>
                  </div>
                  {futureValidationError && (
                    <p className="text-xs text-red-500">Car + Van + TAS must equal Total</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Delivery / Collection</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Deliveries Tomorrow</Label>
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={futureForm.deliveriesTomorrow}
                        onChange={(e) => handleFutureInputChange("deliveriesTomorrow", e.target.value)}
                        placeholder="00"
                        maxLength={2}
                        className="text-center"
                        data-testid="input-future-deliveries"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Collections Open</Label>
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={futureForm.collectionsOpen}
                        onChange={(e) => handleFutureInputChange("collectionsOpen", e.target.value)}
                        placeholder="00"
                        maxLength={2}
                        className="text-center"
                        data-testid="input-future-collections"
                      />
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={handleSaveFuture} 
                  className="w-full"
                  disabled={saveFutureMutation.isPending}
                  data-testid="button-future-save"
                >
                  {saveFutureMutation.isPending ? "Saving..." : "Save Planning"}
                </Button>
              </div>
            )}

            {futureIsDone && futureData && (
              <div className="space-y-3 bg-muted/10 rounded-lg p-3">
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground">TOTAL</p>
                    <p className="text-lg font-bold text-white" data-testid="future-saved-total">{futureData.reservationsTotal}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center justify-center gap-1"><Car className="w-3 h-3" /> Car</p>
                    <p className="text-lg font-bold text-white" data-testid="future-saved-car">{futureData.reservationsCar}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center justify-center gap-1"><Truck className="w-3 h-3" /> Van</p>
                    <p className="text-lg font-bold text-white" data-testid="future-saved-van">{futureData.reservationsVan}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center justify-center gap-1"><Plane className="w-3 h-3" /> TAS</p>
                    <p className="text-lg font-bold text-white" data-testid="future-saved-tas">{futureData.reservationsTas}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-center border-t border-muted/20 pt-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Deliveries</p>
                    <p className="text-lg font-bold text-white" data-testid="future-saved-deliveries">{futureData.deliveriesTomorrow}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Collections</p>
                    <p className="text-lg font-bold text-white" data-testid="future-saved-collections">{futureData.collectionsOpen}</p>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      <ExportPreview open={showExportPreview} onOpenChange={setShowExportPreview} />

      <Dialog open={showFutureUnlockDialog} onOpenChange={setShowFutureUnlockDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Admin Unlock</DialogTitle>
            <DialogDescription>
              Enter admin PIN to unlock FutureSIXT before 15:00
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Input
              type="password"
              inputMode="numeric"
              maxLength={4}
              placeholder="Enter 4-digit admin PIN"
              value={futureUnlockPin}
              onChange={(e) => setFutureUnlockPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              className="text-center text-2xl tracking-widest"
              autoFocus
              data-testid="input-future-unlock-pin"
            />
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => { setShowFutureUnlockDialog(false); setFutureUnlockPin(""); }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleFutureUnlockSubmit}
                disabled={futureUnlockPin.length !== 4}
                className="flex-1"
                data-testid="button-future-unlock-submit"
              >
                Unlock
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
