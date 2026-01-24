import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type CreateVehicleRequest, type CreateCommentRequest } from "@shared/routes";

// ============================================
// VEHICLE HOOKS
// ============================================

export function useVehicles(filters?: { search?: string, filter?: 'all' | 'expired' }) {
  const queryKey = [api.vehicles.list.path, filters];
  return useQuery({
    queryKey,
    queryFn: async () => {
      // Build query string manually or use URLSearchParams if complexity grows
      const params = new URLSearchParams();
      if (filters?.search) params.append('search', filters.search);
      if (filters?.filter) params.append('filter', filters.filter);
      
      const url = `${api.vehicles.list.path}?${params.toString()}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch vehicles");
      return api.vehicles.list.responses[200].parse(await res.json());
    },
  });
}

export function useVehicle(id: number) {
  return useQuery({
    queryKey: [api.vehicles.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.vehicles.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch vehicle");
      return api.vehicles.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateVehicleRequest) => {
      const res = await fetch(api.vehicles.create.path, {
        method: api.vehicles.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 400) {
          const error = api.vehicles.create.responses[400].parse(await res.json());
          throw new Error(error.message || "Validation failed");
        }
        throw new Error("Failed to create vehicle");
      }
      return api.vehicles.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.vehicles.list.path] });
    },
  });
}

export function useUpdateVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number, data: { readyForCollection?: boolean } }) => {
      const url = buildUrl(api.vehicles.update.path, { id });
      const res = await fetch(url, {
        method: 'PATCH',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update vehicle");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.vehicles.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.vehicles.get.path, variables.id] });
    },
  });
}

export function useDeleteVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.vehicles.delete.path, { id });
      const res = await fetch(url, { 
        method: api.vehicles.delete.method,
        credentials: "include" 
      });
      if (!res.ok && res.status !== 404) throw new Error("Failed to delete vehicle");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.vehicles.list.path] });
    },
  });
}

// ============================================
// COMMENT HOOKS
// ============================================

export function useCreateComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ vehicleId, content, userInitials }: { vehicleId: number, content: string, userInitials?: string }) => {
      const url = buildUrl(api.vehicles.createComment.path, { id: vehicleId });
      const res = await fetch(url, {
        method: api.vehicles.createComment.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, userInitials }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to add comment");
      return api.vehicles.createComment.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.vehicles.get.path, variables.vehicleId] });
    },
  });
}
