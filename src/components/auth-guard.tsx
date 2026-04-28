import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { getAccessToken } from "@/lib/api";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      const token = getAccessToken();
      if (!token) {
        setLocation("/login");
      } else {
        setIsAuthenticated(true);
      }
    };

    checkAuth();

    const handleUnauthorized = () => {
      setLocation("/login");
    };

    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () => {
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
    };
  }, [setLocation]);

  if (!isAuthenticated) return null;

  return <>{children}</>;
}

export function PublicGuard({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const [isPublic, setIsPublic] = useState<boolean | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      setLocation("/");
    } else {
      setIsPublic(true);
    }
  }, [setLocation]);

  if (!isPublic) return null;

  return <>{children}</>;
}
