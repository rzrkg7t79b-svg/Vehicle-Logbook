import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, Plus, Trash2, Check, Square, CheckSquare, Users } from "lucide-react";
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
import type { Todo, ModuleStatus } from "@shared/schema";

export default function TodoList() {
  const { user } = useUser();
  const [newTodoTitle, setNewTodoTitle] = useState("");
  const [assignCounter, setAssignCounter] = useState(false);
  const [assignDriver, setAssignDriver] = useState(false);
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
    mutationFn: async (data: { title: string; assignedTo: string[] }) => {
      await apiRequest("POST", "/api/todos", data, adminHeaders);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
      setNewTodoTitle("");
      setAssignCounter(false);
      setAssignDriver(false);
    },
  });

  const handleCreateTodo = () => {
    if (!newTodoTitle.trim()) return;
    const assignedTo: string[] = [];
    if (assignCounter) assignedTo.push("Counter");
    if (assignDriver) assignedTo.push("Driver");
    createMutation.mutate({ title: newTodoTitle.trim(), assignedTo });
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

  const filteredTodos = user?.isAdmin 
    ? todos 
    : todos.filter(t => {
        if (!t.assignedTo || t.assignedTo.length === 0) return true;
        return t.assignedTo.some((role: string) => userRoles.includes(role));
      });

  const completedCount = filteredTodos.filter(t => t.completed).length;
  const totalCount = filteredTodos.length;
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
            <div className="flex items-center gap-4">
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
          </Card>
        )}

        <div className="space-y-2">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : filteredTodos.length === 0 ? (
            <Card className="p-8 text-center">
              <CheckSquare className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No tasks yet</p>
              {user?.isAdmin && (
                <p className="text-xs text-muted-foreground mt-1">Add a task above</p>
              )}
            </Card>
          ) : (
            <AnimatePresence>
              {filteredTodos.map((todo) => (
                <motion.div
                  key={todo.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                >
                  <Card className={`p-3 ${todo.completed ? 'bg-green-500/5 border-green-500/20' : ''}`}>
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
                        <p className={`text-sm ${todo.completed ? 'line-through text-muted-foreground' : 'text-white'}`}>
                          {todo.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {todo.assignedTo && todo.assignedTo.length > 0 && (
                            <div className="flex gap-1">
                              {todo.assignedTo.map((role: string) => (
                                <Badge key={role} variant="outline" className="text-xs py-0">
                                  {role}
                                </Badge>
                              ))}
                            </div>
                          )}
                          {todo.completed && todo.completedBy && (
                            <span className="text-xs text-muted-foreground">
                              Done by {todo.completedBy}
                            </span>
                          )}
                        </div>
                      </div>
                      {user?.isAdmin && (
                        <button
                          onClick={() => deleteMutation.mutate(todo.id)}
                          className="text-muted-foreground hover:text-red-500 transition-colors"
                          data-testid={`button-delete-todo-${todo.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {!isDone && todos.length > 0 && completedCount === totalCount && (
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
