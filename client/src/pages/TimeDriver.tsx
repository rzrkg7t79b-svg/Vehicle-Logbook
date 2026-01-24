import { useState, useEffect } from "react";
import { Link } from "wouter";
import { ArrowLeft, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getSecondsUntilGermanTime, formatCountdown, isOverdue, getGermanDateString } from "@/lib/germanTime";
import { useUser } from "@/contexts/UserContext";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { ModuleStatus } from "@shared/schema";

export default function TimeDriver() {
  const { user } = useUser();
  const todayDate = getGermanDateString();
  const [countdown, setCountdown] = useState(getSecondsUntilGermanTime(8, 0));
  const [overdueState, setOverdueState] = useState(isOverdue(8, 0));

  const { data: moduleStatuses = [] } = useQuery<ModuleStatus[]>({
    queryKey: ["/api/module-status", todayDate],
    queryFn: async () => {
      const res = await fetch(`/api/module-status?date=${todayDate}`);
      return res.json();
    },
  });

  const isDone = moduleStatuses.find(s => s.moduleName === "timedriver")?.isDone || false;

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(getSecondsUntilGermanTime(8, 0));
      setOverdueState(isOverdue(8, 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const markDoneMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/module-status", {
        moduleName: "timedriver",
        date: todayDate,
        isDone: true,
        doneBy: user?.initials,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/module-status", todayDate] });
    },
  });

  return (
    <div className="pb-24">
      <div className="bg-gradient-to-b from-blue-500/20 to-transparent p-6">
        <Link href="/">
          <button className="flex items-center gap-2 text-muted-foreground hover:text-white mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Master</span>
          </button>
        </Link>
        <h1 className="text-2xl font-bold text-white mb-1">
          TimeDriver<span className="text-blue-400">SIXT</span>
        </h1>
        <p className="text-sm text-muted-foreground">Morning Driver Check</p>
      </div>

      <div className="p-4 space-y-4">
        <Card className={`p-6 ${overdueState && !isDone ? 'border-red-500/50 bg-red-500/10' : isDone ? 'border-green-500/50 bg-green-500/10' : ''}`}>
          <div className="text-center">
            <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
              isDone ? 'bg-green-500/20' : overdueState ? 'bg-red-500/20' : 'bg-blue-500/20'
            }`}>
              {isDone ? (
                <CheckCircle className="w-8 h-8 text-green-500" />
              ) : overdueState ? (
                <AlertTriangle className="w-8 h-8 text-red-500" />
              ) : (
                <Clock className="w-8 h-8 text-blue-400" />
              )}
            </div>
            
            <p className="text-sm text-muted-foreground mb-2">Deadline: 08:00 German Time</p>
            
            {isDone ? (
              <div className="text-green-500">
                <p className="text-2xl font-bold">COMPLETED</p>
                <p className="text-sm text-muted-foreground mt-1">Module marked as done</p>
              </div>
            ) : overdueState ? (
              <div className="text-red-500">
                <p className="text-3xl font-bold">OVERDUE</p>
                <p className="text-sm text-muted-foreground mt-1">Deadline has passed</p>
              </div>
            ) : (
              <p className="text-4xl font-mono font-bold text-blue-400" data-testid="timedriver-countdown">
                {formatCountdown(countdown)}
              </p>
            )}
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-medium text-white mb-3">Morning Tasks</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              Check driver schedules
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              Review vehicle assignments
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              Confirm pickup times
            </li>
          </ul>
        </Card>

        {!isDone && (
          <Button
            onClick={() => markDoneMutation.mutate()}
            disabled={markDoneMutation.isPending}
            className="w-full"
            data-testid="button-mark-done"
          >
            {markDoneMutation.isPending ? "Marking..." : "Mark as Done"}
          </Button>
        )}
      </div>
    </div>
  );
}
