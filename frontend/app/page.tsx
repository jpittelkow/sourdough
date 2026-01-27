"use client";

import { useAuth } from "@/lib/auth";
import { useAppConfig } from "@/lib/app-config";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  const { user, isLoading } = useAuth();
  const { appName } = useAppConfig();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center space-y-8">
        <h1 className="text-5xl font-bold tracking-tight">
          {appName}
        </h1>
        <p className="text-xl text-muted-foreground">
          A starter for AI to develop other apps - with enterprise-grade user management,
          multi-provider notifications, and AI/LLM orchestration.
        </p>
        
        <div className="flex gap-4 justify-center">
          {isLoading ? (
            <div className="animate-pulse h-10 w-32 bg-muted rounded-md" />
          ) : user ? (
            <Link href="/dashboard">
              <Button size="lg">Go to Dashboard</Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button size="lg" variant="default">Sign In</Button>
              </Link>
              <Link href="/register">
                <Button size="lg" variant="outline">Create Account</Button>
              </Link>
            </>
          )}
        </div>

        <div className="pt-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="p-6 rounded-lg border bg-card">
            <h3 className="font-semibold mb-2">User Management</h3>
            <p className="text-sm text-muted-foreground">
              SSO, 2FA, password reset, email verification - all optional for easy self-hosting.
            </p>
          </div>
          <div className="p-6 rounded-lg border bg-card">
            <h3 className="font-semibold mb-2">Notifications</h3>
            <p className="text-sm text-muted-foreground">
              Email, Telegram, Discord, Signal, SMS, and push notifications.
            </p>
          </div>
          <div className="p-6 rounded-lg border bg-card">
            <h3 className="font-semibold mb-2">AI/LLM Council</h3>
            <p className="text-sm text-muted-foreground">
              Multiple LLM providers with single, aggregation, and council modes.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
