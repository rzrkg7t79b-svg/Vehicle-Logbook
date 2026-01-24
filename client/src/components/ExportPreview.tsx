import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, Download, Clock, Car, ClipboardCheck, CheckSquare, Workflow, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getGermanDateString } from "@/lib/germanTime";
import html2canvas from "html2canvas";
import type { Todo, FlowTask, Vehicle } from "@shared/schema";

type DashboardStatus = {
  timedriver: { isDone: boolean; details?: string };
  flow: { isDone: boolean; pending: number; total: number };
  todo: { isDone: boolean; completed: number; total: number; postponed?: number };
  quality: { isDone: boolean; passedChecks: number; incompleteTasks: number };
  bodyshop: { isDone: boolean; vehiclesWithoutComment: number; total: number };
  overallProgress: number;
  hasPostponedTasks?: boolean;
};

type QualityCheck = {
  id: number;
  licensePlate: string;
  passed: boolean;
  comment: string | null;
  createdBy: string;
  date: string;
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

  const { data: qualityChecks = [] } = useQuery<QualityCheck[]>({
    queryKey: ["/api/quality-checks", todayDate],
    queryFn: async () => {
      const res = await fetch(`/api/quality-checks?date=${todayDate}`);
      return res.json();
    },
  });

  const handleExport = async () => {
    if (!exportRef.current) return;
    setIsExporting(true);
    
    try {
      const canvas = await html2canvas(exportRef.current, {
        scale: 2,
        backgroundColor: "#1a1a1a",
        width: 1920,
        height: 1080,
        windowWidth: 1920,
        windowHeight: 1080,
      });
      
      const link = document.createElement("a");
      link.download = `MasterSIXT-Export-${todayDate}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Export Preview - Dashboard Cards</span>
            <Button onClick={handleExport} disabled={isExporting} size="sm">
              <Download className="w-4 h-4 mr-2" />
              {isExporting ? "Exporting..." : "Download PNG"}
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-auto border rounded-lg">
          <div 
            ref={exportRef}
            style={{ 
              width: "1920px", 
              height: "1080px",
              transform: "scale(0.4)",
              transformOrigin: "top left",
              backgroundColor: "#1a1a1a",
              padding: "40px",
              fontFamily: "system-ui, -apple-system, sans-serif",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
              <div>
                <h1 style={{ fontSize: "48px", fontWeight: "bold", color: "white", margin: 0 }}>
                  Master<span style={{ color: "#f97316" }}>SIXT</span>
                </h1>
                <p style={{ fontSize: "20px", color: "#888", margin: "5px 0 0 0" }}>
                  Daily Status Report - {formatDate(todayDate)}
                </p>
              </div>
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "20px",
                backgroundColor: progress === 100 ? "rgba(34, 197, 94, 0.2)" : "rgba(249, 115, 22, 0.2)",
                padding: "20px 40px",
                borderRadius: "16px",
                border: `2px solid ${progress === 100 ? "#22c55e" : "#f97316"}`,
              }}>
                <span style={{ fontSize: "64px", fontWeight: "bold", color: progress === 100 ? "#22c55e" : "#f97316" }}>
                  {progress}%
                </span>
                <span style={{ fontSize: "20px", color: "#888" }}>Daily<br/>Progress</span>
              </div>
            </div>

            {/* Module Cards Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
              
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
                <p style={{ fontSize: "16px", color: dashboardStatus?.timedriver.isDone ? "#22c55e" : "#f97316", margin: 0 }}>
                  {dashboardStatus?.timedriver.isDone ? "Calculation saved" : "Due before 8:00"}
                </p>
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
                      {flowTasks.slice(0, 4).map(task => (
                        <div key={task.id} style={{ 
                          display: "flex", 
                          alignItems: "center", 
                          gap: "8px", 
                          padding: "4px 0",
                          color: task.completed ? "#888" : "#fff",
                          textDecoration: task.completed ? "line-through" : "none",
                        }}>
                          {task.completed ? <CheckCircle style={{ width: "14px", height: "14px", color: "#22c55e" }} /> : <AlertCircle style={{ width: "14px", height: "14px", color: "#f97316" }} />}
                          <span>{task.licensePlate} - {task.taskType}</span>
                        </div>
                      ))}
                      {flowTasks.length > 4 && (
                        <p style={{ margin: "8px 0 0 0", color: "#888", fontSize: "12px" }}>+{flowTasks.length - 4} more tasks</p>
                      )}
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
                      {activeVehicles.slice(0, 3).map(vehicle => (
                        <div key={vehicle.id} style={{ 
                          display: "flex", 
                          alignItems: "center", 
                          gap: "8px", 
                          padding: "4px 0",
                        }}>
                          <span style={{ color: "#fff" }}>{vehicle.licensePlate}</span>
                          {vehicle.isEv && <span style={{ fontSize: "10px", backgroundColor: "#22c55e", color: "#000", padding: "2px 6px", borderRadius: "4px" }}>EV</span>}
                        </div>
                      ))}
                      {activeVehicles.length > 3 && (
                        <p style={{ margin: "8px 0 0 0", color: "#888", fontSize: "12px" }}>+{activeVehicles.length - 3} more vehicles</p>
                      )}
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
                  {todaysTodos.slice(0, 4).map(todo => (
                    <div key={todo.id} style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: "8px", 
                      padding: "4px 0",
                      color: todo.completed ? "#888" : "#fff",
                      textDecoration: todo.completed ? "line-through" : "none",
                    }}>
                      {todo.completed ? <CheckCircle style={{ width: "14px", height: "14px", color: "#22c55e" }} /> : <AlertCircle style={{ width: "14px", height: "14px", color: "#f97316" }} />}
                      <span>{todo.title}</span>
                    </div>
                  ))}
                  {todaysTodos.length > 4 && (
                    <p style={{ margin: "8px 0 0 0", color: "#888", fontSize: "12px" }}>+{todaysTodos.length - 4} more tasks</p>
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
                  {qualityChecks.slice(0, 4).map(check => (
                    <div key={check.id} style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: "8px", 
                      padding: "4px 0",
                    }}>
                      {check.passed ? <CheckCircle style={{ width: "14px", height: "14px", color: "#22c55e" }} /> : <AlertCircle style={{ width: "14px", height: "14px", color: "#ef4444" }} />}
                      <span style={{ color: check.passed ? "#22c55e" : "#ef4444" }}>{check.licensePlate}</span>
                      <span style={{ color: "#888" }}>by {check.createdBy}</span>
                    </div>
                  ))}
                  {qualityChecks.length > 4 && (
                    <p style={{ margin: "8px 0 0 0", color: "#888", fontSize: "12px" }}>+{qualityChecks.length - 4} more checks</p>
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
              <p style={{ fontSize: "14px", color: "#666", margin: 0 }}>
                Generated by MasterSIXT Workshop Management
              </p>
              <p style={{ fontSize: "14px", color: "#666", margin: 0 }}>
                {new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} Uhr
              </p>
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-2">
          Preview scaled to 40% - Export will be 1920x1080 (Full HD 16:9)
        </p>
      </DialogContent>
    </Dialog>
  );
}
