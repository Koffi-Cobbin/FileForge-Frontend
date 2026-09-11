import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

const PUBLIC_ROUTES = ["/docs", "/providers"];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { profile, isLoading } = useAuth();

  const isPublicRoute = PUBLIC_ROUTES.some(route => location.startsWith(route));

  useEffect(() => {
    if (!isLoading && !profile && !isPublicRoute) {
      setLocation("/login");
    }
  }, [isLoading, profile, setLocation, isPublicRoute]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!profile && !isPublicRoute) return null;

  return <>{children}</>;
}

export function PublicGuard({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const { profile, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && profile) {
      setLocation("/dashboard");
    }
  }, [isLoading, profile, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (profile) return null;

  return <>{children}</>;
}

