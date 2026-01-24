import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useUser } from "@/contexts/UserContext";
import { getGermanDateString } from "@/lib/germanTime";
import { GermanPlate } from "@/components/GermanPlate";
import { LicensePlateInput, buildPlateFromParts } from "@/components/LicensePlateInput";
import type { QualityCheck as QualityCheckType, DriverTask, ModuleStatus } from "@shared/schema";

export default function QualityCheck() {
  const { user } = useUser();
  const [plateLetters, setPlateLetters] = useState("");
  const [plateNumbers, setPlateNumbers] = useState("");
  const [isEv, setIsEv] = useState(false);
  const [passed, setPassed] = useState<boolean | null>(null);
  const [comment, setComment] = useState("");
  const todayDate = getGermanDateString();
  
  const licensePlate = buildPlateFromParts(plateLetters, plateNumbers, isEv);
  const isValidPlate = plateLetters && plateNumbers;

  const isDriver = user?.roles?.includes("Driver");

  const { data: qualityChecks = [] } = useQuery<QualityCheckType[]>({
    queryKey: ["/api/quality-checks"],
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

  const isDone = moduleStatuses.find(s => s.moduleName === "quality")?.isDone || false;

  const createCheckMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/quality-checks", {
        licensePlate: licensePlate.toUpperCase(),
        isEv,
        passed: passed!,
        comment: passed ? undefined : comment,
        checkedBy: user?.initials,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quality-checks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/driver-tasks"] });
      resetForm();
    },
  });

  const completeTaskMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("PATCH", `/api/driver-tasks/${id}`, {
        completed: true,
        completedBy: user?.initials,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/driver-tasks"] });
    },
  });

  const markModuleDoneMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/module-status", {
        moduleName: "quality",
        date: todayDate,
        isDone: true,
        doneBy: user?.initials,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/module-status", todayDate] });
    },
  });

  const resetForm = () => {
    setPlateLetters("");
    setPlateNumbers("");
    setIsEv(false);
    setPassed(null);
    setComment("");
  };

  const pendingTasks = driverTasks.filter(t => !t.completed);
  const todayChecks = qualityChecks.filter(c => {
    const checkDate = new Date(c.createdAt!).toLocaleDateString("en-CA", { timeZone: "Europe/Berlin" });
    return checkDate === todayDate;
  });

  return (
    <div className="pb-24">
      <div className="bg-gradient-to-b from-teal-500/20 to-transparent p-6">
        <Link href="/">
          <button className="flex items-center gap-2 text-muted-foreground hover:text-white mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Master</span>
          </button>
        </Link>
        <h1 className="text-2xl font-bold text-white mb-1">
          Quality<span className="text-teal-400">SIXT</span>
        </h1>
        <p className="text-sm text-muted-foreground">Vehicle Quality Checks</p>
      </div>

      <div className="p-4 space-y-4">
        {isDriver && pendingTasks.length > 0 && (
          <Card className="p-4 border-orange-500/50 bg-orange-500/10">
            <div className="flex items-center gap-3 mb-3">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <span className="font-medium text-orange-400">Your Pending Tasks</span>
            </div>
            <div className="space-y-2">
              {pendingTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                  <div>
                    <GermanPlate plate={task.licensePlate} size="sm" />
                    <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => completeTaskMutation.mutate(task.id)}
                    disabled={completeTaskMutation.isPending}
                    data-testid={`button-complete-task-${task.id}`}
                  >
                    Done
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        )}

        <Card className="p-4">
          <h3 className="font-medium text-white mb-4">New Quality Check</h3>
          
          <div className="space-y-4">
            <LicensePlateInput
              letters={plateLetters}
              numbers={plateNumbers}
              isEv={isEv}
              onLettersChange={setPlateLetters}
              onNumbersChange={setPlateNumbers}
              onEvChange={setIsEv}
              autoFocusLetters
            />

            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Result</label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant={passed === true ? "default" : "outline"}
                  className={passed === true ? "bg-green-500 hover:bg-green-600" : ""}
                  onClick={() => setPassed(true)}
                  data-testid="button-passed"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Passed
                </Button>
                <Button
                  variant={passed === false ? "default" : "outline"}
                  className={passed === false ? "bg-red-500 hover:bg-red-600" : ""}
                  onClick={() => setPassed(false)}
                  data-testid="button-not-passed"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Not Passed
                </Button>
              </div>
            </div>

            {passed === false && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
              >
                <label className="text-sm text-muted-foreground mb-1 block">Comment (required for failed checks)</label>
                <Textarea
                  placeholder="Describe the issue..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  data-testid="input-comment"
                />
                <p className="text-xs text-orange-400 mt-2">
                  A task will be automatically created for Drivers
                </p>
              </motion.div>
            )}

            <Button
              onClick={() => createCheckMutation.mutate()}
              disabled={!isValidPlate || passed === null || (passed === false && !comment) || createCheckMutation.isPending}
              className="w-full"
              data-testid="button-submit-check"
            >
              {createCheckMutation.isPending ? "Submitting..." : "Submit Check"}
            </Button>
          </div>
        </Card>

        {todayChecks.length > 0 && (
          <Card className="p-4">
            <h3 className="font-medium text-white mb-3">Today's Checks</h3>
            <div className="space-y-2">
              <AnimatePresence>
                {todayChecks.map((check) => (
                  <motion.div
                    key={check.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3 rounded-lg ${check.passed ? 'bg-green-500/10' : 'bg-red-500/10'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GermanPlate plate={check.licensePlate} size="sm" />
                        {check.isEv && <Zap className="w-4 h-4 text-green-500" />}
                      </div>
                      {check.passed ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                    {!check.passed && check.comment && (
                      <p className="text-xs text-muted-foreground mt-2">{check.comment}</p>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </Card>
        )}

        {!isDone && (
          <Button
            onClick={() => markModuleDoneMutation.mutate()}
            disabled={markModuleDoneMutation.isPending}
            className="w-full"
            variant="outline"
            data-testid="button-mark-module-done"
          >
            {markModuleDoneMutation.isPending ? "Marking..." : "Mark Module as Done"}
          </Button>
        )}
      </div>
    </div>
  );
}
