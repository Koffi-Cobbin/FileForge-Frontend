import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, setTokens, clearTokens } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { useLocation } from "wouter";
import { DeveloperProfile, TokenResponse } from "@/lib/types";

export function useAuth() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: (data: any) => apiFetch<TokenResponse>("/auth/token/", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    onSuccess: (data) => {
      setTokens(data.access, data.refresh);
      queryClient.setQueryData(queryKeys.auth.me, {
        email: data.email,
        full_name: data.full_name,
      });
      setLocation("/");
    },
  });

  const registerMutation = useMutation({
    mutationFn: (data: any) => apiFetch<DeveloperProfile>("/auth/register/", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  });

  const logout = () => {
    clearTokens();
    queryClient.clear();
    setLocation("/login");
  };

  const { data: profile, isLoading } = useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: () => apiFetch<DeveloperProfile>("/auth/me/"),
    retry: false,
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => apiFetch<DeveloperProfile>("/auth/me/", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.auth.me, data);
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: any) => apiFetch<{ detail: string }>("/auth/me/change-password/", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  });

  return {
    login: loginMutation,
    register: registerMutation,
    updateProfile: updateProfileMutation,
    changePassword: changePasswordMutation,
    logout,
    profile,
    isLoading,
  };
}
