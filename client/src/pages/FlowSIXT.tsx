import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Check, RotateCcw, GripVertical, Zap, AlertTriangle } from "lucide-react";
import { GermanPlate } from "@/components/GermanPlate";
import { useUser } from "@/contexts/UserContext";
import type { FlowTask } from "@shared/schema";
import { flowTaskTypes } from "@shared/schema";
import { motion, AnimatePresence, Reorder } from "framer-motion";

export default function FlowSIXT() {
  const { user } = useUser();
  const [licensePlate, setLicensePlate] = useState("");
  const [isEv, setIsEv] = useState(false);
  const [taskType, setTaskType] = useState<string>("");
  const [showCompleted, setShowCompleted] = useState(false);

  const isAdminOrCounter = user?.isAdmin || user?.roles?.includes("Counter");
  const isDriver = user?.roles?.includes("Driver");

  const { data: tasks = [], isLoading } = useQuery<FlowTask[]>({
    queryKey: ["/api/flow-tasks"],
  });

  const createTask = useMutation({
    mutationFn: async (data: { licensePlate: string; isEv: boolean; taskType: string }) => {
      const res = await fetch("/api/flow-tasks", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-admin-pin": user?.pin || ""
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create task");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/flow-tasks"] });
      setLicensePlate("");
      setIsEv(false);
      setTaskType("");
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!licensePlate.trim() || !taskType) return;
    createTask.mutate({ 
      licensePlate: licensePlate.trim().toUpperCase(), 
      isEv, 
      taskType 
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

  const pendingTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  const handleReorder = (newOrder: FlowTask[]) => {
    const taskIds = newOrder.map(t => t.id);
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
                <div className="space-y-2">
                  <Label>License Plate</Label>
                  <Input
                    value={licensePlate}
                    onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
                    placeholder="M-AB 1234"
                    className="font-mono text-lg"
                    data-testid="input-flow-license-plate"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-green-500" />
                    <Label htmlFor="ev-switch">Electric Vehicle</Label>
                  </div>
                  <Switch
                    id="ev-switch"
                    checked={isEv}
                    onCheckedChange={setIsEv}
                    data-testid="switch-ev"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Task Type</Label>
                  <Select value={taskType} onValueChange={setTaskType}>
                    <SelectTrigger data-testid="select-task-type">
                      <SelectValue placeholder="Select task type" />
                    </SelectTrigger>
                    <SelectContent>
                      {flowTaskTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={!licensePlate.trim() || !taskType || createTask.isPending}
                  data-testid="button-create-flow-task"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Task
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              Pending Tasks
              <span className="text-sm font-normal text-muted-foreground">
                ({pendingTasks.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : pendingTasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No pending tasks
              </div>
            ) : isAdminOrCounter ? (
              <Reorder.Group 
                axis="y" 
                values={pendingTasks} 
                onReorder={handleReorder}
                className="space-y-2"
              >
                <AnimatePresence>
                  {pendingTasks.map((task) => (
                    <Reorder.Item key={task.id} value={task}>
                      <TaskCard 
                        task={task} 
                        onComplete={handleComplete}
                        onMarkUndone={handleMarkUndone}
                        canReorder={isAdminOrCounter ?? false}
                        canComplete={true}
                        canMarkUndone={false}
                      />
                    </Reorder.Item>
                  ))}
                </AnimatePresence>
              </Reorder.Group>
            ) : (
              <div className="space-y-2">
                <AnimatePresence>
                  {pendingTasks.map((task) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                    >
                      <TaskCard 
                        task={task} 
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
            {showCompleted ? "Hide" : "Show"} Completed ({completedTasks.length})
          </Button>
        </div>

        {showCompleted && completedTasks.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-muted-foreground">Completed Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {completedTasks.map((task) => (
                  <TaskCard 
                    key={task.id}
                    task={task} 
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

interface TaskCardProps {
  task: FlowTask;
  onComplete: (task: FlowTask) => void;
  onMarkUndone: (task: FlowTask) => void;
  canReorder: boolean;
  canComplete: boolean;
  canMarkUndone: boolean;
}

function TaskCard({ task, onComplete, onMarkUndone, canReorder, canComplete, canMarkUndone }: TaskCardProps) {
  return (
    <div 
      className={`flex items-center gap-3 p-3 rounded-lg border ${
        task.needsRetry 
          ? "bg-orange-500/10 border-orange-500/30" 
          : task.completed 
            ? "bg-muted/50 border-muted" 
            : "bg-card border-border"
      }`}
      data-testid={`flow-task-${task.id}`}
    >
      {canReorder && !task.completed && (
        <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
      )}
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <GermanPlate plate={task.licensePlate} size="sm" />
          {task.isEv && <Zap className="w-4 h-4 text-green-500" />}
        </div>
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

      {!task.completed && canComplete && (
        <Button 
          size="icon" 
          variant="ghost" 
          className="text-green-500 hover:text-green-600 hover:bg-green-500/10"
          onClick={() => onComplete(task)}
          data-testid={`button-complete-flow-task-${task.id}`}
        >
          <Check className="w-5 h-5" />
        </Button>
      )}

      {task.completed && canMarkUndone && (
        <Button 
          size="icon" 
          variant="ghost" 
          className="text-orange-500 hover:text-orange-600 hover:bg-orange-500/10"
          onClick={() => onMarkUndone(task)}
          data-testid={`button-retry-flow-task-${task.id}`}
        >
          <RotateCcw className="w-5 h-5" />
        </Button>
      )}
    </div>
  );
}
