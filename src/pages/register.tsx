import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";

const registerSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    full_name: z.string().min(2, "Name must be at least 2 characters"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    password_confirm: z.string(),
  })
  .refine((data) => data.password === data.password_confirm, {
    message: "Passwords do not match",
    path: ["password_confirm"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function Register() {
  const { register, login } = useAuth();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      full_name: "",
      password: "",
      password_confirm: "",
    },
  });

  const onSubmit = (data: RegisterFormValues) => {
    register.mutate(data, {
      onSuccess: () => {
        toast.success("Account created successfully! Logging you in...");
        // Auto-login after successful registration
        login.mutate(
          { email: data.email, password: data.password },
          {
            onError: (error) => {
              if (error instanceof ApiError) {
                toast.error(
                  error.data?.detail || "Account created but login failed. Please try logging in."
                );
              } else {
                toast.error("Account created but login failed. Please try logging in.");
              }
            },
          }
        );
      },
      onError: (error) => {
        if (error instanceof ApiError) {
          if (error.data?.detail) {
            toast.error(error.data.detail);
          } else {
            Object.entries(error.data).forEach(([key, messages]) => {
              if (Array.isArray(messages)) {
                form.setError(key as keyof RegisterFormValues, {
                  message: messages[0],
                });
              }
            });
          }
        } else {
          toast.error("Failed to create account");
        }
      },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl mb-6 shadow-lg shadow-primary/20">
            FF
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Create an account
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Start building with FileForge
          </p>
        </div>

        <Card>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  placeholder="Jane Doe"
                  {...form.register("full_name")}
                />
                {form.formState.errors.full_name && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.full_name.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  {...form.register("email")}
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  {...form.register("password")}
                />
                {form.formState.errors.password && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password_confirm">Confirm Password</Label>
                <Input
                  id="password_confirm"
                  type="password"
                  {...form.register("password_confirm")}
                />
                {form.formState.errors.password_confirm && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.password_confirm.message}
                  </p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full"
                disabled={register.isPending || login.isPending}
              >
                {register.isPending || login.isPending
                  ? "Creating account..."
                  : "Sign up"}
              </Button>
              <div className="text-sm text-center text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="text-primary hover:underline font-medium">
                  Sign in
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}

