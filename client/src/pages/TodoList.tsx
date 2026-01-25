import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, Plus, Trash2, Check, Square, CheckSquare, Users, CalendarClock, RotateCcw, CircleDot } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useUser } from "@/contexts/UserContext";
import { getGermanDateString } from "@/lib/germanTime";
import type { Todo, ModuleStatus } from "@/types";

const PRIORITY_LABELS: Record<number, string> = {
  3: "!!!",
  2: "!!",
  1: "!",
  0: "",
};

const PRIORITY_COLORS: Record<number, string> = {
  3: "bg-red-500/20 text-red-400",
  2: "bg-orange-500/20 text-orange-400",
  1: "bg-yellow-500/20 text-yellow-400",
  0: "",
};

export default function TodoList() {
  const { user } = useUser();
  const [newTodoTitle, setNewTodoTitle] = useState("");
  const [assignCounter, setAssignCounter] = useState(false);
  const [assignDriver, setAssignDriver] = useState(false);
  const [isRecurring, setIsRecurring] = useState(true);
  const [priority, setPriority] = useState(0);
  const todayDate = getGermanDateString();

  const adminPin = user?.pin;
  const adminHeaders: Record<string, string> = user?.isAdmin && adminPin ? { "x-admin-pin": adminPin } : {};
  const userRoles = user?.roles || [];

  const { data: todos = [], isLoading } = useQuery<Todo[]>({
    queryKey: ["/api/todos"],
  });

  const { data: moduleStatuses = [] } = useQuery<ModuleStatus[]>({
    queryKey: ["/api/module-status", todayDate],
    queryFn: async () => {
      const res = await fetch(`/api/module-status?date=${todayDate}`);
      return res.json();
    },
  });

  const isDone = moduleStatuses.find(s => s.moduleName === "todo")?.isDone || false;

  const createMutation = useMutation({
    mutationFn: async (data: { title: string; assignedTo: string[]; isRecurring: boolean; priority: number }) => {
      await apiRequest("POST", "/api/todos", data, adminHeaders);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
      setNewTodoTitle("");
      setAssignCounter(false);
      setAssignDriver(false);
      setIsRecurring(true);
      setPriority(0);
    },
  });

  const handleCreateTodo = () => {
    if (!newTodoTitle.trim()) return;
    const assignedTo: string[] = [];
    if (assignCounter) assignedTo.push("Counter");
    if (assignDriver) assignedTo.push("Driver");
    createMutation.mutate({ title: newTodoTitle.trim(), assignedTo, isRecurring, priority });
  };

  const toggleMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: number; completed: boolean }) => {
      await apiRequest("PATCH", `/api/todos/${id}`, { 
        completed, 
        completedBy: completed ? user?.initials : undefined 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/todos/${id}`, undefined, adminHeaders);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
    },
  });

  const postponeMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("POST", `/api/todos/${id}/postpone`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/module-status"] });
    },
  });

  const markModuleDoneMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/module-status", {
        moduleName: "todo",
        date: todayDate,
        isDone: true,
        doneBy: user?.initials,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/module-status", todayDate] });
    },
  });

  // Filter todos based on role
  const baseTodos = user?.isAdmin 
    ? todos 
    : todos.filter(t => {
        if (!t.assignedTo || t.assignedTo.length === 0) return true;
        return t.assignedTo.some((role: string) => userRoles.includes(role));
      });

  // Today's tasks: not postponed, or postponed to today or earlier
  const todaysTasks = baseTodos.filter(t => {
    if (!t.postponedToDate) return true;
    return t.postponedToDate <= todayDate;
  });

  // Tomorrow's tasks: postponed to future dates
  const tomorrowTasks = baseTodos.filter(t => t.postponedToDate && t.postponedToDate > todayDate);

  // Count postponed todos that arrived today (from past postponement)
  const arrivedFromPostponement = todaysTasks.filter(t => t.postponedToDate === todayDate && !t.completed);

  const completedCount = todaysTasks.filter(t => t.completed).length;
  const postponedToFutureCount = tomorrowTasks.length;
  const arrivedPostponedCount = arrivedFromPostponement.length;
  const totalCount = todaysTasks.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="pb-24">
      <div className="bg-gradient-to-b from-purple-500/20 to-transparent p-6">
        <Link href="/">
          <button className="flex items-center gap-2 text-muted-foreground hover:text-white mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Master</span>
          </button>
        </Link>
        <h1 className="text-2xl font-bold text-white mb-1">
          ToDo<span className="text-purple-400">SIXT</span>
        </h1>
        <p className="text-sm text-muted-foreground">Daily Task List</p>
      </div>

      <div className="p-4 space-y-4">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted-foreground">Progress</span>
            <span className="text-sm font-bold text-purple-400">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">
            {completedCount} of {totalCount} tasks completed
            {postponedToFutureCount > 0 && (
              <span className="text-orange-400 ml-1">({postponedToFutureCount} postponed to tomorrow)</span>
            )}
          </p>
        </Card>

        {user?.isAdmin && (
          <Card className="p-4 space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Add new task..."
                value={newTodoTitle}
                onChange={(e) => setNewTodoTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newTodoTitle.trim()) {
                    handleCreateTodo();
                  }
                }}
                data-testid="input-new-todo"
              />
              <Button
                size="icon"
                onClick={handleCreateTodo}
                disabled={!newTodoTitle.trim() || createMutation.isPending}
                data-testid="button-add-todo"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-xs text-muted-foreground">Assign to:</span>
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="assign-counter" 
                  checked={assignCounter} 
                  onCheckedChange={(checked) => setAssignCounter(checked === true)}
                  data-testid="checkbox-assign-counter"
                />
                <Label htmlFor="assign-counter" className="text-sm">Counter</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="assign-driver" 
                  checked={assignDriver} 
                  onCheckedChange={(checked) => setAssignDriver(checked === true)}
                  data-testid="checkbox-assign-driver"
                />
                <Label htmlFor="assign-driver" className="text-sm">Driver</Label>
              </div>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-xs text-muted-foreground">Type:</span>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant={isRecurring ? "default" : "outline"}
                  onClick={() => setIsRecurring(true)}
                  className="text-xs gap-1"
                  data-testid="button-type-recurring"
                >
                  <RotateCcw className="w-3 h-3" />
                  Recurring
                </Button>
                <Button
                  size="sm"
                  variant={!isRecurring ? "default" : "outline"}
                  onClick={() => setIsRecurring(false)}
                  className="text-xs gap-1"
                  data-testid="button-type-onetime"
                >
                  <CircleDot className="w-3 h-3" />
                  One-Time
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-xs text-muted-foreground">Priority:</span>
              <div className="flex gap-1">
                {[0, 1, 2, 3].map((p) => (
                  <Button
                    key={p}
                    size="sm"
                    variant={priority === p ? "default" : "outline"}
                    onClick={() => setPriority(p)}
                    className="text-xs"
                    data-testid={`button-priority-${p}`}
                  >
                    {p === 0 ? "None" : PRIORITY_LABELS[p]}
                  </Button>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Today's Tasks */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground px-1">Today's Tasks</h3>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : todaysTasks.length === 0 ? (
            <Card className="p-8 text-center">
              <CheckSquare className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No tasks yet</p>
              {user?.isAdmin && (
                <p className="text-xs text-muted-foreground mt-1">Add a task above</p>
              )}
            </Card>
          ) : (
            <AnimatePresence>
              {todaysTasks.map((todo) => (
                <motion.div
                  key={todo.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                >
                  <Card className={`p-3 ${todo.completed ? 'bg-green-500/5 border-green-500/20' : ''} ${todo.postponedToDate === todayDate ? 'border-orange-500/30' : ''}`}>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleMutation.mutate({ id: todo.id, completed: !todo.completed })}
                        className="flex-shrink-0"
                        data-testid={`button-toggle-todo-${todo.id}`}
                      >
                        {todo.completed ? (
                          <CheckSquare className="w-5 h-5 text-green-500" />
                        ) : (
                          <Square className="w-5 h-5 text-muted-foreground hover:text-white transition-colors" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {(todo.priority ?? 0) > 0 && (
                            <span className={`text-xs font-bold ${
                              todo.priority === 3 ? "text-red-400" : 
                              todo.priority === 2 ? "text-orange-400" : 
                              "text-yellow-400"
                            }`}>
                              {PRIORITY_LABELS[todo.priority ?? 0]}
                            </span>
                          )}
                          <p className={`text-sm ${todo.completed ? 'line-through text-muted-foreground' : 'text-white'}`}>
                            {todo.title}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {todo.assignedTo && todo.assignedTo.length > 0 && (
                            <div className="flex gap-1">
                              {todo.assignedTo.map((role: string) => (
                                <Badge key={role} variant="outline" className="text-xs py-0">
                                  {role}
                                </Badge>
                              ))}
                            </div>
                          )}
                          {!todo.isRecurring && (
                            <Badge variant="secondary" className="text-xs py-0 bg-cyan-500/20 text-cyan-400">
                              One-Time
                            </Badge>
                          )}
                          {todo.isSystemGenerated && (
                            <Badge variant="secondary" className="text-xs py-0 bg-blue-500/20 text-blue-400">
                              Collection
                            </Badge>
                          )}
                          {todo.postponedToDate === todayDate && (
                            <Badge variant="secondary" className="text-xs py-0 bg-orange-500/20 text-orange-400">
                              Postponed
                            </Badge>
                          )}
                          {todo.completed && todo.completedBy && (
                            <span className="text-xs text-muted-foreground">
                              Done by {todo.completedBy}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {todo.isSystemGenerated && !todo.completed && todo.postponeCount === 0 && (
                          <button
                            onClick={() => postponeMutation.mutate(todo.id)}
                            className="text-muted-foreground hover:text-orange-400 transition-colors p-1"
                            title="Postpone to tomorrow"
                            data-testid={`button-postpone-todo-${todo.id}`}
                          >
                            <CalendarClock className="w-4 h-4" />
                          </button>
                        )}
                        {user?.isAdmin && !todo.isSystemGenerated && (
                          <button
                            onClick={() => deleteMutation.mutate(todo.id)}
                            className="text-muted-foreground hover:text-red-500 transition-colors p-1"
                            data-testid={`button-delete-todo-${todo.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Tomorrow's Tasks (Postponed) */}
        {tomorrowTasks.length > 0 && (
          <div className="space-y-2 mt-6">
            <h3 className="text-sm font-medium text-orange-400 px-1 flex items-center gap-2">
              <CalendarClock className="w-4 h-4" />
              Tomorrow's Tasks
            </h3>
            <AnimatePresence>
              {tomorrowTasks.map((todo) => (
                <motion.div
                  key={todo.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                >
                  <Card className="p-3 border-orange-500/30 bg-orange-500/5">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        <Square className="w-5 h-5 text-orange-400/50" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {(todo.priority ?? 0) > 0 && (
                            <span className={`text-xs font-bold ${
                              todo.priority === 3 ? "text-red-400" : 
                              todo.priority === 2 ? "text-orange-400" : 
                              "text-yellow-400"
                            }`}>
                              {PRIORITY_LABELS[todo.priority ?? 0]}
                            </span>
                          )}
                          <p className="text-sm text-orange-200">{todo.title}</p>
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {!todo.isRecurring && (
                            <Badge variant="secondary" className="text-xs py-0 bg-cyan-500/20 text-cyan-400">
                              One-Time
                            </Badge>
                          )}
                          {todo.isSystemGenerated && (
                            <Badge variant="secondary" className="text-xs py-0 bg-blue-500/20 text-blue-400">
                              Collection
                            </Badge>
                          )}
                          <Badge variant="secondary" className="text-xs py-0 bg-orange-500/20 text-orange-400">
                            Postponed
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {!isDone && todaysTasks.length > 0 && completedCount === totalCount && tomorrowTasks.length === 0 && (
          <Button
            onClick={() => markModuleDoneMutation.mutate()}
            disabled={markModuleDoneMutation.isPending}
            className="w-full"
            data-testid="button-mark-module-done"
          >
            {markModuleDoneMutation.isPending ? "Marking..." : "Mark Module as Done"}
          </Button>
        )}
      </div>
    </div>
  );
}
