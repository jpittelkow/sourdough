"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Loader2,
  CheckCircle,
  XCircle,
  Mail,
  ArrowRight,
} from "lucide-react";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, fetchUser } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error" | "pending">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [isResending, setIsResending] = useState(false);

  const id = searchParams.get("id");
  const hash = searchParams.get("hash");

  useEffect(() => {
    if (id && hash) {
      verifyEmail();
    } else if (user) {
      setStatus("pending");
    } else {
      setStatus("error");
      setErrorMessage("Invalid verification link");
    }
  }, [id, hash, user]);

  const verifyEmail = async () => {
    try {
      await api.post("/auth/verify-email", { id, hash });
      setStatus("success");
      await fetchUser();
      toast.success("Email verified successfully!");
    } catch (error: any) {
      setStatus("error");
      setErrorMessage(error.message || "Verification failed");
    }
  };

  const handleResendVerification = async () => {
    setIsResending(true);
    try {
      await api.post("/auth/resend-verification");
      toast.success("Verification email sent!");
    } catch (error: any) {
      toast.error(error.message || "Failed to resend verification email");
    } finally {
      setIsResending(false);
    }
  };

  // Loading state
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
            <CardTitle className="mt-4">Verifying Email</CardTitle>
            <CardDescription>
              Please wait while we verify your email address...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Success state
  if (status === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle>Email Verified</CardTitle>
            <CardDescription>
              Your email address has been verified successfully.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center">
              You now have full access to all features of your account.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/dashboard" className="w-full">
              <Button className="w-full">
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Pending verification state (user is logged in but not verified)
  if (status === "pending" && user && !user.email_verified_at) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mb-4">
              <Mail className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <CardTitle>Verify Your Email</CardTitle>
            <CardDescription>
              We've sent a verification link to{" "}
              <span className="font-medium text-foreground">{user.email}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>
                Please check your email and click the verification link to
                activate your account. The link will expire in 24 hours.
              </AlertDescription>
            </Alert>
            <p className="text-sm text-muted-foreground text-center">
              Didn't receive the email? Check your spam folder or click below to
              resend.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button
              onClick={handleResendVerification}
              disabled={isResending}
              className="w-full"
            >
              {isResending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Resend Verification Email
            </Button>
            <Link href="/dashboard" className="w-full">
              <Button variant="ghost" className="w-full">
                Continue to Dashboard
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Error state
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <XCircle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle>Verification Failed</CardTitle>
          <CardDescription>
            We couldn't verify your email address.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {errorMessage || "The verification link is invalid or has expired."}
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          {user ? (
            <>
              <Button
                onClick={handleResendVerification}
                disabled={isResending}
                className="w-full"
              >
                {isResending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Request New Verification Email
              </Button>
              <Link href="/dashboard" className="w-full">
                <Button variant="ghost" className="w-full">
                  Continue to Dashboard
                </Button>
              </Link>
            </>
          ) : (
            <Link href="/login" className="w-full">
              <Button className="w-full">Sign In</Button>
            </Link>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
