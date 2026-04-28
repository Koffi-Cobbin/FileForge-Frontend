import { useApps } from "@/hooks/use-apps";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Copy, Check, Box } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { format } from "date-fns";

export default function AppsList() {
  const { apps, isLoading } = useApps();
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  const copyToClipboard = (e: React.MouseEvent, text: string) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedSlug(text);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Apps</h1>
          <p className="text-muted-foreground">Manage your FileForge applications and API keys</p>
        </div>
        <Link href="/apps/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New App
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full" />)}
        </div>
      ) : apps && apps.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {apps.map(app => (
            <Link key={app.id} href={`/apps/${app.id}`}>
              <a className="block group">
                <Card className="h-full transition-colors hover:border-primary/50">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">
                        {app.name}
                      </CardTitle>
                      <Badge variant={app.is_active ? "default" : "secondary"}>
                        {app.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-2 min-h-[2.5rem]">
                      {app.description || "No description"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Owner Slug</div>
                        <div 
                          className="flex items-center justify-between bg-muted/50 rounded px-2 py-1 border font-mono text-sm group/copy hover:bg-muted transition-colors cursor-pointer"
                          onClick={(e) => copyToClipboard(e, app.owner_slug)}
                        >
                          <span className="truncate mr-2">{app.owner_slug}</span>
                          {copiedSlug === app.owner_slug ? (
                            <Check className="h-3 w-3 text-green-500 shrink-0" />
                          ) : (
                            <Copy className="h-3 w-3 text-muted-foreground opacity-0 group-hover/copy:opacity-100 transition-opacity shrink-0" />
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div>{app.api_key_count} API Key{app.api_key_count !== 1 ? 's' : ''}</div>
                        <div>Created {format(new Date(app.created_at), "MMM d, yyyy")}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </a>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 border border-dashed rounded-lg bg-card">
          <Box className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium">No apps found</h3>
          <p className="text-muted-foreground mt-2 mb-6 max-w-sm mx-auto">
            Applications are logical containers for your API keys. Create one to start integrating FileForge.
          </p>
          <Link href="/apps/new">
            <Button>Create your first app</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
