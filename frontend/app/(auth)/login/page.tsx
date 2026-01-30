"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { useAppConfig } from "@/lib/app-config";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SSOButtons } from "@/components/auth/sso-buttons";
import { TwoFactorForm } from "@/components/auth/two-factor-form";
import { AuthPageLayout } from "@/components/auth/auth-page-layout";
import { AuthDivider } from "@/components/auth/auth-divider";
import { FormField } from "@/components/ui/form-field";
import { LoadingButton } from "@/components/ui/loading-button";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  remember: z.boolean().optional(),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { features } = useAppConfig();
  const [isLoading, setIsLoading] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      remember: false,
    },
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const result = await login(data.email, data.password, data.remember);
      
      if (result.requires_2fa) {
        setRequires2FA(true);
        return;
      }

      toast.success("Welcome back!");
      router.push("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  if (requires2FA) {
    return (
      <AuthPageLayout
        title="Two-Factor Authentication"
        description="Enter the code from your authenticator app"
      >
        <TwoFactorForm
          onSuccess={() => router.push("/dashboard")}
          onCancel={() => setRequires2FA(false)}
        />
      </AuthPageLayout>
    );
  }

  return (
    <AuthPageLayout
      title="Sign In"
      description="Enter your credentials to access your account"
    >
      <SSOButtons />

      <AuthDivider />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          id="email"
          label="Email"
          error={errors.email?.message}
        >
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            {...register("email")}
            disabled={isLoading}
          />
        </FormField>

        <FormField
          id="password"
          label={
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              {features?.passwordResetAvailable && (
                <Link
                  href="/forgot-password"
                  className="text-sm text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              )}
            </div>
          }
          error={errors.password?.message}
        >
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            {...register("password")}
            disabled={isLoading}
          />
        </FormField>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="remember"
            {...register("remember")}
            className="h-4 w-4 rounded border-gray-300"
          />
          <Label htmlFor="remember" className="text-sm font-normal">
            Remember me
          </Label>
        </div>

        <LoadingButton
          type="submit"
          className="w-full"
          isLoading={isLoading}
          loadingText="Signing in..."
        >
          Sign In
        </LoadingButton>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-primary hover:underline">
          Create one
        </Link>
      </p>
    </AuthPageLayout>
  );
}
