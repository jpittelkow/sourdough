"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useTheme } from "@/components/theme-provider";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Moon, Sun, Monitor, Loader2, Palette, Bell, Brain } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface UserPreferences {
  theme?: "light" | "dark" | "system";
  default_llm_mode?: "single" | "aggregation" | "council";
  notification_channels?: string[];
}

export default function PreferencesPage() {
  const { theme, setTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences>({
    theme: theme || "system",
    default_llm_mode: "single",
    notification_channels: [],
  });

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const response = await api.get("/user/settings");
      const data = response.data;
      
      // Validate and normalize theme value
      const validThemes = ["light", "dark", "system"] as const;
      const themeValue = validThemes.includes(data.theme) 
        ? data.theme 
        : (theme || "system");
      
      // Validate and normalize LLM mode value
      const validModes = ["single", "aggregation", "council"] as const;
      const llmModeValue = validModes.includes(data.default_llm_mode)
        ? data.default_llm_mode
        : "single";
      
      setPreferences({
        theme: themeValue,
        default_llm_mode: llmModeValue,
        notification_channels: Array.isArray(data.notification_channels) 
          ? data.notification_channels 
          : [],
      });
      
      // Sync theme if it's different
      if (themeValue && themeValue !== theme) {
        setTheme(themeValue);
      }
    } catch (error: any) {
      // If endpoint doesn't exist yet, use defaults
      console.warn("Failed to fetch preferences:", error);
      const currentTheme = theme || "system";
      setPreferences({
        theme: currentTheme,
        default_llm_mode: "single",
        notification_channels: [],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const savePreferences = async (updates: Partial<UserPreferences>) => {
    setIsSaving(true);
    try {
      // Only send the fields that are being updated, filtering out undefined/null
      const payload: Partial<UserPreferences> = {};
      if (updates.theme !== undefined && updates.theme !== null) {
        payload.theme = updates.theme;
      }
      if (updates.default_llm_mode !== undefined && updates.default_llm_mode !== null) {
        payload.default_llm_mode = updates.default_llm_mode;
      }
      if (updates.notification_channels !== undefined && updates.notification_channels !== null) {
        payload.notification_channels = updates.notification_channels;
      }
      
      // Ensure we have at least one field to update
      if (Object.keys(payload).length === 0) {
        console.warn("No fields to update");
        setIsSaving(false);
        return;
      }
      
      await api.put("/user/settings", payload);
      
      // Update local state with the merged preferences
      const newPreferences = { ...preferences, ...updates };
      setPreferences(newPreferences);
      toast.success("Preferences saved");
    } catch (error: any) {
      // Handle Laravel validation errors
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        const errorMessages = Object.values(errors).flat().join(", ");
        toast.error(`Validation error: ${errorMessages}`);
      } else {
        const errorMessage = error.response?.data?.message 
          || error.message 
          || "Failed to save preferences";
        toast.error(errorMessage);
      }
      console.error("Failed to save preferences:", error.response?.data || error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
    savePreferences({ theme: newTheme });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Preferences</h1>
        <p className="text-muted-foreground">
          Customize your personal settings and preferences.
        </p>
      </div>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Appearance
          </CardTitle>
          <CardDescription>
            Choose your preferred theme and visual style.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Theme</Label>
            <RadioGroup
              value={preferences.theme ?? "system"}
              onValueChange={(value) => {
                const validTheme = ["light", "dark", "system"].includes(value)
                  ? (value as "light" | "dark" | "system")
                  : "system";
                handleThemeChange(validTheme);
              }}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="light" id="light" />
                <Label htmlFor="light" className="flex items-center gap-2 cursor-pointer">
                  <Sun className="h-4 w-4" />
                  Light
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="dark" id="dark" />
                <Label htmlFor="dark" className="flex items-center gap-2 cursor-pointer">
                  <Moon className="h-4 w-4" />
                  Dark
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="system" id="system" />
                <Label htmlFor="system" className="flex items-center gap-2 cursor-pointer">
                  <Monitor className="h-4 w-4" />
                  System
                </Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      {/* Defaults */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Defaults
          </CardTitle>
          <CardDescription>
            Set your default preferences for AI interactions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="default_llm_mode">Default LLM Mode</Label>
            <Select
              value={preferences.default_llm_mode ?? "single"}
              onValueChange={(value) => {
                const validMode = ["single", "aggregation", "council"].includes(value)
                  ? (value as "single" | "aggregation" | "council")
                  : "single";
                savePreferences({
                  default_llm_mode: validMode,
                });
              }}
            >
              <SelectTrigger id="default_llm_mode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single Provider</SelectItem>
                <SelectItem value="aggregation">Aggregation</SelectItem>
                <SelectItem value="council">Council</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              <strong>Single:</strong> Uses one provider (fastest, cheapest).{" "}
              <strong>Aggregation:</strong> Queries all providers, primary synthesizes responses.{" "}
              <strong>Council:</strong> Providers vote for consensus (best for accuracy).
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>
            Choose which channels you want to receive notifications on.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Notification channel preferences are managed in the{" "}
            <a
              href="/configuration/notifications"
              className="text-primary hover:underline"
            >
              Configuration
            </a>{" "}
            section. This setting will be available once the backend API is implemented.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
