# Code Patterns

Follow these patterns for consistency across the codebase.

## Backend Patterns

### Controller Pattern

```php
<?php
// backend/app/Http/Controllers/Api/ExampleController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreExampleRequest;
use App\Http\Requests\UpdateExampleRequest;
use App\Http\Resources\ExampleResource;
use App\Models\Example;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ExampleController extends Controller
{
    /**
     * List all examples for the authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        $examples = Example::where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return response()->json([
            'data' => ExampleResource::collection($examples),
            'meta' => [
                'current_page' => $examples->currentPage(),
                'last_page' => $examples->lastPage(),
                'total' => $examples->total(),
            ],
        ]);
    }

    /**
     * Store a new example.
     */
    public function store(StoreExampleRequest $request): JsonResponse
    {
        $example = Example::create([
            ...$request->validated(),
            'user_id' => $request->user()->id,
        ]);

        return response()->json([
            'data' => new ExampleResource($example),
            'message' => 'Example created successfully.',
        ], 201);
    }

    /**
     * Show a single example.
     */
    public function show(Request $request, Example $example): JsonResponse
    {
        // Policy check (if using policies)
        $this->authorize('view', $example);

        return response()->json([
            'data' => new ExampleResource($example),
        ]);
    }

    /**
     * Update an example.
     */
    public function update(UpdateExampleRequest $request, Example $example): JsonResponse
    {
        $this->authorize('update', $example);

        $example->update($request->validated());

        return response()->json([
            'data' => new ExampleResource($example),
            'message' => 'Example updated successfully.',
        ]);
    }

    /**
     * Delete an example.
     */
    public function destroy(Request $request, Example $example): JsonResponse
    {
        $this->authorize('delete', $example);

        $example->delete();

        return response()->json([
            'message' => 'Example deleted successfully.',
        ]);
    }
}
```

### User Disable Pattern

When supporting disable/enable for user accounts, use a nullable `disabled_at` timestamp and block disabled users at login:

- **Model**: Add `disabled_at` to `$fillable` and `$casts` (datetime). Add `isDisabled(): bool` helper that returns `$this->disabled_at !== null`.
- **Login**: In `AuthController::login()`, after `Auth::attempt()` succeeds, check `$user->isDisabled()`. If disabled, call `Auth::logout()` and return 403 with a clear message (e.g. "This account has been disabled. Please contact your administrator.").
- **Admin toggle**: In `UserController::toggleDisabled()`, prevent disabling self or the last admin (use `AdminAuthorizationTrait::ensureNotLastAdmin()`). Toggle by setting `disabled_at` to `now()` or `null`.
- **API**: Expose `disabled_at` in user list/detail responses so the frontend can show Active/Disabled badge and Enable/Disable action.

**Key files**: `backend/app/Models/User.php`, `backend/app/Http/Controllers/Api/AuthController.php`, `backend/app/Http/Controllers/Api/UserController.php`, `backend/app/Http/Traits/AdminAuthorizationTrait.php`.

### AuditService Pattern

Use `AuditService` to log significant user actions for compliance and debugging. The service is registered as a singleton; inject it in controllers or use the `AuditLogging` trait.

```php
use App\Services\AuditService;
use App\Http\Traits\AuditLogging;

// Option 1: Inject AuditService
public function __construct(private AuditService $auditService) {}

$this->auditService->log('user.created', $user, [], ['name' => $user->name]);
$this->auditService->logAuth('login', $user);
$this->auditService->logAuth('login_failed', null, ['email' => $email], 'warning');
$this->auditService->logSettings('mail', $oldValues, $newValues, $request->user()->id);
$this->auditService->logUserAction('custom.action', null, null, 'info');
$this->auditService->logModelChange($model, 'resource.updated', $oldValues, $newValues);

// Option 2: Use AuditLogging trait (forwards to AuditService::log)
use AuditLogging;
$this->audit('user.created', $user, [], ['name' => $user->name], null, 'info');
```

- **When to use**: Log auth events (login, logout, failed login, 2FA), user management (create, update, delete, disable, admin toggle), settings changes, backup operations, and any other action that should be auditable.
- **Action naming**: Use `{resource}.{action}` (e.g. `auth.login`, `user.created`, `settings.updated`, `backup.restored`). Severity: `info`, `warning`, `error`, `critical`.
- **Sensitive data**: `AuditService::log()` and `logSettings()` automatically mask keys containing `password`, `token`, `secret`, `api_key`, etc. (values replaced with `***`). Do not pass raw secrets in `old_values`/`new_values`.
- **Error resilience**: If writing the audit log fails, the service logs to Laravel Log and returns null; the request is not broken.
- **Request context**: If you do not pass `Request`, the service resolves it from the container when available (for IP and user agent).

**Key files**: `backend/app/Services/AuditService.php`, `backend/app/Http/Traits/AuditLogging.php`, `backend/app/Models/AuditLog.php`, `backend/app/Http/Controllers/Api/AuditLogController.php`. See [Recipe: Trigger audit logging](recipes/trigger-audit-logging.md) and [Recipe: Add auditable action](recipes/add-auditable-action.md).

### Logging Pattern

Use the Laravel `Log` facade for operational and diagnostic events (not user actions; use AuditService for those). Every log record gets `correlation_id`, `user_id`, `ip_address`, and `request_uri` from the context processor when in HTTP context.

```php
use Illuminate\Support\Facades\Log;

// Success / operational events
Log::info('Backup created', ['filename' => $filename, 'size' => $size]);
Log::info('Email sent', ['user_id' => $user->id, 'to' => $user->email]);

// Recoverable issues
Log::warning('LLM provider failed', ['provider' => $name, 'error' => $e->getMessage()]);

// Failures
Log::error('Backup restore failed', ['error' => $e->getMessage()]);
```

- **Levels**: Use `info` for normal operations, `warning` for recoverable issues (e.g. one provider failed), `error` for failures. Use `debug` only for development.
- **Context**: Always pass a structured array (ids, names, duration_ms). Do not log secrets or full request bodies.
- **Frontend**: Use `errorLogger` from `frontend/lib/error-logger.ts` instead of `console.error`/`console.warn` so client errors are sent to `POST /api/client-errors` and appear in backend logs with correlation ID.

**Key files**: `backend/config/logging.php`, `backend/app/Logging/ContextProcessor.php`, `backend/app/Http/Middleware/AddCorrelationId.php`, `frontend/lib/error-logger.ts`, `docs/logging.md`. See [Recipe: Extend logging](recipes/extend-logging.md).

### SettingService Pattern

Use `SettingService` for system-wide settings that can be stored in the database with environment fallback. Do not use `SystemSetting` directly for migratable settings; use the service so env fallback and caching apply.

```php
<?php
// Inject SettingService in controller or service
use App\Services\SettingService;

public function __construct(private SettingService $settingService) {}

// Get a single setting (env fallback)
$value = $this->settingService->get('mail', 'smtp_host', '127.0.0.1');

// Get all settings for a group (env fallback)
$mailSettings = $this->settingService->getGroup('mail');

// Set a setting (encryption applied per settings-schema; cache cleared)
$this->settingService->set('mail', 'smtp_password', $password, $request->user()->id);

// Check if value is overridden in DB (vs env)
if ($this->settingService->isOverridden('mail', 'smtp_host')) { ... }

// Reset to env default (delete from DB, clear cache)
$this->settingService->reset('mail', 'smtp_password');

// Get all settings (for boot-time config injection; cached)
$all = $this->settingService->all();
```

- Define new migratable settings in `backend/config/settings-schema.php` with `env`, `default`, and `encrypted` keys.
- Add boot-time injection in `ConfigServiceProvider::boot()` for new groups.
- Use file cache only for settings (not DB) to avoid circular dependency.

### EmailTemplateService Pattern

Use `EmailTemplateService` for rendering email templates with variable replacement. Send rendered content via the **TemplatedMail** Mailable:

```php
use App\Mail\TemplatedMail;
use App\Services\EmailTemplateService;
use App\Services\RenderedEmail;
use Illuminate\Support\Facades\Mail;

public function __construct(private EmailTemplateService $templateService) {}

// Render a template (active templates only)
$rendered = $this->templateService->render('password_reset', [
    'user' => ['name' => $user->name, 'email' => $user->email],
    'reset_url' => $resetUrl,
    'expires_in' => '60 minutes',
    'app_name' => config('app.name'),
]);

// Send via TemplatedMail (standard pattern)
Mail::to($user->email)->send(new TemplatedMail($rendered));

// Or use rendered content directly
$rendered->subject; // "Reset your password"
$rendered->html;    // HTML body
$rendered->text;    // Plain text body
```

- **TemplatedMail**: Accepts a `RenderedEmail` DTO; sets subject and HTML body. Use for all template-based sends so admins’ customizations apply.
- Variable placeholders: `{{variable}}` or `{{user.name}}` (dot notation for nested arrays). Missing variables are replaced with empty string.
- For admin preview of any template (including inactive), use `renderTemplate(EmailTemplate $template, array $variables): RenderedEmail`.
- For **live preview of unsaved content** (e.g. admin UI), use `renderContent(string $subject, string $bodyHtml, ?string $bodyText, array $variables): RenderedEmail`. The preview API accepts optional `subject`, `body_html`, `body_text` in the request body and uses them when present.
- Default templates are defined in `EmailTemplateSeeder` and seeded on migration; reset-to-default uses `getDefaultContent($key)`.

**Integration points:** Built-in templates are wired as follows. Use the same pattern (render + TemplatedMail) for new flows.

- **password_reset** – `User::sendPasswordResetNotification($token)`; reset URL uses `config('app.frontend_url')` + `/reset-password?token=...&email=...`.
- **email_verification** – `User::sendEmailVerificationNotification()`; verification URL uses frontend `/verify-email?id=...&hash=...`.
- **notification** – `EmailChannel::send()`; passes user, title, message, action_url, action_text, app_name.
- **welcome** – Template exists; not yet wired (e.g. to `Registered` event).

**Key files**: `backend/app/Services/EmailTemplateService.php`, `backend/app/Services/RenderedEmail.php`, `backend/app/Mail/TemplatedMail.php`, `backend/app/Models/EmailTemplate.php`, `backend/app/Models/User.php` (overrides), `backend/app/Services/Notifications/Channels/EmailChannel.php`, `backend/database/seeders/EmailTemplateSeeder.php`. See [ADR-016: Email Template System](../adr/016-email-template-system.md) and [Recipe: Add Email Template](recipes/add-email-template.md).

### Email Template Admin UI Pattern

The admin UI for email templates lives under **Configuration > Email Templates** (`/configuration/email-templates`):

- **List page**: Fetches `GET /api/email-templates`; displays name, description, Active/Inactive badge, System badge, last updated; row click navigates to `/configuration/email-templates/[key]`.
- **Editor page**: Fetches `GET /api/email-templates/{key}`; form with subject (Input), body (TipTap WYSIWYG via `EmailTemplateEditor`), plain text (Textarea, optional), Active (Switch). Save calls `PUT /api/email-templates/{key}`. Reset to default (system templates only) calls `POST /api/email-templates/{key}/reset`.
- **EmailTemplateEditor**: TipTap with StarterKit, Link, Image, Placeholder; toolbar (Bold, Italic, headings, lists, link, image, variable picker). Controlled: `content` and `onChange(html)`. Variable picker inserts `{{variable}}` at cursor.
- **VariablePicker**: Dropdown listing template `variables`; on select, parent inserts `{{variable}}` into the editor.
- **Live preview**: Debounce (e.g. 500ms) then `POST /api/email-templates/{key}/preview` with current `subject`, `body_html`, `body_text`; render returned HTML in an iframe (sandbox). Preview API uses `EmailTemplateService::renderContent()` when body is provided.
- **Test email**: Dialog with email input (default current user); `POST /api/email-templates/{key}/test` with `{ to }`. Handle 503 when email is not configured.

**Key files**: `frontend/app/(dashboard)/configuration/email-templates/page.tsx`, `frontend/app/(dashboard)/configuration/email-templates/[key]/page.tsx`, `frontend/components/email-template-editor.tsx`, `frontend/components/variable-picker.tsx`. Navigation: add "Email Templates" to `frontend/app/(dashboard)/configuration/layout.tsx`.

### Backup & Restore Patterns

**Documentation:** Full backup docs (user, admin, developer; key files; recipes): [Backup & Restore](../backup.md).

**Backup settings (database with env fallback):** Backup configuration is stored in the `backup` group in `backend/config/settings-schema.php`. ConfigServiceProvider injects flat keys into nested `config('backup.*')` at boot; BackupService and destination classes read only from `config()`. Do not read SettingService inside BackupService or destinations; keep config as the single source at runtime.

**Destination interface:** New storage destinations implement `App\Services\Backup\Destinations\DestinationInterface`: `upload(localPath, filename): array`, `download(filename, localPath): array`, `list(): array`, `delete(filename): bool`, `isAvailable(): bool`, `getName(): string`. Destinations read `config('backup.destinations.{id}.*')` in `__construct()`; config is populated from DB by ConfigServiceProvider.

**Settings API and Test Connection:** BackupSettingController exposes `GET/PUT /backup-settings` and `POST /backup-settings/test/{destination}`. For Test Connection, the controller builds nested backup config from SettingService (via `injectBackupConfigFromSettings()`), injects it into config, then instantiates the destination and calls `isAvailable()`. Validation rules in `update()` must cover every backup schema key you expose in the UI.

**Backup UI:** The backup page has two tabs: **Backups** (list, create, download, restore, delete) and **Settings** (form for retention, schedule, S3/SFTP/Google Drive, encryption, notifications). Settings are fetched when the user opens the Settings tab; form uses react-hook-form + zod; SaveButton submits to `PUT /backup-settings`; Test Connection calls `POST /backup-settings/test/{destination}`. Add new settings by extending the schema, defaultBackupSettings, fetch mapping, and a Card in the Settings tab.

**Adding a new backup setting:** (1) Add flat key to `backup` group in settings-schema.php (use `encrypted` for secrets). (2) Add env default in backup.php if needed. (3) Map flat → nested in ConfigServiceProvider::injectBackupConfig(). (4) Add validation and injectBackupConfigFromSettings() in BackupSettingController. (5) Add field to frontend schema, defaults, fetch mapping, and a FormField/SettingsSwitchRow in the right Card.

**Adding a new destination:** See [Add backup destination](recipes/add-backup-destination.md). Summary: implement DestinationInterface, add flat keys to backup schema and backup.php destinations, map in ConfigServiceProvider and BackupSettingController, add Card and Test Connection in Settings tab.

**Extending backup/restore behavior:** See [Extend backup and restore features](recipes/extend-backup-restore.md) for new restore logic, scheduling, notifications, new backup content, or UI-only changes.

### Form Request Pattern

```php
<?php
// backend/app/Http/Requests/StoreExampleRequest.php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreExampleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Auth handled by route middleware
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'type' => ['required', 'in:typeA,typeB,typeC'],
            'settings' => ['nullable', 'array'],
            'settings.key' => ['required_with:settings', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Please provide a name.',
            'type.in' => 'Invalid type selected.',
        ];
    }
}
```

### Resource Pattern

```php
<?php
// backend/app/Http/Resources/ExampleResource.php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ExampleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'type' => $this->type,
            'settings' => $this->settings,
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),
        ];
    }
}
```

### Service Pattern

```php
<?php
// backend/app/Services/Example/ExampleService.php

namespace App\Services\Example;

use App\Models\Example;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class ExampleService
{
    /**
     * Process an example with business logic.
     */
    public function process(Example $example, array $options = []): ProcessResult
    {
        try {
            // Business logic here
            $result = $this->doSomething($example, $options);

            Log::info('Example processed', [
                'example_id' => $example->id,
                'result' => $result,
            ]);

            return new ProcessResult(success: true, data: $result);
        } catch (\Exception $e) {
            Log::error('Example processing failed', [
                'example_id' => $example->id,
                'error' => $e->getMessage(),
            ]);

            return new ProcessResult(success: false, error: $e->getMessage());
        }
    }

    private function doSomething(Example $example, array $options): array
    {
        // Implementation
        return [];
    }
}
```

### Channel/Provider Pattern (for pluggable implementations)

Notification channels implement `ChannelInterface` and receive user-specific config from user settings:

```php
<?php
// backend/app/Services/Notifications/Channels/ExampleChannel.php

namespace App\Services\Notifications\Channels;

use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ExampleChannel implements ChannelInterface
{
    public function send(User $user, string $type, string $title, string $message, array $data = []): array
    {
        // User-specific config from User Preferences
        $webhookUrl = $user->getSetting('notifications', 'example_webhook_url');

        if (!$webhookUrl) {
            throw new \RuntimeException('Example webhook URL not configured');
        }

        try {
            $response = Http::timeout(30)->post($webhookUrl, [
                'title' => $title,
                'message' => $message,
                'type' => $type,
                'data' => $data,
            ]);

            if (!$response->successful()) {
                throw new \RuntimeException('Webhook error: ' . $response->body());
            }

            return ['sent' => true];
        } catch (\Exception $e) {
            Log::error('ExampleChannel: Send failed', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    public function getName(): string
    {
        return 'Example';
    }

    public function isAvailableFor(User $user): bool
    {
        return config('notifications.channels.example.enabled', false);
    }
}
```

**Key points:**
- User-specific settings (webhooks, phone numbers) come from `$user->getSetting('notifications', 'key')`
- Global config (API keys, enabled status) comes from `config('notifications.channels.{channel}.*')`
- Add channel name/description to `NotificationChannelMetadata` trait
- Add user settings to `UserNotificationSettingsController::getRequiredSettings()`

See [Recipe: Add Notification Channel](recipes/add-notification-channel.md) for full guide.

### Route Definition Pattern

```php
// backend/routes/api.php

use App\Http\Controllers\Api\ExampleController;

// Public routes (no auth)
Route::post('/auth/login', [AuthController::class, 'login']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Resource routes (CRUD)
    Route::apiResource('examples', ExampleController::class);

    // Custom routes
    Route::post('/examples/{example}/process', [ExampleController::class, 'process']);

    // Settings routes
    Route::prefix('settings')->group(function () {
        Route::get('/example', [SettingController::class, 'getExample']);
        Route::put('/example', [SettingController::class, 'updateExample']);
    });
});

// Admin-only routes
Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->group(function () {
    Route::get('/users', [AdminController::class, 'users']);
});
```

## Backend Traits

Use shared traits for consistent controller behavior. Location: `backend/app/Http/Traits/`.

### AdminAuthorizationTrait

Prevents modifying or deleting the last admin. Use `ensureNotLastAdmin(User $user, string $action)` before delete/disable/demote actions on admin users.

```php
use App\Http\Traits\AdminAuthorizationTrait;

class UserController extends Controller
{
    use AdminAuthorizationTrait;

    public function destroy(User $user): JsonResponse
    {
        if ($error = $this->ensureNotLastAdmin($user, 'delete')) {
            return $error;
        }
        // ... prevent self-delete, then delete
        return $this->successResponse('User deleted successfully');
    }

    public function toggleAdmin(User $user): JsonResponse
    {
        if ($error = $this->ensureNotLastAdmin($user, 'remove admin status from')) {
            return $error;
        }
        // ...
    }
}
```

Common action verbs: `'delete'`, `'disable'`, `'remove admin status from'`. See [Add admin-protected action](recipes/add-admin-protected-action.md).

### ApiResponseTrait

Standardized JSON response helpers:

| Method | Use |
|--------|-----|
| `successResponse($message, $data = [], $status = 200)` | Success with message and optional data |
| `createdResponse($message, $data = [])` | 201 created |
| `errorResponse($message, $status = 400)` | Error with message |
| `dataResponse($data, $status = 200)` | Raw data (e.g. paginated list) |

```php
use App\Http\Traits\ApiResponseTrait;

class ExampleController extends Controller
{
    use ApiResponseTrait;

    public function index(Request $request): JsonResponse
    {
        $items = Example::paginate($request->input('per_page', config('app.pagination.default')));
        return $this->dataResponse($items);
    }

    public function store(StoreRequest $request): JsonResponse
    {
        $example = Example::create($request->validated());
        return $this->createdResponse('Example created', ['example' => $example]);
    }
}
```

### Pagination config

Use `config('app.pagination.default')` (default 20) for list endpoints. Audit logs use `config('app.pagination.audit_log')` (50).

```php
$perPage = $request->input('per_page', config('app.pagination.default'));
$logs = AuditLog::paginate($request->input('per_page', config('app.pagination.audit_log')));
```

### User password (hashed cast)

The `User` model uses Laravel's `hashed` cast for `password`. Pass **plaintext** when creating or updating users; the cast hashes automatically. Do not use `Hash::make()` in controllers for User password fields, or you will double-hash.

```php
// Good – plaintext, cast hashes
User::create(['name' => $n, 'email' => $e, 'password' => $validated['password']]);
$user->update(['password' => $validated['password']]);

// Bad – double-hash when User has hashed cast
User::create(['password' => Hash::make($validated['password'])]);
```

## Frontend Patterns

### Global Component Principle

**CRITICAL: Never duplicate logic across pages.** All reusable functionality must be implemented as shared components or utilities.

| Type | Location | When to Create |
|------|----------|----------------|
| UI Components | `frontend/components/ui/` | Generic UI elements (buttons, cards, inputs) |
| Feature Components | `frontend/components/` | App-specific components used on 2+ pages |
| Hooks | `frontend/lib/` or `frontend/hooks/` | Shared stateful logic |
| Utilities | `frontend/lib/` | Pure functions, API client, helpers |

**Before creating any component or utility:**
1. Search the codebase for existing implementations
2. If similar functionality exists, use or extend it
3. Only create page-specific code when explicitly required and document why

**Examples of global components:**
- `Logo` - Used on auth pages, sidebar, dashboard
- `usePageTitle` - Sets document title consistently
- `api` - API client with auth handling
- `formatDate` - Date formatting utility

See [Cursor rule: global-components.mdc](../../.cursor/rules/global-components.mdc) for full guidelines.

### Settings Page Components

Use these shared components for consistent settings/configuration page UX.

#### SettingsPageSkeleton

Loading state component for settings pages:

```tsx
import { SettingsPageSkeleton } from "@/components/ui/settings-page-skeleton";

export default function MySettingsPage() {
  const [isLoading, setIsLoading] = useState(true);

  if (isLoading) {
    return <SettingsPageSkeleton />;
  }

  return <div>...</div>;
}
```

**Props:**
- `minHeight?: string` - Custom min-height (default: "400px")

**Key file:** `frontend/components/ui/settings-page-skeleton.tsx`

#### SaveButton

Form save button with built-in dirty/saving state handling:

```tsx
import { SaveButton } from "@/components/ui/save-button";

export default function MySettingsPage() {
  const { formState: { isDirty } } = useForm();
  const [isSaving, setIsSaving] = useState(false);

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <SaveButton isDirty={isDirty} isSaving={isSaving} />
    </form>
  );
}
```

**Props:**
- `isDirty: boolean` - Whether form has unsaved changes
- `isSaving: boolean` - Whether form is currently submitting
- `children?: ReactNode` - Custom button text (default: "Save Changes")
- Extends all `ButtonProps` except `type`

**Key file:** `frontend/components/ui/save-button.tsx`

#### SettingsSwitchRow

Settings row with label (and optional description) on the left and a switch on the right. The switch keeps its natural size; the row provides a 44px touch target for accessibility. Use for configuration toggles (e.g. "Enable SSO", "Allow account linking").

```tsx
import { SettingsSwitchRow } from "@/components/ui/settings-switch-row";

<SettingsSwitchRow
  label="Enable feature"
  description="Optional description below the label"
  checked={watch("enabled")}
  onCheckedChange={(checked) => setValue("enabled", checked, { shouldDirty: true })}
/>
```

**Props:**
- `label: string` - Label shown on the left
- `description?: string` - Optional description below the label
- `checked: boolean` - Controlled checked state
- `onCheckedChange: (checked: boolean) => void` - Called when toggled
- `disabled?: boolean` - Disable the switch
- `className?: string` - Additional class for the row container

**Key file:** `frontend/components/ui/settings-switch-row.tsx`

### Auth Page Components

Use these shared components for consistent authentication page UX.

#### AuthPageLayout

Layout wrapper for auth pages with Logo, title, and description:

```tsx
import { AuthPageLayout } from "@/components/auth/auth-page-layout";

export default function LoginPage() {
  return (
    <AuthPageLayout
      title="Sign In"
      description="Enter your credentials to access your account"
    >
      {/* Form content */}
    </AuthPageLayout>
  );
}
```

**Props:**
- `title: string` - Page title
- `description?: string` - Optional description text
- `children: ReactNode` - Page content

**Key file:** `frontend/components/auth/auth-page-layout.tsx`

#### FormField

Label + Input + error message combo for form fields:

```tsx
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";

export default function MyForm() {
  const { register, formState: { errors } } = useForm();

  return (
    <FormField
      id="email"
      label="Email"
      error={errors.email?.message}
    >
      <Input
        id="email"
        type="email"
        {...register("email")}
      />
    </FormField>
  );
}
```

**Props:**
- `id: string` - Field ID (for label htmlFor)
- `label: string | ReactNode` - Label text or custom label element
- `error?: string` - Error message to display
- `children: ReactNode` - Input component
- `className?: string` - Additional CSS classes

**Key file:** `frontend/components/ui/form-field.tsx`

#### LoadingButton

Button with loading spinner support:

```tsx
import { LoadingButton } from "@/components/ui/loading-button";

export default function MyForm() {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <LoadingButton
      type="submit"
      isLoading={isLoading}
      loadingText="Signing in..."
    >
      Sign In
    </LoadingButton>
  );
}
```

**Props:**
- `isLoading: boolean` - Whether button is in loading state
- `loadingText?: string` - Text to show when loading (defaults to children)
- `children: ReactNode` - Button text
- Extends all `ButtonProps`

**Key file:** `frontend/components/ui/loading-button.tsx`

#### AuthDivider

"Or continue with" divider for separating SSO and email auth:

```tsx
import { AuthDivider } from "@/components/auth/auth-divider";

export default function LoginPage() {
  return (
    <>
      <SSOButtons />
      <AuthDivider />
      <EmailForm />
    </>
  );
}
```

**Props:**
- `text?: string` - Divider text (default: "Or continue with email")

**Key file:** `frontend/components/auth/auth-divider.tsx`

#### AuthStateCard

State card for success/error/warning/loading states on auth pages:

```tsx
import { AuthStateCard } from "@/components/auth/auth-state-card";
import { CheckCircle } from "lucide-react";

export default function SuccessPage() {
  return (
    <AuthStateCard
      variant="success"
      icon={CheckCircle}
      title="Email Verified"
      description="Your email has been verified successfully."
      footer={
        <Link href="/dashboard">
          <Button>Go to Dashboard</Button>
        </Link>
      }
    >
      <p>Additional content here</p>
    </AuthStateCard>
  );
}
```

**Props:**
- `variant: "success" | "error" | "warning" | "loading"` - State variant
- `icon?: LucideIcon` - Custom icon (defaults to variant icon)
- `title: string` - Card title
- `description?: string | ReactNode` - Card description
- `children?: ReactNode` - Card content
- `footer?: ReactNode` - Footer actions

**Key file:** `frontend/components/auth/auth-state-card.tsx`

### Page Component Pattern

```tsx
// frontend/app/(dashboard)/example/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface Example {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

export default function ExamplePage() {
  const [examples, setExamples] = useState<Example[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchExamples();
  }, []);

  const fetchExamples = async () => {
    try {
      setLoading(true);
      const response = await api.get('/examples');
      setExamples(response.data.data);
      setError(null);
    } catch (err) {
      setError('Failed to load examples');
      toast.error('Failed to load examples');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <p className="text-destructive">{error}</p>
        <Button onClick={fetchExamples}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Examples</h1>
          <p className="text-muted-foreground">Manage your examples here.</p>
        </div>
        <Button>Create Example</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {examples.map((example) => (
          <Card key={example.id}>
            <CardHeader>
              <CardTitle>{example.name}</CardTitle>
              <CardDescription>{example.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Created: {new Date(example.created_at).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {examples.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">No examples yet.</p>
            <Button>Create your first example</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

### Settings Page Pattern

```tsx
// frontend/app/(dashboard)/settings/example/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface ExampleSettings {
  enabled: boolean;
  api_key: string;
  webhook_url: string;
}

const defaultSettings: ExampleSettings = {
  enabled: false,
  api_key: '',
  webhook_url: '',
};

export default function ExampleSettingsPage() {
  const [settings, setSettings] = useState<ExampleSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/settings/example');
      setSettings({ ...defaultSettings, ...response.data });
    } catch (err) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/settings/example', settings);
      toast.success('Settings saved successfully');
    } catch (err) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Example Settings</h1>
        <p className="text-muted-foreground">Configure example integration.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
          <CardDescription>Set up your example integration.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Integration</Label>
              <p className="text-sm text-muted-foreground">
                Turn on example integration features.
              </p>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, enabled: checked })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="api_key">API Key</Label>
            <Input
              id="api_key"
              type="password"
              value={settings.api_key}
              onChange={(e) =>
                setSettings({ ...settings, api_key: e.target.value })
              }
              placeholder="Enter your API key"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="webhook_url">Webhook URL</Label>
            <Input
              id="webhook_url"
              type="url"
              value={settings.webhook_url}
              onChange={(e) =>
                setSettings({ ...settings, webhook_url: e.target.value })
              }
              placeholder="https://example.com/webhook"
            />
          </div>

          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

### API Utility Pattern

```typescript
// frontend/lib/api.ts
const API_BASE = '/api';

class ApiClient {
  private async request<T>(
    method: string,
    endpoint: string,
    data?: unknown
  ): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'include', // Include cookies for Sanctum
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `Request failed: ${response.status}`);
    }

    return response.json();
  }

  get<T>(endpoint: string): Promise<T> {
    return this.request<T>('GET', endpoint);
  }

  post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>('POST', endpoint, data);
  }

  put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>('PUT', endpoint, data);
  }

  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>('DELETE', endpoint);
  }
}

export const api = new ApiClient();
```

### Form with Validation Pattern

```tsx
// Using react-hook-form + zod
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  email: z.string().email('Invalid email address'),
  type: z.enum(['typeA', 'typeB', 'typeC']),
});

type FormData = z.infer<typeof formSchema>;

export function ExampleForm({ onSubmit }: { onSubmit: (data: FormData) => void }) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      type: 'typeA',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* More fields... */}
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
```

### Reusable Component Pattern

Components with multiple variants, sizes, and fallback behavior:

```tsx
// frontend/components/example-component.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

// 1. Define typed props interface with JSDoc comments
export interface ExampleComponentProps {
  /** Display variant */
  variant?: 'full' | 'compact' | 'minimal';
  /** Size preset */
  size?: 'sm' | 'md' | 'lg';
  /** Image source (optional - falls back to text) */
  src?: string | null;
  /** Display text */
  label: string;
  /** Additional CSS classes */
  className?: string;
}

// 2. Define size configuration object for consistency
const sizeConfig = {
  sm: {
    container: 'h-6 w-6',
    text: 'text-sm',
    gap: 'gap-1.5',
  },
  md: {
    container: 'h-8 w-8',
    text: 'text-base',
    gap: 'gap-2',
  },
  lg: {
    container: 'h-10 w-10',
    text: 'text-lg',
    gap: 'gap-2.5',
  },
};

// 3. Export the component with sensible defaults
export function ExampleComponent({
  variant = 'full',
  size = 'md',
  src,
  label,
  className,
}: ExampleComponentProps) {
  // 4. Track image load errors for fallback behavior
  const [imageError, setImageError] = useState(false);
  const sizes = sizeConfig[size];
  const hasImage = src && !imageError;

  // 5. Handle different variants
  if (variant === 'minimal') {
    return (
      <span className={cn('font-medium', sizes.text, className)}>
        {label}
      </span>
    );
  }

  // 6. Use cn() to merge conditional classes
  return (
    <div className={cn('flex items-center', sizes.gap, className)}>
      {hasImage ? (
        <div className={cn(sizes.container, 'relative')}>
          <Image
            src={src}
            alt={label}
            fill
            className="object-contain"
            onError={() => setImageError(true)}
          />
        </div>
      ) : (
        // 7. Provide styled fallback when no image
        <div
          className={cn(
            sizes.container,
            'flex items-center justify-center rounded-md',
            'bg-primary text-primary-foreground font-bold'
          )}
        >
          {label.slice(0, 2).toUpperCase()}
        </div>
      )}
      {variant === 'full' && (
        <span className={cn('font-medium', sizes.text)}>{label}</span>
      )}
    </div>
  );
}
```

**Key principles:**
- TypeScript interface with JSDoc for props
- Size configuration object for consistent sizing
- `cn()` utility for conditional class merging
- Image `onError` handler for graceful fallbacks
- Sensible defaults for optional props

**Real example:** See `frontend/components/logo.tsx`

### Charts (shadcn + Recharts)

Use the shadcn chart component (`ChartContainer`, `ChartTooltip`, `ChartTooltipContent`) with Recharts for dashboard and analytics charts. Config-driven colors and tooltips; theme-aware.

- **ChartContainer**: Wrap charts; requires `config` (`ChartConfig`) and `className` with `min-h-[...]` for responsive height. Injects `--color-{key}` CSS variables from config.
- **ChartConfig**: Keys map to data keys; each entry has `label` and `color` (or `theme { light, dark }`). Use `var(--color-{key})` for fills/strokes.
- **ChartTooltip / ChartTooltipContent**: Optional; use `nameKey`, `labelKey` when keys differ from config.
- Prefer `AreaChart`, `BarChart`, `PieChart` + `Pie` (donut via `innerRadius`) from `recharts`. Use `accessibilityLayer` on the chart.

**Key files:** `frontend/components/ui/chart.tsx`, `frontend/components/audit/audit-severity-chart.tsx`, `frontend/components/audit/audit-trends-chart.tsx`. See [Add dashboard widget](recipes/add-dashboard-widget.md) for chart widget variation.

## Error Handling Patterns

### Backend Error Response Format

```php
// Consistent error response structure
return response()->json([
    'message' => 'Human-readable error message.',
    'errors' => [
        'field_name' => ['Specific field error.'],
    ],
], 422);

// Common error responses
return response()->json(['message' => 'Unauthenticated.'], 401);
return response()->json(['message' => 'Forbidden.'], 403);
return response()->json(['message' => 'Not found.'], 404);
return response()->json(['message' => 'Server error.'], 500);

// Using Laravel's abort helper
abort(404, 'Example not found.');
abort(403, 'You do not have permission to access this resource.');
```

### Backend Exception Handling in Services

```php
<?php
// backend/app/Services/Example/ExampleService.php

use Illuminate\Support\Facades\Log;

class ExampleService
{
    public function process(Example $example, array $options = []): ProcessResult
    {
        try {
            $result = $this->doProcessing($example, $options);

            return new ProcessResult(success: true, data: $result);
        } catch (ValidationException $e) {
            // Re-throw validation exceptions (let Laravel handle)
            throw $e;
        } catch (ExternalApiException $e) {
            // Log external failures, return graceful error
            Log::warning('External API failed', [
                'example_id' => $example->id,
                'error' => $e->getMessage(),
            ]);

            return new ProcessResult(
                success: false,
                error: 'External service temporarily unavailable.'
            );
        } catch (\Exception $e) {
            // Log unexpected errors
            Log::error('Unexpected error in ExampleService', [
                'example_id' => $example->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return new ProcessResult(
                success: false,
                error: 'An unexpected error occurred.'
            );
        }
    }
}
```

### Frontend Error Handling Pattern

```tsx
// Handling API errors with proper user feedback
const handleSubmit = async (data: FormData) => {
  try {
    setSubmitting(true);
    setError(null);

    await api.post('/examples', data);
    toast.success('Example created successfully');
    router.push('/examples');
  } catch (err: any) {
    // Handle validation errors (422)
    if (err.response?.status === 422 && err.response?.data?.errors) {
      const errors = err.response.data.errors;
      Object.entries(errors).forEach(([field, messages]) => {
        form.setError(field as any, {
          message: (messages as string[])[0],
        });
      });
      toast.error('Please fix the validation errors');
    }
    // Handle authentication errors (401)
    else if (err.response?.status === 401) {
      toast.error('Session expired. Please log in again.');
      router.push('/login');
    }
    // Handle forbidden errors (403)
    else if (err.response?.status === 403) {
      toast.error('You do not have permission to perform this action');
    }
    // Handle not found errors (404)
    else if (err.response?.status === 404) {
      toast.error('The requested resource was not found');
    }
    // Handle all other errors
    else {
      const message = err.response?.data?.message || 'Something went wrong';
      toast.error(message);
      setError(message);
    }
  } finally {
    setSubmitting(false);
  }
};
```

### Frontend Error Boundary Pattern

```tsx
// frontend/components/error-boundary.tsx
'use client';

import { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="max-w-md mx-auto mt-8">
          <CardHeader>
            <CardTitle>Something went wrong</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              An unexpected error occurred. Please try again.
            </p>
            <Button onClick={() => this.setState({ hasError: false })}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}
```

### API Response Status Codes

| Code | Meaning | When to Use |
|------|---------|-------------|
| 200 | OK | Successful GET, PUT, DELETE |
| 201 | Created | Successful POST that creates a resource |
| 204 | No Content | Successful DELETE with no response body |
| 400 | Bad Request | Malformed request (invalid JSON, etc.) |
| 401 | Unauthorized | Not authenticated (missing/invalid session) |
| 403 | Forbidden | Authenticated but not allowed |
| 404 | Not Found | Resource doesn't exist or user doesn't own it |
| 422 | Unprocessable Entity | Validation failed |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected backend error |

## Responsive & Mobile-First Patterns

### Mobile-First Class Order

Always write base styles for mobile, then add breakpoint modifiers for larger screens:

```tsx
// ✅ CORRECT: Mobile-first (base → larger screens)
<div className="flex flex-col md:flex-row lg:gap-6">
<div className="w-full md:w-1/2 lg:w-1/3">
<div className="p-4 md:p-6 lg:p-8">
<h1 className="text-2xl md:text-3xl lg:text-4xl">

// ❌ WRONG: Desktop-first (breaks mobile)
<div className="flex-row md:flex-col">
<div className="w-1/3 md:w-full">
```

### Responsive Grid Layout

```tsx
// Cards: 1 column on mobile → multi-column on larger screens
<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
  {items.map(item => (
    <Card key={item.id}>...</Card>
  ))}
</div>

// Form fields: stack on mobile, side-by-side on tablet+
<div className="grid gap-4 md:grid-cols-2">
  <FormField name="firstName" />
  <FormField name="lastName" />
</div>
```

### Mobile Detection Hook

Use the `useIsMobile` hook for conditional rendering:

```tsx
import { useIsMobile } from "@/lib/use-mobile";

export function ResponsiveComponent() {
  const isMobile = useIsMobile();

  // Fundamentally different UIs for mobile vs desktop
  if (isMobile) {
    return <MobileVersion />;
  }
  return <DesktopVersion />;
}
```

**Key file**: `frontend/lib/use-mobile.ts`

### Responsive Navigation Pattern

```tsx
// Mobile: Sheet (drawer) component
// Desktop: Fixed sidebar

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/lib/use-mobile";

export function ResponsiveSidebar({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  if (isMobile) {
    return (
      <>
        <Button variant="ghost" size="icon" onClick={() => setOpen(true)}>
          <Menu className="h-5 w-5" />
        </Button>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="left" className="w-64 p-0">
            <nav onClick={() => setOpen(false)}>{children}</nav>
          </SheetContent>
        </Sheet>
      </>
    );
  }

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col border-r">
      {children}
    </aside>
  );
}
```

### Responsive Table Pattern

```tsx
// Option 1: Horizontal scroll wrapper (simpler)
<div className="overflow-x-auto rounded-md border">
  <Table className="min-w-[600px]">
    {/* table content */}
  </Table>
</div>

// Option 2: Card view on mobile (better UX)
import { useIsMobile } from "@/lib/use-mobile";

export function DataView({ data }: { data: Item[] }) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="space-y-4">
        {data.map(item => (
          <Card key={item.id}>
            <CardHeader>
              <CardTitle className="text-base">{item.name}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              {/* Mobile-friendly card layout */}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return <Table>{/* Desktop table view */}</Table>;
}
```

### Touch Target Pattern

Ensure all interactive elements have minimum 44x44px touch targets:

```tsx
// ✅ CORRECT: Adequate touch targets
<Button className="min-h-[44px]">Submit</Button>

<button className="p-3 hover:bg-accent rounded-md">
  <Icon className="h-5 w-5" /> {/* 20px + 24px padding = 44px+ */}
</button>

// Icon button with explicit size
<Button variant="ghost" size="icon" className="h-11 w-11">
  <Settings className="h-5 w-5" />
</Button>

// ❌ WRONG: Too small for touch
<button className="p-1"><Icon className="h-4 w-4" /></button>
```

### Responsive Typography Pattern

```tsx
// Page titles - scale up on larger screens
<h1 className="text-2xl font-bold md:text-3xl lg:text-4xl">Dashboard</h1>

// Section headers
<h2 className="text-xl font-semibold md:text-2xl">Recent Activity</h2>

// Body text
<p className="text-sm md:text-base text-muted-foreground">
  Description text.
</p>
```

### Hide/Show by Breakpoint

```tsx
// Mobile only
<div className="block md:hidden">Mobile content</div>

// Desktop only  
<div className="hidden md:block">Desktop content</div>

// Tablet and up
<div className="hidden sm:block">Tablet+ content</div>
```

## Naming Conventions Summary

| Type | Pattern | Example |
|------|---------|---------|
| Controller | `{Feature}Controller.php` | `ExampleController.php` |
| Service | `{Feature}Service.php` | `ExampleService.php` |
| Model | `{Singular}.php` | `Example.php` |
| FormRequest | `{Action}{Model}Request.php` | `StoreExampleRequest.php` |
| Resource | `{Model}Resource.php` | `ExampleResource.php` |
| Channel | `{Provider}Channel.php` | `TelegramChannel.php` |
| Provider | `{Provider}Provider.php` | `OpenAIProvider.php` |
| Frontend page | `page.tsx` in route folder | `app/(dashboard)/example/page.tsx` |
| Frontend component | `kebab-case.tsx` | `example-card.tsx` |
| Migration | `{timestamp}_create_{table}_table.php` | `2024_01_01_000000_create_examples_table.php` |
