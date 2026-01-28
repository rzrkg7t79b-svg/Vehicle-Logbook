import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_PATHS, buildUrl } from "@/api";
import type { Vehicle, VehicleWithComments, CreateVehicleRequest, Comment } from "@/types";

export function useVehicles(filters?: { search?: string, filter?: 'all' | 'expired' }) {
  const queryKey = [API_PATHS.vehicles.list, filters];
  return useQuery<VehicleWithComments[]>({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.search) params.append('search', filters.search);
      if (filters?.filter) params.append('filter', filters.filter);
      
      const url = `${API_PATHS.vehicles.list}?${params.toString()}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch vehicles");
      return res.json();
    },
  });
}

export function useVehicle(id: number) {
  return useQuery<VehicleWithComments | null>({
    queryKey: [API_PATHS.vehicles.get, id],
    queryFn: async () => {
      const url = buildUrl(API_PATHS.vehicles.get, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch vehicle");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useCreateVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateVehicleRequest) => {
      const res = await fetch(API_PATHS.vehicles.create, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 400) {
          const error = await res.json();
          throw new Error(error.message || "Validation failed");
        }
        throw new Error("Failed to create vehicle");
      }
      return res.json() as Promise<Vehicle>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_PATHS.vehicles.list] });
    },
  });
}

export function useUpdateVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number, data: { readyForCollection?: boolean } }) => {
      const url = buildUrl(API_PATHS.vehicles.update, { id });
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
      queryClient.invalidateQueries({ queryKey: [API_PATHS.vehicles.list] });
      queryClient.invalidateQueries({ queryKey: [API_PATHS.vehicles.get, variables.id] });
    },
  });
}

export function useDeleteVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(API_PATHS.vehicles.delete, { id });
      const res = await fetch(url, { 
        method: 'DELETE',
        credentials: "include" 
      });
      if (!res.ok && res.status !== 404) throw new Error("Failed to delete vehicle");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_PATHS.vehicles.list] });
    },
  });
}

export function useCreateComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ vehicleId, content, userInitials }: { vehicleId: number, content: string, userInitials?: string }) => {
      const url = buildUrl(API_PATHS.vehicles.createComment, { id: vehicleId });
      const res = await fetch(url, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, userInitials }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to add comment");
      return res.json() as Promise<Comment>;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [API_PATHS.vehicles.get, variables.vehicleId] });
    },
  });
}
