# UI Component Patterns

Shared UI patterns for configuration, navigation, help, auth, and PWA.

## CollapsibleCard

Expandable sections for settings and configuration pages.

```tsx
import { CollapsibleCard } from "@/components/ui/collapsible-card";

<CollapsibleCard
  title="Slack"
  description="Send notifications to Slack channels."
  icon={<MessageSquare className="h-4 w-4" />}
  status={{ label: "Configured", variant: "success" }}
  defaultOpen={false}
>
  <div className="space-y-4">{/* form fields */}</div>
</CollapsibleCard>
```

Props: `title`, `description?`, `icon?`, `status?` ({ label, variant }), `defaultOpen?`, `open?`, `onOpenChange?`, `headerActions?`, `children`, `disabled?`, `className?`.

**Key file:** `frontend/components/ui/collapsible-card.tsx`

## ProviderIcon

Shared icon component for SSO, LLM, notification, backup providers.

```tsx
import { ProviderIcon } from "@/components/provider-icons";

<ProviderIcon provider="google" size="sm" style="mono" />
<ProviderIcon provider={provider.icon} size="sm" style="branded" />
```

Props: `provider: string`, `size?: "sm" | "md" | "lg"`, `style?: "mono" | "branded"`, `className?`.

Adding a new icon: Edit `frontend/components/provider-icons.tsx`, add entry to `SSO_ICONS`, `LLM_ICONS`, or `ALL_ICONS`.

**Key file:** `frontend/components/provider-icons.tsx`

## Configuration Navigation

Grouped, collapsible navigation in `configuration/layout.tsx`. Items organized into groups (General, Users & Access, Communications, Integrations, Logs & Monitoring, Data). Expanded/collapsed state persisted in localStorage.

Adding a new item:
1. Choose appropriate group
2. Add entry to that group's `items` in `navigationGroups`
3. Create page at `frontend/app/(dashboard)/configuration/[slug]/page.tsx`

**Key file:** `frontend/app/(dashboard)/configuration/layout.tsx`

## Help System

In-app searchable documentation with contextual links and tooltips.

```tsx
import { HelpLink } from "@/components/help/help-link";

<p className="text-muted-foreground">
  Configure this feature. <HelpLink articleId="my-article-id" />
</p>
```

- **HelpArticle**: `id`, `title`, `content` (markdown), `tags?`
- **HelpCategory**: `slug`, `name`, `icon?`, `articles`, `permission?`
- Categories in `userHelpCategories` are visible to all users; categories in `permissionHelpCategories` are gated by the `permission` field (e.g., `backups.view`, `audit.view`). Admin users have all permissions, so they see everything.
- `getAllCategories(permissions: string[])` filters by the user's permissions array
- Help modal opened with `?` or `Ctrl+/`
- Search integration via `backend/config/search-pages.php` with `help:` URL prefix and `permission` field
- Every config page should have a `HelpLink` in its description area

**Key files:** `frontend/lib/help/help-content.ts`, `frontend/components/help/`

## SaveButton

Standardized save button for all settings/configuration forms. Always use this instead of inline `Button` with manual loading logic.

```tsx
import { SaveButton } from "@/components/ui/save-button";

// Inside a <form> (default type="submit")
<SaveButton isDirty={isDirty} isSaving={isSaving} />

// With onClick handler (no form), use type="button"
<SaveButton type="button" isDirty={isDirty} isSaving={isSaving} onClick={handleSave} />

// Custom size for inline contexts (e.g., per-item settings)
<SaveButton type="button" size="sm" isDirty={true} isSaving={isSaving} onClick={handleSave} />
```

Props: `isDirty: boolean`, `isSaving: boolean`, `type?: "submit" | "button"` (default `"submit"`), `children?` (default `"Save Changes"`), plus all standard `ButtonProps`.

### CardFooter Alignment Standards

Always place save buttons in `<CardFooter>` with consistent alignment:

| Pattern | CardFooter className | When to use |
|---------|---------------------|-------------|
| Single save button | `flex justify-end` | Most pages |
| Save + helper text | `flex flex-col gap-4 sm:flex-row sm:justify-between` | When explanatory text accompanies save |
| Save + other buttons | `flex flex-wrap justify-end gap-2` | Test Connection, Send Test, Preview alongside Save |
| Reset + Save | `flex justify-between` | Destructive/secondary action opposite Save |

**Key file:** `frontend/components/ui/save-button.tsx`

## Auth Page Components

### AuthPageLayout

```tsx
import { AuthPageLayout } from "@/components/auth/auth-page-layout";

<AuthPageLayout title="Sign In" description="Enter your credentials">
  {/* Form content */}
</AuthPageLayout>
```

### FormField

```tsx
import { FormField } from "@/components/ui/form-field";

<FormField id="email" label="Email" description="We'll never share your email." error={errors.email?.message}>
  <Input id="email" type="email" {...register("email")} />
</FormField>
```

### LoadingButton

```tsx
import { LoadingButton } from "@/components/ui/loading-button";

<LoadingButton type="submit" isLoading={isLoading} loadingText="Signing in...">Sign In</LoadingButton>
```

### SSO Provider Display

Sign-in pages: `SSOButtons` fetches enabled providers from `GET /auth/sso/providers`. Provider shown when credentials set, test passed, and enabled flag is true. Icons from `ProviderIcon`.

Setup page (Configuration > SSO): Global options card + per-provider cards with CollapsibleCard, status badges, test connection, enable toggle. Three conditions for login page display: (1) Credentials, (2) Test passed, (3) Enabled.

### AuthDivider / AuthStateCard

```tsx
<AuthDivider text="Or continue with email" />
<AuthStateCard variant="success" title="Email Verified" description="Your email has been verified." />
```

**Key files:** `frontend/components/auth/`, `frontend/components/ui/form-field.tsx`, `frontend/components/ui/loading-button.tsx`, `frontend/app/(dashboard)/configuration/sso/page.tsx`

## PWA Install Prompt

```tsx
import { useInstallPrompt } from "@/lib/use-install-prompt";
import { InstallPrompt } from "@/components/install-prompt";

<InstallPrompt />

const { canPrompt, isInstalled, promptInstall } = useInstallPrompt();
```

- Hook: `useInstallPrompt()` returns `deferredPrompt`, `canPrompt`, `isInstalled`, `promptInstall()`, `dismissBanner()`, `shouldShowBanner`
- Dialog shows after 2+ visits, not dismissed, install available, not installed
- Uses `AlertDialog` (shadcn) for proper light/dark mode theming
- Add `<InstallPrompt />` to AppShell

**Key files:** `frontend/lib/use-install-prompt.ts`, `frontend/components/install-prompt.tsx`, `frontend/components/app-shell.tsx`

**Related:** [Recipe: Add collapsible section](../recipes/add-collapsible-section.md), [Recipe: Add SSO Provider](../recipes/add-sso-provider.md), [Recipe: Add help article](../recipes/add-help-article.md), [Recipe: Add configuration menu item](../recipes/add-configuration-menu-item.md), [Recipe: Add PWA install prompt](../recipes/add-pwa-install-prompt.md)
