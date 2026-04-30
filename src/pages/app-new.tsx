import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link, useLocation } from "wouter";
import { useApps } from "@/hooks/use-apps";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import { ArrowLeft } from "lucide-react";

const appSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50),
  description: z.string().min(0).max(200),
});

type AppFormValues = z.infer<typeof appSchema>;

export default function AppNew() {
  const [, setLocation] = useLocation();
  const { createApp } = useApps();
  
  const form = useForm({
    resolver: zodResolver(appSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const onSubmit: SubmitHandler<AppFormValues> = (data) => {
    createApp.mutate(data, {
      onSuccess: (newApp) => {
        toast.success("App created successfully");
        setLocation(`/apps/${newApp.id}`);
      },
      onError: (error) => {
        if (error instanceof ApiError) {
          if (error.data?.detail) {
            toast.error(error.data.detail);
          } else {
            Object.entries(error.data).forEach(([key, messages]) => {
              if (Array.isArray(messages)) {
                form.setError(key as keyof AppFormValues, { message: messages[0] });
              }
            });
          }
        } else {
          toast.error("Failed to create app");
        }
      },
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/apps">
          <Button variant="ghost" size="icon" className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create App</h1>
          <p className="text-muted-foreground">Register a new application to generate API keys</p>
        </div>
      </div>

      <Card>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>Application Details</CardTitle>
            <CardDescription>
              The name helps you identify the app. The owner slug will be automatically generated from your profile.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">App Name</Label>
              <Input
                id="name"
                placeholder="e.g. Production Backend"
                {...form.register("name")}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description <span className="text-muted-foreground font-normal">(Optional)</span></Label>
              <Textarea
                id="description"
                placeholder="What is this app used for?"
                className="resize-none"
                {...form.register("description")}
              />
              {form.formState.errors.description && (
                <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2 border-t pt-4 bg-muted/20">
            <Link href="/apps">
              <Button type="button" variant="outline">Cancel</Button>
            </Link>
            <Button type="submit" disabled={createApp.isPending}>
              {createApp.isPending ? "Creating..." : "Create App"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
