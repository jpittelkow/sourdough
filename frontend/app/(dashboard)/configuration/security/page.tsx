"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Loader2,
  Shield,
  Smartphone,
  Key,
  Link as LinkIcon,
  Unlink,
  Copy,
  Check,
  AlertTriangle,
} from "lucide-react";

const passwordSchema = z
  .object({
    current_password: z.string().min(1, "Current password is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    password_confirmation: z.string(),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Passwords don't match",
    path: ["password_confirmation"],
  });

type PasswordForm = z.infer<typeof passwordSchema>;

interface TwoFactorStatus {
  enabled: boolean;
  confirmed: boolean;
  recovery_codes_count?: number;
}

interface SSOProvider {
  id: string;
  name: string;
  icon: string;
  connected: boolean;
  nickname?: string;
}

export default function SecurityPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [twoFactorStatus, setTwoFactorStatus] = useState<TwoFactorStatus | null>(null);
  const [ssoProviders, setSsoProviders] = useState<SSOProvider[]>([]);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [setupSecret, setSetupSecret] = useState<string | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [showRecoveryDialog, setShowRecoveryDialog] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [copied, setCopied] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  // Fetch 2FA status and SSO providers
  useEffect(() => {
    fetchSecurityStatus();
  }, []);

  const fetchSecurityStatus = async () => {
    try {
      const [twoFactorRes, ssoRes] = await Promise.all([
        api.get("/auth/2fa/status"),
        api.get("/auth/sso/providers"),
      ]);
      setTwoFactorStatus(twoFactorRes.data);
      setSsoProviders(ssoRes.data.providers || []);
    } catch (error) {
      console.error("Failed to fetch security status:", error);
    }
  };

  const onPasswordSubmit = async (data: PasswordForm) => {
    setIsLoading(true);
    try {
      await api.put("/profile/password", data);
      toast.success("Password updated successfully");
      reset();
    } catch (error: any) {
      toast.error(error.message || "Failed to update password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnable2FA = async () => {
    try {
      const response = await api.post("/auth/2fa/enable");
      setQrCode(response.data.qr_code);
      setSetupSecret(response.data.secret);
      setShowSetupDialog(true);
    } catch (error: any) {
      toast.error(error.message || "Failed to enable 2FA");
    }
  };

  const handleConfirm2FA = async () => {
    if (verificationCode.length !== 6) {
      toast.error("Please enter a 6-digit code");
      return;
    }

    try {
      const response = await api.post("/auth/2fa/confirm", {
        code: verificationCode,
      });
      setRecoveryCodes(response.data.recovery_codes || []);
      setShowSetupDialog(false);
      setShowRecoveryDialog(true);
      setVerificationCode("");
      fetchSecurityStatus();
      toast.success("Two-factor authentication enabled");
    } catch (error: any) {
      toast.error(error.message || "Invalid verification code");
    }
  };

  const handleDisable2FA = async () => {
    try {
      await api.post("/auth/2fa/disable");
      fetchSecurityStatus();
      toast.success("Two-factor authentication disabled");
    } catch (error: any) {
      toast.error(error.message || "Failed to disable 2FA");
    }
  };

  const handleViewRecoveryCodes = async () => {
    try {
      const response = await api.get("/auth/2fa/recovery-codes");
      setRecoveryCodes(response.data.recovery_codes || []);
      setShowRecoveryDialog(true);
    } catch (error: any) {
      toast.error(error.message || "Failed to get recovery codes");
    }
  };

  const handleRegenerateRecoveryCodes = async () => {
    try {
      const response = await api.post("/auth/2fa/recovery-codes/regenerate");
      setRecoveryCodes(response.data.recovery_codes || []);
      toast.success("Recovery codes regenerated");
    } catch (error: any) {
      toast.error(error.message || "Failed to regenerate codes");
    }
  };

  const handleLinkSSO = (provider: string) => {
    window.location.href = `/api/auth/sso/${provider}?link=true`;
  };

  const handleUnlinkSSO = async (provider: string) => {
    try {
      await api.delete(`/auth/sso/${provider}/unlink`);
      fetchSecurityStatus();
      toast.success(`${provider} account unlinked`);
    } catch (error: any) {
      toast.error(error.message || "Failed to unlink account");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Security</h1>
        <p className="text-muted-foreground">
          Manage your password, two-factor authentication, and connected accounts.
        </p>
      </div>

      {/* Password Change */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Change Password
          </CardTitle>
          <CardDescription>
            Update your password to keep your account secure.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onPasswordSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current_password">Current Password</Label>
              <Input
                id="current_password"
                type="password"
                {...register("current_password")}
                disabled={isLoading}
              />
              {errors.current_password && (
                <p className="text-sm text-destructive">
                  {errors.current_password.message}
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  {...register("password")}
                  disabled={isLoading}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password_confirmation">Confirm Password</Label>
                <Input
                  id="password_confirmation"
                  type="password"
                  {...register("password_confirmation")}
                  disabled={isLoading}
                />
                {errors.password_confirmation && (
                  <p className="text-sm text-destructive">
                    {errors.password_confirmation.message}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Password
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account using an authenticator app.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className={`p-3 rounded-full ${
                  twoFactorStatus?.enabled
                    ? "bg-green-500/10 text-green-500"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <p className="font-medium">
                  {twoFactorStatus?.enabled ? "Enabled" : "Disabled"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {twoFactorStatus?.enabled
                    ? "Your account is protected with 2FA"
                    : "Add 2FA for enhanced security"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {twoFactorStatus?.enabled && (
                <Button variant="outline" onClick={handleViewRecoveryCodes}>
                  Recovery Codes
                </Button>
              )}
              <Switch
                checked={twoFactorStatus?.enabled || false}
                onCheckedChange={(checked) => {
                  if (checked) {
                    handleEnable2FA();
                  } else {
                    handleDisable2FA();
                  }
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SSO Connections */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            Connected Accounts
          </CardTitle>
          <CardDescription>
            Link your account with external providers for easy sign-in.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {ssoProviders.map((provider) => (
              <div
                key={provider.id}
                className="flex items-center justify-between py-2"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-lg">
                    {provider.icon || provider.name[0]}
                  </div>
                  <div>
                    <p className="font-medium capitalize">{provider.name}</p>
                    {provider.connected && provider.nickname && (
                      <p className="text-sm text-muted-foreground">
                        {provider.nickname}
                      </p>
                    )}
                  </div>
                </div>
                {provider.connected ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUnlinkSSO(provider.id)}
                  >
                    <Unlink className="mr-2 h-4 w-4" />
                    Disconnect
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleLinkSSO(provider.id)}
                  >
                    <LinkIcon className="mr-2 h-4 w-4" />
                    Connect
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 2FA Setup Dialog */}
      <Dialog open={showSetupDialog} onOpenChange={setShowSetupDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Set Up Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Scan this QR code with your authenticator app, then enter the
              verification code.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {qrCode && (
              <div className="flex justify-center">
                <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
              </div>
            )}
            {setupSecret && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground text-center">
                  Or enter this code manually:
                </p>
                <div className="flex items-center justify-center gap-2">
                  <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                    {setupSecret}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(setupSecret)}
                  >
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="verification_code">Verification Code</Label>
              <Input
                id="verification_code"
                value={verificationCode}
                onChange={(e) =>
                  setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="000000"
                className="text-center text-2xl tracking-widest"
                maxLength={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSetupDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirm2FA}>Verify & Enable</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Recovery Codes Dialog */}
      <Dialog open={showRecoveryDialog} onOpenChange={setShowRecoveryDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Recovery Codes</DialogTitle>
            <DialogDescription>
              Save these codes in a secure location. You can use them to access
              your account if you lose access to your authenticator app.
            </DialogDescription>
          </DialogHeader>
          <Alert variant="warning" className="my-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Important</AlertTitle>
            <AlertDescription>
              Each code can only be used once. Keep them safe!
            </AlertDescription>
          </Alert>
          <div className="grid grid-cols-2 gap-2 py-4">
            {recoveryCodes.map((code, index) => (
              <code
                key={index}
                className="bg-muted px-3 py-2 rounded text-sm font-mono text-center"
              >
                {code}
              </code>
            ))}
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => copyToClipboard(recoveryCodes.join("\n"))}
              className="w-full sm:w-auto"
            >
              {copied ? (
                <Check className="mr-2 h-4 w-4" />
              ) : (
                <Copy className="mr-2 h-4 w-4" />
              )}
              Copy All
            </Button>
            <Button
              variant="outline"
              onClick={handleRegenerateRecoveryCodes}
              className="w-full sm:w-auto"
            >
              Regenerate
            </Button>
            <Button
              onClick={() => setShowRecoveryDialog(false)}
              className="w-full sm:w-auto"
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
