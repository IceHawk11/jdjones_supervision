import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertProductionEntry } from "@shared/routes";
import { z } from "zod";

export function useProduction() {
  return useQuery({
    queryKey: [api.production.list.path],
    queryFn: async () => {
      const res = await fetch(api.production.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch production entries");
      return api.production.list.responses[200].parse(await res.json());
    },
  });
}

export function useProductionStats() {
  return useQuery({
    queryKey: [api.production.stats.path],
    queryFn: async () => {
      const res = await fetch(api.production.stats.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch production stats");
      return api.production.stats.responses[200].parse(await res.json());
    },
    refetchInterval: 30000, // Refresh stats every 30s
  });
}

export function useCreateProductionEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertProductionEntry) => {
      // Validate with schema first
      const validated = api.production.create.input.parse(data);
      
      const res = await fetch(api.production.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = await res.json();
          throw new Error(error.message || "Validation failed");
        }
        throw new Error("Failed to create production entry");
      }
      return api.production.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.production.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.production.stats.path] });
    },
  });
}

export function useDeleteProductionEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.production.delete.path, { id });
      const res = await fetch(url, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete entry");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.production.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.production.stats.path] });
    },
  });
}
