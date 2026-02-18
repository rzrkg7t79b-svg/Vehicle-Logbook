import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, Clock, Car, Truck, Plane, TrendingUp, Users, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { getGermanDateString } from "@/lib/germanTime";
import { toJpeg } from "html-to-image";
import type { TimedriverCalculation, FuturePlanning, KpiMetric } from "@/types";

type DashboardStatus = {
  timedriver: { isDone: boolean; details?: string };
  upgrade: { isDone: boolean; hasPending: boolean; isOverdue: boolean; pendingVehicle?: any };
  flow: { isDone: boolean; pending: number; total: number };
  todo: { isDone: boolean; completed: number; total: number; postponed?: number };
  quality: { isDone: boolean; totalChecks: number; passedChecks: number; incompleteTasks: number };
  bodyshop: { isDone: boolean; vehiclesWithoutComment: number; total: number };
  future: { isDone: boolean; isLocked: boolean; data?: FuturePlanning };
  breaksixt: { isDone: boolean; isOverdue: boolean; doneBy?: string | null; doneAt?: string | null };
  overallProgress: number;
};

type UpgradeVehicle = {
  id: number;
  licensePlate: string;
  model: string;
  reason: string;
  isVan: boolean;
  isSold: boolean;
  soldBy: string | null;
  soldAt: string | null;
  createdAt: string;
  createdBy: string | null;
  date: string;
};

type DriverData = {
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

interface DailyBriefingExportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DailyBriefingExport({ open, onOpenChange }: DailyBriefingExportProps) {
  const exportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [briefingMessage, setBriefingMessage] = useState("");
  const todayDate = getGermanDateString();
  

  const { data: dashboardStatus } = useQuery<DashboardStatus>({
    queryKey: ["/api/dashboard/status", todayDate],
    queryFn: async () => {
      const res = await fetch(`/api/dashboard/status?date=${todayDate}`);
      return res.json();
    },
  });

  const { data: timedriverCalc } = useQuery<TimedriverCalculation | null>({
    queryKey: ["/api/timedriver-calculations", todayDate],
    queryFn: async () => {
      const res = await fetch(`/api/timedriver-calculations/${todayDate}`);
      return res.json();
    },
  });

  const { data: upgradeVehicles = [] } = useQuery<UpgradeVehicle[]>({
    queryKey: ["/api/upgrade-vehicles/date", todayDate],
    queryFn: async () => {
      const res = await fetch(`/api/upgrade-vehicles/date/${todayDate}`);
      return res.json();
    },
  });

  const { data: kpiMetrics = [] } = useQuery<KpiMetric[]>({
    queryKey: ["/api/kpi-metrics"],
  });

  type QualityCheckWithStatus = {
    id: number;
    licensePlate: string;
    isEv: boolean;
    passed: boolean;
    comment: string | null;
    checkedBy: string | null;
    createdAt: string;
    driverTaskCompleted: boolean | null;
    driverTaskCompletedBy: string | null;
  };

  const { data: qualityChecks = [] } = useQuery<QualityCheckWithStatus[]>({
    queryKey: ["/api/quality-checks/date", todayDate],
    queryFn: async () => {
      const res = await fetch(`/api/quality-checks/date/${todayDate}`);
      return res.json();
    },
  });

  // Get yesterday values directly from database
  const irpdYesterday = kpiMetrics.find(m => m.key === "irpd")?.yesterdayValue?.toString() || "";
  const sesYesterday = kpiMetrics.find(m => m.key === "ses")?.yesterdayValue?.toString() || "";
  const upMtdYesterday = kpiMetrics.find(m => m.key === "upmtd")?.yesterdayValue?.toString() || "";

  const getKpiMetric = (key: "irpd" | "ses" | "upmtd"): KpiMetric | undefined => {
    return kpiMetrics.find(m => m.key === key);
  };

  const getKpiTrafficLight = (key: "irpd" | "ses" | "upmtd", value: number | undefined, goal: number): "green" | "yellow" | "red" => {
    if (value === undefined) return "red";
    if (key === "irpd") {
      if (value >= goal) return "green";
      if (value >= goal - 0.8) return "yellow";
      return "red";
    } else if (key === "ses") {
      if (value >= goal) return "green";
      if (value >= goal - 2.5) return "yellow";
      return "red";
    } else {
      if (value >= goal) return "green";
      if (value >= goal - 1.5) return "yellow";
      return "red";
    }
  };

  const getKpiColor = (trafficLight: "green" | "yellow" | "red"): string => {
    if (trafficLight === "green") return "#22c55e";
    if (trafficLight === "yellow") return "#eab308";
    return "#ef4444";
  };

  // Get arrow direction comparing yesterday to today's actual value
  // Arrow shows whether yesterday helped reach the goal compared to today's ACT
  // Yesterday > Today = Green ↑ (yesterday was better, helped toward goal)
  // Yesterday = Today = Yellow → (same performance)
  // Yesterday < Today = Red ↓ (yesterday was worse than today)
  const getYesterdayArrow = (key: "irpd" | "ses" | "upmtd", yesterdayVal: number, actualVal: number): { arrow: string; color: string } => {
    if (yesterdayVal > actualVal) {
      // Yesterday was better than today = green up arrow
      return { arrow: "↑", color: "#22c55e" };
    } else if (Math.abs(actualVal - yesterdayVal) < 0.01) {
      // Same = yellow straight arrow
      return { arrow: "→", color: "#eab308" };
    } else {
      // Yesterday was worse than today = red down arrow
      return { arrow: "↓", color: "#ef4444" };
    }
  };

  const getYesterdayValueColor = (_key: "irpd" | "ses" | "upmtd", yesterdayVal: number, goal: number): string => {
    if (yesterdayVal >= goal) return "#22c55e";
    const threshold = goal * 0.9;
    if (yesterdayVal >= threshold) return "#eab308";
    return "#ef4444";
  };

  const formatWeekdayDate = (dateStr: string): string => {
    const date = new Date(dateStr + "T12:00:00");
    const weekday = date.toLocaleDateString("de-DE", { weekday: "long" });
    const formatted = date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
    return `${weekday}, ${formatted}`;
  };

  const handleExport = async () => {
    if (!exportRef.current) return;
    setIsExporting(true);
    
    try {
      const element = exportRef.current;
      
      const originalTransform = element.style.transform;
      element.style.transform = "none";
      
      element.offsetHeight;
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const dataUrl = await toJpeg(element, {
        quality: 1.0,
        pixelRatio: 1,
        width: 1920,
        height: 1080,
        backgroundColor: "#0a0a0a",
        style: {
          transform: "none",
        },
      });
      
      element.style.transform = originalTransform;
      
      const fileName = `DailyBriefing41137-${todayDate}.jpg`;
      
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], fileName, { type: "image/jpeg" });
      
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: "Daily Briefing 41137",
          });
        } catch (err) {
          if ((err as Error).name !== "AbortError") {
            const link = document.createElement("a");
            link.download = fileName;
            link.href = dataUrl;
            link.click();
          }
        }
      } else {
        const link = document.createElement("a");
        link.download = fileName;
        link.href = dataUrl;
        link.click();
      }
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const driversData: DriverData[] = timedriverCalc?.driversData 
    ? JSON.parse(timedriverCalc.driversData) 
    : [];

  const futureData = dashboardStatus?.future?.data;
  const pendingVehicles = upgradeVehicles.filter(v => !v.isSold);
  const soldVehicles = upgradeVehicles.filter(v => v.isSold);
  const progress = dashboardStatus?.overallProgress ?? 0;

  const hasMultipleUpgrades = upgradeVehicles.length >= 2;
  const irpdKpi = getKpiMetric("irpd");
  const sesKpi = getKpiMetric("ses");
  const upMtdKpi = getKpiMetric("upmtd");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Daily Briefing Export (1920×1080)</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mb-4">
          <div>
            <Label className="text-sm text-muted-foreground">Briefing Message (optional)</Label>
            <Textarea
              placeholder="Enter a message to include in the briefing..."
              value={briefingMessage}
              onChange={(e) => setBriefingMessage(e.target.value)}
              className="mt-1"
              rows={2}
              data-testid="input-briefing-message"
            />
          </div>
          
          {/* Yesterday KPI Values (read from database) */}
          <div className="border border-orange-500/30 rounded-lg p-4 bg-orange-500/5">
            <Label className="text-sm font-bold text-orange-500 mb-3 block">Yesterday KPI Values (from database)</Label>
            <p className="text-xs text-muted-foreground mb-2">Edit yesterday values on the main dashboard KPI tiles.</p>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">IRPD Yesterday</Label>
                <div className="mt-1 px-3 py-2 bg-muted/20 rounded-md text-sm" data-testid="display-irpd-yesterday">
                  {irpdYesterday || "Not set"}
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">SES Yesterday</Label>
                <div className="mt-1 px-3 py-2 bg-muted/20 rounded-md text-sm" data-testid="display-ses-yesterday">
                  {sesYesterday ? `${sesYesterday}%` : "Not set"}
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">UP % MTD Yesterday</Label>
                <div className="mt-1 px-3 py-2 bg-muted/20 rounded-md text-sm" data-testid="display-upmtd-yesterday">
                  {upMtdYesterday ? `${upMtdYesterday}%` : "Not set"}
                </div>
              </div>
            </div>
          </div>
          
          <Button onClick={handleExport} disabled={isExporting} className="w-full" data-testid="button-export-briefing">
            <Download className="w-4 h-4 mr-2" />
            {isExporting ? "Exporting..." : "Export Daily Briefing"}
          </Button>
        </div>

        <div className="overflow-auto border rounded-lg bg-black/50" style={{ maxHeight: "60vh" }}>
          <div 
            ref={exportRef}
            style={{ 
              width: "1920px", 
              height: "1080px",
              transform: "scale(0.35)",
              transformOrigin: "top left",
              backgroundColor: "#0a0a0a",
              padding: "40px",
              fontFamily: "system-ui, -apple-system, sans-serif",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Header - Motivational & Energetic */}
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center", 
              marginBottom: "30px",
              background: "linear-gradient(135deg, rgba(255, 102, 0, 0.2) 0%, rgba(255, 102, 0, 0.05) 40%, transparent 70%)",
              borderRadius: "20px",
              padding: "24px 32px",
              border: "1px solid rgba(255, 102, 0, 0.3)",
              boxShadow: "0 0 40px rgba(255, 102, 0, 0.15)",
            }}>
              <div>
                <h1 style={{ fontSize: "48px", fontWeight: "bold", color: "white", margin: 0 }}>
                  DailyBriefing<span style={{ fontWeight: "900", color: "#f97316" }}>41137</span>
                </h1>
                <p style={{ fontSize: "26px", color: "rgba(255,255,255,0.6)", margin: "8px 0 0 0" }}>
                  {formatWeekdayDate(todayDate)}
                </p>
              </div>
              {/* Motivational Message */}
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "16px",
                background: "linear-gradient(135deg, rgba(255, 102, 0, 0.3) 0%, rgba(255, 102, 0, 0.1) 100%)",
                borderRadius: "16px",
                padding: "16px 28px",
                border: "2px solid rgba(255, 102, 0, 0.5)",
                boxShadow: "0 0 30px rgba(255, 102, 0, 0.3)",
              }}>
                <span style={{ fontSize: "40px" }}>🔥</span>
                <div>
                  <p style={{ 
                    margin: 0, 
                    fontSize: "28px", 
                    fontWeight: "900", 
                    color: "#fff",
                    textShadow: "0 0 20px rgba(255, 102, 0, 0.8)",
                    letterSpacing: "1px",
                  }}>
                    LET'S ROCK TODAY!
                  </p>
                  <p style={{ margin: "4px 0 0 0", fontSize: "16px", color: "rgba(255,255,255,0.7)", fontWeight: "500" }}>
                    Team 41137 - We make it happen!
                  </p>
                </div>
                <span style={{ fontSize: "40px" }}>🚀</span>
              </div>
            </div>

            {/* Briefing Message */}
            {briefingMessage && (
              <div style={{ 
                backgroundColor: "rgba(249, 115, 22, 0.1)",
                border: "2px solid rgba(249, 115, 22, 0.4)",
                borderRadius: "16px",
                padding: "20px 28px",
                marginBottom: "24px",
              }}>
                <p style={{ 
                  fontSize: "22px", 
                  color: "white", 
                  margin: 0,
                  lineHeight: 1.5,
                  whiteSpace: "pre-wrap",
                }}>
                  {briefingMessage}
                </p>
              </div>
            )}

            {/* Main Content Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: hasMultipleUpgrades ? "18px" : "24px", flex: 1 }}>
              {/* Left Column */}
              <div style={{ display: "flex", flexDirection: "column", gap: hasMultipleUpgrades ? "14px" : "20px" }}>
                {/* TodaySIXT (FutureSIXT data relabeled) - Colorful & Motivational */}
                {futureData && (
                  <div style={{ 
                    background: "linear-gradient(145deg, #1a1a1a 0%, #0d1f0d 100%)",
                    borderRadius: "16px",
                    padding: "24px",
                    border: "3px solid rgba(34, 197, 94, 0.5)",
                    boxShadow: "0 0 30px rgba(34, 197, 94, 0.2), inset 0 0 40px rgba(34, 197, 94, 0.05)",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                      <div style={{ 
                        width: "50px", 
                        height: "50px", 
                        borderRadius: "12px", 
                        background: "linear-gradient(135deg, rgba(34, 197, 94, 0.4) 0%, rgba(34, 197, 94, 0.15) 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 0 20px rgba(34, 197, 94, 0.4)",
                      }}>
                        <span style={{ fontSize: "28px" }}>📅</span>
                      </div>
                      <div>
                        <h2 style={{ fontSize: "28px", fontWeight: "bold", color: "white", margin: 0 }}>
                          Today<span style={{ color: "#f97316" }}>SIXT</span>
                        </h2>
                        <p style={{ margin: 0, color: "#22c55e", fontSize: "14px", fontWeight: "600" }}>Your day at a glance</p>
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
                      <div style={{ 
                        textAlign: "center", 
                        padding: "16px", 
                        background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)", 
                        borderRadius: "12px",
                        boxShadow: "0 0 20px rgba(59, 130, 246, 0.4)",
                      }}>
                        <p style={{ margin: 0, color: "rgba(255,255,255,0.9)", fontSize: "14px", marginBottom: "4px", fontWeight: "700", letterSpacing: "1px" }}>TOTAL</p>
                        <p style={{ margin: 0, color: "#fff", fontSize: "42px", fontWeight: "900", textShadow: "0 0 20px rgba(255,255,255,0.5)" }}>{futureData.reservationsTotal}</p>
                      </div>
                      <div style={{ 
                        textAlign: "center", 
                        padding: "16px", 
                        background: "linear-gradient(135deg, #262626 0%, #1a1a1a 100%)", 
                        borderRadius: "12px",
                        border: "2px solid rgba(34, 197, 94, 0.3)",
                      }}>
                        <p style={{ margin: 0, color: "#22c55e", fontSize: "14px", marginBottom: "4px", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", fontWeight: "700" }}>
                          <Car style={{ width: "16px", height: "16px" }} /> CAR
                        </p>
                        <p style={{ margin: 0, color: "#fff", fontSize: "36px", fontWeight: "bold" }}>{futureData.reservationsCar}</p>
                        {futureData.carDayMin !== null && futureData.carDayMin !== undefined && (
                          <p style={{ 
                            margin: "8px 0 0 0", 
                            fontSize: "22px", 
                            fontWeight: "900",
                            color: futureData.carDayMin < 0 ? "#ef4444" : "#22c55e",
                            textShadow: futureData.carDayMin < 0 ? "0 0 15px rgba(239, 68, 68, 0.8)" : "0 0 15px rgba(34, 197, 94, 0.8)",
                          }}>
                            {futureData.carDayMin >= 0 ? '+' : ''}{futureData.carDayMin}
                          </p>
                        )}
                      </div>
                      <div style={{ 
                        textAlign: "center", 
                        padding: "16px", 
                        background: "linear-gradient(135deg, #262626 0%, #1a1a1a 100%)", 
                        borderRadius: "12px",
                        border: "2px solid rgba(249, 115, 22, 0.3)",
                      }}>
                        <p style={{ margin: 0, color: "#f97316", fontSize: "14px", marginBottom: "4px", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", fontWeight: "700" }}>
                          <Truck style={{ width: "16px", height: "16px" }} /> VAN
                        </p>
                        <p style={{ margin: 0, color: "#fff", fontSize: "36px", fontWeight: "bold" }}>{futureData.reservationsVan}</p>
                        {futureData.vanDayMin !== null && futureData.vanDayMin !== undefined && (
                          <p style={{ 
                            margin: "8px 0 0 0", 
                            fontSize: "22px", 
                            fontWeight: "900",
                            color: futureData.vanDayMin < 0 ? "#ef4444" : "#22c55e",
                            textShadow: futureData.vanDayMin < 0 ? "0 0 15px rgba(239, 68, 68, 0.8)" : "0 0 15px rgba(34, 197, 94, 0.8)",
                          }}>
                            {futureData.vanDayMin >= 0 ? '+' : ''}{futureData.vanDayMin}
                          </p>
                        )}
                      </div>
                      <div style={{ 
                        textAlign: "center", 
                        padding: "16px", 
                        background: "linear-gradient(135deg, #262626 0%, #1a1a1a 100%)", 
                        borderRadius: "12px",
                        border: "2px solid rgba(168, 85, 247, 0.3)",
                      }}>
                        <p style={{ margin: 0, color: "#a855f7", fontSize: "14px", marginBottom: "4px", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", fontWeight: "700" }}>
                          <Plane style={{ width: "16px", height: "16px" }} /> TAS
                        </p>
                        <p style={{ margin: 0, color: "#fff", fontSize: "36px", fontWeight: "bold" }}>{futureData.reservationsTas}</p>
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "16px" }}>
                      <div style={{ 
                        textAlign: "center", 
                        padding: "14px", 
                        background: "linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(59, 130, 246, 0.05) 100%)", 
                        borderRadius: "12px",
                        border: "2px solid rgba(59, 130, 246, 0.4)",
                      }}>
                        <p style={{ margin: 0, color: "#60a5fa", fontSize: "14px", fontWeight: "700" }}>Deliveries</p>
                        <p style={{ margin: 0, color: "#fff", fontSize: "32px", fontWeight: "bold", textShadow: "0 0 10px rgba(59, 130, 246, 0.5)" }}>{futureData.deliveriesTomorrow}</p>
                      </div>
                      <div style={{ 
                        textAlign: "center", 
                        padding: "14px", 
                        background: "linear-gradient(135deg, rgba(236, 72, 153, 0.2) 0%, rgba(236, 72, 153, 0.05) 100%)", 
                        borderRadius: "12px",
                        border: "2px solid rgba(236, 72, 153, 0.4)",
                      }}>
                        <p style={{ margin: 0, color: "#f472b6", fontSize: "14px", fontWeight: "700" }}>Collections</p>
                        <p style={{ margin: 0, color: "#fff", fontSize: "32px", fontWeight: "bold", textShadow: "0 0 10px rgba(236, 72, 153, 0.5)" }}>{futureData.collectionsOpen}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* TimeDriverSIXT - Compact when many drivers */}
                {driversData.length > 0 && (() => {
                  const isCompact = driversData.length > 2 || hasMultipleUpgrades;
                  const useGrid = driversData.length > 3;
                  return (
                  <div style={{ 
                    background: "linear-gradient(145deg, #1a1a1a 0%, #1a0d0d 100%)",
                    borderRadius: "16px",
                    padding: hasMultipleUpgrades ? "12px" : (isCompact ? "16px" : "24px"),
                    border: "3px solid rgba(249, 115, 22, 0.5)",
                    boxShadow: "0 0 30px rgba(249, 115, 22, 0.2), inset 0 0 40px rgba(249, 115, 22, 0.05)",
                    flex: 1,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: hasMultipleUpgrades ? "8px" : "12px", marginBottom: hasMultipleUpgrades ? "8px" : (isCompact ? "12px" : "20px") }}>
                      <div style={{ 
                        width: hasMultipleUpgrades ? "30px" : (isCompact ? "36px" : "50px"), 
                        height: hasMultipleUpgrades ? "30px" : (isCompact ? "36px" : "50px"), 
                        borderRadius: "12px", 
                        background: "linear-gradient(135deg, rgba(249, 115, 22, 0.4) 0%, rgba(249, 115, 22, 0.15) 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 0 20px rgba(249, 115, 22, 0.4)",
                      }}>
                        <span style={{ fontSize: hasMultipleUpgrades ? "16px" : (isCompact ? "18px" : "28px") }}>👥</span>
                      </div>
                      <div>
                        <h2 style={{ fontSize: hasMultipleUpgrades ? "18px" : (isCompact ? "20px" : "28px"), fontWeight: "bold", color: "white", margin: 0 }}>
                          TimeDriver<span style={{ color: "#f97316" }}>SIXT</span>
                        </h2>
                        <p style={{ margin: 0, color: "#f97316", fontSize: hasMultipleUpgrades ? "11px" : (isCompact ? "12px" : "14px"), fontWeight: "600" }}>
                          {timedriverCalc?.rentals} rentals × €{timedriverCalc?.budgetPerRental.toFixed(2)} = €{timedriverCalc?.totalBudget.toFixed(2)} Budget
                        </p>
                      </div>
                    </div>
                    <div style={{ 
                      display: useGrid ? "grid" : "flex", 
                      gridTemplateColumns: useGrid ? "1fr 1fr" : undefined,
                      flexDirection: useGrid ? undefined : "column", 
                      gap: hasMultipleUpgrades ? "6px" : (isCompact ? "8px" : "14px"),
                    }}>
                      {driversData.map((driver) => {
                        const barColor = driver.percent >= 100 ? "#ef4444" : driver.percent >= 80 ? "#eab308" : "#22c55e";
                        return (
                          <div key={driver.id} style={{ 
                            padding: hasMultipleUpgrades ? "6px 10px" : (isCompact ? "8px 12px" : "14px 16px"), 
                            background: "linear-gradient(135deg, #262626 0%, #1a1a1a 100%)", 
                            borderRadius: isCompact ? "8px" : "12px",
                            border: driver.percent >= 100 ? "2px solid rgba(239, 68, 68, 0.5)" : "1px solid rgba(255,255,255,0.1)",
                            boxShadow: driver.percent >= 100 ? "0 0 20px rgba(239, 68, 68, 0.3)" : "none",
                          }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: hasMultipleUpgrades ? "4px" : (isCompact ? "6px" : "10px") }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span style={{ color: "#f97316", fontSize: hasMultipleUpgrades ? "14px" : (isCompact ? "16px" : "22px"), fontWeight: "900" }}>{driver.initials}</span>
                                <span style={{ color: "#666", fontSize: hasMultipleUpgrades ? "10px" : (isCompact ? "11px" : "14px") }}>(max {driver.maxHours}h)</span>
                                {(isCompact || hasMultipleUpgrades) && (driver.overflowHours !== undefined && driver.overflowHours > 0) && (
                                  <span style={{ color: "#f97316", fontSize: hasMultipleUpgrades ? "10px" : "11px", fontWeight: "600" }}>
                                    +{driver.overflowHours}h{driver.overflowMinutes}m
                                  </span>
                                )}
                              </div>
                              <span style={{ 
                                color: "#22c55e", 
                                fontSize: hasMultipleUpgrades ? "14px" : (isCompact ? "16px" : "24px"), 
                                fontWeight: "900",
                                textShadow: "0 0 10px rgba(34, 197, 94, 0.5)",
                              }}>
                                {driver.assignedHours}h {driver.assignedMinutes}min
                              </span>
                            </div>
                            {!isCompact && !hasMultipleUpgrades && (driver.overflowHours !== undefined && driver.overflowHours > 0) && (
                              <p style={{ 
                                margin: "0 0 8px 0", 
                                color: "#f97316", 
                                fontSize: "13px",
                                fontWeight: "600",
                              }}>
                                ⚠️ if needed: +{driver.overflowHours}h {driver.overflowMinutes}min
                              </p>
                            )}
                            <div style={{ 
                              position: "relative",
                              height: hasMultipleUpgrades ? "14px" : (isCompact ? "18px" : "28px"), 
                              backgroundColor: "rgba(255,255,255,0.1)", 
                              borderRadius: hasMultipleUpgrades ? "7px" : (isCompact ? "9px" : "14px"),
                              overflow: "hidden",
                            }}>
                              <div style={{ 
                                position: "absolute",
                                left: 0,
                                top: 0,
                                width: `${Math.min(driver.percent, 100)}%`, 
                                height: "100%", 
                                background: `linear-gradient(90deg, ${barColor} 0%, ${barColor}cc 100%)`,
                                borderRadius: hasMultipleUpgrades ? "7px" : (isCompact ? "9px" : "14px"),
                                boxShadow: `0 0 15px ${barColor}88`,
                              }} />
                              <div style={{
                                position: "absolute",
                                left: 0,
                                top: 0,
                                right: 0,
                                bottom: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}>
                                <span style={{ 
                                  color: "#fff", 
                                  fontSize: hasMultipleUpgrades ? "10px" : (isCompact ? "11px" : "14px"), 
                                  fontWeight: "900",
                                  textShadow: "0 1px 3px rgba(0,0,0,0.8)",
                                }}>
                                  {Math.round(driver.percent)}%
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  );
                })()}
              </div>

              {/* Right Column */}
              <div style={{ display: "flex", flexDirection: "column", gap: hasMultipleUpgrades ? "14px" : "20px" }}>
                {/* UpgradeSIXT with UP % MTD inside - Colorful & Motivational */}
                <div style={{ 
                  background: soldVehicles.length > 0 
                    ? "linear-gradient(145deg, #1a1a1a 0%, #0d1f0d 100%)"
                    : "linear-gradient(145deg, #1a1a1a 0%, #1f0d1a 100%)",
                  borderRadius: "16px",
                  padding: hasMultipleUpgrades ? "16px" : "24px",
                  border: soldVehicles.length > 0 
                    ? "3px solid rgba(34, 197, 94, 0.5)" 
                    : "3px solid rgba(59, 130, 246, 0.5)",
                  boxShadow: soldVehicles.length > 0 
                    ? "0 0 30px rgba(34, 197, 94, 0.2), inset 0 0 40px rgba(34, 197, 94, 0.05)"
                    : "0 0 30px rgba(59, 130, 246, 0.2), inset 0 0 40px rgba(59, 130, 246, 0.05)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: hasMultipleUpgrades ? "14px" : "20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ 
                        width: "50px", 
                        height: "50px", 
                        borderRadius: "12px", 
                        background: soldVehicles.length > 0 
                          ? "linear-gradient(135deg, rgba(34, 197, 94, 0.4) 0%, rgba(34, 197, 94, 0.15) 100%)"
                          : "linear-gradient(135deg, rgba(59, 130, 246, 0.4) 0%, rgba(59, 130, 246, 0.15) 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: soldVehicles.length > 0 
                          ? "0 0 20px rgba(34, 197, 94, 0.4)"
                          : "0 0 20px rgba(59, 130, 246, 0.4)",
                      }}>
                        <span style={{ fontSize: "28px" }}>{soldVehicles.length > 0 ? "💰" : "📈"}</span>
                      </div>
                      <div>
                        <h2 style={{ fontSize: "28px", fontWeight: "bold", color: "white", margin: 0 }}>
                          Upgrade<span style={{ color: "#3b82f6" }}>SIXT</span>
                        </h2>
                        <p style={{ margin: 0, color: soldVehicles.length > 0 ? "#22c55e" : "#3b82f6", fontSize: "14px", fontWeight: "600" }}>
                          {soldVehicles.length > 0 ? `${soldVehicles.length} UP sold today!` : "Let's sell some UPs!"}
                        </p>
                      </div>
                    </div>
                    {/* UP % MTD KPI - Bold and Glowing */}
                    <div style={{ 
                      background: "linear-gradient(145deg, #262626 0%, #1a1a1a 100%)",
                      borderRadius: "16px",
                      padding: hasMultipleUpgrades ? "14px 20px" : "20px 28px",
                      border: upMtdKpi 
                        ? `4px solid ${getKpiColor(getKpiTrafficLight("upmtd", upMtdKpi.value, upMtdKpi.goal))}`
                        : "4px solid rgba(255, 255, 255, 0.2)",
                      boxShadow: upMtdKpi 
                        ? `0 0 40px ${getKpiColor(getKpiTrafficLight("upmtd", upMtdKpi.value, upMtdKpi.goal))}88, inset 0 0 20px ${getKpiColor(getKpiTrafficLight("upmtd", upMtdKpi.value, upMtdKpi.goal))}22`
                        : "none",
                      display: "flex",
                      alignItems: "center",
                      gap: "20px",
                    }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                        <div style={{ 
                          width: "16px", height: "16px", borderRadius: "50%", 
                          backgroundColor: upMtdKpi && getKpiTrafficLight("upmtd", upMtdKpi.value, upMtdKpi.goal) === "green" ? "#22c55e" : "rgba(34, 197, 94, 0.3)",
                          boxShadow: upMtdKpi && getKpiTrafficLight("upmtd", upMtdKpi.value, upMtdKpi.goal) === "green" ? "0 0 16px rgba(34, 197, 94, 1), 0 0 32px rgba(34, 197, 94, 0.6)" : "none",
                        }} />
                        <div style={{ 
                          width: "16px", height: "16px", borderRadius: "50%", 
                          backgroundColor: upMtdKpi && getKpiTrafficLight("upmtd", upMtdKpi.value, upMtdKpi.goal) === "yellow" ? "#eab308" : "rgba(234, 179, 8, 0.3)",
                          boxShadow: upMtdKpi && getKpiTrafficLight("upmtd", upMtdKpi.value, upMtdKpi.goal) === "yellow" ? "0 0 16px rgba(234, 179, 8, 1), 0 0 32px rgba(234, 179, 8, 0.6)" : "none",
                        }} />
                        <div style={{ 
                          width: "16px", height: "16px", borderRadius: "50%", 
                          backgroundColor: !upMtdKpi || getKpiTrafficLight("upmtd", upMtdKpi.value, upMtdKpi.goal) === "red" ? "#ef4444" : "rgba(239, 68, 68, 0.3)",
                          boxShadow: !upMtdKpi || getKpiTrafficLight("upmtd", upMtdKpi.value, upMtdKpi.goal) === "red" ? "0 0 16px rgba(239, 68, 68, 1), 0 0 32px rgba(239, 68, 68, 0.6)" : "none",
                        }} />
                      </div>
                      <div>
                        <p style={{ 
                          margin: 0, 
                          color: "#fff", 
                          fontSize: "16px", 
                          fontWeight: "800", 
                          letterSpacing: "2px",
                          textShadow: "0 0 8px rgba(255,255,255,0.3)",
                        }}>UP % MTD</p>
                        <p style={{ 
                          margin: `${hasMultipleUpgrades ? "4px" : "6px"} 0 0 0`, 
                          color: upMtdKpi ? getKpiColor(getKpiTrafficLight("upmtd", upMtdKpi.value, upMtdKpi.goal)) : "#888", 
                          fontSize: hasMultipleUpgrades ? "36px" : "48px", 
                          fontWeight: "900",
                          lineHeight: "1",
                          textShadow: upMtdKpi ? `0 0 30px ${getKpiColor(getKpiTrafficLight("upmtd", upMtdKpi.value, upMtdKpi.goal))}, 0 0 60px ${getKpiColor(getKpiTrafficLight("upmtd", upMtdKpi.value, upMtdKpi.goal))}66` : "none",
                        }}>
                          {upMtdKpi ? `${upMtdKpi.value.toFixed(1)}%` : "--"}
                        </p>
                        {/* Yesterday Value with Arrow */}
                        {upMtdYesterday && parseFloat(upMtdYesterday) > 0 && upMtdKpi && (() => {
                          const yesterdayVal = parseFloat(upMtdYesterday);
                          const arrow = getYesterdayArrow("upmtd", yesterdayVal, upMtdKpi.value);
                          const valueColor = getYesterdayValueColor("upmtd", yesterdayVal, upMtdKpi.goal);
                          return (
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
                              <span style={{ 
                                fontSize: "18px", 
                                fontWeight: "900",
                                color: arrow.color,
                                textShadow: `0 0 8px ${arrow.color}`,
                              }}>
                                {arrow.arrow}
                              </span>
                              <span style={{ 
                                fontSize: "14px", 
                                fontWeight: "700",
                                color: valueColor,
                                textShadow: `0 0 6px ${valueColor}66`,
                              }}>
                                Yest: {yesterdayVal.toFixed(1)}%
                              </span>
                            </div>
                          );
                        })()}
                        <p style={{ margin: "6px 0 0 0", color: "#888", fontSize: "14px", fontWeight: "600" }}>Goal: {upMtdKpi ? `${upMtdKpi.goal.toFixed(1)}%` : "15.0%"}</p>
                      </div>
                    </div>
                  </div>
                  
                  {upgradeVehicles.length === 0 ? (
                    <p style={{ color: "#888", fontSize: "18px", fontStyle: "italic" }}>No UP vehicles defined today - Time to find some!</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: hasMultipleUpgrades ? "10px" : "14px" }}>
                      {upgradeVehicles.map((vehicle) => (
                        <div key={vehicle.id} style={{ 
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: hasMultipleUpgrades ? "12px 16px" : "18px 20px",
                          background: vehicle.isSold 
                            ? "linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, #262626 100%)"
                            : "linear-gradient(135deg, rgba(234, 179, 8, 0.15) 0%, #262626 100%)",
                          borderRadius: "12px",
                          border: vehicle.isSold ? "3px solid rgba(34, 197, 94, 0.6)" : "3px solid rgba(234, 179, 8, 0.6)",
                          boxShadow: vehicle.isSold 
                            ? "0 0 20px rgba(34, 197, 94, 0.3)" 
                            : "0 0 20px rgba(234, 179, 8, 0.2)",
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: hasMultipleUpgrades ? "10px" : "14px" }}>
                            {vehicle.isVan ? (
                              <Truck style={{ width: hasMultipleUpgrades ? "24px" : "32px", height: hasMultipleUpgrades ? "24px" : "32px", color: vehicle.isSold ? "#22c55e" : "#eab308" }} />
                            ) : (
                              <Car style={{ width: hasMultipleUpgrades ? "24px" : "32px", height: hasMultipleUpgrades ? "24px" : "32px", color: vehicle.isSold ? "#22c55e" : "#eab308" }} />
                            )}
                            <div>
                              <p style={{ 
                                margin: 0, 
                                color: "#fff", 
                                fontSize: hasMultipleUpgrades ? "18px" : "24px", 
                                fontWeight: "bold",
                                fontFamily: "monospace",
                              }}>
                                {vehicle.licensePlate}
                              </p>
                              <p style={{ margin: "2px 0 0 0", color: "#aaa", fontSize: hasMultipleUpgrades ? "13px" : "16px" }}>
                                {vehicle.model}
                              </p>
                            </div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ 
                              display: "inline-block",
                              padding: hasMultipleUpgrades ? "4px 12px" : "6px 16px",
                              borderRadius: "20px",
                              background: vehicle.isSold 
                                ? "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)"
                                : "linear-gradient(135deg, #eab308 0%, #ca8a04 100%)",
                              boxShadow: vehicle.isSold 
                                ? "0 0 15px rgba(34, 197, 94, 0.6)"
                                : "0 0 15px rgba(234, 179, 8, 0.6)",
                            }}>
                              <span style={{ 
                                color: "#fff", 
                                fontSize: hasMultipleUpgrades ? "13px" : "16px",
                                fontWeight: "900",
                                letterSpacing: "1px",
                                textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                              }}>
                                {vehicle.isSold ? "✓ SOLD" : "⏳ PENDING"}
                              </span>
                            </div>
                            <p style={{ 
                              margin: `${hasMultipleUpgrades ? "4px" : "8px"} 0 0 0`, 
                              color: "#f97316", 
                              fontSize: hasMultipleUpgrades ? "16px" : "22px",
                              fontWeight: "900",
                              textShadow: "0 0 12px rgba(249, 115, 22, 0.6)",
                            }}>
                              {vehicle.reason}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* QualitySIXT - Quality Checks Summary */}
                {qualityChecks.length > 0 && (
                  <div style={{ 
                    background: "linear-gradient(145deg, #1a1a1a 0%, #0d1a0d 100%)",
                    borderRadius: "16px",
                    padding: "20px",
                    border: "3px solid rgba(34, 197, 94, 0.5)",
                    boxShadow: "0 0 30px rgba(34, 197, 94, 0.2), inset 0 0 40px rgba(34, 197, 94, 0.05)",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
                      <div style={{ 
                        width: "40px", 
                        height: "40px", 
                        borderRadius: "10px", 
                        background: "linear-gradient(135deg, rgba(34, 197, 94, 0.4) 0%, rgba(34, 197, 94, 0.15) 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 0 20px rgba(34, 197, 94, 0.4)",
                      }}>
                        <Target style={{ width: "22px", height: "22px", color: "#22c55e" }} />
                      </div>
                      <div>
                        <h2 style={{ fontSize: "22px", fontWeight: "bold", color: "white", margin: 0 }}>
                          Quality<span style={{ color: "#22c55e" }}>SIXT</span>
                        </h2>
                        <p style={{ margin: 0, color: "#22c55e", fontSize: "12px", fontWeight: "600" }}>
                          {qualityChecks.length} checks ({qualityChecks.filter(c => c.passed).length} passed / {qualityChecks.filter(c => !c.passed).length} failed)
                        </p>
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {qualityChecks.map((check) => {
                        const status = check.passed ? "passed" : (check.driverTaskCompleted ? "solved" : "open");
                        const statusColors = {
                          passed: { bg: "rgba(34, 197, 94, 0.15)", border: "rgba(34, 197, 94, 0.5)", badge: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)", glow: "rgba(34, 197, 94, 0.5)", label: "PASSED" },
                          solved: { bg: "rgba(234, 179, 8, 0.15)", border: "rgba(234, 179, 8, 0.5)", badge: "linear-gradient(135deg, #eab308 0%, #ca8a04 100%)", glow: "rgba(234, 179, 8, 0.5)", label: "SOLVED" },
                          open: { bg: "rgba(239, 68, 68, 0.15)", border: "rgba(239, 68, 68, 0.5)", badge: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)", glow: "rgba(239, 68, 68, 0.5)", label: "OPEN" },
                        }[status];
                        return (
                          <div key={check.id} style={{ 
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "10px 14px",
                            background: `linear-gradient(135deg, ${statusColors.bg} 0%, #262626 100%)`,
                            borderRadius: "10px",
                            border: `2px solid ${statusColors.border}`,
                          }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <span style={{ 
                                fontSize: "18px", 
                                fontWeight: "900", 
                                fontFamily: "monospace",
                                color: "#fff",
                              }}>
                                {check.licensePlate}
                              </span>
                              {!check.passed && check.comment && (
                                <span style={{ color: "#999", fontSize: "13px", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {check.comment}
                                </span>
                              )}
                            </div>
                            <div style={{ 
                              display: "inline-block",
                              padding: "4px 12px",
                              borderRadius: "16px",
                              background: statusColors.badge,
                              boxShadow: `0 0 10px ${statusColors.glow}`,
                            }}>
                              <span style={{ 
                                color: "#fff", 
                                fontSize: "13px",
                                fontWeight: "800",
                              }}>
                                {statusColors.label}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* KPI Tiles - IRPD and SES - ULTRA BOLD EYE CATCHERS */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: hasMultipleUpgrades ? "16px" : "24px" }}>
                  {/* IRPD - MEGA Eye Catcher */}
                  {irpdKpi && (
                    <div style={{ 
                      background: `linear-gradient(145deg, #1a1a1a 0%, #0d0d0d 100%)`,
                      borderRadius: hasMultipleUpgrades ? "16px" : "24px",
                      padding: hasMultipleUpgrades ? "18px" : "32px",
                      border: `${hasMultipleUpgrades ? "4px" : "6px"} solid ${getKpiColor(getKpiTrafficLight("irpd", irpdKpi.value, irpdKpi.goal))}`,
                      boxShadow: `0 0 ${hasMultipleUpgrades ? "40px" : "60px"} ${getKpiColor(getKpiTrafficLight("irpd", irpdKpi.value, irpdKpi.goal))}99, inset 0 0 ${hasMultipleUpgrades ? "20px" : "40px"} ${getKpiColor(getKpiTrafficLight("irpd", irpdKpi.value, irpdKpi.goal))}22`,
                      position: "relative",
                    }}>
                      <div style={{ 
                        position: "absolute", 
                        top: hasMultipleUpgrades ? "12px" : "20px", 
                        right: hasMultipleUpgrades ? "12px" : "20px", 
                        display: "flex", 
                        flexDirection: "column", 
                        gap: hasMultipleUpgrades ? "4px" : "6px" 
                      }}>
                        <div style={{ 
                          width: hasMultipleUpgrades ? "14px" : "20px", 
                          height: hasMultipleUpgrades ? "14px" : "20px", 
                          borderRadius: "50%", 
                          backgroundColor: getKpiTrafficLight("irpd", irpdKpi.value, irpdKpi.goal) === "green" ? "#22c55e" : "rgba(34, 197, 94, 0.2)",
                          boxShadow: getKpiTrafficLight("irpd", irpdKpi.value, irpdKpi.goal) === "green" ? "0 0 16px rgba(34, 197, 94, 1), 0 0 32px rgba(34, 197, 94, 0.6)" : "none",
                        }} />
                        <div style={{ 
                          width: hasMultipleUpgrades ? "14px" : "20px", 
                          height: hasMultipleUpgrades ? "14px" : "20px", 
                          borderRadius: "50%", 
                          backgroundColor: getKpiTrafficLight("irpd", irpdKpi.value, irpdKpi.goal) === "yellow" ? "#eab308" : "rgba(234, 179, 8, 0.2)",
                          boxShadow: getKpiTrafficLight("irpd", irpdKpi.value, irpdKpi.goal) === "yellow" ? "0 0 16px rgba(234, 179, 8, 1), 0 0 32px rgba(234, 179, 8, 0.6)" : "none",
                        }} />
                        <div style={{ 
                          width: hasMultipleUpgrades ? "14px" : "20px", 
                          height: hasMultipleUpgrades ? "14px" : "20px", 
                          borderRadius: "50%", 
                          backgroundColor: getKpiTrafficLight("irpd", irpdKpi.value, irpdKpi.goal) === "red" ? "#ef4444" : "rgba(239, 68, 68, 0.2)",
                          boxShadow: getKpiTrafficLight("irpd", irpdKpi.value, irpdKpi.goal) === "red" ? "0 0 16px rgba(239, 68, 68, 1), 0 0 32px rgba(239, 68, 68, 0.6)" : "none",
                        }} />
                      </div>
                      <p style={{ 
                        margin: 0, 
                        color: "#fff", 
                        fontSize: hasMultipleUpgrades ? "18px" : "24px", 
                        fontWeight: "800", 
                        letterSpacing: "3px",
                        textTransform: "uppercase",
                        textShadow: "0 0 10px rgba(255,255,255,0.3)",
                      }}>IRPD MTD</p>
                      <p style={{ 
                        margin: `${hasMultipleUpgrades ? "8px" : "16px"} 0 0 0`, 
                        color: getKpiColor(getKpiTrafficLight("irpd", irpdKpi.value, irpdKpi.goal)), 
                        fontSize: hasMultipleUpgrades ? "52px" : "80px", 
                        fontWeight: "900",
                        lineHeight: "1",
                        textShadow: `0 0 40px ${getKpiColor(getKpiTrafficLight("irpd", irpdKpi.value, irpdKpi.goal))}, 0 0 80px ${getKpiColor(getKpiTrafficLight("irpd", irpdKpi.value, irpdKpi.goal))}88`,
                      }}>
                        {irpdKpi.value.toFixed(2)}
                      </p>
                      {irpdYesterday && parseFloat(irpdYesterday) > 0 && (() => {
                        const yesterdayVal = parseFloat(irpdYesterday);
                        const arrow = getYesterdayArrow("irpd", yesterdayVal, irpdKpi.value);
                        const valueColor = getYesterdayValueColor("irpd", yesterdayVal, irpdKpi.goal);
                        return (
                          <div style={{ display: "flex", alignItems: "center", gap: hasMultipleUpgrades ? "6px" : "8px", marginTop: hasMultipleUpgrades ? "4px" : "8px" }}>
                            <span style={{ 
                              fontSize: hasMultipleUpgrades ? "20px" : "28px", 
                              fontWeight: "900",
                              color: arrow.color,
                              textShadow: `0 0 10px ${arrow.color}`,
                            }}>
                              {arrow.arrow}
                            </span>
                            <span style={{ 
                              fontSize: hasMultipleUpgrades ? "16px" : "24px", 
                              fontWeight: "700",
                              color: valueColor,
                              textShadow: `0 0 8px ${valueColor}66`,
                            }}>
                              Yest: {yesterdayVal.toFixed(2)}
                            </span>
                          </div>
                        );
                      })()}
                      <p style={{ margin: `${hasMultipleUpgrades ? "6px" : "12px"} 0 0 0`, color: "#888", fontSize: hasMultipleUpgrades ? "14px" : "20px", fontWeight: "600" }}>Goal: {irpdKpi.goal.toFixed(2)}</p>
                    </div>
                  )}

                  {/* SES - MEGA Eye Catcher */}
                  {sesKpi && (
                    <div style={{ 
                      background: `linear-gradient(145deg, #1a1a1a 0%, #0d0d0d 100%)`,
                      borderRadius: hasMultipleUpgrades ? "16px" : "24px",
                      padding: hasMultipleUpgrades ? "18px" : "32px",
                      border: `${hasMultipleUpgrades ? "4px" : "6px"} solid ${getKpiColor(getKpiTrafficLight("ses", sesKpi.value, sesKpi.goal))}`,
                      boxShadow: `0 0 ${hasMultipleUpgrades ? "40px" : "60px"} ${getKpiColor(getKpiTrafficLight("ses", sesKpi.value, sesKpi.goal))}99, inset 0 0 ${hasMultipleUpgrades ? "20px" : "40px"} ${getKpiColor(getKpiTrafficLight("ses", sesKpi.value, sesKpi.goal))}22`,
                      position: "relative",
                    }}>
                      <div style={{ 
                        position: "absolute", 
                        top: hasMultipleUpgrades ? "12px" : "20px", 
                        right: hasMultipleUpgrades ? "12px" : "20px", 
                        display: "flex", 
                        flexDirection: "column", 
                        gap: hasMultipleUpgrades ? "4px" : "6px" 
                      }}>
                        <div style={{ 
                          width: hasMultipleUpgrades ? "14px" : "20px", 
                          height: hasMultipleUpgrades ? "14px" : "20px", 
                          borderRadius: "50%", 
                          backgroundColor: getKpiTrafficLight("ses", sesKpi.value, sesKpi.goal) === "green" ? "#22c55e" : "rgba(34, 197, 94, 0.2)",
                          boxShadow: getKpiTrafficLight("ses", sesKpi.value, sesKpi.goal) === "green" ? "0 0 16px rgba(34, 197, 94, 1), 0 0 32px rgba(34, 197, 94, 0.6)" : "none",
                        }} />
                        <div style={{ 
                          width: hasMultipleUpgrades ? "14px" : "20px", 
                          height: hasMultipleUpgrades ? "14px" : "20px", 
                          borderRadius: "50%", 
                          backgroundColor: getKpiTrafficLight("ses", sesKpi.value, sesKpi.goal) === "yellow" ? "#eab308" : "rgba(234, 179, 8, 0.2)",
                          boxShadow: getKpiTrafficLight("ses", sesKpi.value, sesKpi.goal) === "yellow" ? "0 0 16px rgba(234, 179, 8, 1), 0 0 32px rgba(234, 179, 8, 0.6)" : "none",
                        }} />
                        <div style={{ 
                          width: hasMultipleUpgrades ? "14px" : "20px", 
                          height: hasMultipleUpgrades ? "14px" : "20px", 
                          borderRadius: "50%", 
                          backgroundColor: getKpiTrafficLight("ses", sesKpi.value, sesKpi.goal) === "red" ? "#ef4444" : "rgba(239, 68, 68, 0.2)",
                          boxShadow: getKpiTrafficLight("ses", sesKpi.value, sesKpi.goal) === "red" ? "0 0 16px rgba(239, 68, 68, 1), 0 0 32px rgba(239, 68, 68, 0.6)" : "none",
                        }} />
                      </div>
                      <p style={{ 
                        margin: 0, 
                        color: "#fff", 
                        fontSize: hasMultipleUpgrades ? "18px" : "24px", 
                        fontWeight: "800", 
                        letterSpacing: "3px",
                        textTransform: "uppercase",
                        textShadow: "0 0 10px rgba(255,255,255,0.3)",
                      }}>SES MTD</p>
                      <p style={{ 
                        margin: `${hasMultipleUpgrades ? "8px" : "16px"} 0 0 0`, 
                        color: getKpiColor(getKpiTrafficLight("ses", sesKpi.value, sesKpi.goal)), 
                        fontSize: hasMultipleUpgrades ? "52px" : "80px", 
                        fontWeight: "900",
                        lineHeight: "1",
                        textShadow: `0 0 40px ${getKpiColor(getKpiTrafficLight("ses", sesKpi.value, sesKpi.goal))}, 0 0 80px ${getKpiColor(getKpiTrafficLight("ses", sesKpi.value, sesKpi.goal))}88`,
                      }}>
                        {sesKpi.value.toFixed(1)}%
                      </p>
                      {sesYesterday && parseFloat(sesYesterday) > 0 && (() => {
                        const yesterdayVal = parseFloat(sesYesterday);
                        const arrow = getYesterdayArrow("ses", yesterdayVal, sesKpi.value);
                        const valueColor = getYesterdayValueColor("ses", yesterdayVal, sesKpi.goal);
                        return (
                          <div style={{ display: "flex", alignItems: "center", gap: hasMultipleUpgrades ? "6px" : "8px", marginTop: hasMultipleUpgrades ? "4px" : "8px" }}>
                            <span style={{ 
                              fontSize: hasMultipleUpgrades ? "20px" : "28px", 
                              fontWeight: "900",
                              color: arrow.color,
                              textShadow: `0 0 10px ${arrow.color}`,
                            }}>
                              {arrow.arrow}
                            </span>
                            <span style={{ 
                              fontSize: hasMultipleUpgrades ? "16px" : "24px", 
                              fontWeight: "700",
                              color: valueColor,
                              textShadow: `0 0 8px ${valueColor}66`,
                            }}>
                              Yest: {yesterdayVal.toFixed(1)}%
                            </span>
                          </div>
                        );
                      })()}
                      <p style={{ margin: `${hasMultipleUpgrades ? "6px" : "12px"} 0 0 0`, color: "#888", fontSize: hasMultipleUpgrades ? "14px" : "20px", fontWeight: "600" }}>Goal: {sesKpi.goal.toFixed(1)}%</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
