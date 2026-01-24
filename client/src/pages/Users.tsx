import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useUser } from "@/contexts/UserContext";
import { Link } from "wouter";
import { ArrowLeft, Plus, Edit2, Trash2, Shield, User as UserIcon, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/schema";

export default function Users() {
  const { user: currentUser } = useUser();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newInitials, setNewInitials] = useState("");
  const [newPin, setNewPin] = useState("");
  const [newRoles, setNewRoles] = useState<string[]>([]);
  const [pinError, setPinError] = useState("");

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: { initials: string; pin: string; roles: string[] }) => {
      const res = await apiRequest("POST", "/api/users", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      resetForm();
    },
    onError: (err: Error) => {
      setPinError(err.message || "Failed to create user");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<User> }) => {
      const res = await apiRequest("PATCH", `/api/users/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      resetForm();
    },
    onError: (err: Error) => {
      setPinError(err.message || "Failed to update user");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
  });

  const resetForm = () => {
    setIsCreating(false);
    setEditingId(null);
    setNewInitials("");
    setNewPin("");
    setNewRoles([]);
    setPinError("");
  };

  const handleCreate = () => {
    if (!newInitials || !newPin || newPin.length !== 4) {
      setPinError("Initials and 4-digit PIN required");
      return;
    }
    createMutation.mutate({
      initials: newInitials.toUpperCase(),
      pin: newPin,
      roles: newRoles,
    });
  };

  const handleUpdate = (id: number) => {
    const updateData: Partial<User> = {};
    if (newInitials) updateData.initials = newInitials.toUpperCase();
    if (newPin && newPin.length === 4) updateData.pin = newPin;
    if (newRoles.length > 0 || editingId) updateData.roles = newRoles;
    
    updateMutation.mutate({ id, data: updateData });
  };

  const startEdit = (user: User) => {
    setEditingId(user.id);
    setNewInitials(user.initials);
    setNewPin("");
    setNewRoles(user.roles || []);
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
                {pinError && <p className="text-xs text-red-500">{pinError}</p>}
                <div className="flex gap-2 pt-2">
                  <Button size="sm" onClick={handleCreate} disabled={createMutation.isPending} data-testid="button-save-user">
                    <Check className="w-4 h-4 mr-1" />
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

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading users...</div>
        ) : (
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
                    {pinError && <p className="text-xs text-red-500">{pinError}</p>}
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleUpdate(user.id)} disabled={updateMutation.isPending}>
                        <Check className="w-4 h-4 mr-1" />
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
                        <div className="flex gap-1 mt-1">
                          {(user.roles || []).map((role) => (
                            <span
                              key={role}
                              className="text-[10px] px-1.5 py-0.5 bg-white/5 text-muted-foreground rounded"
                            >
                              {role}
                            </span>
                          ))}
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
                          onClick={() => {
                            if (confirm("Delete this user?")) {
                              deleteMutation.mutate(user.id);
                            }
                          }}
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
        )}
      </main>
    </div>
  );
}
