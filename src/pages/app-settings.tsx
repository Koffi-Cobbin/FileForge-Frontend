import { useRoute, useLocation, Link } from "wouter";
import { useAppDetail } from "@/hooks/use-apps";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";

const settingsSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50),
  description: z.string().max(200).optional().default(""),
  is_active: z.boolean(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function AppSettings() {
  const [, params] = useRoute("/apps/:id/settings");
  const [, setLocation] = useLocation();
  const appId = params?.id || "";
  const { app, isLoadingApp, updateApp, deleteApp } = useAppDetail(appId);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");

  const form = useForm<SettingsFormValues>({
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

  const onSubmit = (data: SettingsFormValues) => {
    updateApp.mutate(data, {
      onSuccess: () => {
        toast.success("Settings updated");
      },
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
      }
    });
  };

  const handleDelete = () => {
    deleteApp.mutate(undefined, {
      onSuccess: () => {
        toast.success("App deleted");
        setLocation("/apps");
      },
      onError: () => {
        toast.error("Failed to delete app");
      }
    });
  };

  if (isLoadingApp) {
    return <div className="space-y-6 max-w-2xl mx-auto"><Skeleton className="h-10 w-48" /><Skeleton className="h-64 w-full" /></div>;
  }

  if (!app) return <div>App not found</div>;

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
              {form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" className="resize-none" {...form.register("description")} />
              {form.formState.errors.description && <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>}
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
                  This action cannot be undone. This will permanently delete the 
                  <span className="font-bold text-foreground mx-1">{app.name}</span> 
                  app and immediately revoke all associated API keys.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="my-4 space-y-2">
                <Label htmlFor="confirmName">Please type <span className="font-mono font-bold bg-muted px-1 rounded">{app.name}</span> to confirm.</Label>
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
    </div>
  );
}
