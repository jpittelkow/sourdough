"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { SSOButtons } from "@/components/auth/sso-buttons";
import { AuthPageLayout } from "@/components/auth/auth-page-layout";
import { AuthDivider } from "@/components/auth/auth-divider";
import { FormField } from "@/components/ui/form-field";
import { LoadingButton } from "@/components/ui/loading-button";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  password_confirmation: z.string(),
}).refine((data) => data.password === data.password_confirmation, {
  message: "Passwords don't match",
  path: ["password_confirmation"],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      await registerUser(data.name, data.email, data.password, data.password_confirmation);
      toast.success("Account created successfully!");
      router.push("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthPageLayout
      title="Create Account"
      description="Get started with your free account"
    >
      <SSOButtons />

      <AuthDivider />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          id="name"
          label="Name"
          error={errors.name?.message}
        >
          <Input
            id="name"
            type="text"
            placeholder="John Doe"
            {...register("name")}
            disabled={isLoading}
          />
        </FormField>

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
          label="Password"
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

        <FormField
          id="password_confirmation"
          label="Confirm Password"
          error={errors.password_confirmation?.message}
        >
          <Input
            id="password_confirmation"
            type="password"
            placeholder="••••••••"
            {...register("password_confirmation")}
            disabled={isLoading}
          />
        </FormField>

        <LoadingButton
          type="submit"
          className="w-full"
          isLoading={isLoading}
          loadingText="Creating account..."
        >
          Create Account
        </LoadingButton>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </AuthPageLayout>
  );
}
