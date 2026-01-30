# Recipe: Add SSO Provider

Step-by-step guide to add a new OAuth2/OIDC SSO provider to Sourdough.

## Architecture Overview

SSO uses **Laravel Socialite** for OAuth flows. Provider credentials and options are stored in the database (with env fallback) and injected at boot via `ConfigServiceProvider`. The frontend login page shows buttons for each enabled provider.

```
┌─────────────────────────────────────────────────────────────┐
│ Configuration > SSO (Admin)                                  │
│   - Global: enabled, allow_linking, auto_register             │
│   - Per-provider: client_id, client_secret (from DB or env)   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ ConfigServiceProvider::injectSSOConfig()                     │
│   - Injects config('sso.*') and config('services.{provider}.*') │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ SSOService + Socialite::driver($provider)                    │
│   - Redirect, callback, link/unlink                          │
└─────────────────────────────────────────────────────────────┘
```

## Files to Create/Modify

### Backend

| File | Action | Purpose |
|------|--------|---------|
| `backend/config/settings-schema.php` | Modify | Add provider keys to `sso` group |
| `backend/app/Providers/ConfigServiceProvider.php` | Modify | Add provider to `injectSSOConfig()` |
| `backend/config/sso.php` | Modify | Add provider to `providers` array |
| `backend/config/services.php` | Modify | Add Socialite credentials (env fallback) |
| `backend/app/Http/Controllers/Api/SSOSettingController.php` | Modify | Add validation rules for new keys |
| `backend/.env.example` | Modify | Add env variables |

### Frontend

| File | Action | Purpose |
|------|--------|---------|
| `frontend/components/provider-icons.tsx` | Modify | Add provider icon to the shared icon map so **sign-in, register, and SSO config** show the correct icon |
| `frontend/app/(dashboard)/configuration/sso/page.tsx` | Modify | Add provider card and form fields on the **SSO setup page** (Configuration > SSO) |

### Optional (custom Socialite driver)

| File | Action | Purpose |
|------|--------|---------|
| `backend/config/services.php` | Modify | Register custom driver config |
| Composer | Add package | e.g. `socialiteproviders/xxx` if not in Laravel Socialite core |

## Step 1: Add to Settings Schema

Add the provider's client ID and client secret to the `sso` group in `backend/config/settings-schema.php`:

```php
'sso' => [
    // ... existing keys ...
    'example_client_id' => ['env' => 'EXAMPLE_CLIENT_ID', 'default' => null],
    'example_client_secret' => ['env' => 'EXAMPLE_CLIENT_SECRET', 'default' => null, 'encrypted' => true],
],
```

Use a short provider slug (e.g. `google`, `github`, `example`) as the key prefix. Secrets must have `'encrypted' => true`.

## Step 2: Add to ConfigServiceProvider

In `backend/app/Providers/ConfigServiceProvider.php`, update `injectSSOConfig()`:

1. Add the provider slug to the `$providers` array if it uses the same pattern (client_id + client_secret):

```php
$providers = ['google', 'github', 'microsoft', 'apple', 'discord', 'gitlab', 'example'];
```

2. If the provider has custom config (e.g. OIDC with issuer_url), add a dedicated block after the loop:

```php
// Example provider
if (array_key_exists('example_client_id', $settings)) {
    config(['services.example.client_id' => $settings['example_client_id'] ?? config('services.example.client_id')]);
    config(['sso.providers.example.enabled' => !empty($settings['example_client_id'])]);
}
if (array_key_exists('example_client_secret', $settings)) {
    config(['services.example.client_secret' => $settings['example_client_secret'] ?? config('services.example.client_secret')]);
}
```

## Step 3: Add to SSO Config

In `backend/config/sso.php`, add the provider to the `providers` array:

```php
'providers' => [
    // ... existing providers ...
    'example' => [
        'name' => 'Example',
        'icon' => 'key',  // or a Lucide icon name used on the frontend
        'enabled' => !empty(env('EXAMPLE_CLIENT_ID')),
        'color' => '#6B7280',
    ],
],
```

The `enabled` value from env is overridden at runtime by `ConfigServiceProvider` when DB settings exist.

## Step 4: Add to Services Config (Socialite)

In `backend/config/services.php`, add the provider so Socialite can read credentials (env fallback when DB not used):

```php
'example' => [
    'client_id' => env('EXAMPLE_CLIENT_ID'),
    'client_secret' => env('EXAMPLE_CLIENT_SECRET'),
    'redirect' => env('EXAMPLE_REDIRECT_URI'),
],
```

Redirect URI is typically `{APP_URL}/api/callback/{provider}`. Many deployments leave it to the app to build; you can document the required callback URL for the provider's developer console.

## Step 5: Add Socialite Driver (if custom)

If the provider is **not** included in Laravel Socialite's built-in drivers, install a community package (e.g. Socialite Providers) and register the driver in `AppServiceProvider` or a dedicated service provider. See [Laravel Socialite](https://laravel.com/docs/socialite) and [Socialite Providers](https://socialiteproviders.com/).

For built-in drivers (google, github, microsoft, etc.), no code change is needed beyond config.

## Step 6: Add to SSOSettingController Validation

In `backend/app/Http/Controllers/Api/SSOSettingController.php`, add validation rules for the new keys in the `update()` method:

```php
'example_client_id' => ['sometimes', 'nullable', 'string', 'max:500'],
'example_client_secret' => ['sometimes', 'nullable', 'string', 'max:1000'],
```

## Step 7: Add Sign-In and Config Page Icon

Icons are centralized in **`frontend/components/provider-icons.tsx`**. SSO buttons (`sso-buttons.tsx`) and the SSO config page both use `ProviderIcon` from this file. Add your provider's icon so sign-in, register, and Configuration > SSO show the correct icon (not the generic `key` icon).

1. Open `frontend/components/provider-icons.tsx`.
2. Add your provider to the `ProviderIconId` type (optional; `string` is accepted).
3. Add an entry to **`SSO_ICONS`** (or `ALL_ICONS` if you prefer a single map) with the same key as `config/sso.php` (e.g. `example`):

```tsx
// In SSO_ICONS (or ALL_ICONS), add:
example: (className) =>
  renderSvg(
    className,
    <path d="M... your SVG path from official brand assets ..." />
  ),
```

Use the same key as `config/sso.php` (e.g. `example`). The `icon` value returned by `GET /auth/sso/providers` comes from `config/sso.php`; unknown keys fall back to the `key` icon. See [Patterns: ProviderIcon](patterns.md#providericon-pattern) and the inline comments in `provider-icons.tsx`.

## Step 8: Add SSO Setup Page Form

In `frontend/app/(dashboard)/configuration/sso/page.tsx` (the **SSO setup page** at Configuration > SSO):

1. Add the provider to the `providers` array:

```ts
const providers = [
  // ... existing ...
  { id: "example", label: "Example", clientIdKey: "example_client_id" as const, clientSecretKey: "example_client_secret" as const },
];
```

2. Add the keys to the Zod schema and default values (and to the `fetchSettings` mapping if you use explicit keys).

The existing loop over `providers` will render a card for the new provider automatically.

## Step 9: Add Environment Variables

In `backend/.env.example` (and root `.env.example` if present):

```env
# Example SSO Provider
EXAMPLE_CLIENT_ID=
EXAMPLE_CLIENT_SECRET=
EXAMPLE_REDIRECT_URI=
```

## Checklist

### Backend

- [ ] Settings schema: `example_client_id` and `example_client_secret` in `sso` group (secret `encrypted => true`)
- [ ] ConfigServiceProvider: provider included in `injectSSOConfig()` (enabled flag + `services.{provider}.*`)
- [ ] `config/sso.php`: provider entry with name, icon, enabled, color
- [ ] `config/services.php`: provider entry with client_id, client_secret, redirect
- [ ] SSOSettingController: validation rules for new keys
- [ ] If custom driver: Socialite provider package installed and registered
- [ ] `.env.example`: EXAMPLE_CLIENT_ID, EXAMPLE_CLIENT_SECRET (and redirect if used)

### Frontend

- [ ] **Sign-in/register and SSO config:** Provider icon added to `frontend/components/provider-icons.tsx` (key must match `config/sso.php` icon)
- [ ] **SSO setup page:** Provider added to `providers` array in `frontend/app/(dashboard)/configuration/sso/page.tsx` (and schema/defaultValues if not driven by array)

### Testing

- [ ] Admin can set client ID/secret in Configuration > SSO (setup page)
- [ ] Provider appears with correct icon on **sign-in and register pages** when credentials are set (buttons come from `GET /auth/sso/providers`)
- [ ] Redirect to provider and callback complete successfully
- [ ] New user can register via SSO; existing user can link account (if allow_linking enabled)

## Existing Providers for Reference

| Provider | Schema keys | Socialite driver |
|----------|-------------|------------------|
| Google | google_client_id, google_client_secret | google |
| GitHub | github_client_id, github_client_secret | github |
| Microsoft | microsoft_client_* | microsoft |
| Apple | apple_client_* | apple |
| Discord | discord_client_* | discord |
| GitLab | gitlab_client_* | gitlab |
| OIDC | oidc_client_id, oidc_client_secret, oidc_issuer_url, oidc_provider_name | oidc (custom) |

## Related Documentation

- [ADR-003: SSO Provider Integration](../../adr/003-sso-provider-integration.md)
- [Env to Database Roadmap](../../plans/env-to-database-roadmap.md) (Phase 5: SSO settings migration)
