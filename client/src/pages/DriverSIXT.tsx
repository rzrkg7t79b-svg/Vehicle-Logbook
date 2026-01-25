import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Check, Clock, AlertTriangle, Zap, CheckSquare, Workflow } from "lucide-react";
import { GermanPlate } from "@/components/GermanPlate";
import { useUser } from "@/contexts/UserContext";
import { getGermanTime } from "@/lib/germanTime";
import type { FlowTask, Todo, DriverTask } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";

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

export default function DriverSIXT() {
  const { user } = useUser();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const { data: flowTasks = [], isLoading: flowLoading } = useQuery<FlowTask[]>({
    queryKey: ["/api/flow-tasks"],
  });

  const { data: todos = [], isLoading: todosLoading } = useQuery<Todo[]>({
    queryKey: ["/api/todos"],
  });

  const { data: qualityDriverTasks = [], isLoading: qualityLoading } = useQuery<DriverTask[]>({
    queryKey: ["/api/driver-tasks"],
  });

  const completeFlowTask = useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      const res = await fetch(`/api/flow-tasks/${id}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "x-admin-pin": user?.pin || ""
        },
        body: JSON.stringify({ completed: true, completedBy: user?.initials }),
      });
      if (!res.ok) throw new Error("Failed to complete task");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/flow-tasks"] });
    },
  });

  const completeTodo = useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      const res = await fetch(`/api/todos/${id}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "x-admin-pin": user?.pin || ""
        },
        body: JSON.stringify({ completed: true, completedBy: user?.initials }),
      });
      if (!res.ok) throw new Error("Failed to complete todo");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
    },
  });

  const completeQualityTask = useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      const res = await fetch(`/api/driver-tasks/${id}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "x-admin-pin": user?.pin || ""
        },
        body: JSON.stringify({ completed: true, completedBy: user?.initials }),
      });
      if (!res.ok) throw new Error("Failed to complete task");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/driver-tasks"] });
    },
  });

  const driverTodos = useMemo(() => {
    return todos.filter(todo => 
      todo.assignedTo.includes("Driver") || todo.assignedTo.length === 0
    );
  }, [todos]);

  const pendingFlowTasks = flowTasks.filter(t => !t.completed);
  const completedFlowTasks = flowTasks.filter(t => t.completed);
  const pendingTodos = driverTodos.filter(t => !t.completed);
  const completedTodos = driverTodos.filter(t => t.completed);
  const pendingQualityTasks = qualityDriverTasks.filter(t => !t.completed);
  const completedQualityTasks = qualityDriverTasks.filter(t => t.completed);

  const totalTasks = flowTasks.length + driverTodos.length + qualityDriverTasks.length;
  const completedCount = completedFlowTasks.length + completedTodos.length + completedQualityTasks.length;
  const progress = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  const flowVehicleGroups = useMemo(() => {
    const groups = new Map<string, { licensePlate: string; isEv: boolean; tasks: FlowTask[] }>();
    
    pendingFlowTasks.forEach(task => {
      const key = task.licensePlate;
      if (!groups.has(key)) {
        groups.set(key, {
          licensePlate: task.licensePlate,
          isEv: task.isEv,
          tasks: [],
        });
      }
      groups.get(key)!.tasks.push(task);
    });
    
    return Array.from(groups.values()).sort((a, b) => {
      const aMinPriority = Math.min(...a.tasks.map(t => t.priority));
      const bMinPriority = Math.min(...b.tasks.map(t => t.priority));
      return aMinPriority - bMinPriority;
    });
  }, [pendingFlowTasks]);

  const isLoading = flowLoading || todosLoading || qualityLoading;

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-gradient-to-b from-primary/20 to-transparent p-6">
        <h1 className="text-2xl font-bold text-white mb-1">
          Driver<span className="text-primary">SIXT</span>
        </h1>
        <p className="text-sm text-muted-foreground">Your Tasks</p>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted-foreground">Your Progress</span>
            <span className="text-sm font-bold text-primary">{progress}%</span>
          </div>
          <Progress value={progress} className="h-3" />
          <p className="text-xs text-muted-foreground mt-2">
            {completedCount} of {totalTasks} tasks completed
          </p>
        </Card>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : (
          <>
            {flowVehicleGroups.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Workflow className="w-5 h-5 text-primary" />
                    FlowSIXT Tasks
                    <span className="text-sm font-normal text-muted-foreground">
                      ({pendingFlowTasks.length})
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <AnimatePresence>
                    {flowVehicleGroups.map((group) => (
                      <motion.div
                        key={group.licensePlate}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="p-3 rounded-lg border bg-card"
                        data-testid={`driver-vehicle-${group.licensePlate.replace(/\s+/g, '-')}`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <GermanPlate plate={group.licensePlate} size="sm" />
                          {group.isEv && <Zap className="w-4 h-4 text-green-500" />}
                        </div>
                        <div className="space-y-2">
                          {group.tasks.map((task) => {
                            const countdownStatus = getCountdownStatus(task.needAt, now);
                            return (
                              <div 
                                key={task.id}
                                className={`flex items-center gap-2 p-2 rounded ${
                                  countdownStatus?.isOverdue 
                                    ? "bg-red-500/20" 
                                    : task.needsRetry 
                                      ? "bg-orange-500/20" 
                                      : "bg-white/5"
                                }`}
                                data-testid={`driver-flow-task-${task.id}`}
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-medium">{task.taskType}</span>
                                    {task.needsRetry && (
                                      <span className="text-xs text-orange-500 flex items-center gap-1">
                                        <AlertTriangle className="w-3 h-3" />
                                        Try again!
                                      </span>
                                    )}
                                  </div>
                                  {countdownStatus && (
                                    <span className={`text-xs flex items-center gap-1 ${countdownStatus.isOverdue ? "text-red-500 font-semibold" : "text-muted-foreground"}`}>
                                      <Clock className="w-3 h-3" />
                                      {countdownStatus.text}
                                    </span>
                                  )}
                                </div>
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  onClick={() => completeFlowTask.mutate({ id: task.id })}
                                  disabled={completeFlowTask.isPending}
                                  data-testid={`button-complete-driver-flow-${task.id}`}
                                >
                                  <Check className="w-4 h-4 text-green-500" />
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </CardContent>
              </Card>
            )}

            {pendingTodos.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckSquare className="w-5 h-5 text-primary" />
                    ToDoSIXT Tasks
                    <span className="text-sm font-normal text-muted-foreground">
                      ({pendingTodos.length})
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <AnimatePresence>
                    {pendingTodos.map((todo) => (
                      <motion.div
                        key={todo.id}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="flex items-center gap-2 p-3 rounded-lg border bg-card"
                        data-testid={`driver-todo-${todo.id}`}
                      >
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium">{todo.title}</span>
                        </div>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={() => completeTodo.mutate({ id: todo.id })}
                          disabled={completeTodo.isPending}
                          data-testid={`button-complete-driver-todo-${todo.id}`}
                        >
                          <Check className="w-4 h-4 text-green-500" />
                        </Button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </CardContent>
              </Card>
            )}

            {pendingQualityTasks.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    Quality Issues
                    <span className="text-sm font-normal text-muted-foreground">
                      ({pendingQualityTasks.length})
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <AnimatePresence>
                    {pendingQualityTasks.map((task) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="flex items-center gap-2 p-3 rounded-lg border bg-card border-red-500/30"
                        data-testid={`driver-quality-task-${task.id}`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <GermanPlate plate={task.licensePlate} size="sm" />
                          </div>
                          <span className="text-sm text-muted-foreground">{task.description}</span>
                        </div>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={() => completeQualityTask.mutate({ id: task.id })}
                          disabled={completeQualityTask.isPending}
                          data-testid={`button-complete-driver-quality-${task.id}`}
                        >
                          <Check className="w-4 h-4 text-green-500" />
                        </Button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </CardContent>
              </Card>
            )}

            {pendingFlowTasks.length === 0 && pendingTodos.length === 0 && pendingQualityTasks.length === 0 && (
              <Card className="p-8 text-center border-green-500/30 bg-green-500/5">
                <Check className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-green-500">All Done!</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  No pending tasks at the moment
                </p>
              </Card>
            )}
          </>
        )}
      </div>

      <footer className="mt-8 pt-8 pb-24 border-t border-white/10 text-center space-y-1">
        <p className="text-xs text-muted-foreground">
          Version v2.0.5
        </p>
        <p className="text-xs text-muted-foreground">
          &copy; 2026 by Nathanael Prem
        </p>
      </footer>
    </div>
  );
}
