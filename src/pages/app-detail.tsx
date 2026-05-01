import { useRoute } from "wouter";
import { Link } from "wouter";
import { useAppDetail } from "@/hooks/use-apps";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Copy, Check, Plus, Settings, Key, AlertTriangle, Clock, Cloud, HardDrive, Database } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { format, formatDistanceToNow, addDays } from "date-fns";
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, 
  DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { ApiKey, ApiKeyCreated, AppProvider } from "@/lib/types";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { LucideIcon } from "lucide-react";

interface ProviderMeta {
  name: string;
  icon: LucideIcon;
  iconColor: string;
}

const PROVIDER_META: Record<string, ProviderMeta> = {
  cloudinary: { name: "Cloudinary", icon: Cloud, iconColor: "text-blue-500" },
  google_drive: { name: "Google Drive", icon: HardDrive, iconColor: "text-green-500" },
};

const keySchema = z.object({
  name: z.string().min(2, "Name is required"),
  expires_in_days: z.string().optional(),
});

type KeyFormValues = z.infer<typeof keySchema>;

export default function AppDetail() {
  const [, params] = useRoute("/apps/:id");
  const appId = params?.id || "";
  const { app, isLoadingApp, keys, isLoadingKeys, providers, isLoadingProviders, createKey, revokeKey } = useAppDetail(appId);
  
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newKeyData, setNewKeyData] = useState<ApiKeyCreated | null>(null);

  const form = useForm<KeyFormValues>({
    resolver: zodResolver(keySchema),
    defaultValues: { name: "", expires_in_days: "never" },
  });

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleCreateKey = (data: KeyFormValues) => {
    const payload: any = { name: data.name };
    
    if (data.expires_in_days && data.expires_in_days !== "never") {
      const days = parseInt(data.expires_in_days, 10);
      if (!isNaN(days)) {
        payload.expires_at = addDays(new Date(), days).toISOString();
      }
    }

    createKey.mutate(payload, {
      onSuccess: (newKey) => {
        setIsCreateOpen(false);
        setNewKeyData(newKey);
        form.reset();
      },
      onError: () => {
        toast.error("Failed to create key");
      }
    });
  };

  const handleRevoke = (keyId: number) => {
    revokeKey.mutate(keyId, {
      onSuccess: () => {
        toast.success("Key revoked successfully");
      },
      onError: () => {
        toast.error("Failed to revoke key");
      }
    });
  };

  const getKeyStatus = (key: ApiKey) => {
    if (!key.is_active) return { label: "Revoked", variant: "destructive" as const };
    if (key.expires_at) {
      const expiresDate = new Date(key.expires_at);
      const now = new Date();
      if (expiresDate < now) return { label: "Expired", variant: "secondary" as const };
      
      const daysUntilExpiry = (expiresDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      if (daysUntilExpiry <= 7) return { label: "Expiring soon", variant: "default" as const, className: "bg-orange-500 hover:bg-orange-600" };
    }
    return { label: "Active", variant: "outline" as const, className: "border-green-500/50 text-green-600 dark:text-green-400" };
  };

  if (isLoadingApp) {
    return <div className="space-y-6"><Skeleton className="h-32 w-full" /><Skeleton className="h-64 w-full" /></div>;
  }

  if (!app) {
    return <div className="text-center py-10">App not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Link href="/apps">
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{app.name}</h1>
              <Badge variant={app.is_active ? "default" : "secondary"}>
                {app.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">{app.description || "No description"}</p>
          </div>
        </div>
        <Link href={`/apps/${app.id}/settings`}>
          <Button variant="outline">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </Link>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>API Keys</CardTitle>
                <CardDescription>Manage credentials for this application</CardDescription>
              </div>
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button disabled={!app.is_active} size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Key
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create API Key</DialogTitle>
                    <DialogDescription>
                      Generate a new API key to authenticate requests.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={form.handleSubmit(handleCreateKey)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="keyName">Key Name</Label>
                      <Input id="keyName" placeholder="e.g. Production Worker" {...form.register("name")} />
                      {form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expires">Expiration</Label>
                      <Select 
                        onValueChange={(val: string) => form.setValue("expires_in_days", val)} 
                        value={form.watch("expires_in_days")}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select expiration" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="never">Never expire (Not recommended)</SelectItem>
                          <SelectItem value="30">30 days</SelectItem>
                          <SelectItem value="90">90 days</SelectItem>
                          <SelectItem value="365">1 year</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                      <Button type="submit" disabled={createKey.isPending}>
                        {createKey.isPending ? "Generating..." : "Generate Key"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {!app.is_active && (
                <div className="mb-6 p-4 border border-destructive/20 bg-destructive/10 text-destructive rounded-md flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-sm">App is disabled</h4>
                    <p className="text-sm mt-1 opacity-90">This app is currently inactive. API requests using its keys will be rejected. You cannot create new keys.</p>
                  </div>
                </div>
              )}

              {isLoadingKeys ? (
                <div className="space-y-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : keys && keys.length > 0 ? (
                <div className="border rounded-md divide-y">
                  {keys.map((key) => {
                    const status = getKeyStatus(key);
                    return (
                      <div key={key.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{key.name}</span>
                            <Badge variant={status.variant} className={status.className}>{status.label}</Badge>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground font-mono">
                            <Key className="h-3 w-3" />
                            {key.key_prefix}...
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right text-sm text-muted-foreground hidden sm:block">
                            <div className="flex items-center justify-end gap-1">
                              <Clock className="h-3 w-3" />
                              {key.last_used_at ? `Used ${formatDistanceToNow(new Date(key.last_used_at))} ago` : "Never used"}
                            </div>
                            <div className="text-xs opacity-70 mt-1">
                              Created {format(new Date(key.created_at), "MMM d")}
                            </div>
                          </div>
                          {key.is_active && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">Revoke</Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Revoke API Key</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to revoke the key "{key.name}"? Any requests using this key will immediately fail. This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleRevoke(key.id)} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                                    Revoke Key
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10 border border-dashed rounded-md bg-muted/20">
                  <Key className="mx-auto h-8 w-8 text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">No API keys generated yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">App Credentials</CardTitle>
              <CardDescription>Your unique identifier</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label className="text-xs uppercase text-muted-foreground font-semibold">Owner Slug</Label>
                <div className="flex relative group">
                  <div className="w-full bg-background border rounded-md px-3 py-2 font-mono text-sm overflow-x-auto whitespace-nowrap scrollbar-hide">
                    {app.owner_slug}
                  </div>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="absolute right-1 top-1 bottom-1 h-auto bg-background/80 hover:bg-muted"
                    onClick={() => copyToClipboard(app.owner_slug, "slug")}
                  >
                    {copiedText === "slug" ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  This public identifier routes uploads to this specific application.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Registered Providers</CardTitle>
              <CardDescription>Storage backends linked to this app</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingProviders ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : providers && providers.length > 0 ? (
                <div className="space-y-2">
                  {providers.map((p: AppProvider) => {
                    const meta = PROVIDER_META[p.provider] ?? {
                      name: p.provider,
                      icon: Database,
                      iconColor: "text-muted-foreground",
                    };
                    const Icon = meta.icon;
                    return (
                      <div
                        key={p.id}
                        className="flex items-center justify-between gap-3 rounded-md border px-3 py-2.5 bg-muted/20"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-md bg-muted flex items-center justify-center shrink-0">
                            <Icon className={`h-4 w-4 ${meta.iconColor}`} />
                          </div>
                          <span className="text-sm font-medium">{meta.name}</span>
                        </div>
                        {p.is_default && (
                          <Badge variant="secondary" className="text-xs shrink-0">Default</Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6 border border-dashed rounded-md bg-muted/20">
                  <Database className="mx-auto h-6 w-6 text-muted-foreground/40 mb-2" />
                  <p className="text-xs text-muted-foreground">No providers configured yet.</p>
                  <Link href="/providers">
                    <Button variant="link" className="px-0 h-auto text-xs mt-1">View available providers &rarr;</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick Start</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">Request a secure upload URL from your backend:</p>
              <div className="bg-muted rounded-md p-3 font-mono text-xs overflow-x-auto">
                <div className="text-primary-foreground/50 mb-1"># POST /api/files/</div>
                <div><span className="text-primary">curl</span> -X POST https://api.fileforge.com/api/files/ \</div>
                <div>  -H <span className="text-green-600 dark:text-green-400">"Authorization: Bearer ffk_YOUR_KEY"</span> \</div>
                <div>  -H <span className="text-green-600 dark:text-green-400">"X-FileForge-App: {app.owner_slug}"</span> \</div>
                <div>  -H <span className="text-green-600 dark:text-green-400">"Content-Type: application/json"</span> \</div>
                <div>  -d <span className="text-orange-600 dark:text-orange-400">{`'{"filename":"avatar.jpg","size":1024}'`}</span></div>
              </div>
              <Link href="/docs">
                <Button variant="link" className="px-0 mt-2 h-auto text-xs">View full documentation &rarr;</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ONE-TIME REVEAL MODAL */}
      <Dialog 
        open={!!newKeyData} 
        onOpenChange={(open) => {
          if (!open) {
            // Cannot close by clicking outside or escape, must explicitly click the close button
          }
        }}
      >
        <DialogContent 
          className="sm:max-w-md"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          hideCloseButton
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Save your new API Key
            </DialogTitle>
            <DialogDescription className="text-foreground font-medium pt-2">
              This key will not be shown again. Save it now.
            </DialogDescription>
          </DialogHeader>
          
          <div className="my-4 relative">
            <div className="bg-muted border rounded-md p-4 font-mono text-base break-all">
              {newKeyData?.raw_key}
            </div>
            <Button 
              size="sm" 
              className="absolute top-2 right-2"
              variant={copiedText === "raw_key" ? "secondary" : "default"}
              onClick={() => {
                if (newKeyData) {
                  copyToClipboard(newKeyData.raw_key, "raw_key");
                  toast.success("Copied to clipboard");
                }
              }}
            >
              {copiedText === "raw_key" ? <Check className="mr-2 h-4 w-4 text-green-500" /> : <Copy className="mr-2 h-4 w-4" />}
              {copiedText === "raw_key" ? "Copied!" : "Copy"}
            </Button>
          </div>

          <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md border border-dashed">
            Make sure to copy your API key now. You won't be able to see it again!
          </div>

          <DialogFooter className="mt-6">
            <Button onClick={() => setNewKeyData(null)} className="w-full">
              I've saved my key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
