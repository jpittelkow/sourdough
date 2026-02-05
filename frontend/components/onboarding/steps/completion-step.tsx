"use client";

import { CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppConfig } from "@/lib/app-config";
import {
  WizardStep,
  WizardStepTitle,
  WizardStepDescription,
  WizardStepContent,
} from "@/components/onboarding/wizard-step";
import Link from "next/link";

interface CompletionStepProps {
  onComplete?: () => void;
}

export function CompletionStep({ onComplete }: CompletionStepProps) {
  const { appName } = useAppConfig();

  return (
    <WizardStep>
      <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
        <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
      </div>

      <WizardStepTitle>You&apos;re all set!</WizardStepTitle>

      <WizardStepDescription>
        Welcome to {appName || "the app"}. You&apos;re ready to start exploring.
      </WizardStepDescription>

      <WizardStepContent>
        <div className="space-y-3">
          <Button onClick={() => onComplete?.()} className="w-full">
            Get Started
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>

          <div className="flex flex-col gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/user/profile">Edit Profile</Link>
            </Button>
          </div>
        </div>
      </WizardStepContent>
    </WizardStep>
  );
}
