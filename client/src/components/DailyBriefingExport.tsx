import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, Clock, Car, Truck, Plane, TrendingUp, Users, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { getGermanDateString } from "@/lib/germanTime";
import { toJpeg } from "html-to-image";
import type { TimedriverCalculation, FuturePlanning, KpiMetric } from "@/types";

type DashboardStatus = {
  timedriver: { isDone: boolean; details?: string };
  upgrade: { isDone: boolean; hasPending: boolean; isOverdue: boolean; pendingVehicle?: any };
  flow: { isDone: boolean; pending: number; total: number };
  todo: { isDone: boolean; completed: number; total: number; postponed?: number };
  quality: { isDone: boolean; passedChecks: number; incompleteTasks: number };
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
            {/* Header - No Total Progress */}
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center", 
              marginBottom: "30px",
              background: "linear-gradient(135deg, rgba(255, 102, 0, 0.15) 0%, transparent 50%)",
              borderRadius: "20px",
              padding: "24px 32px",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}>
              <div>
                <h1 style={{ fontSize: "48px", fontWeight: "bold", color: "white", margin: 0 }}>
                  DailyBriefing<span style={{ fontWeight: "900", color: "#f97316" }}>41137</span>
                </h1>
                <p style={{ fontSize: "26px", color: "rgba(255,255,255,0.6)", margin: "8px 0 0 0" }}>
                  {formatWeekdayDate(todayDate)}
                </p>
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
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", flex: 1 }}>
              {/* Left Column */}
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {/* TodaySIXT (FutureSIXT data relabeled) */}
                {futureData && (
                  <div style={{ 
                    backgroundColor: "#1a1a1a",
                    borderRadius: "16px",
                    padding: "24px",
                    border: "2px solid rgba(34, 197, 94, 0.4)",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                      <div style={{ 
                        width: "44px", 
                        height: "44px", 
                        borderRadius: "10px", 
                        backgroundColor: "rgba(34, 197, 94, 0.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}>
                        <Clock style={{ width: "24px", height: "24px", color: "#22c55e" }} />
                      </div>
                      <h2 style={{ fontSize: "28px", fontWeight: "bold", color: "white", margin: 0 }}>
                        Today<span style={{ color: "#f97316" }}>SIXT</span>
                      </h2>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
                      <div style={{ textAlign: "center", padding: "16px", backgroundColor: "#262626", borderRadius: "12px" }}>
                        <p style={{ margin: 0, color: "#888", fontSize: "12px", marginBottom: "4px" }}>TOTAL</p>
                        <p style={{ margin: 0, color: "#fff", fontSize: "36px", fontWeight: "bold" }}>{futureData.reservationsTotal}</p>
                      </div>
                      <div style={{ textAlign: "center", padding: "16px", backgroundColor: "#262626", borderRadius: "12px" }}>
                        <p style={{ margin: 0, color: "#888", fontSize: "12px", marginBottom: "4px", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                          <Car style={{ width: "14px", height: "14px" }} /> CAR
                        </p>
                        <p style={{ margin: 0, color: "#fff", fontSize: "36px", fontWeight: "bold" }}>{futureData.reservationsCar}</p>
                        {futureData.carDayMin !== null && futureData.carDayMin !== undefined && (
                          <p style={{ 
                            margin: "8px 0 0 0", 
                            fontSize: "22px", 
                            fontWeight: "900",
                            color: futureData.carDayMin < 0 ? "#ef4444" : "#22c55e",
                            textShadow: futureData.carDayMin < 0 ? "0 0 12px rgba(239, 68, 68, 0.6)" : "0 0 12px rgba(34, 197, 94, 0.6)",
                          }}>
                            DayMin: {futureData.carDayMin >= 0 ? '+' : ''}{futureData.carDayMin}
                          </p>
                        )}
                      </div>
                      <div style={{ textAlign: "center", padding: "16px", backgroundColor: "#262626", borderRadius: "12px" }}>
                        <p style={{ margin: 0, color: "#888", fontSize: "12px", marginBottom: "4px", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                          <Truck style={{ width: "14px", height: "14px" }} /> VAN
                        </p>
                        <p style={{ margin: 0, color: "#fff", fontSize: "36px", fontWeight: "bold" }}>{futureData.reservationsVan}</p>
                        {futureData.vanDayMin !== null && futureData.vanDayMin !== undefined && (
                          <p style={{ 
                            margin: "8px 0 0 0", 
                            fontSize: "22px", 
                            fontWeight: "900",
                            color: futureData.vanDayMin < 0 ? "#ef4444" : "#22c55e",
                            textShadow: futureData.vanDayMin < 0 ? "0 0 12px rgba(239, 68, 68, 0.6)" : "0 0 12px rgba(34, 197, 94, 0.6)",
                          }}>
                            DayMin: {futureData.vanDayMin >= 0 ? '+' : ''}{futureData.vanDayMin}
                          </p>
                        )}
                      </div>
                      <div style={{ textAlign: "center", padding: "16px", backgroundColor: "#262626", borderRadius: "12px" }}>
                        <p style={{ margin: 0, color: "#888", fontSize: "12px", marginBottom: "4px", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                          <Plane style={{ width: "14px", height: "14px" }} /> TAS
                        </p>
                        <p style={{ margin: 0, color: "#fff", fontSize: "36px", fontWeight: "bold" }}>{futureData.reservationsTas}</p>
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "16px" }}>
                      <div style={{ textAlign: "center", padding: "12px", backgroundColor: "#262626", borderRadius: "12px" }}>
                        <p style={{ margin: 0, color: "#888", fontSize: "12px" }}>Deliveries</p>
                        <p style={{ margin: 0, color: "#fff", fontSize: "28px", fontWeight: "bold" }}>{futureData.deliveriesTomorrow}</p>
                      </div>
                      <div style={{ textAlign: "center", padding: "12px", backgroundColor: "#262626", borderRadius: "12px" }}>
                        <p style={{ margin: 0, color: "#888", fontSize: "12px" }}>Collections</p>
                        <p style={{ margin: 0, color: "#fff", fontSize: "28px", fontWeight: "bold" }}>{futureData.collectionsOpen}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* TimeDriverSIXT */}
                {driversData.length > 0 && (
                  <div style={{ 
                    backgroundColor: "#1a1a1a",
                    borderRadius: "16px",
                    padding: "24px",
                    border: "2px solid rgba(34, 197, 94, 0.4)",
                    flex: 1,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                      <div style={{ 
                        width: "44px", 
                        height: "44px", 
                        borderRadius: "10px", 
                        backgroundColor: "rgba(34, 197, 94, 0.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}>
                        <Users style={{ width: "24px", height: "24px", color: "#22c55e" }} />
                      </div>
                      <div>
                        <h2 style={{ fontSize: "24px", fontWeight: "bold", color: "white", margin: 0 }}>
                          TimeDriver<span style={{ color: "#f97316" }}>SIXT</span>
                        </h2>
                        <p style={{ margin: 0, color: "#888", fontSize: "14px" }}>
                          {timedriverCalc?.rentals} rentals × €{timedriverCalc?.budgetPerRental.toFixed(2)} = €{timedriverCalc?.totalBudget.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px" }}>
                      {driversData.map((driver) => (
                        <div key={driver.id} style={{ 
                          textAlign: "center", 
                          padding: "14px", 
                          backgroundColor: "#262626", 
                          borderRadius: "12px",
                          border: driver.percent >= 100 ? "2px solid rgba(249, 115, 22, 0.5)" : "2px solid transparent",
                        }}>
                          <p style={{ margin: 0, color: "#f97316", fontSize: "20px", fontWeight: "bold" }}>{driver.initials}</p>
                          <p style={{ margin: "4px 0", color: "#fff", fontSize: "22px", fontWeight: "bold" }}>
                            {driver.assignedHours}h {driver.assignedMinutes}m
                          </p>
                          <p style={{ margin: 0, color: "#888", fontSize: "12px" }}>(max {driver.maxHours}h/day)</p>
                          {driver.overflowHours !== undefined && driver.overflowHours > 0 && (
                            <p style={{ margin: "4px 0 0 0", color: "rgba(255,255,255,0.5)", fontSize: "11px" }}>
                              (if needed +{driver.overflowHours}h {driver.overflowMinutes}m)
                            </p>
                          )}
                          <div style={{ 
                            marginTop: "8px", 
                            height: "6px", 
                            backgroundColor: "#333", 
                            borderRadius: "3px",
                            overflow: "hidden",
                          }}>
                            <div style={{ 
                              width: `${Math.min(driver.percent, 100)}%`, 
                              height: "100%", 
                              backgroundColor: driver.percent >= 100 ? "#f97316" : "#22c55e",
                              borderRadius: "3px",
                            }} />
                          </div>
                          <p style={{ margin: "4px 0 0 0", color: driver.percent >= 100 ? "#f97316" : "#22c55e", fontSize: "12px" }}>
                            {Math.round(driver.percent)}%
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column */}
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {/* UpgradeSIXT with UP % MTD inside */}
                <div style={{ 
                  backgroundColor: "#1a1a1a",
                  borderRadius: "16px",
                  padding: "24px",
                  border: `2px solid ${soldVehicles.length > 0 ? "rgba(34, 197, 94, 0.4)" : "rgba(239, 68, 68, 0.4)"}`,
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ 
                        width: "44px", 
                        height: "44px", 
                        borderRadius: "10px", 
                        backgroundColor: soldVehicles.length > 0 ? "rgba(34, 197, 94, 0.2)" : "rgba(59, 130, 246, 0.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}>
                        <TrendingUp style={{ width: "24px", height: "24px", color: soldVehicles.length > 0 ? "#22c55e" : "#3b82f6" }} />
                      </div>
                      <h2 style={{ fontSize: "28px", fontWeight: "bold", color: "white", margin: 0 }}>
                        Upgrade<span style={{ color: "#3b82f6" }}>SIXT</span>
                      </h2>
                    </div>
                    {/* UP % MTD KPI - Big and Bold inside UpgradeSIXT */}
                    <div style={{ 
                      backgroundColor: "#262626",
                      borderRadius: "16px",
                      padding: "16px 24px",
                      border: upMtdKpi 
                        ? `3px solid ${getKpiColor(getKpiTrafficLight("upmtd", upMtdKpi.value, upMtdKpi.goal))}`
                        : "3px solid rgba(255, 255, 255, 0.2)",
                      boxShadow: upMtdKpi 
                        ? `0 0 20px ${getKpiColor(getKpiTrafficLight("upmtd", upMtdKpi.value, upMtdKpi.goal))}66`
                        : "none",
                      display: "flex",
                      alignItems: "center",
                      gap: "16px",
                    }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <div style={{ 
                          width: "14px", height: "14px", borderRadius: "50%", 
                          backgroundColor: upMtdKpi && getKpiTrafficLight("upmtd", upMtdKpi.value, upMtdKpi.goal) === "green" ? "#22c55e" : "rgba(34, 197, 94, 0.3)",
                          boxShadow: upMtdKpi && getKpiTrafficLight("upmtd", upMtdKpi.value, upMtdKpi.goal) === "green" ? "0 0 12px rgba(34, 197, 94, 1)" : "none",
                        }} />
                        <div style={{ 
                          width: "14px", height: "14px", borderRadius: "50%", 
                          backgroundColor: upMtdKpi && getKpiTrafficLight("upmtd", upMtdKpi.value, upMtdKpi.goal) === "yellow" ? "#eab308" : "rgba(234, 179, 8, 0.3)",
                          boxShadow: upMtdKpi && getKpiTrafficLight("upmtd", upMtdKpi.value, upMtdKpi.goal) === "yellow" ? "0 0 12px rgba(234, 179, 8, 1)" : "none",
                        }} />
                        <div style={{ 
                          width: "14px", height: "14px", borderRadius: "50%", 
                          backgroundColor: !upMtdKpi || getKpiTrafficLight("upmtd", upMtdKpi.value, upMtdKpi.goal) === "red" ? "#ef4444" : "rgba(239, 68, 68, 0.3)",
                          boxShadow: !upMtdKpi || getKpiTrafficLight("upmtd", upMtdKpi.value, upMtdKpi.goal) === "red" ? "0 0 12px rgba(239, 68, 68, 1)" : "none",
                        }} />
                      </div>
                      <div>
                        <p style={{ margin: 0, color: "#888", fontSize: "14px", fontWeight: "700" }}>UP % MTD</p>
                        <p style={{ 
                          margin: "4px 0 0 0", 
                          color: upMtdKpi ? getKpiColor(getKpiTrafficLight("upmtd", upMtdKpi.value, upMtdKpi.goal)) : "#888", 
                          fontSize: "36px", 
                          fontWeight: "900",
                          textShadow: upMtdKpi ? `0 0 16px ${getKpiColor(getKpiTrafficLight("upmtd", upMtdKpi.value, upMtdKpi.goal))}88` : "none",
                        }}>
                          {upMtdKpi ? `${upMtdKpi.value.toFixed(1)}%` : "--"}
                        </p>
                        <p style={{ margin: 0, color: "#666", fontSize: "12px" }}>Goal: {upMtdKpi ? `${upMtdKpi.goal.toFixed(1)}%` : "15.0%"}</p>
                      </div>
                    </div>
                  </div>
                  
                  {upgradeVehicles.length === 0 ? (
                    <p style={{ color: "#888", fontSize: "18px" }}>No UP vehicles defined today</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                      {upgradeVehicles.map((vehicle) => (
                        <div key={vehicle.id} style={{ 
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "18px 20px",
                          backgroundColor: "#262626",
                          borderRadius: "12px",
                          border: vehicle.isSold ? "2px solid rgba(34, 197, 94, 0.5)" : "2px solid rgba(234, 179, 8, 0.5)",
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                            {vehicle.isVan ? (
                              <Truck style={{ width: "28px", height: "28px", color: "#888" }} />
                            ) : (
                              <Car style={{ width: "28px", height: "28px", color: "#888" }} />
                            )}
                            <div>
                              <p style={{ 
                                margin: 0, 
                                color: "#fff", 
                                fontSize: "24px", 
                                fontWeight: "bold",
                                fontFamily: "monospace",
                              }}>
                                {vehicle.licensePlate}
                              </p>
                              <p style={{ margin: "4px 0 0 0", color: "#888", fontSize: "16px" }}>
                                {vehicle.model}
                              </p>
                            </div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <p style={{ 
                              margin: 0, 
                              color: vehicle.isSold ? "#22c55e" : "#eab308", 
                              fontSize: "18px",
                              fontWeight: "700",
                            }}>
                              {vehicle.isSold ? "SOLD" : "PENDING"}
                            </p>
                            <p style={{ 
                              margin: "6px 0 0 0", 
                              color: "#f97316", 
                              fontSize: "22px",
                              fontWeight: "900",
                              textShadow: "0 0 8px rgba(249, 115, 22, 0.5)",
                            }}>
                              {vehicle.reason}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* KPI Tiles - IRPD and SES - ULTRA BOLD EYE CATCHERS */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "24px" }}>
                  {/* IRPD - MEGA Eye Catcher */}
                  {irpdKpi && (
                    <div style={{ 
                      background: `linear-gradient(145deg, #1a1a1a 0%, #0d0d0d 100%)`,
                      borderRadius: "24px",
                      padding: "32px",
                      border: `6px solid ${getKpiColor(getKpiTrafficLight("irpd", irpdKpi.value, irpdKpi.goal))}`,
                      boxShadow: `0 0 60px ${getKpiColor(getKpiTrafficLight("irpd", irpdKpi.value, irpdKpi.goal))}99, inset 0 0 40px ${getKpiColor(getKpiTrafficLight("irpd", irpdKpi.value, irpdKpi.goal))}22`,
                      position: "relative",
                    }}>
                      <div style={{ 
                        position: "absolute", 
                        top: "20px", 
                        right: "20px", 
                        display: "flex", 
                        flexDirection: "column", 
                        gap: "6px" 
                      }}>
                        <div style={{ 
                          width: "20px", 
                          height: "20px", 
                          borderRadius: "50%", 
                          backgroundColor: getKpiTrafficLight("irpd", irpdKpi.value, irpdKpi.goal) === "green" ? "#22c55e" : "rgba(34, 197, 94, 0.2)",
                          boxShadow: getKpiTrafficLight("irpd", irpdKpi.value, irpdKpi.goal) === "green" ? "0 0 16px rgba(34, 197, 94, 1), 0 0 32px rgba(34, 197, 94, 0.6)" : "none",
                        }} />
                        <div style={{ 
                          width: "20px", 
                          height: "20px", 
                          borderRadius: "50%", 
                          backgroundColor: getKpiTrafficLight("irpd", irpdKpi.value, irpdKpi.goal) === "yellow" ? "#eab308" : "rgba(234, 179, 8, 0.2)",
                          boxShadow: getKpiTrafficLight("irpd", irpdKpi.value, irpdKpi.goal) === "yellow" ? "0 0 16px rgba(234, 179, 8, 1), 0 0 32px rgba(234, 179, 8, 0.6)" : "none",
                        }} />
                        <div style={{ 
                          width: "20px", 
                          height: "20px", 
                          borderRadius: "50%", 
                          backgroundColor: getKpiTrafficLight("irpd", irpdKpi.value, irpdKpi.goal) === "red" ? "#ef4444" : "rgba(239, 68, 68, 0.2)",
                          boxShadow: getKpiTrafficLight("irpd", irpdKpi.value, irpdKpi.goal) === "red" ? "0 0 16px rgba(239, 68, 68, 1), 0 0 32px rgba(239, 68, 68, 0.6)" : "none",
                        }} />
                      </div>
                      <p style={{ 
                        margin: 0, 
                        color: "#fff", 
                        fontSize: "24px", 
                        fontWeight: "800", 
                        letterSpacing: "3px",
                        textTransform: "uppercase",
                        textShadow: "0 0 10px rgba(255,255,255,0.3)",
                      }}>IRPD MTD</p>
                      <p style={{ 
                        margin: "16px 0 0 0", 
                        color: getKpiColor(getKpiTrafficLight("irpd", irpdKpi.value, irpdKpi.goal)), 
                        fontSize: "80px", 
                        fontWeight: "900",
                        lineHeight: "1",
                        textShadow: `0 0 40px ${getKpiColor(getKpiTrafficLight("irpd", irpdKpi.value, irpdKpi.goal))}, 0 0 80px ${getKpiColor(getKpiTrafficLight("irpd", irpdKpi.value, irpdKpi.goal))}88`,
                      }}>
                        {irpdKpi.value.toFixed(2)}
                      </p>
                      <p style={{ margin: "12px 0 0 0", color: "#888", fontSize: "20px", fontWeight: "600" }}>Goal: {irpdKpi.goal.toFixed(2)}</p>
                    </div>
                  )}

                  {/* SES - MEGA Eye Catcher */}
                  {sesKpi && (
                    <div style={{ 
                      background: `linear-gradient(145deg, #1a1a1a 0%, #0d0d0d 100%)`,
                      borderRadius: "24px",
                      padding: "32px",
                      border: `6px solid ${getKpiColor(getKpiTrafficLight("ses", sesKpi.value, sesKpi.goal))}`,
                      boxShadow: `0 0 60px ${getKpiColor(getKpiTrafficLight("ses", sesKpi.value, sesKpi.goal))}99, inset 0 0 40px ${getKpiColor(getKpiTrafficLight("ses", sesKpi.value, sesKpi.goal))}22`,
                      position: "relative",
                    }}>
                      <div style={{ 
                        position: "absolute", 
                        top: "20px", 
                        right: "20px", 
                        display: "flex", 
                        flexDirection: "column", 
                        gap: "6px" 
                      }}>
                        <div style={{ 
                          width: "20px", 
                          height: "20px", 
                          borderRadius: "50%", 
                          backgroundColor: getKpiTrafficLight("ses", sesKpi.value, sesKpi.goal) === "green" ? "#22c55e" : "rgba(34, 197, 94, 0.2)",
                          boxShadow: getKpiTrafficLight("ses", sesKpi.value, sesKpi.goal) === "green" ? "0 0 16px rgba(34, 197, 94, 1), 0 0 32px rgba(34, 197, 94, 0.6)" : "none",
                        }} />
                        <div style={{ 
                          width: "20px", 
                          height: "20px", 
                          borderRadius: "50%", 
                          backgroundColor: getKpiTrafficLight("ses", sesKpi.value, sesKpi.goal) === "yellow" ? "#eab308" : "rgba(234, 179, 8, 0.2)",
                          boxShadow: getKpiTrafficLight("ses", sesKpi.value, sesKpi.goal) === "yellow" ? "0 0 16px rgba(234, 179, 8, 1), 0 0 32px rgba(234, 179, 8, 0.6)" : "none",
                        }} />
                        <div style={{ 
                          width: "20px", 
                          height: "20px", 
                          borderRadius: "50%", 
                          backgroundColor: getKpiTrafficLight("ses", sesKpi.value, sesKpi.goal) === "red" ? "#ef4444" : "rgba(239, 68, 68, 0.2)",
                          boxShadow: getKpiTrafficLight("ses", sesKpi.value, sesKpi.goal) === "red" ? "0 0 16px rgba(239, 68, 68, 1), 0 0 32px rgba(239, 68, 68, 0.6)" : "none",
                        }} />
                      </div>
                      <p style={{ 
                        margin: 0, 
                        color: "#fff", 
                        fontSize: "24px", 
                        fontWeight: "800", 
                        letterSpacing: "3px",
                        textTransform: "uppercase",
                        textShadow: "0 0 10px rgba(255,255,255,0.3)",
                      }}>SES MTD</p>
                      <p style={{ 
                        margin: "16px 0 0 0", 
                        color: getKpiColor(getKpiTrafficLight("ses", sesKpi.value, sesKpi.goal)), 
                        fontSize: "80px", 
                        fontWeight: "900",
                        lineHeight: "1",
                        textShadow: `0 0 40px ${getKpiColor(getKpiTrafficLight("ses", sesKpi.value, sesKpi.goal))}, 0 0 80px ${getKpiColor(getKpiTrafficLight("ses", sesKpi.value, sesKpi.goal))}88`,
                      }}>
                        {sesKpi.value.toFixed(1)}%
                      </p>
                      <p style={{ margin: "12px 0 0 0", color: "#888", fontSize: "20px", fontWeight: "600" }}>Goal: {sesKpi.goal.toFixed(1)}%</p>
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
