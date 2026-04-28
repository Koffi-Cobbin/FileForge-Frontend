import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const { profile, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !profile) {
      setLocation("/login");
    }
  }, [isLoading, profile, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!profile) return null;

  return <>{children}</>;
}

export function PublicGuard({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const { profile, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && profile) {
      setLocation("/");
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

