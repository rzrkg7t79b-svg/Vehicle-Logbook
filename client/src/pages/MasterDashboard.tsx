import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Clock, Car, ClipboardCheck, CheckSquare, AlertTriangle, CheckCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { getSecondsUntilGermanTime, formatCountdown, isOverdue, getGermanDateString } from "@/lib/germanTime";
import { useUser } from "@/contexts/UserContext";
import type { Todo, DriverTask, ModuleStatus } from "@shared/schema";

const MODULES = [
  { id: "timedriver", name: "TimeDriverSIXT", icon: Clock, path: "/timedriver", targetHour: 8, targetMinute: 0 },
  { id: "bodyshop", name: "BodyshopSIXT", icon: Car, path: "/bodyshop", targetHour: null, targetMinute: null },
  { id: "todo", name: "ToDoSIXT", icon: CheckSquare, path: "/todo", targetHour: null, targetMinute: null },
  { id: "quality", name: "QualitySIXT", icon: ClipboardCheck, path: "/quality", targetHour: null, targetMinute: null },
];

export default function MasterDashboard() {
  const { user } = useUser();
  const [masterCountdown, setMasterCountdown] = useState(getSecondsUntilGermanTime(16, 30));
  const [masterOverdue, setMasterOverdue] = useState(isOverdue(16, 30));
  const todayDate = getGermanDateString();

  const { data: todos = [] } = useQuery<Todo[]>({
    queryKey: ["/api/todos"],
  });

  const { data: driverTasks = [] } = useQuery<DriverTask[]>({
    queryKey: ["/api/driver-tasks"],
  });

  const { data: moduleStatuses = [] } = useQuery<ModuleStatus[]>({
    queryKey: ["/api/module-status", todayDate],
    queryFn: async () => {
      const res = await fetch(`/api/module-status?date=${todayDate}`);
      return res.json();
    },
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setMasterCountdown(getSecondsUntilGermanTime(16, 30));
      setMasterOverdue(isOverdue(16, 30));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const getModuleStatus = (moduleId: string): boolean => {
    const status = moduleStatuses.find(s => s.moduleName === moduleId);
    return status?.isDone || false;
  };

  const completedModules = MODULES.filter(m => getModuleStatus(m.id)).length;
  const totalProgress = Math.round((completedModules / MODULES.length) * 100);

  const completedTodos = todos.filter(t => t.completed).length;
  const totalTodos = todos.length;
  const todoProgress = totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0;

  const pendingDriverTasks = driverTasks.filter(t => !t.completed);
  const isDriver = user?.roles.includes("Driver");

  return (
    <div className="pb-24">
      <div className="bg-gradient-to-b from-primary/20 to-transparent p-6">
        <h1 className="text-2xl font-bold text-white mb-1">
          Master<span className="text-primary">SIXT</span>
        </h1>
        <p className="text-sm text-muted-foreground">Daily Task Overview</p>
      </div>

      <div className="p-4 space-y-4">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted-foreground">Daily Progress</span>
            <span className="text-sm font-bold text-primary">{totalProgress}%</span>
          </div>
          <Progress value={totalProgress} className="h-3" />
          <p className="text-xs text-muted-foreground mt-2">
            {completedModules} of {MODULES.length} modules completed
          </p>
        </Card>

        <Card className={`p-4 ${masterOverdue ? 'border-red-500/50 bg-red-500/10' : ''}`}>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-muted-foreground">Daily Deadline</span>
              <p className="text-xs text-muted-foreground">16:30 German Time</p>
            </div>
            <div className="text-right">
              {masterOverdue ? (
                <div className="flex items-center gap-2 text-red-500">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="text-lg font-bold">OVERDUE</span>
                </div>
              ) : (
                <span className="text-2xl font-mono font-bold text-primary" data-testid="master-countdown">
                  {formatCountdown(masterCountdown)}
                </span>
              )}
            </div>
          </div>
        </Card>

        {isDriver && pendingDriverTasks.length > 0 && (
          <Card className="p-4 border-orange-500/50 bg-orange-500/10">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm font-medium text-orange-400">Driver Tasks Pending</p>
                <p className="text-xs text-muted-foreground">
                  {pendingDriverTasks.length} quality issue{pendingDriverTasks.length !== 1 ? 's' : ''} to address
                </p>
              </div>
            </div>
          </Card>
        )}

        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground px-1">Modules</h2>
          
          {MODULES.map((module, index) => {
            const isDone = getModuleStatus(module.id);
            const Icon = module.icon;
            
            return (
              <motion.div
                key={module.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={module.path}>
                  <Card 
                    className={`p-4 hover-elevate cursor-pointer transition-all ${
                      isDone ? 'border-green-500/30 bg-green-500/5' : ''
                    }`}
                    data-testid={`module-card-${module.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          isDone ? 'bg-green-500/20' : 'bg-primary/10'
                        }`}>
                          <Icon className={`w-5 h-5 ${isDone ? 'text-green-500' : 'text-primary'}`} />
                        </div>
                        <div>
                          <p className="font-medium text-white">{module.name}</p>
                          {module.id === "todo" && totalTodos > 0 && (
                            <p className="text-xs text-muted-foreground">{todoProgress}% complete</p>
                          )}
                          {module.id === "quality" && pendingDriverTasks.length > 0 && isDriver && (
                            <p className="text-xs text-orange-400">{pendingDriverTasks.length} pending tasks</p>
                          )}
                        </div>
                      </div>
                      {isDone ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                      )}
                    </div>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
