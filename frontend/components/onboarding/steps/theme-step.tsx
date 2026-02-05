"use client";

import { Palette, Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  WizardStep,
  WizardStepTitle,
  WizardStepDescription,
  WizardStepContent,
} from "@/components/onboarding/wizard-step";

type Theme = "light" | "dark" | "system";

const themes: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

export function ThemeStep() {
  const { theme, setTheme } = useTheme();

  return (
    <WizardStep>
      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
        <Palette className="h-8 w-8 text-primary" />
      </div>

      <WizardStepTitle>Choose your theme</WizardStepTitle>

      <WizardStepDescription>
        Select your preferred appearance. You can change this anytime.
      </WizardStepDescription>

      <WizardStepContent>
        <div className="grid grid-cols-3 gap-2">
          {themes.map(({ value, label, icon: Icon }) => (
            <Button
              key={value}
              variant="outline"
              className={cn(
                "flex flex-col items-center gap-2 h-auto py-4",
                theme === value && "border-primary bg-primary/5"
              )}
              onClick={() => setTheme(value)}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs">{label}</span>
            </Button>
          ))}
        </div>
      </WizardStepContent>
    </WizardStep>
  );
}
