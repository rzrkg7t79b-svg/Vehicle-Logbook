import { useState, useMemo, useEffect } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, Check, RotateCcw, GripVertical, Zap, AlertTriangle, Clock } from "lucide-react";
import { GermanPlate } from "@/components/GermanPlate";
import { LicensePlateInput, buildPlateFromParts } from "@/components/LicensePlateInput";
import { useUser } from "@/contexts/UserContext";
import { getGermanTime } from "@/lib/germanTime";
import type { FlowTask } from "@/types";
import { flowTaskTypes } from "@/constants";
import { motion, AnimatePresence, Reorder } from "framer-motion";

interface VehicleGroup {
  licensePlate: string;
  isEv: boolean;
  tasks: FlowTask[];
  allCompleted: boolean;
  priority: number;
}

export default function FlowSIXT() {
  const { user } = useUser();
  const [plateLetters, setPlateLetters] = useState("");
  const [plateNumbers, setPlateNumbers] = useState("");
  const [isEv, setIsEv] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [needAt, setNeedAt] = useState("");
  const [showCompleted, setShowCompleted] = useState(false);
  const [now, setNow] = useState(() => new Date());

  const isAdminOrCounter = user?.isAdmin || user?.roles?.includes("Counter");
  const isDriver = user?.roles?.includes("Driver");

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const { data: tasks = [], isLoading } = useQuery<FlowTask[]>({
    queryKey: ["/api/flow-tasks"],
  });

  const createTasks = useMutation({
    mutationFn: async (data: { licensePlate: string; isEv: boolean; taskTypes: string[]; needAt?: string }) => {
      const results = [];
      for (const taskType of data.taskTypes) {
        const body: any = { 
          licensePlate: data.licensePlate, 
          isEv: data.isEv, 
          taskType 
        };
        if (data.needAt) {
          const today = getGermanTime().toISOString().split('T')[0];
          body.needAt = new Date(`${today}T${data.needAt}:00`);
        }
        const res = await fetch("/api/flow-tasks", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "x-admin-pin": user?.pin || ""
          },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error("Failed to create task");
        results.push(await res.json());
      }
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/flow-tasks"] });
      setPlateLetters("");
      setPlateNumbers("");
      setIsEv(false);
      setSelectedTasks([]);
      setNeedAt("");
    },
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<FlowTask>) => {
      const res = await fetch(`/api/flow-tasks/${id}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "x-admin-pin": user?.pin || ""
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update task");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/flow-tasks"] });
    },
  });

  const reorderTasks = useMutation({
    mutationFn: async (taskIds: number[]) => {
      const res = await fetch("/api/flow-tasks/reorder", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-admin-pin": user?.pin || ""
        },
        body: JSON.stringify({ taskIds }),
      });
      if (!res.ok) throw new Error("Failed to reorder tasks");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/flow-tasks"] });
    },
  });

  const toggleTaskSelection = (taskType: string) => {
    setSelectedTasks(prev => 
      prev.includes(taskType) 
        ? prev.filter(t => t !== taskType)
        : [...prev, taskType]
    );
  };

  const licensePlate = buildPlateFromParts(plateLetters, plateNumbers, isEv);
  const isValidPlate = plateLetters && plateNumbers;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidPlate || selectedTasks.length === 0) return;
    createTasks.mutate({ 
      licensePlate, 
      isEv, 
      taskTypes: selectedTasks,
      needAt: needAt || undefined
    });
  };

  const handleComplete = (task: FlowTask) => {
    updateTask.mutate({ 
      id: task.id, 
      completed: true, 
      completedBy: user?.initials 
    });
  };

  const handleMarkUndone = (task: FlowTask) => {
    updateTask.mutate({ 
      id: task.id, 
      needsRetry: true 
    });
  };

  const vehicleGroups = useMemo(() => {
    const groups = new Map<string, VehicleGroup>();
    
    tasks.forEach(task => {
      const key = task.licensePlate;
      if (!groups.has(key)) {
        groups.set(key, {
          licensePlate: task.licensePlate,
          isEv: task.isEv,
          tasks: [],
          allCompleted: true,
          priority: task.priority,
        });
      }
      const group = groups.get(key)!;
      group.tasks.push(task);
      if (!task.completed) {
        group.allCompleted = false;
      }
      if (task.priority < group.priority) {
        group.priority = task.priority;
      }
    });
    
    return Array.from(groups.values()).sort((a, b) => a.priority - b.priority);
  }, [tasks]);

  const pendingGroups = vehicleGroups.filter(g => !g.allCompleted);
  const completedGroups = vehicleGroups.filter(g => g.allCompleted);

  const handleReorderGroups = (newOrder: VehicleGroup[]) => {
    const taskIds: number[] = [];
    newOrder.forEach(group => {
      group.tasks.forEach(task => taskIds.push(task.id));
    });
    reorderTasks.mutate(taskIds);
  };

  return (
    <div className="min-h-screen pb-24">
      <div className="max-w-md mx-auto">
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/10 via-yellow-500/5 to-transparent" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[200px] bg-yellow-500/15 blur-[100px] rounded-full" />
          <div className="relative p-6 pt-8">
            <Link href="/" className="flex items-center gap-2 text-white/50 hover:text-white mb-4 transition-colors rounded-xl px-3 py-1.5 -ml-3 hover:bg-white/[0.04] w-fit" data-testid="link-back-master">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back to Master</span>
            </Link>
            <h1 className="text-3xl font-bold text-white mb-1">
              Flow<span className="text-yellow-400">SIXT</span>
            </h1>
            <p className="text-sm text-white/50">Driver Task Management</p>
          </div>
        </div>

        <div className="p-4 space-y-6">
        {isAdminOrCounter && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">New Driver Task</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <LicensePlateInput
                  letters={plateLetters}
                  numbers={plateNumbers}
                  isEv={isEv}
                  onLettersChange={setPlateLetters}
                  onNumbersChange={setPlateNumbers}
                  onEvChange={setIsEv}
                  autoFocusLetters
                />

                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Select Tasks</p>
                  <div className="flex flex-wrap gap-2">
                    {flowTaskTypes.map((taskType) => (
                      <Button
                        key={taskType}
                        type="button"
                        variant={selectedTasks.includes(taskType) ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleTaskSelection(taskType)}
                        className={`text-xs ${selectedTasks.includes(taskType) ? "bg-primary text-primary-foreground" : ""}`}
                        data-testid={`button-task-${taskType.replace(/\s+/g, '-').toLowerCase()}`}
                      >
                        {taskType}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground flex items-center justify-center gap-2">
                    <Clock className="w-4 h-4" />
                    Need at (optional)
                  </label>
                  <div className="flex justify-center">
                    <Input
                      type="time"
                      value={needAt}
                      onChange={(e) => setNeedAt(e.target.value)}
                      className="w-40 text-center"
                      data-testid="input-need-at"
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={!isValidPlate || selectedTasks.length === 0 || createTasks.isPending}
                  data-testid="button-create-flow-task"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create {selectedTasks.length > 0 ? `${selectedTasks.length} Task${selectedTasks.length > 1 ? 's' : ''}` : 'Tasks'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              Pending Vehicles
              <span className="text-sm font-normal text-muted-foreground">
                ({pendingGroups.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : pendingGroups.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No pending tasks
              </div>
            ) : isAdminOrCounter ? (
              <Reorder.Group 
                axis="y" 
                values={pendingGroups} 
                onReorder={handleReorderGroups}
                className="space-y-3"
              >
                <AnimatePresence>
                  {pendingGroups.map((group) => (
                    <Reorder.Item key={group.licensePlate} value={group}>
                      <VehicleCard 
                        group={group}
                        now={now}
                        onComplete={handleComplete}
                        onMarkUndone={handleMarkUndone}
                        canReorder={true}
                        canComplete={true}
                        canMarkUndone={true}
                      />
                    </Reorder.Item>
                  ))}
                </AnimatePresence>
              </Reorder.Group>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {pendingGroups.map((group) => (
                    <motion.div
                      key={group.licensePlate}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                    >
                      <VehicleCard 
                        group={group}
                        now={now}
                        onComplete={handleComplete}
                        onMarkUndone={handleMarkUndone}
                        canReorder={false}
                        canComplete={isDriver ?? false}
                        canMarkUndone={false}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setShowCompleted(!showCompleted)}
            className="text-muted-foreground"
            data-testid="button-toggle-completed"
          >
            {showCompleted ? "Hide" : "Show"} Completed ({completedGroups.length})
          </Button>
        </div>

        {showCompleted && completedGroups.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-muted-foreground">Completed Vehicles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {completedGroups.map((group) => (
                  <VehicleCard 
                    key={group.licensePlate}
                    group={group}
                    now={now}
                    onComplete={() => {}}
                    onMarkUndone={handleMarkUndone}
                    canReorder={false}
                    canComplete={false}
                    canMarkUndone={isAdminOrCounter ?? false}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <footer className="mt-8 pt-8 border-t border-white/10 text-center space-y-1">
          <p className="text-xs text-muted-foreground">Version v3.1.8</p>
          <p className="text-xs text-muted-foreground">&copy; 2026 by Nathanael Prem</p>
        </footer>
        </div>
      </div>
    </div>
  );
}

interface VehicleCardProps {
  group: VehicleGroup;
  now: Date;
  onComplete: (task: FlowTask) => void;
  onMarkUndone: (task: FlowTask) => void;
  canReorder: boolean;
  canComplete: boolean;
  canMarkUndone: boolean;
}

function VehicleCard({ group, now, onComplete, onMarkUndone, canReorder, canComplete, canMarkUndone }: VehicleCardProps) {
  const completedCount = group.tasks.filter(t => t.completed).length;
  const totalCount = group.tasks.length;
  const hasRetry = group.tasks.some(t => t.needsRetry);
  
  return (
    <div 
      className={`p-4 rounded-lg border ${
        hasRetry 
          ? "bg-orange-500/10 border-orange-500/30" 
          : group.allCompleted 
            ? "bg-muted/50 border-muted" 
            : "bg-card border-border"
      }`}
      data-testid={`flow-vehicle-${group.licensePlate.replace(/\s+/g, '-')}`}
    >
      <div className="flex items-center gap-3 mb-3">
        {canReorder && !group.allCompleted && (
          <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
        )}
        <div className="flex items-center gap-2">
          <GermanPlate plate={group.licensePlate} size="sm" />
          {group.isEv && <Zap className="w-4 h-4 text-green-500" />}
        </div>
        <div className="ml-auto text-sm text-muted-foreground">
          {completedCount}/{totalCount} done
        </div>
      </div>
      
      <div className="space-y-2">
        {group.tasks.map((task) => (
          <SubTaskRow
            key={task.id}
            task={task}
            now={now}
            onComplete={() => onComplete(task)}
            onMarkUndone={() => onMarkUndone(task)}
            canComplete={canComplete && !task.completed}
            canMarkUndone={canMarkUndone && task.completed}
          />
        ))}
      </div>
    </div>
  );
}

interface SubTaskRowProps {
  task: FlowTask;
  now: Date;
  onComplete: () => void;
  onMarkUndone: () => void;
  canComplete: boolean;
  canMarkUndone: boolean;
}

function getCountdownStatus(needAt: Date | null | undefined, now: Date): { text: string; isOverdue: boolean } | null {
  if (!needAt) return null;
  
  const needAtTime = new Date(needAt);
  const diffMs = needAtTime.getTime() - now.getTime();
  
  if (diffMs <= 0) {
    return { text: "overdue/immediately", isOverdue: true };
  }
  
  const diffMinutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  
  if (hours > 0) {
    return { text: `Need in ${hours}h ${minutes}min`, isOverdue: false };
  }
  return { text: `Need in ${minutes}min`, isOverdue: false };
}

function SubTaskRow({ task, now, onComplete, onMarkUndone, canComplete, canMarkUndone }: SubTaskRowProps) {
  const countdownStatus = getCountdownStatus(task.needAt, now);
  
  return (
    <div 
      className={`flex items-center gap-2 p-2 rounded ${
        countdownStatus?.isOverdue && !task.completed
          ? "bg-red-500/20"
          : task.needsRetry 
            ? "bg-orange-500/20" 
            : task.completed 
              ? "bg-green-500/10" 
              : "bg-white/5"
      }`}
      data-testid={`flow-task-${task.id}`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-sm font-medium ${task.completed ? "line-through text-muted-foreground" : ""}`}>
            {task.taskType}
          </span>
          {task.needsRetry && (
            <span className="text-xs text-orange-500 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Try again!
            </span>
          )}
        </div>
        {countdownStatus && !task.completed && (
          <span className={`text-xs flex items-center gap-1 ${countdownStatus.isOverdue ? "text-red-500 font-semibold" : "text-muted-foreground"}`}>
            <Clock className="w-3 h-3" />
            {countdownStatus.text}
          </span>
        )}
        {task.completed && task.completedBy && (
          <span className="text-xs text-muted-foreground">
            Done by {task.completedBy}
          </span>
        )}
      </div>

      {canComplete && (
        <Button 
          size="icon" 
          variant="ghost" 
          className="h-8 w-8 text-green-500 hover:text-green-600 hover:bg-green-500/10"
          onClick={onComplete}
          data-testid={`button-complete-flow-task-${task.id}`}
        >
          <Check className="w-4 h-4" />
        </Button>
      )}

      {canMarkUndone && (
        <Button 
          size="icon" 
          variant="ghost" 
          className="h-8 w-8 text-orange-500 hover:text-orange-600 hover:bg-orange-500/10"
          onClick={onMarkUndone}
          data-testid={`button-retry-flow-task-${task.id}`}
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
      )}
      
      {task.completed && !canMarkUndone && (
        <Check className="w-4 h-4 text-green-500" />
      )}
    </div>
  );
}
