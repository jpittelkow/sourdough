# Recipe: Add Configuration Page

Step-by-step guide to add a new configuration page in the dashboard using react-hook-form with Zod validation. **Fields are optional by default** unless explicitly marked as required.

## Critical Principles

1. **Optional by default** - All fields should be optional unless you explicitly need them required
2. **Empty strings are valid** - Use `refine()` to allow empty strings for fields with format validation
3. **Validate on blur** - Use `mode: "onBlur"` to avoid blocking users while typing
4. **Track dirty state properly** - Use `reset()` for initial values and `{ shouldDirty: true }` for custom inputs
5. **Send null for empty fields** - Backend should receive `null` (not empty string) to clear a field

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `frontend/app/(dashboard)/configuration/{name}/page.tsx` | Create | Config page UI |
| `backend/routes/api.php` | Modify | Add config endpoints |
| `backend/app/Http/Controllers/Api/{Name}Controller.php` | Create | Handle requests |

## When Config Uses Database + Env Fallback (SettingService)

If the config is stored in the database with environment fallback (see [ADR-014](../../adr/014-database-settings-env-fallback.md)):

1. **Add keys to** `backend/config/settings-schema.php` for the group (e.g. `mail`) with `env`, `default`, and `encrypted` where needed.
2. **Backend controller** should use **SettingService** (inject it), not `SystemSetting::get`/`set` directly. Use `$this->settingService->getGroup('group')` and `$this->settingService->set('group', $key, $value, $userId)`.
3. **Boot-time injection**: Add an `injectXxxConfig(array $settings)` method in `ConfigServiceProvider` and call it from `boot()` when the group is present in loaded settings.
4. **Reset to default**: Expose `DELETE /api/.../keys/{key}` where `{key}` is the **schema key** (e.g. `smtp_password`), not the frontend key. Validate that the key exists in `config('settings-schema.{group}')` before calling `$this->settingService->reset($group, $key)`.
5. **Frontend**: Reset button can call `api.delete(\`/mail-settings/keys/${schemaKey}\`)`. Schema keys for mail are e.g. `mailer`, `smtp_host`, `smtp_port`, `smtp_password`, `from_address`, `from_name`.

See [SettingService pattern](../patterns.md#settingservice-pattern) and `backend/app/Http/Controllers/Api/MailSettingController.php` for key mapping (schema ↔ frontend) and validation.

## Step 1: Define the Zod Schema (Optional by Default)

```tsx
import { z } from "zod";

// ✅ CORRECT: Fields are optional by default
const configSchema = z.object({
  // Simple optional string
  api_key: z.string().optional(),
  
  // Optional string with format validation that ALSO allows empty
  webhook_url: z.string()
    .refine((val) => {
      if (!val || val === "") return true; // Empty is valid
      try {
        new URL(val);
        return true;
      } catch {
        return false;
      }
    }, {
      message: "Must be a valid URL",
    })
    .optional(),
  
  // Optional hex color (empty allowed)
  accent_color: z.string()
    .refine((val) => {
      if (!val || val === "") return true; // Empty is valid
      return /^#[0-9A-Fa-f]{6}$/.test(val);
    }, {
      message: "Must be a valid hex color (e.g., #3b82f6)",
    })
    .optional(),
  
  // Boolean with default
  enabled: z.boolean().default(false),
  
  // Optional number
  retry_count: z.coerce.number().optional(),
  
  // ONLY mark required when truly needed
  // name: z.string().min(1, "Name is required"),
});

type ConfigForm = z.infer<typeof configSchema>;
```

### Common Field Patterns

```tsx
// Optional string (most common)
field_name: z.string().optional(),

// Optional string with format validation (URL, email, etc.)
url_field: z.string()
  .refine((val) => !val || val === "" || isValidUrl(val), {
    message: "Must be a valid URL",
  })
  .optional(),

// Optional hex color
color_field: z.string()
  .refine((val) => !val || val === "" || /^#[0-9A-Fa-f]{6}$/.test(val), {
    message: "Must be a valid hex color",
  })
  .optional(),

// Boolean (always has a value, use default)
toggle_field: z.boolean().default(false),

// Optional number (coerce from string input)
number_field: z.coerce.number().optional(),

// Optional enum/select
mode_field: z.enum(["option1", "option2", "option3"]).optional(),

// ONLY when truly required
required_field: z.string().min(1, "This field is required"),
```

## Step 2: Set Up the Form (Validate on Blur)

```tsx
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { api } from "@/lib/api";

export default function ExampleConfigPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // ✅ CORRECT: mode "onBlur" prevents validation blocking while typing
  const { 
    register, 
    handleSubmit, 
    formState: { errors, isDirty }, 
    setValue, 
    watch, 
    reset  // Important: use reset() for initial values
  } = useForm<ConfigForm>({
    resolver: zodResolver(configSchema),
    mode: "onBlur", // Validate on blur, not on every keystroke
    defaultValues: {
      api_key: "",
      webhook_url: "",
      accent_color: "",
      enabled: false,
      retry_count: undefined,
    },
  });

  // ... rest of component
}
```

## Step 3: Fetch and Reset Form State

```tsx
const fetchSettings = async () => {
  setIsLoading(true);
  try {
    const response = await api.get("/config/example");
    const settings = response.data.settings || {};

    // ✅ CORRECT: Use reset() to set initial values
    // This establishes the "clean" state for isDirty tracking
    const formValues = {
      api_key: settings.api_key || "",
      webhook_url: settings.webhook_url || "",
      accent_color: settings.accent_color || "",
      enabled: settings.enabled || false,
      retry_count: settings.retry_count ?? undefined,
    };
    
    reset(formValues);
  } catch (error: any) {
    toast.error(error.message || "Failed to load settings");
  } finally {
    setIsLoading(false);
  }
};

useEffect(() => {
  fetchSettings();
}, []);
```

## Step 4: Handle Non-Native Inputs (Switch, ColorPicker, etc.)

```tsx
// ✅ CORRECT: Use { shouldDirty: true } for custom components
<Switch
  checked={watch("enabled")}
  onCheckedChange={(checked) =>
    setValue("enabled", checked, { shouldDirty: true })
  }
/>

<ColorPicker
  value={watch("accent_color") || ""}
  onChange={(color) => setValue("accent_color", color, { shouldDirty: true })}
/>

// Native inputs with register() track dirty state automatically
<Input {...register("api_key")} placeholder="Enter API key" />
```

## Step 5: Submit with Null Conversion

```tsx
const onSubmit = async (data: ConfigForm) => {
  setIsSaving(true);
  try {
    // ✅ CORRECT: Convert empty strings to null for backend
    const payload = {
      ...data,
      api_key: data.api_key || null,
      webhook_url: data.webhook_url || null,
      accent_color: data.accent_color || null,
      // Numbers: keep as-is (undefined is fine)
      // Booleans: keep as-is (always have a value)
    };
    
    await api.put("/config/example", payload);
    toast.success("Settings saved successfully");
    await fetchSettings(); // Re-fetch to reset dirty state
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Failed to save settings");
  } finally {
    setIsSaving(false);
  }
};
```

## Step 6: Save Button (Disable When Not Dirty)

```tsx
<Button type="submit" disabled={!isDirty || isSaving}>
  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
  Save Changes
</Button>
```

## Step 7: Backend Validation (Laravel)

```php
// ✅ CORRECT: Use 'nullable' for optional fields
$validated = $request->validate([
    'api_key' => 'nullable|string|max:255',
    'webhook_url' => 'nullable|url|max:255',
    'accent_color' => 'nullable|string|regex:/^#[0-9A-Fa-f]{6}$/',
    'enabled' => 'boolean',
    'retry_count' => 'nullable|integer|min:0|max:10',
    // ONLY use 'required' when truly needed
    // 'name' => 'required|string|max:255',
]);
```

## Complete Example

```tsx
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
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";

const configSchema = z.object({
  api_key: z.string().optional(),
  webhook_url: z.string()
    .refine((val) => !val || val === "" || (() => { try { new URL(val); return true; } catch { return false; } })(), {
      message: "Must be a valid URL",
    })
    .optional(),
  enabled: z.boolean().default(false),
});

type ConfigForm = z.infer<typeof configSchema>;

export default function ExampleConfigPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const { register, handleSubmit, formState: { errors, isDirty }, setValue, watch, reset } = useForm<ConfigForm>({
    resolver: zodResolver(configSchema),
    mode: "onBlur",
    defaultValues: {
      api_key: "",
      webhook_url: "",
      enabled: false,
    },
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/config/example");
      const settings = response.data.settings || {};
      reset({
        api_key: settings.api_key || "",
        webhook_url: settings.webhook_url || "",
        enabled: settings.enabled || false,
      });
    } catch (error: any) {
      toast.error("Failed to load settings");
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: ConfigForm) => {
    setIsSaving(true);
    try {
      await api.put("/config/example", {
        ...data,
        api_key: data.api_key || null,
        webhook_url: data.webhook_url || null,
      });
      toast.success("Settings saved");
      await fetchSettings();
    } catch (error: any) {
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
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
        <h1 className="text-3xl font-bold">Example Config</h1>
        <p className="text-muted-foreground mt-2">Configure your integration.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <Label>Enabled</Label>
              <Switch
                checked={watch("enabled")}
                onCheckedChange={(checked) => setValue("enabled", checked, { shouldDirty: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="api_key">API Key</Label>
              <Input {...register("api_key")} type="password" placeholder="Optional" />
              {errors.api_key && <p className="text-sm text-destructive">{errors.api_key.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="webhook_url">Webhook URL</Label>
              <Input {...register("webhook_url")} placeholder="https://example.com/webhook (optional)" />
              {errors.webhook_url && <p className="text-sm text-destructive">{errors.webhook_url.message}</p>}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={!isDirty || isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
```

## Checklist

- [ ] Schema uses `.optional()` for non-required fields
- [ ] Format validations use `.refine()` to allow empty strings
- [ ] Form uses `mode: "onBlur"` (not `"onChange"`)
- [ ] Initial values loaded with `reset()`
- [ ] Custom inputs use `setValue(..., { shouldDirty: true })`
- [ ] Submit converts empty strings to `null`
- [ ] Save button uses `disabled={!isDirty || isSaving}`
- [ ] Backend validation uses `nullable` for optional fields

## Common Mistakes

### ❌ Wrong: Validation blocks empty optional fields

```tsx
// This fails validation when empty
webhook_url: z.string().url().optional(),
```

### ✅ Correct: Allow empty strings explicitly

```tsx
webhook_url: z.string()
  .refine((val) => !val || val === "" || isValidUrl(val), {
    message: "Must be a valid URL",
  })
  .optional(),
```

### ❌ Wrong: Using setValue without shouldDirty

```tsx
// isDirty won't update
setValue("enabled", true);
```

### ✅ Correct: Include shouldDirty option

```tsx
setValue("enabled", true, { shouldDirty: true });
```

### ❌ Wrong: Using onChange mode

```tsx
// Validates on every keystroke, blocks typing
useForm({ mode: "onChange" });
```

### ✅ Correct: Use onBlur mode

```tsx
// Validates when field loses focus
useForm({ mode: "onBlur" });
```

### ❌ Wrong: Using individual setValue for initial load

```tsx
// Doesn't establish clean state for isDirty
setValue("api_key", settings.api_key);
setValue("enabled", settings.enabled);
```

### ✅ Correct: Use reset for initial load

```tsx
// Establishes clean state, isDirty works correctly
reset({
  api_key: settings.api_key || "",
  enabled: settings.enabled || false,
});
```
