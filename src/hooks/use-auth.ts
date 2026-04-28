import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { apiFetch, setTokens, clearTokens, getAccessToken } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { useLocation } from "wouter";
import { DeveloperProfile, TokenResponse } from "@/lib/types";

interface LoginInput {
  email: string;
  password: string;
}

interface RegisterInput {
  email: string;
  full_name: string;
  password: string;
  password_confirm: string;
}

interface UpdateProfileInput {
  full_name: string;
}

interface ChangePasswordInput {
  current_password: string;
  new_password: string;
}

export function useAuth() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  // Listen for unauthorized events
  useEffect(() => {
    const handleUnauthorized = () => {
      clearTokens();
      queryClient.clear();
      setLocation("/login");
    };

    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", handleUnauthorized);
  }, [queryClient, setLocation]);

  const loginMutation = useMutation({
    mutationFn: (data: LoginInput) =>
      apiFetch<TokenResponse>("/auth/token/", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (data) => {
      setTokens(data.access, data.refresh);
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
      setLocation("/");
    },
  });

  const registerMutation = useMutation({
    mutationFn: (data: RegisterInput) =>
      apiFetch<TokenResponse>("/auth/register/", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (data) => {
      // If the backend returns tokens (some do), use them directly
      if (data.access && data.refresh) {
        setTokens(data.access, data.refresh);
        queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
      }
    },
  });

  const logout = () => {
    clearTokens();
    queryClient.clear();
    setLocation("/login");
  };

  const { data: profile, isLoading } = useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: () => apiFetch<DeveloperProfile>("/auth/me/"),
    enabled: !!getAccessToken(), // Only fetch if we have a token
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: UpdateProfileInput) =>
      apiFetch<DeveloperProfile>("/auth/me/", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.auth.me, data);
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: ChangePasswordInput) =>
      apiFetch<{ detail: string }>("/auth/me/change-password/", {
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

