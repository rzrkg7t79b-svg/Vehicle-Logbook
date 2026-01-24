import { useState, useMemo } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Check, RotateCcw, GripVertical, Zap, AlertTriangle } from "lucide-react";
import { GermanPlate } from "@/components/GermanPlate";
import { LicensePlateInput, buildPlateFromParts } from "@/components/LicensePlateInput";
import { useUser } from "@/contexts/UserContext";
import type { FlowTask } from "@shared/schema";
import { flowTaskTypes } from "@shared/schema";
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
  const [plateCity, setPlateCity] = useState("");
  const [plateLetters, setPlateLetters] = useState("");
  const [plateNumbers, setPlateNumbers] = useState("");
  const [isEv, setIsEv] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [showCompleted, setShowCompleted] = useState(false);

  const isAdminOrCounter = user?.isAdmin || user?.roles?.includes("Counter");
  const isDriver = user?.roles?.includes("Driver");

  const { data: tasks = [], isLoading } = useQuery<FlowTask[]>({
    queryKey: ["/api/flow-tasks"],
  });

  const createTasks = useMutation({
    mutationFn: async (data: { licensePlate: string; isEv: boolean; taskTypes: string[] }) => {
      const results = [];
      for (const taskType of data.taskTypes) {
        const res = await fetch("/api/flow-tasks", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "x-admin-pin": user?.pin || ""
          },
          body: JSON.stringify({ 
            licensePlate: data.licensePlate, 
            isEv: data.isEv, 
            taskType 
          }),
        });
        if (!res.ok) throw new Error("Failed to create task");
        results.push(await res.json());
      }
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/flow-tasks"] });
      setPlateCity("");
      setPlateLetters("");
      setPlateNumbers("");
      setIsEv(false);
      setSelectedTasks([]);
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

  const licensePlate = buildPlateFromParts(plateCity, plateLetters, plateNumbers, isEv);
  const isValidPlate = plateCity && plateLetters && plateNumbers;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidPlate || selectedTasks.length === 0) return;
    createTasks.mutate({ 
      licensePlate, 
      isEv, 
      taskTypes: selectedTasks 
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
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-md mx-auto p-4 space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-muted-foreground hover:text-foreground" data-testid="link-back-master">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">FlowSIXT</h1>
            <p className="text-sm text-muted-foreground">Driver Task Management</p>
          </div>
        </div>

        {isAdminOrCounter && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">New Driver Task</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <LicensePlateInput
                  city={plateCity}
                  letters={plateLetters}
                  numbers={plateNumbers}
                  isEv={isEv}
                  onCityChange={setPlateCity}
                  onLettersChange={setPlateLetters}
                  onNumbersChange={setPlateNumbers}
                  onEvChange={setIsEv}
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
      </div>
    </div>
  );
}

interface VehicleCardProps {
  group: VehicleGroup;
  onComplete: (task: FlowTask) => void;
  onMarkUndone: (task: FlowTask) => void;
  canReorder: boolean;
  canComplete: boolean;
  canMarkUndone: boolean;
}

function VehicleCard({ group, onComplete, onMarkUndone, canReorder, canComplete, canMarkUndone }: VehicleCardProps) {
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
  onComplete: () => void;
  onMarkUndone: () => void;
  canComplete: boolean;
  canMarkUndone: boolean;
}

function SubTaskRow({ task, onComplete, onMarkUndone, canComplete, canMarkUndone }: SubTaskRowProps) {
  return (
    <div 
      className={`flex items-center gap-2 p-2 rounded ${
        task.needsRetry 
          ? "bg-orange-500/20" 
          : task.completed 
            ? "bg-green-500/10" 
            : "bg-white/5"
      }`}
      data-testid={`flow-task-${task.id}`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
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
