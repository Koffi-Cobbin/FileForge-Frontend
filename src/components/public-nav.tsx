import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";

interface PublicNavProps {
  /** Extra content to show after the Badge (e.g., section label) */
  extra?: React.ReactNode;
}

export function PublicNav({ extra }: PublicNavProps) {
  const [location] = useLocation();
  const { profile } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={profile ? "/dashboard" : "/"} className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
              FF
            </div>
            <span className="text-lg font-bold tracking-tight hidden sm:block">FileForge</span>
          </Link>
          {extra}
        </div>
        <nav className="flex items-center gap-2">
          <Link href="/providers">
            <Button variant="ghost" size="sm" className={location === "/providers" ? "text-foreground" : ""}>
              Providers
            </Button>
          </Link>
          <Link href="/docs">
            <Button variant="ghost" size="sm" className={location === "/docs" ? "text-foreground" : ""}>
              Docs
            </Button>
          </Link>
          {profile ? (
            <Link href="/dashboard">
              <Button size="sm">Dashboard</Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">Log in</Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Sign up</Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
