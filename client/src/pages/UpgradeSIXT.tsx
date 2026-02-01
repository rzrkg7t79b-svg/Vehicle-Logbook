import { useState, useEffect } from "react";
import { Link } from "wouter";
import { ArrowLeft, TrendingUp, Clock, AlertTriangle, CheckCircle, Plus, Loader2, Car, Truck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useUser } from "@/contexts/UserContext";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { getSecondsUntilGermanTime, formatCountdown, isOverdue, getGermanDateString } from "@/lib/germanTime";
import { LicensePlateInput, buildPlateFromParts } from "@/components/LicensePlateInput";
import { GermanPlate } from "@/components/GermanPlate";

type UpgradeVehicle = {
  id: number;
  licensePlate: string;
  model: string;
  reason: string;
  isVan: boolean;
  isSold: boolean;
  soldBy: string | null;
  soldAt: string | null;
  createdAt: string;
  createdBy: string | null;
  date: string;
};

export default function UpgradeSIXT() {
  const { user } = useUser();
  const isAdmin = user?.isAdmin;
  const isCounter = user?.roles?.includes("Counter");
  const canAdd = isAdmin || isCounter;
  
  const todayDate = getGermanDateString();
  
  const [countdown, setCountdown] = useState(getSecondsUntilGermanTime(8, 30));
  const [deadlineOverdue, setDeadlineOverdue] = useState(isOverdue(8, 30));
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [letters, setLetters] = useState("");
  const [numbers, setNumbers] = useState("");
  const [isEv, setIsEv] = useState(false);
  const [isVan, setIsVan] = useState(false);
  const [model, setModel] = useState("");
  const [reason, setReason] = useState("");
  
  const adminHeaders: Record<string, string> = user?.pin ? { "x-admin-pin": user.pin } : {};
  
  const { data: upgradeVehicles = [], isLoading } = useQuery<UpgradeVehicle[]>({
    queryKey: ["/api/upgrade-vehicles/date", todayDate],
    queryFn: async () => {
      const res = await fetch(`/api/upgrade-vehicles/date/${todayDate}`);
      return res.json();
    },
  });
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(getSecondsUntilGermanTime(8, 30));
      setDeadlineOverdue(isOverdue(8, 30));
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  
  const createMutation = useMutation({
    mutationFn: async (data: { licensePlate: string; model: string; reason: string; date: string; isVan: boolean; createdBy?: string }) => {
      return await apiRequest("POST", "/api/upgrade-vehicles", data, adminHeaders);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/upgrade-vehicles/date", todayDate] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/status"] });
      resetForm();
    },
  });
  
  const markSoldMutation = useMutation({
    mutationFn: async ({ id, soldBy }: { id: number; soldBy: string }) => {
      return await apiRequest("PATCH", `/api/upgrade-vehicles/${id}`, { isSold: true, soldBy }, adminHeaders);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/upgrade-vehicles/date", todayDate] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/status"] });
    },
  });
  
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/upgrade-vehicles/${id}`, undefined, adminHeaders);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/upgrade-vehicles/date", todayDate] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/status"] });
    },
  });
  
  const resetForm = () => {
    setLetters("");
    setNumbers("");
    setIsEv(false);
    setIsVan(false);
    setModel("");
    setReason("");
    setShowAddForm(false);
  };
  
  const handleSubmit = () => {
    if (!letters || !numbers || !model.trim() || !reason.trim()) return;
    
    const licensePlate = buildPlateFromParts(letters, numbers, isEv);
    createMutation.mutate({
      licensePlate,
      model: model.trim(),
      reason: reason.trim(),
      date: todayDate,
      isVan,
      createdBy: user?.initials,
    });
  };
  
  const handleMarkSold = (id: number) => {
    if (!user?.initials) return;
    markSoldMutation.mutate({ id, soldBy: user.initials });
  };
  
  const pendingVehicles = upgradeVehicles.filter(v => !v.isSold);
  const soldVehicles = upgradeVehicles.filter(v => v.isSold);
  const hasPending = pendingVehicles.length > 0;
  const hasSold = soldVehicles.length > 0;
  const isDone = hasSold;
  
  const isFormValid = letters.length >= 1 && numbers.length >= 1 && model.trim() && reason.trim();

  return (
    <div className="min-h-screen pb-24">
      <div className="max-w-md mx-auto">
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 via-blue-500/5 to-transparent" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[200px] bg-blue-500/15 blur-[100px] rounded-full" />
          <div className="relative p-6 pt-8">
            <Link href="/" className="flex items-center gap-2 text-white/50 hover:text-white mb-4 transition-colors rounded-xl px-3 py-1.5 -ml-3 hover:bg-white/[0.04] w-fit" data-testid="link-back-master">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back to Master</span>
            </Link>
            <h1 className="text-3xl font-bold text-white mb-1">
              Upgrade<span className="text-blue-400">SIXT</span>
            </h1>
            <p className="text-sm text-white/50">Daily UP Vehicle Management</p>
          </div>
        </div>

      <div className="p-4 space-y-4">
        <Card className={`p-4 ${isDone ? 'border-green-500/50 bg-green-500/10' : deadlineOverdue && !hasPending ? 'border-red-500/50 bg-red-500/10' : ''}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                isDone ? 'bg-green-500/20' : 'bg-primary/10'
              }`}>
                <TrendingUp className={`w-5 h-5 ${isDone ? 'text-green-500' : 'text-primary'}`} />
              </div>
              <div>
                <p className="font-medium text-white">Daily UP Target</p>
                <p className="text-xs text-muted-foreground">
                  {isDone ? 'Target achieved!' : hasPending ? 'Pending sale' : 'Define UP vehicle by 08:30'}
                </p>
              </div>
            </div>
            <div className="text-right">
              {isDone ? (
                <CheckCircle className="w-6 h-6 text-green-500" />
              ) : deadlineOverdue && !hasPending ? (
                <div className="flex items-center gap-2 text-red-500">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="text-sm font-bold">OVERDUE</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-lg font-mono font-bold text-primary" data-testid="countdown-display">
                    {formatCountdown(countdown)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </Card>

        {canAdd && !showAddForm && pendingVehicles.length < 2 && (
          <Button
            onClick={() => setShowAddForm(true)}
            className="w-full"
            variant="default"
            data-testid="button-add-upgrade"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add UP Vehicle {pendingVehicles.length > 0 ? `(${pendingVehicles.length}/2)` : ''}
          </Button>
        )}

        {showAddForm && (
          <Card className="p-4 space-y-4">
            <h3 className="font-medium text-white">New UP Vehicle</h3>
            
            <LicensePlateInput
              letters={letters}
              numbers={numbers}
              isEv={isEv}
              onLettersChange={setLetters}
              onNumbersChange={setNumbers}
              onEvChange={setIsEv}
              autoFocusLetters
            />
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Vehicle Type *</label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={!isVan ? "default" : "outline"}
                  onClick={() => setIsVan(false)}
                  className="flex-1"
                  data-testid="button-car"
                >
                  <Car className="w-4 h-4 mr-2" />
                  Car
                </Button>
                <Button
                  type="button"
                  variant={isVan ? "default" : "outline"}
                  onClick={() => setIsVan(true)}
                  className="flex-1"
                  data-testid="button-van"
                >
                  <Truck className="w-4 h-4 mr-2" />
                  Van
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Model *</label>
              <Input
                placeholder="e.g., BMW 5 Series, Audi A4"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                data-testid="input-model"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Reason for Upgrade *</label>
              <Textarea
                placeholder="Explain why this vehicle should be offered as an upgrade..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                data-testid="input-reason"
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={resetForm}
                className="flex-1"
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!isFormValid || createMutation.isPending}
                className="flex-1"
                data-testid="button-save"
              >
                {createMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Save'
                )}
              </Button>
            </div>
          </Card>
        )}

        {hasPending && (
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground px-1">Pending Sales Tasks</h2>
            {pendingVehicles.map((vehicle) => (
              <Card key={vehicle.id} className="p-4 border-orange-500/30 bg-orange-500/5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <GermanPlate plate={vehicle.licensePlate} size="sm" />
                      {vehicle.isVan ? (
                        <Truck className="w-4 h-4 text-orange-400" data-testid={`icon-van-${vehicle.id}`} />
                      ) : (
                        <Car className="w-4 h-4 text-orange-400" data-testid={`icon-car-${vehicle.id}`} />
                      )}
                    </div>
                    <p className="font-medium text-white">{vehicle.model}</p>
                    <p className="text-sm text-muted-foreground">{vehicle.reason}</p>
                    <p className="text-xs text-muted-foreground/50">
                      Added by {vehicle.createdBy || 'Unknown'}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleMarkSold(vehicle.id)}
                      disabled={markSoldMutation.isPending}
                      className="bg-green-600 hover:bg-green-700"
                      data-testid={`button-mark-sold-${vehicle.id}`}
                    >
                      {markSoldMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Mark Sold'
                      )}
                    </Button>
                    {canAdd && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteMutation.mutate(vehicle.id)}
                        disabled={deleteMutation.isPending}
                        className="text-red-400 hover:text-red-300"
                        data-testid={`button-delete-${vehicle.id}`}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {hasSold && (
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground px-1">Sold Today</h2>
            {soldVehicles.map((vehicle) => (
              <Card key={vehicle.id} className="p-4 border-green-500/30 bg-green-500/5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <GermanPlate plate={vehicle.licensePlate} size="sm" />
                      {vehicle.isVan ? (
                        <Truck className="w-4 h-4 text-green-400" />
                      ) : (
                        <Car className="w-4 h-4 text-green-400" />
                      )}
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    </div>
                    <p className="font-medium text-white">{vehicle.model}</p>
                    <p className="text-xs text-green-400">
                      Sold by {vehicle.soldBy || 'Unknown'}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}

        {!isLoading && !hasPending && !hasSold && !showAddForm && (
          <Card className="p-6 text-center">
            <TrendingUp className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">No UP vehicles for today</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              {canAdd ? 'Add a vehicle to start tracking upgrades' : 'Counter or Admin can add vehicles'}
            </p>
          </Card>
        )}

        <footer className="mt-8 pt-8 border-t border-white/10 text-center space-y-1">
          <p className="text-xs text-muted-foreground">Version v3.1.5</p>
          <p className="text-xs text-muted-foreground">&copy; 2026 by Nathanael Prem</p>
        </footer>
        </div>
      </div>
    </div>
  );
}
