import { useState } from "react";
import { useUser } from "@/contexts/UserContext";
import { Link } from "wouter";
import { ArrowLeft, Plus, Edit2, Trash2, Shield, User as UserIcon, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import type { User } from "@/types";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";

export default function Users() {
  const { user: currentUser } = useUser();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newInitials, setNewInitials] = useState("");
  const [newPin, setNewPin] = useState("");
  const [newRoles, setNewRoles] = useState<string[]>([]);
  const [newMaxDailyHours, setNewMaxDailyHours] = useState<string>("");
  const [newHourlyRate, setNewHourlyRate] = useState<string>("");
  const [pinError, setPinError] = useState("");

  const adminHeaders: Record<string, string> = currentUser?.pin ? { "x-admin-pin": currentUser.pin } : {};

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const res = await fetch("/api/users", { headers: adminHeaders });
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
    enabled: !!currentUser?.isAdmin,
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: {
      initials: string;
      pin: string;
      roles: string[];
      maxDailyHours: number | null;
      hourlyRate: number | null;
    }) => {
      return apiRequest("POST", "/api/users", data, adminHeaders);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/drivers"] });
      resetForm();
    },
    onError: (err: Error) => {
      setPinError(err.message || "Failed to create user");
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<User> }) => {
      return apiRequest("PATCH", `/api/users/${id}`, data, adminHeaders);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/drivers"] });
      resetForm();
    },
    onError: (err: Error) => {
      setPinError(err.message || "Failed to update user");
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/users/${id}`, undefined, adminHeaders);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/drivers"] });
    },
    onError: (err: Error) => {
      setPinError(err.message || "Failed to delete user");
    },
  });

  const resetForm = () => {
    setIsCreating(false);
    setEditingId(null);
    setNewInitials("");
    setNewPin("");
    setNewRoles([]);
    setNewMaxDailyHours("");
    setNewHourlyRate("");
    setPinError("");
  };

  const handleCreate = () => {
    if (!newInitials || !newPin || newPin.length !== 4) {
      setPinError("Initials and 4-digit PIN required");
      return;
    }
    const hasDriverRole = newRoles.includes("Driver");
    const hours = newMaxDailyHours ? Number(newMaxDailyHours) : null;
    const rate = newHourlyRate ? Number(newHourlyRate) : null;
    if (hasDriverRole && !hours) {
      setPinError("Max daily hours required for Driver role");
      return;
    }
    if (hasDriverRole && !rate) {
      setPinError("Hourly rate required for Driver role");
      return;
    }
    
    createUserMutation.mutate({
      initials: newInitials.toUpperCase(),
      pin: newPin,
      roles: newRoles,
      maxDailyHours: hours,
      hourlyRate: rate,
    });
  };

  const handleUpdate = (id: number) => {
    const hasDriverRole = newRoles.includes("Driver");
    const hours = newMaxDailyHours ? Number(newMaxDailyHours) : null;
    const rate = newHourlyRate ? Number(newHourlyRate) : null;
    if (hasDriverRole && !hours) {
      setPinError("Max daily hours required for Driver role");
      return;
    }
    if (hasDriverRole && !rate) {
      setPinError("Hourly rate required for Driver role");
      return;
    }
    
    const updateData: Partial<User> = {
      roles: newRoles,
      maxDailyHours: hours,
      hourlyRate: rate,
    };
    if (newInitials) updateData.initials = newInitials.toUpperCase();
    if (newPin && newPin.length === 4) updateData.pin = newPin;
    
    updateUserMutation.mutate({ id, data: updateData });
  };

  const handleDelete = (id: number) => {
    if (confirm("Delete this user?")) {
      deleteUserMutation.mutate(id);
    }
  };

  const startEdit = (user: User) => {
    setEditingId(user.id);
    setNewInitials(user.initials);
    setNewPin("");
    setNewRoles(user.roles || []);
    setNewMaxDailyHours(user.maxDailyHours ? String(user.maxDailyHours) : "");
    setNewHourlyRate(user.hourlyRate ? String(user.hourlyRate) : "");
    setPinError("");
  };

  const toggleRole = (role: string) => {
    if (newRoles.includes(role)) {
      setNewRoles(newRoles.filter((r) => r !== role));
    } else {
      setNewRoles([...newRoles, role]);
    }
  };

  if (!currentUser?.isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center">
          <Shield className="w-16 h-16 text-primary/50 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-4">Only Branch Manager can access user management.</p>
          <Link href="/">
            <Button variant="outline">Return to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-white/5">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Link href="/">
              <button className="p-2 rounded-lg bg-card border border-white/10 hover:bg-white/5" data-testid="button-back">
                <ArrowLeft className="w-5 h-5" />
              </button>
            </Link>
            <div>
              <h1 className="text-lg font-bold text-white">User Management</h1>
              <p className="text-xs text-muted-foreground">Branch Manager Only</p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => {
              setIsCreating(true);
              setEditingId(null);
              setNewInitials("");
              setNewPin("");
              setNewRoles([]);
              setPinError("");
            }}
            data-testid="button-add-user"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add User
          </Button>
        </div>
      </header>

      <main className="p-4 space-y-3 pb-24">
        <AnimatePresence>
          {isCreating && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="glass-card rounded-xl p-4 border-2 border-primary/50"
            >
              <h3 className="text-sm font-bold text-white mb-3">New User</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Initials</label>
                  <Input
                    value={newInitials}
                    onChange={(e) => setNewInitials(e.target.value.toUpperCase().slice(0, 3))}
                    placeholder="e.g. LS"
                    className="bg-background"
                    maxLength={3}
                    data-testid="input-initials"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">4-Digit PIN</label>
                  <Input
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    placeholder="e.g. 1234"
                    className="bg-background font-mono"
                    maxLength={4}
                    type="password"
                    data-testid="input-pin"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Roles</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleRole("Counter")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        newRoles.includes("Counter")
                          ? "bg-primary text-white"
                          : "bg-card border border-white/10 text-muted-foreground"
                      }`}
                      data-testid="button-role-counter"
                    >
                      Counter
                    </button>
                    <button
                      onClick={() => toggleRole("Driver")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        newRoles.includes("Driver")
                          ? "bg-primary text-white"
                          : "bg-card border border-white/10 text-muted-foreground"
                      }`}
                      data-testid="button-role-driver"
                    >
                      Driver
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Max Daily Hours {newRoles.includes("Driver") ? "(required)" : "(optional)"}
                  </label>
                  <Input
                    value={newMaxDailyHours}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^\d.]/g, "");
                      if (val.split('.').length <= 2) {
                        setNewMaxDailyHours(val.slice(0, 5));
                      }
                    }}
                    placeholder="e.g. 5.5"
                    className="bg-background"
                    maxLength={5}
                    data-testid="input-max-daily-hours"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Hourly Rate (EUR) {newRoles.includes("Driver") ? "(required)" : "(optional)"}
                  </label>
                  <Input
                    value={newHourlyRate}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^\d.,]/g, "").replace(",", ".");
                      if (val.split('.').length <= 2) {
                        setNewHourlyRate(val.slice(0, 6));
                      }
                    }}
                    placeholder="e.g. 27.08"
                    className="bg-background"
                    maxLength={6}
                    data-testid="input-hourly-rate"
                  />
                </div>
                {pinError && <p className="text-xs text-red-500">{pinError}</p>}
                <div className="flex gap-2 pt-2">
                  <Button 
                    size="sm" 
                    onClick={handleCreate} 
                    disabled={createUserMutation.isPending}
                    data-testid="button-save-user"
                  >
                    {createUserMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4 mr-1" />
                    )}
                    Create
                  </Button>
                  <Button size="sm" variant="outline" onClick={resetForm} data-testid="button-cancel">
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-2">
          {users.map((user) => (
            <motion.div
              key={user.id}
              layout
              className={`glass-card rounded-xl p-4 ${user.isAdmin ? "border-primary/30" : ""}`}
            >
              {editingId === user.id ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Initials</label>
                      <Input
                        value={newInitials}
                        onChange={(e) => setNewInitials(e.target.value.toUpperCase().slice(0, 3))}
                        className="bg-background"
                        maxLength={3}
                        disabled={user.isAdmin}
                        data-testid="input-edit-initials"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">New PIN (optional)</label>
                      <Input
                        value={newPin}
                        onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                        placeholder="Leave blank to keep"
                        className="bg-background font-mono"
                        maxLength={4}
                        type="password"
                        data-testid="input-edit-pin"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Roles</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleRole("Counter")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          newRoles.includes("Counter")
                            ? "bg-primary text-white"
                            : "bg-card border border-white/10 text-muted-foreground"
                        }`}
                      >
                        Counter
                      </button>
                      <button
                        onClick={() => toggleRole("Driver")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          newRoles.includes("Driver")
                            ? "bg-primary text-white"
                            : "bg-card border border-white/10 text-muted-foreground"
                        }`}
                      >
                        Driver
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      Max Daily Hours {newRoles.includes("Driver") ? "(required)" : "(optional)"}
                    </label>
                    <Input
                      value={newMaxDailyHours}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^\d.]/g, "");
                        if (val.split('.').length <= 2) {
                          setNewMaxDailyHours(val.slice(0, 5));
                        }
                      }}
                      placeholder="e.g. 5.5"
                      className="bg-background"
                      maxLength={5}
                      data-testid="input-edit-max-daily-hours"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      Hourly Rate (EUR) {newRoles.includes("Driver") ? "(required)" : "(optional)"}
                    </label>
                    <Input
                      value={newHourlyRate}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^\d.,]/g, "").replace(",", ".");
                        if (val.split('.').length <= 2) {
                          setNewHourlyRate(val.slice(0, 6));
                        }
                      }}
                      placeholder="e.g. 27.08"
                      className="bg-background"
                      maxLength={6}
                      data-testid="input-edit-hourly-rate"
                    />
                  </div>
                  {pinError && <p className="text-xs text-red-500">{pinError}</p>}
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => handleUpdate(user.id)}
                      disabled={updateUserMutation.isPending}
                    >
                      {updateUserMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4 mr-1" />
                      )}
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={resetForm}>
                      <X className="w-4 h-4 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      user.isAdmin ? "bg-primary/20 text-primary" : "bg-card border border-white/10"
                    }`}>
                      {user.isAdmin ? <Shield className="w-5 h-5" /> : <UserIcon className="w-5 h-5 text-muted-foreground" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{user.initials}</span>
                        {user.isAdmin && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-primary/20 text-primary rounded font-bold">
                            ADMIN
                          </span>
                        )}
                      </div>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {(user.roles || []).map((role) => (
                          <span
                            key={role}
                            className="text-[10px] px-1.5 py-0.5 bg-white/5 text-muted-foreground rounded"
                          >
                            {role}
                          </span>
                        ))}
                        {user.maxDailyHours && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded">
                            {Math.floor(user.maxDailyHours)}h{user.maxDailyHours % 1 > 0 ? ` ${Math.round((user.maxDailyHours % 1) * 60)}min` : ""}/day
                          </span>
                        )}
                        {user.hourlyRate && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded">
                            {user.hourlyRate} EUR/h
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(user)}
                      className="p-2 rounded-lg bg-card border border-white/10 hover:bg-white/5"
                      data-testid={`button-edit-user-${user.id}`}
                    >
                      <Edit2 className="w-4 h-4 text-muted-foreground" />
                    </button>
                    {!user.isAdmin && (
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="p-2 rounded-lg bg-card border border-white/10 hover:bg-red-500/20"
                        data-testid={`button-delete-user-${user.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        <footer className="mt-8 pt-8 border-t border-white/10 text-center space-y-1">
          <p className="text-xs text-muted-foreground">Version v3.1.8</p>
          <p className="text-xs text-muted-foreground">&copy; 2026 by Nathanael Prem</p>
        </footer>
      </main>
    </div>
  );
}
