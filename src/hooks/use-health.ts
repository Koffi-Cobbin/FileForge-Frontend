import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { HealthStatus } from "@/lib/types";

export function useHealth() {
  return useQuery({
    queryKey: queryKeys.health,
    queryFn: () => apiFetch<HealthStatus>("/api/health/"),
    refetchInterval: 30000, // Ping every 30s
  });
}
