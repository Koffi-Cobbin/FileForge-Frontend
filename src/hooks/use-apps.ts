import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { App, ApiKey, ApiKeyCreated, AppProvider } from "@/lib/types";

export function useApps() {
  const queryClient = useQueryClient();

  const appsQuery = useQuery({
    queryKey: queryKeys.apps.all,
    queryFn: () => apiFetch<App[]>("/auth/apps/"),
  });

  const createApp = useMutation({
    mutationFn: (data: Partial<App>) => apiFetch<App>("/auth/apps/", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.apps.all });
    },
  });

  return {
    apps: appsQuery.data,
    isLoading: appsQuery.isLoading,
    createApp,
  };
}

export function useAppDetail(appId: string | number) {
  const queryClient = useQueryClient();

  const appQuery = useQuery({
    queryKey: queryKeys.apps.detail(appId),
    queryFn: () => apiFetch<App>(`/auth/apps/${appId}/`),
    enabled: !!appId,
  });

  const keysQuery = useQuery({
    queryKey: queryKeys.apps.keys(appId),
    queryFn: () => apiFetch<ApiKey[]>(`/auth/apps/${appId}/keys/`),
    enabled: !!appId,
  });

  const providersQuery = useQuery({
    queryKey: queryKeys.apps.providers(appId),
    queryFn: () => apiFetch<AppProvider[]>(`/auth/apps/${appId}/providers/`),
    enabled: !!appId,
  });

  const updateApp = useMutation({
    mutationFn: (data: Partial<App>) => apiFetch<App>(`/auth/apps/${appId}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.apps.detail(appId), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.apps.all });
    },
  });

  const deleteApp = useMutation({
    mutationFn: () => apiFetch(`/auth/apps/${appId}/`, {
      method: "DELETE",
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.apps.all });
    },
  });

  const createKey = useMutation({
    mutationFn: (data: any) => apiFetch<ApiKeyCreated>(`/auth/apps/${appId}/keys/`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.apps.keys(appId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.apps.detail(appId) });
    },
  });

  const revokeKey = useMutation({
    mutationFn: (keyId: number) => apiFetch<{ detail: string }>(`/auth/apps/${appId}/keys/${keyId}/revoke/`, {
      method: "POST",
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.apps.keys(appId) });
    },
  });

  return {
    app: appQuery.data,
    isLoadingApp: appQuery.isLoading,
    keys: keysQuery.data,
    isLoadingKeys: keysQuery.isLoading,
    providers: providersQuery.data,
    isLoadingProviders: providersQuery.isLoading,
    updateApp,
    deleteApp,
    createKey,
    revokeKey,
  };
}
