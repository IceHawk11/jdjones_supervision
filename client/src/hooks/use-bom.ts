import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertBomItem, type InsertBomRelationship } from "@shared/routes";

export function useBomItems() {
  return useQuery({
    queryKey: [api.bom.items.list.path],
    queryFn: async () => {
      const res = await fetch(api.bom.items.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch BOM items");
      return api.bom.items.list.responses[200].parse(await res.json());
    },
  });
}

export function useBomRelationships() {
  return useQuery({
    queryKey: [api.bom.relationships.list.path],
    queryFn: async () => {
      const res = await fetch(api.bom.relationships.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch BOM relationships");
      return api.bom.relationships.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateBomItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertBomItem) => {
      const validated = api.bom.items.create.input.parse(data);
      const res = await fetch(api.bom.items.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to create BOM item");
      return api.bom.items.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.bom.items.list.path] });
    },
  });
}

export function useCreateBomRelationship() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertBomRelationship) => {
      const validated = api.bom.relationships.create.input.parse(data);
      const res = await fetch(api.bom.relationships.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to create relationship");
      return api.bom.relationships.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.bom.relationships.list.path] });
    },
  });
}

export function useCalculateMaterials() {
  return useMutation({
    mutationFn: async (data: { productCode: string; quantity: number }) => {
      const res = await fetch(api.bom.calculate.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to calculate materials");
      return api.bom.calculate.responses[200].parse(await res.json());
    },
  });
}
