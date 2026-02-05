"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  WizardStep,
  WizardStepTitle,
  WizardStepDescription,
  WizardStepContent,
} from "@/components/onboarding/wizard-step";
import { useAppConfig } from "@/lib/app-config";
import Link from "next/link";

export function NotificationsStep() {
  const { features } = useAppConfig();
  const webpushEnabled = features?.webpushEnabled;

  return (
    <WizardStep>
      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
        <Bell className="h-8 w-8 text-primary" />
      </div>

      <WizardStepTitle>Stay informed</WizardStepTitle>

      <WizardStepDescription>
        Choose how you want to receive notifications about important updates.
      </WizardStepDescription>

      <WizardStepContent>
        <div className="space-y-3">
          <div className="p-4 rounded-lg border bg-card text-left">
            <p className="text-sm font-medium mb-2">Available channels:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>In-app notifications (always on)</li>
              <li>Email notifications</li>
              {webpushEnabled && <li>Browser push notifications</li>}
            </ul>
          </div>

          <Button asChild variant="outline" className="w-full">
            <Link href="/user/notifications">Configure Notifications</Link>
          </Button>
        </div>
      </WizardStepContent>
    </WizardStep>
  );
}
