import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import { useEffect } from "react";
import { format } from "date-fns";

const profileSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
});

const passwordSchema = z.object({
  current_password: z.string().min(1, "Current password is required"),
  new_password: z.string().min(8, "New password must be at least 8 characters"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function Profile() {
  const { profile, updateProfile, changePassword } = useAuth();
  
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { full_name: "" },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { current_password: "", new_password: "" },
  });

  useEffect(() => {
    if (profile) {
      profileForm.reset({ full_name: profile.full_name });
    }
  }, [profile, profileForm]);

  const onProfileSubmit = (data: ProfileFormValues) => {
    updateProfile.mutate(data, {
      onSuccess: () => {
        toast.success("Profile updated");
      },
      onError: (error) => {
        if (error instanceof ApiError && error.data) {
          Object.entries(error.data).forEach(([key, msgs]) => {
            if (Array.isArray(msgs)) profileForm.setError(key as any, { message: msgs[0] });
          });
        } else {
          toast.error("Failed to update profile");
        }
      }
    });
  };

  const onPasswordSubmit = (data: PasswordFormValues) => {
    changePassword.mutate(data, {
      onSuccess: () => {
        toast.success("Password changed successfully");
        passwordForm.reset();
      },
      onError: (error) => {
        if (error instanceof ApiError) {
          if (error.data?.detail) toast.error(error.data.detail);
          else {
            Object.entries(error.data).forEach(([key, msgs]) => {
              if (Array.isArray(msgs)) passwordForm.setError(key as any, { message: msgs[0] });
            });
          }
        } else {
          toast.error("Failed to change password");
        }
      }
    });
  };

  if (!profile) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">Manage your developer account</p>
      </div>

      <Card>
        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)}>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={profile.email} disabled className="bg-muted opacity-60" />
              <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input id="full_name" {...profileForm.register("full_name")} />
              {profileForm.formState.errors.full_name && (
                <p className="text-sm text-destructive">{profileForm.formState.errors.full_name.message}</p>
              )}
            </div>
            <div className="text-sm text-muted-foreground mt-4">
              Member since {format(new Date(profile.date_joined), "MMMM d, yyyy")}
            </div>
          </CardContent>
          <CardFooter className="flex justify-end border-t pt-4 bg-muted/20">
            <Button type="submit" disabled={!profileForm.formState.isDirty || updateProfile.isPending}>
              {updateProfile.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card>
        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>Update your account password</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current_password">Current Password</Label>
              <Input id="current_password" type="password" {...passwordForm.register("current_password")} />
              {passwordForm.formState.errors.current_password && (
                <p className="text-sm text-destructive">{passwordForm.formState.errors.current_password.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="new_password">New Password</Label>
              <Input id="new_password" type="password" {...passwordForm.register("new_password")} />
              {passwordForm.formState.errors.new_password && (
                <p className="text-sm text-destructive">{passwordForm.formState.errors.new_password.message}</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-end border-t pt-4 bg-muted/20">
            <Button type="submit" disabled={changePassword.isPending}>
              {changePassword.isPending ? "Updating..." : "Update Password"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
