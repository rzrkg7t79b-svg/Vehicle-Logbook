import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, Clock, Car, ClipboardCheck, CheckSquare, Workflow, CheckCircle, AlertCircle, Users, Timer, TrendingUp, Truck, Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getGermanDateString } from "@/lib/germanTime";
import { addDays } from "date-fns";
import { toJpeg } from "html-to-image";
import type { Todo, FlowTask, Vehicle, TimedriverCalculation, User, Comment, FuturePlanning, KpiMetric, DriverTask } from "@/types";

type VehicleWithComments = Vehicle & { comments: Comment[] };

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
  hasPostponedTasks?: boolean;
};

type UpgradeVehicle = {
  id: number;
  licensePlate: string;
  model: string;
  reason: string;
  isSold: boolean;
  soldBy: string | null;
  soldAt: string | null;
  createdAt: string;
  createdBy: string | null;
  date: string;
};

type QualityCheck = {
  id: number;
  licensePlate: string;
  passed: boolean;
  comment: string | null;
  checkedBy: string;
  createdAt: string;
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

interface ExportPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExportPreview({ open, onOpenChange }: ExportPreviewProps) {
  const exportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const todayDate = getGermanDateString();

  const { data: dashboardStatus } = useQuery<DashboardStatus>({
    queryKey: ["/api/dashboard/status", todayDate],
    queryFn: async () => {
      const res = await fetch(`/api/dashboard/status?date=${todayDate}`);
      return res.json();
    },
  });

  const { data: todos = [] } = useQuery<Todo[]>({
    queryKey: ["/api/todos"],
  });

  const { data: flowTasks = [] } = useQuery<FlowTask[]>({
    queryKey: ["/api/flow-tasks"],
  });

  const { data: vehicles = [] } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
  });

  const { data: vehiclesWithComments = [] } = useQuery<VehicleWithComments[]>({
    queryKey: ["/api/vehicles-with-comments"],
    queryFn: async () => {
      const vehicleList = vehicles.filter(v => !v.isPast);
      const results = await Promise.all(
        vehicleList.map(async (v) => {
          const res = await fetch(`/api/vehicles/${v.id}`);
          return res.json();
        })
      );
      return results;
    },
    enabled: vehicles.length > 0,
  });

  const { data: qualityChecks = [] } = useQuery<QualityCheck[]>({
    queryKey: ["/api/quality-checks", todayDate],
    queryFn: async () => {
      const res = await fetch(`/api/quality-checks?date=${todayDate}`);
      return res.json();
    },
  });

  const { data: driverTasks = [] } = useQuery<DriverTask[]>({
    queryKey: ["/api/driver-tasks"],
  });

  // Filter quality checks for export: show passed OR not-passed with incomplete driver task
  const exportQualityChecks = qualityChecks.filter(check => {
    if (check.passed) return true;
    // For not-passed checks, only show if driver task exists and is NOT completed
    const relatedTask = driverTasks.find(t => t.qualityCheckId === check.id);
    // If no related task found, show the check (safety - shouldn't happen normally)
    if (!relatedTask) return true;
    // Only show if driver task is not completed
    return !relatedTask.completed;
  });

  const { data: timedriverCalc } = useQuery<TimedriverCalculation | null>({
    queryKey: ["/api/timedriver-calculations", todayDate],
    queryFn: async () => {
      const res = await fetch(`/api/timedriver-calculations/${todayDate}`);
      return res.json();
    },
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
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

  const getKpiMetric = (key: "irpd" | "ses"): KpiMetric | undefined => {
    return kpiMetrics.find(m => m.key === key);
  };

  const getKpiColor = (key: "irpd" | "ses", value: number | undefined): string => {
    if (value === undefined) return "#888";
    if (key === "irpd") {
      if (value >= 8.0) return "#22c55e";
      if (value >= 7.2) return "#eab308";
      return "#ef4444";
    } else {
      if (value >= 92.5) return "#22c55e";
      if (value >= 90.0) return "#eab308";
      return "#ef4444";
    }
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

  const getKpiGlowColor = (key: "irpd" | "ses", value: number | undefined): string => {
    if (value === undefined) return "100, 100, 100";
    if (key === "irpd") {
      if (value >= 8.0) return "34, 197, 94";
      if (value >= 7.2) return "234, 179, 8";
      return "239, 68, 68";
    } else {
      if (value >= 92.5) return "34, 197, 94";
      if (value >= 90.0) return "234, 179, 8";
      return "239, 68, 68";
    }
  };

  const isKpiStale = (updatedAt: Date | string | null): boolean => {
    if (!updatedAt) return true;
    const updated = new Date(updatedAt);
    const now = new Date();
    const diffDays = (now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays >= 3;
  };

  const handleExport = async () => {
    if (!exportRef.current) return;
    setIsExporting(true);
    
    try {
      const element = exportRef.current;
      
      // Temporarily remove transform to capture at full size
      const originalTransform = element.style.transform;
      element.style.transform = "none";
      
      // Force browser reflow
      element.offsetHeight;
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Use html-to-image for pixel-perfect capture
      const dataUrl = await toJpeg(element, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: "#1a1a1a",
        style: {
          transform: "none",
        },
      });
      
      // Restore transform
      element.style.transform = originalTransform;
      
      const fileName = `MasterSIXT-Export-${todayDate}.jpg`;
      
      // Convert data URL to blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], fileName, { type: "image/jpeg" });
      
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: "MasterSIXT Export",
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

  const progress = dashboardStatus?.overallProgress ?? 0;
  const activeVehicles = vehicles.filter(v => !v.isPast);
  const todaysTodos = todos.filter(t => !t.postponedToDate || t.postponedToDate <= todayDate);
  const postponedTodos = todos.filter(t => t.postponedToDate && t.postponedToDate > todayDate);

  const formatDate = (date: string) => {
    const d = new Date(date + "T12:00:00");
    return d.toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const formatHoursMinutes = (hours: number): string => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  const calculateCountdown = (startDate: Date | string): { days: number; hours: number; isExpired: boolean } => {
    const start = new Date(startDate);
    const end = addDays(start, 7);
    const now = new Date();
    const total = end.getTime() - now.getTime();
    
    if (total <= 0) {
      return { days: 0, hours: 0, isExpired: true };
    }
    
    return {
      days: Math.floor(total / (1000 * 60 * 60 * 24)),
      hours: Math.floor((total / (1000 * 60 * 60)) % 24),
      isExpired: false,
    };
  };

  const getLastComment = (vehicleId: number): Comment | null => {
    const vehicle = vehiclesWithComments.find(v => v.id === vehicleId);
    if (!vehicle || !vehicle.comments || vehicle.comments.length === 0) return null;
    return vehicle.comments.sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    )[0];
  };

  const driversData: DriverData[] = timedriverCalc?.driversData 
    ? JSON.parse(timedriverCalc.driversData) 
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Export Preview - Dashboard Cards</DialogTitle>
        </DialogHeader>
        
        <div className="flex justify-end mb-4">
          <Button onClick={handleExport} disabled={isExporting} size="sm">
            <Download className="w-4 h-4 mr-2" />
            {isExporting ? "Exporting..." : "Export"}
          </Button>
        </div>

        <div className="overflow-auto border rounded-lg" style={{ maxHeight: "70vh" }}>
          <div 
            ref={exportRef}
            style={{ 
              width: "1200px", 
              transform: "scale(0.5)",
              transformOrigin: "top left",
              backgroundColor: "#1a1a1a",
              padding: "32px",
              fontFamily: "system-ui, -apple-system, sans-serif",
            }}
          >
            {/* Header with Glass Effect */}
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center", 
              marginBottom: "30px",
              background: "linear-gradient(135deg, rgba(249, 115, 22, 0.1) 0%, transparent 50%)",
              borderRadius: "24px",
              padding: "32px",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}>
              <div>
                <h1 style={{ fontSize: "48px", fontWeight: "bold", color: "white", margin: 0 }}>
                  Master<span style={{ color: "#f97316" }}>SIXT</span>
                </h1>
                <p style={{ fontSize: "20px", color: "rgba(255,255,255,0.5)", margin: "8px 0 0 0" }}>
                  Daily Status Report - {formatDate(todayDate)}
                </p>
              </div>
              <div style={{ 
                position: "relative" as const,
                borderRadius: "20px",
                overflow: "hidden" as const,
              }}>
                {/* Glow background layer for progress */}
                <div style={{
                  position: "absolute" as const,
                  inset: "-30px",
                  background: progress === 100 
                    ? "radial-gradient(ellipse at center, rgba(34, 197, 94, 0.5) 0%, rgba(34, 197, 94, 0.2) 40%, transparent 70%)"
                    : "radial-gradient(ellipse at center, rgba(249, 115, 22, 0.5) 0%, rgba(249, 115, 22, 0.2) 40%, transparent 70%)",
                  zIndex: 0,
                }} />
                <div style={{ 
                  position: "relative" as const,
                  zIndex: 1,
                  display: "flex", 
                  alignItems: "center", 
                  gap: "20px",
                  backgroundColor: progress === 100 ? "rgba(34, 197, 94, 0.15)" : "rgba(249, 115, 22, 0.15)",
                  padding: "24px 40px",
                  borderRadius: "20px",
                  border: `2px solid ${progress === 100 ? "rgba(34, 197, 94, 0.6)" : "rgba(249, 115, 22, 0.6)"}`,
                }}>
                  <span style={{ fontSize: "64px", fontWeight: "bold", color: progress === 100 ? "#22c55e" : "#f97316" }}>
                    {progress}%
                  </span>
                  <span style={{ fontSize: "20px", color: "rgba(255,255,255,0.5)" }}>Daily<br/>Progress</span>
                </div>
              </div>
            </div>

            {/* KPI Indicators with Traffic Lights */}
            {(getKpiMetric("irpd") || getKpiMetric("ses")) && (
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "1fr 1fr", 
                gap: "20px", 
                marginBottom: "20px" 
              }}>
                {(["irpd", "ses"] as const).map((kpiKey) => {
                  const metric = getKpiMetric(kpiKey);
                  if (!metric) return null;
                  const value = metric.value;
                  const goal = metric.goal ?? (kpiKey === "irpd" ? 8.0 : 92.5);
                  const color = getKpiColor(kpiKey, value);
                  const stale = isKpiStale(metric.updatedAt);
                  const trafficLight = getKpiTrafficLight(kpiKey, value);
                  const glowColor = stale ? "100, 100, 100" : getKpiGlowColor(kpiKey, value);
                  
                  return (
                    <div key={kpiKey} style={{ 
                      position: "relative" as const,
                      borderRadius: "16px",
                      overflow: "hidden" as const,
                    }}>
                      {/* Glow background layer - radial gradient for export compatibility */}
                      {!stale && (
                        <div style={{
                          position: "absolute" as const,
                          inset: "-20px",
                          background: `radial-gradient(ellipse at center, rgba(${glowColor}, 0.35) 0%, rgba(${glowColor}, 0.15) 40%, transparent 70%)`,
                          zIndex: 0,
                        }} />
                      )}
                      {/* Card content */}
                      <div style={{ 
                        position: "relative" as const,
                        zIndex: 1,
                        backgroundColor: stale ? "rgba(40, 40, 40, 0.9)" : "rgba(30, 30, 30, 0.85)",
                        borderRadius: "16px",
                        padding: "20px",
                        border: stale ? "2px solid rgba(249, 115, 22, 0.5)" : `2px solid rgba(${glowColor}, 0.6)`,
                        opacity: stale ? 0.6 : 1,
                      }}>
                        {/* Traffic Light with glow backgrounds */}
                        <div style={{ 
                          position: "absolute" as const, 
                          top: "16px", 
                          right: "16px", 
                          display: "flex", 
                          flexDirection: "column" as const, 
                          gap: "6px" 
                        }}>
                          <div style={{ 
                            position: "relative" as const,
                            width: "14px", 
                            height: "14px", 
                          }}>
                            {trafficLight === "green" && (
                              <div style={{
                                position: "absolute" as const,
                                inset: "-8px",
                                background: "radial-gradient(circle, rgba(34, 197, 94, 0.8) 0%, rgba(34, 197, 94, 0.3) 50%, transparent 70%)",
                              }} />
                            )}
                            <div style={{ 
                              position: "relative" as const,
                              width: "14px", 
                              height: "14px", 
                              borderRadius: "50%", 
                              backgroundColor: trafficLight === "green" ? "#22c55e" : "rgba(34, 197, 94, 0.2)",
                            }} />
                          </div>
                          <div style={{ 
                            position: "relative" as const,
                            width: "14px", 
                            height: "14px", 
                          }}>
                            {trafficLight === "yellow" && (
                              <div style={{
                                position: "absolute" as const,
                                inset: "-8px",
                                background: "radial-gradient(circle, rgba(234, 179, 8, 0.8) 0%, rgba(234, 179, 8, 0.3) 50%, transparent 70%)",
                              }} />
                            )}
                            <div style={{ 
                              position: "relative" as const,
                              width: "14px", 
                              height: "14px", 
                              borderRadius: "50%", 
                              backgroundColor: trafficLight === "yellow" ? "#eab308" : "rgba(234, 179, 8, 0.2)",
                            }} />
                          </div>
                          <div style={{ 
                            position: "relative" as const,
                            width: "14px", 
                            height: "14px", 
                          }}>
                            {trafficLight === "red" && (
                              <div style={{
                                position: "absolute" as const,
                                inset: "-8px",
                                background: "radial-gradient(circle, rgba(239, 68, 68, 0.8) 0%, rgba(239, 68, 68, 0.3) 50%, transparent 70%)",
                              }} />
                            )}
                            <div style={{ 
                              position: "relative" as const,
                              width: "14px", 
                              height: "14px", 
                              borderRadius: "50%", 
                              backgroundColor: trafficLight === "red" ? "#ef4444" : "rgba(239, 68, 68, 0.2)",
                            }} />
                          </div>
                        </div>

                        <div style={{ 
                          display: "flex", 
                          alignItems: "center", 
                          justifyContent: "space-between",
                          marginBottom: "12px",
                          paddingRight: "40px",
                        }}>
                          <span style={{ fontSize: "14px", fontWeight: "600", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "1px" }}>
                            {kpiKey === "irpd" ? "IRPD MTD" : "SES MTD"}
                          </span>
                          {stale && (
                            <span style={{ fontSize: "12px", color: "#f97316", fontWeight: "500" }}>Stale</span>
                          )}
                        </div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                          <span style={{ fontSize: "36px", fontWeight: "bold", color: stale ? "#888" : color }}>
                            {value !== undefined 
                              ? (kpiKey === "irpd" ? `${value.toFixed(2)}` : `${value.toFixed(1)}%`)
                              : "--"}
                          </span>
                          <span style={{ fontSize: "16px", color: "rgba(255,255,255,0.4)" }}>
                            / {kpiKey === "irpd" ? goal.toFixed(2) : `${goal.toFixed(1)}%`}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* FutureSIXT Section - At the very top */}
            {dashboardStatus?.future?.data && (
              <div style={{ 
                backgroundColor: "#262626", 
                borderRadius: "16px", 
                padding: "24px",
                marginBottom: "20px",
                border: "2px solid #22c55e",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                  <div style={{ 
                    width: "48px", 
                    height: "48px", 
                    borderRadius: "12px", 
                    backgroundColor: "rgba(34, 197, 94, 0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    <Clock style={{ width: "24px", height: "24px", color: "#22c55e" }} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: "24px", fontWeight: "bold", color: "white", margin: 0 }}>
                      Future<span style={{ color: "#f97316" }}>SIXT</span> - Tomorrow's Planning
                    </h3>
                  </div>
                  <CheckCircle style={{ width: "24px", height: "24px", color: "#22c55e", marginLeft: "auto" }} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "16px" }}>
                  <div style={{ textAlign: "center", padding: "16px", backgroundColor: "#333", borderRadius: "12px" }}>
                    <p style={{ margin: 0, color: "#888", fontSize: "12px", marginBottom: "4px" }}>TOTAL</p>
                    <p style={{ margin: 0, color: "#fff", fontSize: "32px", fontWeight: "bold" }}>{dashboardStatus.future.data.reservationsTotal}</p>
                    <p style={{ margin: 0, color: "#888", fontSize: "10px" }}>Reservations</p>
                  </div>
                  <div style={{ textAlign: "center", padding: "16px", backgroundColor: "#333", borderRadius: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", marginBottom: "4px" }}>
                      <Car style={{ width: "14px", height: "14px", color: "#888" }} />
                      <p style={{ margin: 0, color: "#888", fontSize: "12px" }}>Car</p>
                    </div>
                    <p style={{ margin: 0, color: "#fff", fontSize: "32px", fontWeight: "bold" }}>{dashboardStatus.future.data.reservationsCar}</p>
                  </div>
                  <div style={{ textAlign: "center", padding: "16px", backgroundColor: "#333", borderRadius: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", marginBottom: "4px" }}>
                      <Truck style={{ width: "14px", height: "14px", color: "#888" }} />
                      <p style={{ margin: 0, color: "#888", fontSize: "12px" }}>Van</p>
                    </div>
                    <p style={{ margin: 0, color: "#fff", fontSize: "32px", fontWeight: "bold" }}>{dashboardStatus.future.data.reservationsVan}</p>
                  </div>
                  <div style={{ textAlign: "center", padding: "16px", backgroundColor: "#333", borderRadius: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", marginBottom: "4px" }}>
                      <Plane style={{ width: "14px", height: "14px", color: "#888" }} />
                      <p style={{ margin: 0, color: "#888", fontSize: "12px" }}>TAS</p>
                    </div>
                    <p style={{ margin: 0, color: "#fff", fontSize: "32px", fontWeight: "bold" }}>{dashboardStatus.future.data.reservationsTas}</p>
                  </div>
                  <div style={{ textAlign: "center", padding: "16px", backgroundColor: "#333", borderRadius: "12px" }}>
                    <p style={{ margin: 0, color: "#888", fontSize: "12px", marginBottom: "4px" }}>Deliveries</p>
                    <p style={{ margin: 0, color: "#f97316", fontSize: "32px", fontWeight: "bold" }}>{dashboardStatus.future.data.deliveriesTomorrow}</p>
                    <p style={{ margin: 0, color: "#888", fontSize: "10px" }}>Tomorrow</p>
                  </div>
                  <div style={{ textAlign: "center", padding: "16px", backgroundColor: "#333", borderRadius: "12px" }}>
                    <p style={{ margin: 0, color: "#888", fontSize: "12px", marginBottom: "4px" }}>Collections</p>
                    <p style={{ margin: 0, color: "#f97316", fontSize: "32px", fontWeight: "bold" }}>{dashboardStatus.future.data.collectionsOpen}</p>
                    <p style={{ margin: 0, color: "#888", fontSize: "10px" }}>Open</p>
                  </div>
                </div>
              </div>
            )}

            {/* Break?SIXT Status */}
            <div style={{ 
              backgroundColor: "#262626", 
              borderRadius: "16px", 
              padding: "20px",
              marginBottom: "20px",
              border: dashboardStatus?.breaksixt?.isDone 
                ? "2px solid #22c55e" 
                : dashboardStatus?.breaksixt?.isOverdue 
                  ? "2px solid #ef4444" 
                  : "2px solid #f59e0b",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ 
                    width: "40px", 
                    height: "40px", 
                    borderRadius: "10px", 
                    backgroundColor: dashboardStatus?.breaksixt?.isDone 
                      ? "rgba(34, 197, 94, 0.2)" 
                      : dashboardStatus?.breaksixt?.isOverdue 
                        ? "rgba(239, 68, 68, 0.2)"
                        : "rgba(245, 158, 11, 0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    <Clock style={{ width: "20px", height: "20px", color: dashboardStatus?.breaksixt?.isDone ? "#22c55e" : dashboardStatus?.breaksixt?.isOverdue ? "#ef4444" : "#f59e0b" }} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: "18px", fontWeight: "bold", color: "white", margin: 0 }}>
                      Break?<span style={{ color: "#f59e0b" }}>SIXT</span>
                    </h3>
                    <p style={{ fontSize: "12px", color: "#888", margin: 0 }}>Lunch Break (13:00)</p>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  {dashboardStatus?.breaksixt?.isDone ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ color: "#22c55e", fontWeight: "bold" }}>Done</span>
                      {dashboardStatus.breaksixt.doneBy && (
                        <span style={{ color: "#888", fontSize: "12px" }}>by {dashboardStatus.breaksixt.doneBy}</span>
                      )}
                      <CheckCircle style={{ width: "20px", height: "20px", color: "#22c55e" }} />
                    </div>
                  ) : dashboardStatus?.breaksixt?.isOverdue ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <AlertCircle style={{ width: "20px", height: "20px", color: "#ef4444" }} />
                      <span style={{ color: "#ef4444", fontWeight: "bold" }}>Overdue</span>
                    </div>
                  ) : (
                    <span style={{ color: "#f59e0b", fontWeight: "500" }}>Pending</span>
                  )}
                </div>
              </div>
            </div>

            {/* Module Cards Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px" }}>
              
              {/* TimeDriverSIXT */}
              <div style={{ 
                backgroundColor: "#262626", 
                borderRadius: "16px", 
                padding: "24px",
                border: dashboardStatus?.timedriver.isDone ? "2px solid #22c55e" : "2px solid #333",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                  <div style={{ 
                    width: "48px", 
                    height: "48px", 
                    borderRadius: "12px", 
                    backgroundColor: dashboardStatus?.timedriver.isDone ? "rgba(34, 197, 94, 0.2)" : "rgba(249, 115, 22, 0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    <Clock style={{ width: "24px", height: "24px", color: dashboardStatus?.timedriver.isDone ? "#22c55e" : "#f97316" }} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: "20px", fontWeight: "bold", color: "white", margin: 0 }}>TimeDriverSIXT</h3>
                    <p style={{ fontSize: "14px", color: "#888", margin: 0 }}>Labor Planning</p>
                  </div>
                  {dashboardStatus?.timedriver.isDone && (
                    <CheckCircle style={{ width: "24px", height: "24px", color: "#22c55e", marginLeft: "auto" }} />
                  )}
                </div>
                <div style={{ fontSize: "14px", color: "#ccc" }}>
                  {timedriverCalc ? (
                    <>
                      <div style={{ 
                        display: "grid", 
                        gridTemplateColumns: "1fr 1fr", 
                        gap: "8px", 
                        marginBottom: "12px",
                        padding: "12px",
                        backgroundColor: "#333",
                        borderRadius: "8px",
                      }}>
                        <div>
                          <p style={{ margin: 0, color: "#888", fontSize: "12px" }}>Rentals</p>
                          <p style={{ margin: 0, color: "#fff", fontSize: "18px", fontWeight: "bold" }}>{timedriverCalc.rentals}</p>
                        </div>
                        <div>
                          <p style={{ margin: 0, color: "#888", fontSize: "12px" }}>Total Budget</p>
                          <p style={{ margin: 0, color: "#22c55e", fontSize: "18px", fontWeight: "bold" }}>{timedriverCalc.totalBudget.toFixed(2)} EUR</p>
                        </div>
                      </div>
                      <p style={{ margin: "0 0 8px 0", color: "#888", fontSize: "12px" }}>Driver Allocation:</p>
                      {driversData.map((driver: DriverData) => (
                        <div key={driver.id} style={{ 
                          display: "flex", 
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "6px 8px",
                          backgroundColor: "#333",
                          borderRadius: "4px",
                          marginBottom: "4px",
                        }}>
                          <span style={{ color: "#fff", fontWeight: "500" }}>{driver.initials}</span>
                          <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                            <span style={{ color: "#888", fontSize: "12px" }}>max {driver.maxHours}h</span>
                            <span style={{ color: "#f97316", fontWeight: "bold" }}>{driver.assignedHours}h {driver.assignedMinutes}m</span>
                            {(driver.overflowHours !== undefined || driver.overflowMinutes !== undefined) && (
                              <span style={{ color: "#fb923c", fontSize: "11px", fontWeight: "500" }}>
                                if needed +{driver.overflowHours || 0}h {driver.overflowMinutes || 0}m
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </>
                  ) : (
                    <p style={{ margin: 0, color: "#f97316" }}>Not calculated yet</p>
                  )}
                </div>
              </div>

              {/* UpgradeSIXT */}
              <div style={{ 
                backgroundColor: "#262626", 
                borderRadius: "16px", 
                padding: "24px",
                border: dashboardStatus?.upgrade?.isDone ? "2px solid #22c55e" : dashboardStatus?.upgrade?.isOverdue ? "2px solid #ef4444" : "2px solid #333",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                  <div style={{ 
                    width: "48px", 
                    height: "48px", 
                    borderRadius: "12px", 
                    backgroundColor: dashboardStatus?.upgrade?.isDone ? "rgba(34, 197, 94, 0.2)" : dashboardStatus?.upgrade?.isOverdue ? "rgba(239, 68, 68, 0.2)" : "rgba(249, 115, 22, 0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    <TrendingUp style={{ width: "24px", height: "24px", color: dashboardStatus?.upgrade?.isDone ? "#22c55e" : dashboardStatus?.upgrade?.isOverdue ? "#ef4444" : "#f97316" }} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: "20px", fontWeight: "bold", color: "white", margin: 0 }}>UpgradeSIXT</h3>
                    <p style={{ fontSize: "14px", color: "#888", margin: 0 }}>Daily UP Vehicles</p>
                  </div>
                  {dashboardStatus?.upgrade?.isDone && (
                    <CheckCircle style={{ width: "24px", height: "24px", color: "#22c55e", marginLeft: "auto" }} />
                  )}
                  {dashboardStatus?.upgrade?.isOverdue && !dashboardStatus?.upgrade?.hasPending && (
                    <AlertCircle style={{ width: "24px", height: "24px", color: "#ef4444", marginLeft: "auto" }} />
                  )}
                </div>
                <div style={{ fontSize: "14px", color: "#ccc" }}>
                  {upgradeVehicles.length === 0 ? (
                    <p style={{ margin: 0, color: dashboardStatus?.upgrade?.isOverdue ? "#ef4444" : "#888" }}>
                      {dashboardStatus?.upgrade?.isOverdue ? "No UP vehicle defined (overdue)" : "No UP vehicle defined yet"}
                    </p>
                  ) : (
                    <>
                      {upgradeVehicles.filter(v => v.isSold).length > 0 && (
                        <p style={{ margin: "0 0 8px 0", color: "#22c55e" }}>
                          {upgradeVehicles.filter(v => v.isSold).length} sale(s) completed
                        </p>
                      )}
                      {upgradeVehicles.filter(v => !v.isSold).length > 0 && (
                        <p style={{ margin: "0 0 8px 0", color: "#f97316" }}>
                          {upgradeVehicles.filter(v => !v.isSold).length} pending sale(s)
                        </p>
                      )}
                      {upgradeVehicles.map(vehicle => (
                        <div key={vehicle.id} style={{ 
                          display: "flex", 
                          alignItems: "center", 
                          gap: "8px", 
                          padding: "6px 8px",
                          backgroundColor: "#333",
                          borderRadius: "4px",
                          marginBottom: "4px",
                        }}>
                          {vehicle.isSold ? <CheckCircle style={{ width: "14px", height: "14px", color: "#22c55e", flexShrink: 0 }} /> : <AlertCircle style={{ width: "14px", height: "14px", color: "#f97316", flexShrink: 0 }} />}
                          <span style={{ 
                            fontSize: "13px", 
                            color: vehicle.isSold ? "#888" : "#fff",
                          }}>{vehicle.licensePlate} - {vehicle.model}</span>
                          {vehicle.isSold && <span style={{ fontSize: "11px", color: "#22c55e", marginLeft: "auto" }}>Sold by {vehicle.soldBy}</span>}
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>

              {/* FlowSIXT */}
              <div style={{ 
                backgroundColor: "#262626", 
                borderRadius: "16px", 
                padding: "24px",
                border: dashboardStatus?.flow.isDone ? "2px solid #22c55e" : "2px solid #333",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                  <div style={{ 
                    width: "48px", 
                    height: "48px", 
                    borderRadius: "12px", 
                    backgroundColor: dashboardStatus?.flow.isDone ? "rgba(34, 197, 94, 0.2)" : "rgba(249, 115, 22, 0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    <Workflow style={{ width: "24px", height: "24px", color: dashboardStatus?.flow.isDone ? "#22c55e" : "#f97316" }} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: "20px", fontWeight: "bold", color: "white", margin: 0 }}>FlowSIXT</h3>
                    <p style={{ fontSize: "14px", color: "#888", margin: 0 }}>Driver Tasks</p>
                  </div>
                  {dashboardStatus?.flow.isDone && (
                    <CheckCircle style={{ width: "24px", height: "24px", color: "#22c55e", marginLeft: "auto" }} />
                  )}
                </div>
                <div style={{ fontSize: "14px", color: "#ccc" }}>
                  {flowTasks.length === 0 ? (
                    <p style={{ margin: 0, color: "#888" }}>No tasks today</p>
                  ) : (
                    <>
                      <p style={{ margin: "0 0 8px 0", color: dashboardStatus?.flow.isDone ? "#22c55e" : "#f97316" }}>
                        {flowTasks.filter(t => t.completed).length}/{flowTasks.length} tasks completed
                      </p>
                      {flowTasks.map(task => (
                        <div key={task.id} style={{ 
                          display: "flex", 
                          alignItems: "center", 
                          gap: "8px", 
                          padding: "4px 0",
                        }}>
                          {task.completed ? <CheckCircle style={{ width: "14px", height: "14px", color: "#22c55e", flexShrink: 0 }} /> : <AlertCircle style={{ width: "14px", height: "14px", color: "#f97316", flexShrink: 0 }} />}
                          <span style={{ 
                            fontSize: "13px", 
                            color: task.completed ? "#888" : "#fff",
                            textDecoration: task.completed ? "line-through" : "none",
                          }}>{task.licensePlate} - {task.taskType}</span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>

              {/* BodyshopSIXT */}
              <div style={{ 
                backgroundColor: "#262626", 
                borderRadius: "16px", 
                padding: "24px",
                border: dashboardStatus?.bodyshop.isDone ? "2px solid #22c55e" : "2px solid #333",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                  <div style={{ 
                    width: "48px", 
                    height: "48px", 
                    borderRadius: "12px", 
                    backgroundColor: dashboardStatus?.bodyshop.isDone ? "rgba(34, 197, 94, 0.2)" : "rgba(249, 115, 22, 0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    <Car style={{ width: "24px", height: "24px", color: dashboardStatus?.bodyshop.isDone ? "#22c55e" : "#f97316" }} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: "20px", fontWeight: "bold", color: "white", margin: 0 }}>BodyshopSIXT</h3>
                    <p style={{ fontSize: "14px", color: "#888", margin: 0 }}>Vehicle Tracking</p>
                  </div>
                  {dashboardStatus?.bodyshop.isDone && (
                    <CheckCircle style={{ width: "24px", height: "24px", color: "#22c55e", marginLeft: "auto" }} />
                  )}
                </div>
                <div style={{ fontSize: "14px", color: "#ccc" }}>
                  {activeVehicles.length === 0 ? (
                    <p style={{ margin: 0, color: "#888" }}>No vehicles in bodyshop</p>
                  ) : (
                    <>
                      <p style={{ margin: "0 0 8px 0", color: dashboardStatus?.bodyshop.isDone ? "#22c55e" : "#f97316" }}>
                        {activeVehicles.length} vehicle{activeVehicles.length !== 1 ? "s" : ""} tracked
                      </p>
                      {activeVehicles.map(vehicle => {
                        const countdown = calculateCountdown(vehicle.countdownStart);
                        const lastComment = getLastComment(vehicle.id);
                        const countdownColor = countdown.isExpired ? "#ef4444" : countdown.days <= 3 ? "#f97316" : "#22c55e";
                        
                        return (
                          <div key={vehicle.id} style={{ 
                            backgroundColor: "#333",
                            borderRadius: "8px",
                            padding: "8px 10px",
                            marginBottom: "6px",
                          }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={{ color: "#fff", fontSize: "13px", fontWeight: "bold" }}>{vehicle.licensePlate}</span>
                                {vehicle.isEv && <span style={{ fontSize: "9px", backgroundColor: "#22c55e", color: "#000", padding: "1px 4px", borderRadius: "3px" }}>EV</span>}
                              </div>
                              {vehicle.readyForCollection ? (
                                <span style={{ fontSize: "10px", backgroundColor: "#3b82f6", color: "#fff", padding: "2px 6px", borderRadius: "4px" }}>Ready for Collection</span>
                              ) : (
                                <span style={{ fontSize: "11px", color: countdownColor, fontWeight: "bold" }}>
                                  {countdown.isExpired ? "EXPIRED" : `${countdown.days}d ${countdown.hours}h remaining`}
                                </span>
                              )}
                            </div>
                            {lastComment && (
                              <div style={{ fontSize: "11px", color: "#888", marginTop: "4px" }}>
                                <span style={{ color: "#666" }}>Last comment: </span>
                                <span style={{ color: "#aaa" }}>
                                  {lastComment.content.length > 50 ? lastComment.content.substring(0, 50) + "..." : lastComment.content}
                                </span>
                                <span style={{ color: "#666" }}> - {lastComment.userInitials}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>
              </div>

              {/* ToDoSIXT */}
              <div style={{ 
                backgroundColor: "#262626", 
                borderRadius: "16px", 
                padding: "24px",
                border: dashboardStatus?.todo.isDone ? "2px solid #22c55e" : "2px solid #333",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                  <div style={{ 
                    width: "48px", 
                    height: "48px", 
                    borderRadius: "12px", 
                    backgroundColor: dashboardStatus?.todo.isDone ? "rgba(34, 197, 94, 0.2)" : "rgba(249, 115, 22, 0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    <CheckSquare style={{ width: "24px", height: "24px", color: dashboardStatus?.todo.isDone ? "#22c55e" : "#f97316" }} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: "20px", fontWeight: "bold", color: "white", margin: 0 }}>ToDoSIXT</h3>
                    <p style={{ fontSize: "14px", color: "#888", margin: 0 }}>Daily Tasks</p>
                  </div>
                  {dashboardStatus?.todo.isDone && (
                    <CheckCircle style={{ width: "24px", height: "24px", color: "#22c55e", marginLeft: "auto" }} />
                  )}
                </div>
                <div style={{ fontSize: "14px", color: "#ccc" }}>
                  <p style={{ margin: "0 0 8px 0", color: dashboardStatus?.todo.isDone ? "#22c55e" : "#f97316" }}>
                    {dashboardStatus?.todo.completed}/{dashboardStatus?.todo.total} tasks completed
                    {postponedTodos.length > 0 && <span style={{ color: "#f97316" }}> ({postponedTodos.length} postponed)</span>}
                  </p>
                  {todaysTodos.map(todo => (
                    <div key={todo.id} style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: "8px", 
                      padding: "4px 0",
                    }}>
                      {todo.completed ? <CheckCircle style={{ width: "14px", height: "14px", color: "#22c55e", flexShrink: 0 }} /> : <AlertCircle style={{ width: "14px", height: "14px", color: "#f97316", flexShrink: 0 }} />}
                      <span style={{ 
                        fontSize: "13px", 
                        color: todo.completed ? "#888" : "#fff",
                        textDecoration: todo.completed ? "line-through" : "none",
                      }}>{todo.title}</span>
                    </div>
                  ))}
                  {postponedTodos.length > 0 && (
                    <>
                      <p style={{ margin: "12px 0 8px 0", color: "#f97316", fontSize: "12px" }}>Postponed to tomorrow:</p>
                      {postponedTodos.map(todo => (
                        <div key={todo.id} style={{ 
                          display: "flex", 
                          alignItems: "center", 
                          gap: "8px", 
                          padding: "4px 0",
                        }}>
                          <AlertCircle style={{ width: "14px", height: "14px", color: "#f97316", flexShrink: 0 }} />
                          <span style={{ fontSize: "13px", color: "#f97316" }}>{todo.title}</span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>

              {/* QualitySIXT */}
              <div style={{ 
                backgroundColor: "#262626", 
                borderRadius: "16px", 
                padding: "24px",
                border: dashboardStatus?.quality.isDone ? "2px solid #22c55e" : "2px solid #333",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                  <div style={{ 
                    width: "48px", 
                    height: "48px", 
                    borderRadius: "12px", 
                    backgroundColor: dashboardStatus?.quality.isDone ? "rgba(34, 197, 94, 0.2)" : "rgba(249, 115, 22, 0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    <ClipboardCheck style={{ width: "24px", height: "24px", color: dashboardStatus?.quality.isDone ? "#22c55e" : "#f97316" }} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: "20px", fontWeight: "bold", color: "white", margin: 0 }}>QualitySIXT</h3>
                    <p style={{ fontSize: "14px", color: "#888", margin: 0 }}>Quality Checks</p>
                  </div>
                  {dashboardStatus?.quality.isDone && (
                    <CheckCircle style={{ width: "24px", height: "24px", color: "#22c55e", marginLeft: "auto" }} />
                  )}
                </div>
                <div style={{ fontSize: "14px", color: "#ccc" }}>
                  <p style={{ margin: "0 0 8px 0", color: dashboardStatus?.quality.isDone ? "#22c55e" : "#f97316" }}>
                    {dashboardStatus?.quality.passedChecks}/5 checks passed
                    {dashboardStatus?.quality.incompleteTasks ? `, ${dashboardStatus.quality.incompleteTasks} pending` : ""}
                  </p>
                  {exportQualityChecks.length === 0 ? (
                    <p style={{ margin: 0, color: "#888" }}>No checks today</p>
                  ) : (
                    exportQualityChecks.map(check => (
                      <div key={check.id} style={{ 
                        padding: "6px 0",
                        borderBottom: "1px solid #333",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          {check.passed ? <CheckCircle style={{ width: "14px", height: "14px", color: "#22c55e", flexShrink: 0 }} /> : <AlertCircle style={{ width: "14px", height: "14px", color: "#ef4444", flexShrink: 0 }} />}
                          <span style={{ color: check.passed ? "#22c55e" : "#ef4444", fontSize: "13px", fontWeight: "500" }}>{check.licensePlate}</span>
                          <span style={{ color: "#888", fontSize: "12px", marginLeft: "auto" }}>by {check.checkedBy}</span>
                        </div>
                        {!check.passed && check.comment && (
                          <div style={{ marginTop: "4px", marginLeft: "22px", fontSize: "12px", color: "#f87171" }}>
                            Reason: {check.comment && check.comment.length > 60 ? check.comment.substring(0, 60) + "..." : check.comment}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Summary Card */}
              <div style={{ 
                backgroundColor: "#262626", 
                borderRadius: "16px", 
                padding: "24px",
                border: "2px solid #333",
              }}>
                <h3 style={{ fontSize: "20px", fontWeight: "bold", color: "white", margin: "0 0 16px 0" }}>Summary</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div style={{ textAlign: "center", padding: "12px", backgroundColor: "#333", borderRadius: "8px" }}>
                    <p style={{ fontSize: "28px", fontWeight: "bold", color: "#22c55e", margin: 0 }}>
                      {[dashboardStatus?.timedriver.isDone, dashboardStatus?.flow.isDone, dashboardStatus?.bodyshop.isDone, dashboardStatus?.todo.isDone, dashboardStatus?.quality.isDone].filter(Boolean).length}
                    </p>
                    <p style={{ fontSize: "12px", color: "#888", margin: 0 }}>Modules Done</p>
                  </div>
                  <div style={{ textAlign: "center", padding: "12px", backgroundColor: "#333", borderRadius: "8px" }}>
                    <p style={{ fontSize: "28px", fontWeight: "bold", color: "#f97316", margin: 0 }}>
                      {5 - [dashboardStatus?.timedriver.isDone, dashboardStatus?.flow.isDone, dashboardStatus?.bodyshop.isDone, dashboardStatus?.todo.isDone, dashboardStatus?.quality.isDone].filter(Boolean).length}
                    </p>
                    <p style={{ fontSize: "12px", color: "#888", margin: 0 }}>Remaining</p>
                  </div>
                  <div style={{ textAlign: "center", padding: "12px", backgroundColor: "#333", borderRadius: "8px" }}>
                    <p style={{ fontSize: "28px", fontWeight: "bold", color: "#3b82f6", margin: 0 }}>
                      {flowTasks.length + todaysTodos.length}
                    </p>
                    <p style={{ fontSize: "12px", color: "#888", margin: 0 }}>Total Tasks</p>
                  </div>
                  <div style={{ textAlign: "center", padding: "12px", backgroundColor: "#333", borderRadius: "8px" }}>
                    <p style={{ fontSize: "28px", fontWeight: "bold", color: "#a855f7", margin: 0 }}>
                      {activeVehicles.length}
                    </p>
                    <p style={{ fontSize: "12px", color: "#888", margin: 0 }}>Vehicles</p>
                  </div>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div style={{ 
              marginTop: "30px", 
              paddingTop: "20px", 
              borderTop: "1px solid #333",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              <div style={{ color: "#666", fontSize: "14px" }}>
                <p style={{ margin: 0 }}>Version v3.1.8</p>
                <p style={{ margin: "4px 0 0 0" }}>&copy; 2026 by Nathanael Prem</p>
              </div>
              <div style={{ textAlign: "right", color: "#666", fontSize: "14px" }}>
                <p style={{ margin: 0 }}>Generated by MasterSIXT Workshop Management</p>
                <p style={{ margin: "4px 0 0 0" }}>{new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} Uhr</p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-2">
          Preview scaled to 50% - Export at 4800px wide (high resolution)
        </p>
      </DialogContent>
    </Dialog>
  );
}
