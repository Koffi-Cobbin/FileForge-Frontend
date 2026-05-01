import { useRoute, useLocation, Link } from "wouter";
import { useAppDetail } from "@/hooks/use-apps";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, AlertTriangle, Cloud, HardDrive, Database, Plus, Trash2, Pencil, Star } from "lucide-react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import type { LucideIcon } from "lucide-react";
import type { AppProvider } from "@/lib/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ── Static provider metadata ─────────────────────────────────────────────────

interface ProviderMeta {
  name: string;
  icon: LucideIcon;
  iconColor: string;
}

const PROVIDER_META: Record<string, ProviderMeta> = {
  cloudinary:   { name: "Cloudinary",   icon: Cloud,      iconColor: "text-blue-500"  },
  google_drive: { name: "Google Drive", icon: HardDrive,  iconColor: "text-green-500" },
};

interface CredentialField {
  field: string;
  label: string;
  placeholder: string;
  required: boolean;
  isSecret?: boolean;
}

const PROVIDER_FIELDS: Record<string, CredentialField[]> = {
  cloudinary: [
    { field: "cloud_name",  label: "Cloud Name",  placeholder: "my-cloud",    required: true  },
    { field: "api_key",     label: "API Key",      placeholder: "123456789",   required: true, isSecret: true },
    { field: "api_secret",  label: "API Secret",   placeholder: "my-secret",   required: true, isSecret: true },
  ],
  google_drive: [
    { field: "oauth2_client_id",      label: "OAuth2 Client ID",      placeholder: "client-id.apps.googleusercontent.com", required: true  },
    { field: "oauth2_client_secret",  label: "OAuth2 Client Secret",  placeholder: "client-secret",                        required: true, isSecret: true },
    { field: "oauth2_refresh_token",  label: "OAuth2 Refresh Token",  placeholder: "refresh-token",                        required: true, isSecret: true },
    { field: "folder_id",             label: "Folder ID",             placeholder: "Abc123 (optional)",                    required: false },
  ],
};

const AVAILABLE_PROVIDERS = Object.keys(PROVIDER_FIELDS);

// ── Settings form ─────────────────────────────────────────────────────────────

const settingsSchema = z.object({
  name:        z.string().min(2, "Name must be at least 2 characters").max(50),
  description: z.string().min(0).max(200),
  is_active:   z.boolean(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

// ── Provider credential dialog ────────────────────────────────────────────────

interface ProviderDialogProps {
  open: boolean;
  onClose: () => void;
  existing: AppProvider | null;
  configuredProviders: string[];
  onSave: (provider: string, credentials: Record<string, string>, isDefault: boolean, isExisting: boolean) => void;
  isPending: boolean;
}

function ProviderDialog({ open, onClose, existing, configuredProviders, onSave, isPending }: ProviderDialogProps) {
  const isEditing = !!existing;
  const [selectedProvider, setSelectedProvider] = useState(existing?.provider ?? "");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [isDefault, setIsDefault] = useState(existing?.is_default ?? false);

  useEffect(() => {
    if (open) {
      setSelectedProvider(existing?.provider ?? "");
      setIsDefault(existing?.is_default ?? false);
      setFields(existing?.credentials ? { ...existing.credentials } : {});
    }
  }, [open, existing]);

  const providerFields = PROVIDER_FIELDS[selectedProvider] ?? [];

  const handleSubmit = () => {
    const credentials: Record<string, string> = {};
    for (const f of providerFields) {
      const value = fields[f.field] ?? "";
      if (isEditing) {
        if (value && value !== "***") {
          credentials[f.field] = value;
        }
      } else {
        if (f.required && !value) {
          toast.error(`${f.label} is required`);
          return;
        }
        if (value) credentials[f.field] = value;
      }
    }
    onSave(selectedProvider, credentials, isDefault, isEditing);
  };

  const availableToAdd = AVAILABLE_PROVIDERS.filter(
    (p) => !configuredProviders.includes(p) || p === existing?.provider
  );

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? `Edit ${PROVIDER_META[selectedProvider]?.name ?? selectedProvider}` : "Add Provider"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update credentials. Leave a field blank to keep its current value."
              : "Configure credentials for a storage backend."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {!isEditing && (
            <div className="space-y-2">
              <Label>Provider</Label>
              <Select value={selectedProvider} onValueChange={(v) => { setSelectedProvider(v); setFields({}); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a provider" />
                </SelectTrigger>
                <SelectContent>
                  {availableToAdd.map((p) => {
                    const meta = PROVIDER_META[p] ?? { name: p };
                    return <SelectItem key={p} value={p}>{meta.name}</SelectItem>;
                  })}
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedProvider && providerFields.map((f) => (
            <div key={f.field} className="space-y-1.5">
              <Label htmlFor={f.field}>
                {f.label}
                {f.required && <span className="text-destructive ml-0.5">*</span>}
              </Label>
              <Input
                id={f.field}
                type={f.isSecret ? "password" : "text"}
                placeholder={isEditing ? "Leave blank to keep current value" : f.placeholder}
                value={fields[f.field] ?? ""}
                onChange={(e) => setFields((prev) => ({ ...prev, [f.field]: e.target.value }))}
                autoComplete="off"
              />
            </div>
          ))}

          {selectedProvider && (
            <div className="flex items-center justify-between rounded-md border px-4 py-3">
              <div className="space-y-0.5">
                <Label htmlFor="is_default" className="flex items-center gap-1.5 cursor-pointer">
                  <Star className="h-3.5 w-3.5 text-amber-500" />
                  Set as default provider
                </Label>
                <p className="text-xs text-muted-foreground">Used when no provider is specified in an upload request.</p>
              </div>
              <Switch
                id="is_default"
                checked={isDefault}
                onCheckedChange={setIsDefault}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isPending || !selectedProvider}>
            {isPending ? "Saving…" : isEditing ? "Save Changes" : "Add Provider"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function AppSettings() {
  const [, params] = useRoute("/apps/:id/settings");
  const [, setLocation] = useLocation();
  const appId = params?.id || "";
  const { app, isLoadingApp, providers, isLoadingProviders, updateApp, deleteApp, upsertProvider, deleteProvider } = useAppDetail(appId);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [providerDialogOpen, setProviderDialogOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<AppProvider | null>(null);

  const form = useForm({
    resolver: zodResolver(settingsSchema),
    defaultValues: { name: "", description: "", is_active: true },
  });

  useEffect(() => {
    if (app) {
      form.reset({
        name: app.name,
        description: app.description || "",
        is_active: app.is_active,
      });
    }
  }, [app, form]);

  const onSubmit = (data: Record<string, string | boolean>) => {
    updateApp.mutate(data as SettingsFormValues, {
      onSuccess: () => { toast.success("Settings updated"); },
      onError: (error) => {
        if (error instanceof ApiError) {
          if (error.data?.detail) {
            toast.error(error.data.detail);
          } else {
            Object.entries(error.data).forEach(([key, messages]) => {
              if (Array.isArray(messages)) {
                form.setError(key as keyof SettingsFormValues, { message: messages[0] });
              }
            });
          }
        } else {
          toast.error("Failed to update settings");
        }
      },
    });
  };

  const handleDelete = () => {
    deleteApp.mutate(undefined, {
      onSuccess: () => { toast.success("App deleted"); setLocation("/apps"); },
      onError: () => { toast.error("Failed to delete app"); },
    });
  };

  const handleSaveProvider = (
    provider: string,
    credentials: Record<string, string>,
    isDefault: boolean,
    isExisting: boolean
  ) => {
    upsertProvider.mutate(
      { provider, data: { provider, credentials, is_default: isDefault }, isExisting },
      {
        onSuccess: () => {
          toast.success(isExisting ? "Provider updated" : "Provider added");
          setProviderDialogOpen(false);
          setEditingProvider(null);
        },
        onError: () => { toast.error("Failed to save provider credentials"); },
      }
    );
  };

  const handleDeleteProvider = (providerId: string) => {
    deleteProvider.mutate(providerId, {
      onSuccess: () => { toast.success("Provider removed"); },
      onError: () => { toast.error("Failed to remove provider"); },
    });
  };

  const openAddDialog = () => {
    setEditingProvider(null);
    setProviderDialogOpen(true);
  };

  const openEditDialog = (p: AppProvider) => {
    setEditingProvider(p);
    setProviderDialogOpen(true);
  };

  if (isLoadingApp) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!app) return <div>App not found</div>;

  const configuredProviderIds = providers?.map((p) => p.provider) ?? [];
  const allProvidersConfigured = AVAILABLE_PROVIDERS.every((p) => configuredProviderIds.includes(p));

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/apps/${app.id}`}>
          <Button variant="ghost" size="icon" className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">{app.name}</p>
        </div>
      </div>

      {/* General Settings */}
      <Card>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>Update your application's basic information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">App Name</Label>
              <Input id="name" {...form.register("name")} />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" className="resize-none" {...form.register("description")} />
              {form.formState.errors.description && (
                <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>
              )}
            </div>
            <div className="flex items-center justify-between p-4 border rounded-md">
              <div className="space-y-0.5">
                <Label htmlFor="is_active" className="text-base">Active Status</Label>
                <p className="text-sm text-muted-foreground">
                  If disabled, all API requests for this app will be rejected.
                </p>
              </div>
              <Switch
                id="is_active"
                checked={form.watch("is_active")}
                onCheckedChange={(val) => form.setValue("is_active", val, { shouldDirty: true })}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end border-t pt-4 bg-muted/20">
            <Button type="submit" disabled={!form.formState.isDirty || updateApp.isPending}>
              {updateApp.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Provider Credentials */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Provider Credentials</CardTitle>
            <CardDescription>
              Storage backends this app can upload files to. Secrets are masked after saving.
            </CardDescription>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={openAddDialog}
            disabled={allProvidersConfigured}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add Provider
          </Button>
        </CardHeader>
        <CardContent>
          {isLoadingProviders ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : providers && providers.length > 0 ? (
            <div className="space-y-3">
              {providers.map((p) => {
                const meta = PROVIDER_META[p.provider] ?? { name: p.provider, icon: Database, iconColor: "text-muted-foreground" };
                const Icon = meta.icon;
                const credentialFields = PROVIDER_FIELDS[p.provider] ?? [];
                return (
                  <div key={p.provider} className="border rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between gap-3 px-4 py-3 bg-muted/20">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                          <Icon className={`h-4 w-4 ${meta.iconColor}`} />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{meta.name}</span>
                          {p.is_default && (
                            <Badge variant="secondary" className="text-xs gap-1">
                              <Star className="h-2.5 w-2.5 text-amber-500" />
                              Default
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => openEditDialog(p)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              disabled={deleteProvider.isPending}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove {meta.name}?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will delete the stored credentials. Any upload requests targeting this provider will fail until credentials are re-added.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteProvider(p.provider)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Remove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                    {credentialFields.length > 0 && (
                      <div className="divide-y divide-border/40">
                        {credentialFields.map((f) => (
                          <div key={f.field} className="flex items-center gap-3 px-4 py-2.5 text-xs">
                            <code className="font-mono bg-muted rounded px-1.5 py-0.5 shrink-0 text-muted-foreground">
                              {f.field}
                            </code>
                            <span className="font-mono text-muted-foreground truncate">
                              {p.credentials?.[f.field] ?? (f.required ? "—" : "not set")}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10 border border-dashed rounded-md bg-muted/20">
              <Database className="mx-auto h-8 w-8 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground text-sm">No providers configured yet.</p>
              <p className="text-xs text-muted-foreground mt-1">Add a provider to enable file uploads for this app.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50 bg-destructive/5">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Permanently delete this application and revoke all of its API keys.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm">
            Once you delete an app, there is no going back. Please be certain.
          </div>
        </CardContent>
        <CardFooter className="border-t border-destructive/20 pt-4 mt-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={deleteApp.isPending}>Delete Application</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the{" "}
                  <span className="font-bold text-foreground mx-1">{app.name}</span>
                  app and immediately revoke all associated API keys.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="my-4 space-y-2">
                <Label htmlFor="confirmName">
                  Please type <span className="font-mono font-bold bg-muted px-1 rounded">{app.name}</span> to confirm.
                </Label>
                <Input
                  id="confirmName"
                  value={deleteConfirmName}
                  onChange={(e) => setDeleteConfirmName(e.target.value)}
                  autoComplete="off"
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setDeleteConfirmName("")}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={deleteConfirmName !== app.name}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Confirm Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      </Card>

      {/* Provider credential dialog */}
      <ProviderDialog
        open={providerDialogOpen}
        onClose={() => { setProviderDialogOpen(false); setEditingProvider(null); }}
        existing={editingProvider}
        configuredProviders={configuredProviderIds}
        onSave={handleSaveProvider}
        isPending={upsertProvider.isPending}
      />
    </div>
  );
}
