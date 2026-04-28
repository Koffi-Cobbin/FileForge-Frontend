import { useHealth } from "@/hooks/use-health";
import { useApps } from "@/hooks/use-apps";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, Box, Key, Plus, Server } from "lucide-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function Dashboard() {
  const { data: health, isLoading: isLoadingHealth } = useHealth();
  const { apps, isLoading: isLoadingApps } = useApps();

  const activeApps = apps?.filter(a => a.is_active) || [];
  const totalKeys = apps?.reduce((acc, app) => acc + app.api_key_count, 0) || 0;
  
  const recentApps = apps ? [...apps].sort((a, b) => 
    new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  ).slice(0, 5) : [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your FileForge resources</p>
        </div>
        <Link href="/apps/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New App
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">System Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingHealth ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="flex items-center gap-2">
                <div className={`h-2.5 w-2.5 rounded-full ${health?.status === "ok" ? "bg-green-500" : "bg-destructive"}`} />
                <div className="text-2xl font-bold capitalize">{health?.status || "Unknown"}</div>
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {isLoadingHealth ? (
                <Skeleton className="h-5 w-32" />
              ) : health?.providers ? (
                Object.entries(health.providers).map(([provider, status]) => (
                  <Badge key={provider} variant="outline" className="text-xs bg-muted/50">
                    {provider}: {status}
                  </Badge>
                ))
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Apps</CardTitle>
            <Box className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingApps ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{activeApps.length}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Out of {apps?.length || 0} total apps</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">API Keys</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingApps ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{totalKeys}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Across all apps</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Apps</CardTitle>
          <CardDescription>Apps recently updated or created</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingApps ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : recentApps.length > 0 ? (
            <div className="divide-y border rounded-md">
              {recentApps.map((app) => (
                <div key={app.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                  <div>
                    <Link href={`/apps/${app.id}`}>
                      <a className="font-medium hover:underline">{app.name}</a>
                    </Link>
                    <div className="text-sm text-muted-foreground font-mono mt-1">{app.owner_slug}</div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <Badge variant={app.is_active ? "default" : "secondary"}>
                      {app.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <div className="text-muted-foreground hidden sm:block">
                      Updated {format(new Date(app.updated_at), "MMM d, yyyy")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed rounded-md bg-muted/20">
              <Box className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium">No apps yet</h3>
              <p className="text-muted-foreground mt-2 mb-4">Create your first app to start uploading files.</p>
              <Link href="/apps/new">
                <Button>Create App</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
