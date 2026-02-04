import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Clock, Car, ClipboardCheck, CheckSquare, AlertTriangle, CheckCircle, Workflow, Share2, TrendingUp, Truck, Lock, Plane, RotateCcw, Coffee, ArrowUp, ArrowDown, Minus } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { getSecondsUntilGermanTime, formatCountdown, isOverdue, getGermanDateString, isAfterGermanTime } from "@/lib/germanTime";
import { useUser } from "@/contexts/UserContext";
import { ExportPreview } from "@/components/ExportPreview";
import { DailyBriefingExport } from "@/components/DailyBriefingExport";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Todo, DriverTask, FlowTask, FuturePlanning, KpiMetric } from "@/types";
import { Pencil, DollarSign, Target } from "lucide-react";

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
  breaksixt: { isDone: boolean; isOverdue: boolean; doneBy?: string | null; doneAt?: string | null };
  overallProgress: number;
  hasPostponedTasks?: boolean;
};

const MODULES = [
  { id: "timedriver", name: "TimeDriver", icon: Clock, path: "/timedriver", targetHour: 8, targetMinute: 0, color: "text-green-500", detailColor: "text-green-400" },
  { id: "upgrade", name: "Upgrade", icon: TrendingUp, path: "/upgrade", targetHour: 8, targetMinute: 30, color: "text-blue-500", detailColor: "text-blue-400" },
  { id: "flow", name: "Flow", icon: Workflow, path: "/flow", targetHour: null, targetMinute: null, color: "text-yellow-500", detailColor: "text-yellow-400" },
  { id: "bodyshop", name: "Bodyshop", icon: Car, path: "/bodyshop", targetHour: null, targetMinute: null, color: "text-red-500", detailColor: "text-red-400" },
  { id: "todo", name: "ToDo", icon: CheckSquare, path: "/todo", targetHour: null, targetMinute: null, color: "text-purple-500", detailColor: "text-purple-400" },
  { id: "quality", name: "Quality", icon: ClipboardCheck, path: "/quality", targetHour: null, targetMinute: null, color: "text-cyan-500", detailColor: "text-cyan-400" },
];

export default function MasterDashboard() {
  const { user } = useUser();
  const { toast } = useToast();
  const [masterCountdown, setMasterCountdown] = useState(getSecondsUntilGermanTime(16, 30));
  const [masterOverdue, setMasterOverdue] = useState(isOverdue(16, 30));
  const [breakCountdown, setBreakCountdown] = useState(getSecondsUntilGermanTime(13, 0));
  const [breakOverdue, setBreakOverdue] = useState(isOverdue(13, 0));
  const [showExportPreview, setShowExportPreview] = useState(false);
  const [showDailyBriefing, setShowDailyBriefing] = useState(false);
  const [futureUnlocked, setFutureUnlocked] = useState(isAfterGermanTime(15, 0));
  const [futureAdminUnlocked, setFutureAdminUnlocked] = useState(false);
  const [futureTapCount, setFutureTapCount] = useState(0);
  const [showFutureUnlockDialog, setShowFutureUnlockDialog] = useState(false);
  const [futureUnlockPin, setFutureUnlockPin] = useState("");
  const futureColor = "text-orange-500";
  const todayDate = getGermanDateString();

  const [futureForm, setFutureForm] = useState({
    reservationsTotal: "",
    reservationsCar: "",
    reservationsVan: "",
    reservationsTas: "",
    deliveriesTomorrow: "",
    collectionsOpen: "",
    carDayMin: "",
    vanDayMin: "",
  });
  const [futureValidationError, setFutureValidationError] = useState(false);
  
  const [editingKpi, setEditingKpi] = useState<"irpd" | "ses" | null>(null);
  const [kpiEditValue, setKpiEditValue] = useState("");
  const [kpiEditGoal, setKpiEditGoal] = useState("");
  const [kpiEditYesterday, setKpiEditYesterday] = useState("");

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

  const { data: kpiMetrics = [] } = useQuery<KpiMetric[]>({
    queryKey: ["/api/kpi-metrics"],
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
      setBreakCountdown(getSecondsUntilGermanTime(13, 0));
      setBreakOverdue(isOverdue(13, 0));
      setFutureUnlocked(isAfterGermanTime(15, 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleBreaksixtMutation = useMutation({
    mutationFn: async (isDone: boolean) => {
      return apiRequest("POST", "/api/module-status", {
        moduleName: "breaksixt",
        date: todayDate,
        isDone,
        doneBy: user?.initials,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/status", todayDate] });
      queryClient.invalidateQueries({ queryKey: ["/api/module-status"] });
    },
  });

  const saveFutureMutation = useMutation({
    mutationFn: async (data: {
      date: string;
      reservationsTotal: number;
      reservationsCar: number;
      reservationsVan: number;
      reservationsTas: number;
      deliveriesTomorrow: number;
      collectionsOpen: number;
      carDayMin?: number | null;
      vanDayMin?: number | null;
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
        carDayMin: "",
        vanDayMin: "",
      });
      setFutureValidationError(false);
    },
  });

  const updateKpiMutation = useMutation({
    mutationFn: async ({ key, value, goal, yesterdayValue }: { key: string; value: number; goal: number; yesterdayValue: number | null }) => {
      return apiRequest("PUT", `/api/kpi-metrics/${key}`, { value, goal, yesterdayValue }, {
        "x-admin-pin": user?.pin || "",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kpi-metrics"] });
      setEditingKpi(null);
      setKpiEditValue("");
      setKpiEditGoal("");
      setKpiEditYesterday("");
      toast({ title: "KPI updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error updating KPI", description: error.message, variant: "destructive" });
    },
  });

  const getKpiMetric = (key: "irpd" | "ses"): KpiMetric | undefined => {
    return kpiMetrics.find(m => m.key === key);
  };

  const getKpiColor = (key: "irpd" | "ses", value: number | undefined): string => {
    if (value === undefined) return "text-muted-foreground";
    if (key === "irpd") {
      if (value >= 8.0) return "text-green-500";
      if (value >= 7.2) return "text-yellow-500";
      return "text-red-500";
    } else {
      if (value >= 92.5) return "text-green-500";
      if (value >= 90.0) return "text-yellow-500";
      return "text-red-500";
    }
  };

  const getKpiBgColor = (key: "irpd" | "ses", value: number | undefined): string => {
    if (value === undefined) return "bg-muted/20";
    if (key === "irpd") {
      if (value >= 8.0) return "bg-green-500/20";
      if (value >= 7.2) return "bg-yellow-500/20";
      return "bg-red-500/20";
    } else {
      if (value >= 92.5) return "bg-green-500/20";
      if (value >= 90.0) return "bg-yellow-500/20";
      return "bg-red-500/20";
    }
  };

  const getKpiGlowStyle = (key: "irpd" | "ses", value: number | undefined): React.CSSProperties => {
    if (value === undefined) return {};
    let color: string;
    if (key === "irpd") {
      if (value >= 8.0) color = "34, 197, 94"; // green
      else if (value >= 7.2) color = "234, 179, 8"; // yellow
      else color = "239, 68, 68"; // red
    } else {
      if (value >= 92.5) color = "34, 197, 94"; // green
      else if (value >= 90.0) color = "234, 179, 8"; // yellow
      else color = "239, 68, 68"; // red
    }
    return {
      boxShadow: `0 0 20px rgba(${color}, 0.3), 0 0 40px rgba(${color}, 0.15), inset 0 1px 0 rgba(255,255,255,0.1)`,
      border: `1px solid rgba(${color}, 0.4)`,
    };
  };

  const getKpiTrafficLight = (key: "irpd" | "ses", value: number | undefined): "green" | "yellow" | "red" | "off" => {
    if (value === undefined) return "off";
    if (key === "irpd") {
      if (value >= 8.0) return "green";
      if (value >= 7.2) return "yellow";
      return "red";
    } else {
      if (value >= 92.5) return "green";
      if (value >= 90.0) return "yellow";
      return "red";
    }
  };

  const isKpiStale = (updatedAt: Date | string | null): boolean => {
    if (!updatedAt) return true;
    const updated = new Date(updatedAt);
    const now = new Date();
    const diffDays = (now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays >= 3;
  };

  const formatTimeSinceUpdate = (updatedAt: Date | string | null): string => {
    if (!updatedAt) return "Never updated";
    const updated = new Date(updatedAt);
    const now = new Date();
    const diffMs = now.getTime() - updated.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMins > 0) return `${diffMins}m ago`;
    return "Just now";
  };

  const getKpiComparison = (value: number | undefined, yesterdayValue: number | null | undefined): {
    arrow: "up" | "down" | "same";
    color: string;
  } => {
    if (value === undefined || yesterdayValue === undefined || yesterdayValue === null) {
      return { arrow: "same", color: "text-muted-foreground" };
    }
    if (value > yesterdayValue) return { arrow: "up", color: "text-green-500" };
    if (value < yesterdayValue) return { arrow: "down", color: "text-red-500" };
    return { arrow: "same", color: "text-yellow-500" };
  };

  const getYesterdayValueColor = (key: "irpd" | "ses", yesterdayValue: number | null | undefined, goal: number): string => {
    if (yesterdayValue === undefined || yesterdayValue === null) return "text-muted-foreground";
    // Color based on comparison to goal: green if >= goal, yellow if within 10%, red if worse
    if (yesterdayValue >= goal) return "text-green-500";
    const threshold = goal * 0.9; // 10% below goal
    if (yesterdayValue >= threshold) return "text-yellow-500";
    return "text-red-500";
  };

  const handleKpiEdit = (key: "irpd" | "ses") => {
    const metric = getKpiMetric(key);
    setEditingKpi(key);
    setKpiEditValue(metric?.value?.toString() || (key === "irpd" ? "8.00" : "92.5"));
    setKpiEditGoal(metric?.goal?.toString() || (key === "irpd" ? "8.00" : "92.5"));
    setKpiEditYesterday(metric?.yesterdayValue?.toString() || "");
  };

  const handleKpiSave = () => {
    if (!editingKpi) return;
    // Support both comma and period as decimal separator (German keyboards use comma)
    const value = parseFloat(kpiEditValue.replace(',', '.'));
    const goal = parseFloat(kpiEditGoal.replace(',', '.'));
    const yesterdayValue = kpiEditYesterday.trim() ? parseFloat(kpiEditYesterday.replace(',', '.')) : null;
    if (isNaN(value) || isNaN(goal)) {
      toast({ title: "Please enter valid numbers", variant: "destructive" });
      return;
    }
    if (yesterdayValue !== null && isNaN(yesterdayValue)) {
      toast({ title: "Please enter a valid yesterday value", variant: "destructive" });
      return;
    }
    updateKpiMutation.mutate({ key: editingKpi, value, goal, yesterdayValue });
  };

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
    // For DayMin fields, preserve the minus sign
    if (field === 'carDayMin' || field === 'vanDayMin') {
      const isNegative = value.startsWith('-');
      const numPart = value.replace(/[^0-9]/g, "").slice(0, 2);
      const finalValue = isNegative ? '-' + numPart : numPart;
      setFutureForm(prev => ({ ...prev, [field]: finalValue }));
    } else {
      const numValue = value.replace(/\D/g, "").slice(0, 2);
      setFutureForm(prev => ({ ...prev, [field]: numValue }));
    }
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
      carDayMin: futureForm.carDayMin ? parseInt(futureForm.carDayMin) : null,
      vanDayMin: futureForm.vanDayMin ? parseInt(futureForm.vanDayMin) : null,
      savedBy: user?.initials,
    });
  };

  return (
    <div className="pb-24">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/15 via-primary/5 to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[200px] bg-primary/20 blur-[100px] rounded-full" />
        <div className="relative p-6 pt-8">
          <h1 className="text-3xl font-bold text-white mb-1">
            Master<span className="text-primary text-glow">SIXT</span>
          </h1>
          <p className="text-sm text-white/50">Daily Task Overview</p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* KPI Indicators */}
        <div className="grid grid-cols-2 gap-3">
          {(["irpd", "ses"] as const).map((kpiKey) => {
            const metric = getKpiMetric(kpiKey);
            const value = metric?.value;
            const yesterdayValue = metric?.yesterdayValue;
            const goal = metric?.goal ?? (kpiKey === "irpd" ? 8.0 : 92.5);
            const color = getKpiColor(kpiKey, value);
            const bgColor = getKpiBgColor(kpiKey, value);
            const stale = isKpiStale(metric?.updatedAt ?? null);
            const timeSince = formatTimeSinceUpdate(metric?.updatedAt ?? null);
            
            const glowStyle = getKpiGlowStyle(kpiKey, value);
            const trafficLight = getKpiTrafficLight(kpiKey, value);
            const comparison = getKpiComparison(value, yesterdayValue);
            const yesterdayColor = getYesterdayValueColor(kpiKey, yesterdayValue, goal);
            
            return (
              <Card 
                key={kpiKey}
                className={`p-3 relative overflow-hidden ${stale ? 'opacity-60' : ''} ${bgColor.replace('/20', '/10')}`}
                style={stale ? {} : glowStyle}
                data-testid={`kpi-card-${kpiKey}`}
              >
                {/* Traffic Light Indicator */}
                <div className="absolute top-2 right-2 flex flex-col gap-1">
                  <div className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    trafficLight === "green" 
                      ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8),0_0_16px_rgba(34,197,94,0.4)]" 
                      : "bg-green-900/30"
                  }`} />
                  <div className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    trafficLight === "yellow" 
                      ? "bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.8),0_0_16px_rgba(234,179,8,0.4)]" 
                      : "bg-yellow-900/30"
                  }`} />
                  <div className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    trafficLight === "red" 
                      ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8),0_0_16px_rgba(239,68,68,0.4)]" 
                      : "bg-red-900/30"
                  }`} />
                </div>

                <div className="flex items-center justify-between mb-1 pr-6">
                  <span className="text-xs font-medium text-muted-foreground uppercase">
                    {kpiKey === "irpd" ? "IRPD" : "SES"} MTD
                  </span>
                  {user?.isAdmin && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => handleKpiEdit(kpiKey)}
                      data-testid={`button-edit-kpi-${kpiKey}`}
                    >
                      <Pencil className="w-3 h-3" />
                    </Button>
                  )}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className={`text-xl font-bold ${color}`} data-testid={`kpi-value-${kpiKey}`}>
                    {value !== undefined 
                      ? (kpiKey === "irpd" ? `${value.toFixed(2)}` : `${value.toFixed(1)}%`)
                      : "--"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    / {kpiKey === "irpd" ? goal.toFixed(2) : `${goal.toFixed(1)}%`}
                  </span>
                  {/* Comparison Arrow */}
                  {yesterdayValue !== null && yesterdayValue !== undefined && value !== undefined && (
                    <span className={`ml-1 ${comparison.color}`}>
                      {comparison.arrow === "up" && <ArrowUp className="w-3 h-3 inline" />}
                      {comparison.arrow === "down" && <ArrowDown className="w-3 h-3 inline" />}
                      {comparison.arrow === "same" && <Minus className="w-3 h-3 inline" />}
                    </span>
                  )}
                </div>
                {/* Yesterday Value */}
                {yesterdayValue !== null && yesterdayValue !== undefined && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-xs text-muted-foreground">Yesterday:</span>
                    <span className={`text-xs font-medium ${yesterdayColor}`} data-testid={`kpi-yesterday-${kpiKey}`}>
                      {kpiKey === "irpd" ? yesterdayValue.toFixed(2) : `${yesterdayValue.toFixed(1)}%`}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-1 mt-1">
                  {stale && <AlertTriangle className="w-3 h-3 text-orange-500" />}
                  <span className={`text-xs ${stale ? 'text-orange-400' : 'text-muted-foreground'}`}>
                    {timeSince}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>

        <Card className={`p-5 ${totalProgress === 100 ? 'status-done' : ''}`}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-white/60">Daily Progress</span>
            <span className={`text-lg font-bold ${totalProgress === 100 ? 'text-green-400' : 'text-primary'}`}>
              {totalProgress}%
            </span>
          </div>
          <div className="relative h-3 bg-white/[0.08] rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                totalProgress === 100 
                  ? 'bg-gradient-to-r from-green-500 to-green-400 shadow-[0_0_12px_rgba(34,197,94,0.4)]' 
                  : 'bg-gradient-to-r from-primary to-[#FF8533] shadow-[0_0_12px_rgba(255,102,0,0.4)]'
              }`}
              style={{ width: `${totalProgress}%` }}
            />
          </div>
          <p className="text-xs text-white/40 mt-3">
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

        <Card className={`p-5 ${masterOverdue ? 'status-overdue' : ''}`}>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-white/60">Daily Deadline</span>
              <p className="text-xs text-white/40">16:30 German Time</p>
            </div>
            <div className="text-right">
              {masterOverdue ? (
                <div className="flex items-center gap-2 text-red-400">
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

        {/* Break?SIXT - Countdown to 13:00 */}
        <Card 
          className={`p-4 cursor-pointer transition-all ${
            dashboardStatus?.breaksixt?.isDone 
              ? 'status-done' 
              : dashboardStatus?.breaksixt?.isOverdue || breakOverdue
                ? 'status-overdue'
                : ''
          }`}
          onClick={() => {
            const currentStatus = dashboardStatus?.breaksixt?.isDone ?? false;
            toggleBreaksixtMutation.mutate(!currentStatus);
          }}
          data-testid="breaksixt-card"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                dashboardStatus?.breaksixt?.isDone 
                  ? 'bg-green-500/20' 
                  : dashboardStatus?.breaksixt?.isOverdue || breakOverdue
                    ? 'bg-red-500/20'
                    : 'bg-amber-500/20'
              }`}>
                <Coffee className={`w-5 h-5 ${
                  dashboardStatus?.breaksixt?.isDone 
                    ? 'text-green-400' 
                    : dashboardStatus?.breaksixt?.isOverdue || breakOverdue
                      ? 'text-red-400'
                      : 'text-amber-400'
                }`} />
              </div>
              <div>
                <p className="font-semibold text-white">Break?<span className="text-amber-400">SIXT</span></p>
                <p className="text-xs text-white/40">
                  {dashboardStatus?.breaksixt?.isDone 
                    ? `Done${dashboardStatus.breaksixt.doneBy ? ` by ${dashboardStatus.breaksixt.doneBy}` : ''} • Tap to undo`
                    : 'Tap to mark lunch break done'
                  }
                </p>
              </div>
            </div>
            <div className="text-right">
              {dashboardStatus?.breaksixt?.isDone ? (
                <CheckCircle className="w-6 h-6 text-green-400" />
              ) : dashboardStatus?.breaksixt?.isOverdue || breakOverdue ? (
                <div className="flex items-center gap-2 text-red-400">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="text-sm font-bold">OVERDUE</span>
                </div>
              ) : (
                <span className="text-lg font-mono font-bold text-amber-400" data-testid="break-countdown">
                  {formatCountdown(breakCountdown)}
                </span>
              )}
            </div>
          </div>
          {/* Mandatory break info message */}
          {!dashboardStatus?.breaksixt?.isDone && (
            <div className="mt-3 pt-3 border-t border-white/10">
              <p className="text-xs text-white/50 leading-relaxed">
                {dashboardStatus?.breaksixt?.isOverdue || breakOverdue ? (
                  <>
                    Break after a maximum of 6 hours of working time, according to <span className="font-bold">§ 4 ArbZG</span> – exceeding rest breaks is at your own risk and may result in legal consequences.
                  </>
                ) : (
                  <>
                    Mandatory break after a max of 6 hours working time, according to <span className="font-bold">§ 4 ArbZG</span> – Rest breaks
                  </>
                )}
              </p>
            </div>
          )}
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

        {user?.isAdmin && (
          <Button
            onClick={() => setShowDailyBriefing(true)}
            variant="outline"
            className="w-full"
            data-testid="button-export-briefing"
          >
            <Share2 className="w-4 h-4 mr-2" />
            DailyBriefing Export
          </Button>
        )}

        {isDriver && pendingDriverTasks.length > 0 && (
          <Card className="p-5 status-pending">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-orange-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-orange-300">Driver Tasks Pending</p>
                <p className="text-xs text-white/40">
                  {pendingDriverTasks.length} quality issue{pendingDriverTasks.length !== 1 ? 's' : ''} to address
                </p>
              </div>
            </div>
          </Card>
        )}

        <div className="space-y-3 mt-6">
          <h2 className="text-sm font-medium text-white/50 px-1">Modules</h2>
          
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
                    className={`p-4 cursor-pointer transition-all duration-200 hover:border-white/[0.12] active:scale-[0.98] ${
                      isDone ? 'status-done' : ''
                    }`}
                    data-testid={`module-card-${module.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                          isDone ? 'module-icon-done' : 'module-icon'
                        }`}>
                          <Icon className={`w-6 h-6 ${isDone ? 'text-green-400' : module.color}`} />
                        </div>
                        <div>
                          <p className="font-semibold text-white">{module.name}<span className={module.color}>SIXT</span></p>
                          {details && (
                            <p className={`text-xs mt-0.5 ${isDone ? 'text-green-400' : 'text-white/50'}`}>
                              {details}
                            </p>
                          )}
                          {module.id === "upgrade" && dashboardStatus?.upgrade.pendingVehicles && dashboardStatus.upgrade.pendingVehicles.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {dashboardStatus.upgrade.pendingVehicles.map((v) => (
                                <div key={v.id} className="flex items-center gap-1 text-xs bg-orange-500/15 text-orange-400 px-2 py-1 rounded-lg border border-orange-500/20" data-testid={`pending-upgrade-${v.id}`}>
                                  {v.isVan ? <Truck className="w-3 h-3" /> : <Car className="w-3 h-3" />}
                                  <span>{v.licensePlate}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      {isDone ? (
                        <CheckCircle className="w-6 h-6 text-green-400" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-white/20" />
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
            onClick={!(futureUnlocked || futureAdminUnlocked) && !futureIsDone ? handleFutureCardTap : undefined}
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
                  <p className="font-medium text-white">Future<span className={futureColor}>SIXT</span></p>
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
                      <div className="mt-1">
                        <Label className="text-[10px] text-muted-foreground">DayMin</Label>
                        <div className="flex items-center gap-1">
                          <div
                            role="button"
                            tabIndex={0}
                            onTouchEnd={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const isNegative = futureForm.carDayMin.startsWith('-');
                              const numPart = futureForm.carDayMin.replace('-', '');
                              handleFutureInputChange("carDayMin", isNegative ? numPart : '-' + numPart);
                            }}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const isNegative = futureForm.carDayMin.startsWith('-');
                              const numPart = futureForm.carDayMin.replace('-', '');
                              handleFutureInputChange("carDayMin", isNegative ? numPart : '-' + numPart);
                            }}
                            className={`w-10 h-10 rounded-lg font-bold text-xl flex items-center justify-center select-none cursor-pointer active:scale-95 transition-transform ${
                              futureForm.carDayMin.startsWith('-') 
                                ? 'bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.5)]' 
                                : 'bg-green-600 text-white shadow-[0_0_10px_rgba(34,197,94,0.5)]'
                            }`}
                            data-testid="button-car-daymin-toggle"
                          >
                            {futureForm.carDayMin.startsWith('-') ? '−' : '+'}
                          </div>
                          <Input
                            type="text"
                            inputMode="numeric"
                            value={futureForm.carDayMin.replace('-', '')}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9]/g, '');
                              const isNegative = futureForm.carDayMin.startsWith('-');
                              handleFutureInputChange("carDayMin", isNegative ? '-' + val : val);
                            }}
                            className={`text-center text-base font-bold h-8 w-12 ${futureForm.carDayMin.startsWith('-') ? 'text-red-400' : futureForm.carDayMin.replace('-', '') ? 'text-green-400' : ''}`}
                            placeholder="0"
                            maxLength={2}
                            data-testid="input-future-car-daymin"
                          />
                        </div>
                      </div>
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
                      <div className="mt-1">
                        <Label className="text-[10px] text-muted-foreground">DayMin</Label>
                        <div className="flex items-center gap-1">
                          <div
                            role="button"
                            tabIndex={0}
                            onTouchEnd={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const isNegative = futureForm.vanDayMin.startsWith('-');
                              const numPart = futureForm.vanDayMin.replace('-', '');
                              handleFutureInputChange("vanDayMin", isNegative ? numPart : '-' + numPart);
                            }}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const isNegative = futureForm.vanDayMin.startsWith('-');
                              const numPart = futureForm.vanDayMin.replace('-', '');
                              handleFutureInputChange("vanDayMin", isNegative ? numPart : '-' + numPart);
                            }}
                            className={`w-10 h-10 rounded-lg font-bold text-xl flex items-center justify-center select-none cursor-pointer active:scale-95 transition-transform ${
                              futureForm.vanDayMin.startsWith('-') 
                                ? 'bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.5)]' 
                                : 'bg-green-600 text-white shadow-[0_0_10px_rgba(34,197,94,0.5)]'
                            }`}
                            data-testid="button-van-daymin-toggle"
                          >
                            {futureForm.vanDayMin.startsWith('-') ? '−' : '+'}
                          </div>
                          <Input
                            type="text"
                            inputMode="numeric"
                            value={futureForm.vanDayMin.replace('-', '')}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9]/g, '');
                              const isNegative = futureForm.vanDayMin.startsWith('-');
                              handleFutureInputChange("vanDayMin", isNegative ? '-' + val : val);
                            }}
                            className={`text-center text-base font-bold h-8 w-12 ${futureForm.vanDayMin.startsWith('-') ? 'text-red-400' : futureForm.vanDayMin.replace('-', '') ? 'text-green-400' : ''}`}
                            placeholder="0"
                            maxLength={2}
                            data-testid="input-future-van-daymin"
                          />
                        </div>
                      </div>
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
                    {futureData.carDayMin !== null && futureData.carDayMin !== undefined && (
                      <p className={`text-base font-black ${futureData.carDayMin < 0 ? 'text-red-400' : 'text-green-400'}`} style={{ textShadow: futureData.carDayMin < 0 ? '0 0 8px rgba(248, 113, 113, 0.6)' : '0 0 8px rgba(74, 222, 128, 0.6)' }} data-testid="future-saved-car-daymin">
                        DayMin: {futureData.carDayMin >= 0 ? '+' : ''}{futureData.carDayMin}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center justify-center gap-1"><Truck className="w-3 h-3" /> Van</p>
                    <p className="text-lg font-bold text-white" data-testid="future-saved-van">{futureData.reservationsVan}</p>
                    {futureData.vanDayMin !== null && futureData.vanDayMin !== undefined && (
                      <p className={`text-base font-black ${futureData.vanDayMin < 0 ? 'text-red-400' : 'text-green-400'}`} style={{ textShadow: futureData.vanDayMin < 0 ? '0 0 8px rgba(248, 113, 113, 0.6)' : '0 0 8px rgba(74, 222, 128, 0.6)' }} data-testid="future-saved-van-daymin">
                        DayMin: {futureData.vanDayMin >= 0 ? '+' : ''}{futureData.vanDayMin}
                      </p>
                    )}
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
      <DailyBriefingExport open={showDailyBriefing} onOpenChange={setShowDailyBriefing} />

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

      <Dialog open={editingKpi !== null} onOpenChange={(open) => !open && setEditingKpi(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Update {editingKpi === "irpd" ? "IRPD" : "SES"}</DialogTitle>
            <DialogDescription>
              {editingKpi === "irpd" 
                ? "Incremental Revenue Per Day (EUR)" 
                : "Service Experience Score (%)"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label className="text-xs text-muted-foreground">Current Value</Label>
              <Input
                type="text"
                inputMode="decimal"
                value={kpiEditValue}
                onChange={(e) => setKpiEditValue(e.target.value)}
                placeholder={editingKpi === "irpd" ? "8.00" : "92.5"}
                className="text-center text-lg"
                data-testid="input-kpi-value"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Goal</Label>
              <Input
                type="text"
                inputMode="decimal"
                value={kpiEditGoal}
                onChange={(e) => setKpiEditGoal(e.target.value)}
                placeholder={editingKpi === "irpd" ? "8.00" : "92.5"}
                className="text-center text-lg"
                data-testid="input-kpi-goal"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Yesterday Value (for comparison)</Label>
              <Input
                type="text"
                inputMode="decimal"
                value={kpiEditYesterday}
                onChange={(e) => setKpiEditYesterday(e.target.value)}
                placeholder={editingKpi === "irpd" ? "7.85" : "91.2"}
                className="text-center text-lg"
                data-testid="input-kpi-yesterday"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setEditingKpi(null)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleKpiSave}
                disabled={updateKpiMutation.isPending}
                className="flex-1"
                data-testid="button-kpi-save"
              >
                {updateKpiMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <footer className="pb-24 pt-8 border-t border-white/10 text-center space-y-1 mx-4">
        <p className="text-xs text-muted-foreground">
          Version v3.1.8
        </p>
        <p className="text-xs text-muted-foreground">
          &copy; 2026 by Nathanael Prem
        </p>
      </footer>
    </div>
  );
}
