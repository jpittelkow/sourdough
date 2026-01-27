# Integration Settings Roadmap

Integration and configuration settings for external services and customization.

**Priority**: MEDIUM  
**Status**: Planned (waiting on foundation work)  
**Last Updated**: 2026-01-27

**Dependencies**:
- [Settings Restructure](settings-restructure-roadmap.md) - Configuration page structure
- [Env to Database Migration](env-to-database-roadmap.md) - Database-stored settings for credentials

---

## Task Checklist

- [ ] Add SSO/Authentication provider configuration UI
- [ ] Add Email/SMTP configuration settings UI
- [ ] Add Storage Settings for upload policies and stats
- [ ] Create API tokens and webhook management settings
- [ ] Add Theme/Branding customization settings

---

## 1. SSO/Authentication Configuration (HIGH VALUE)

**Purpose**: Configure Single Sign-On providers through the UI without requiring environment variable changes and redeploy.

**Features**:
- Enable/disable individual SSO providers
- Configure OAuth credentials per provider
- Test connection functionality
- Callback URL display/copy for easy provider setup
- Provider status indicators (configured, enabled, disabled)

### Supported SSO Providers

| Provider | Type | Required Fields |
|----------|------|-----------------|
| **Google** | OAuth 2.0 | Client ID, Client Secret |
| **GitHub** | OAuth 2.0 | Client ID, Client Secret |
| **Microsoft** | OAuth 2.0 / Azure AD | Client ID, Client Secret, Tenant ID (optional) |
| **Apple** | OAuth 2.0 | Client ID, Team ID, Key ID, Private Key |
| **Discord** | OAuth 2.0 | Client ID, Client Secret |
| **GitLab** | OAuth 2.0 | Client ID, Client Secret, GitLab URL (for self-hosted) |
| **Generic OIDC** | OpenID Connect | Client ID, Client Secret, Issuer URL, Scopes |

### Provider Configuration Fields

**Standard OAuth Providers** (Google, GitHub, Discord):
- Client ID
- Client Secret (encrypted storage)
- Enabled toggle
- Callback URL (auto-generated, read-only display)

**Microsoft/Azure AD**:
- Client ID
- Client Secret (encrypted storage)
- Tenant ID (optional - for single-tenant apps)
- Enabled toggle
- Callback URL

**Apple Sign-In**:
- Client ID (Services ID)
- Team ID
- Key ID
- Private Key (.p8 file content, encrypted)
- Enabled toggle
- Callback URL

**GitLab** (supports self-hosted):
- Client ID
- Client Secret (encrypted storage)
- GitLab URL (default: https://gitlab.com)
- Enabled toggle
- Callback URL

**Generic OIDC** (for any OIDC-compliant provider):
- Provider Name (display name)
- Client ID
- Client Secret (encrypted storage)
- Issuer URL (e.g., https://auth.example.com)
- Scopes (default: openid profile email)
- Enabled toggle
- Callback URL

### UI Components

**Provider List View**:
- Card or table for each supported provider
- Status badge: Configured ✓, Not Configured, Disabled
- Quick enable/disable toggle
- Configure button → opens modal/drawer

**Provider Configuration Modal**:
- Form fields based on provider type
- Callback URL with copy button
- Test Connection button
- Save / Cancel actions
- Delete configuration option

**Callback URL Helper**:
- Auto-generate correct callback URL based on APP_URL
- Format: `{APP_URL}/api/auth/callback/{provider}`
- Copy button for easy pasting into provider console

### Implementation Scope

**Route**: `/configuration/sso` or `/configuration/authentication`

**Backend**:
- `SsoProviderController.php` - CRUD for SSO configs
- `SsoProviderService.php` - Provider configuration service
- Store configs in `settings` table with encryption for secrets
- Update `config/sso.php` to read from database with env fallback

**Frontend**:
- Provider list component with status indicators
- Provider configuration forms (dynamic based on type)
- Callback URL display with copy functionality

**Database Storage**:
```
settings table:
- group: 'sso'
- key: '{provider}_client_id', '{provider}_client_secret', '{provider}_enabled', etc.
- value: encrypted for secrets
```

### Security Considerations

- All secrets (client secrets, private keys) stored encrypted
- Admin-only access to SSO configuration
- Audit log for SSO config changes
- Never expose full secrets in API responses (mask as `****...****`)
- Validate callback URLs match configured APP_URL

**Current state**: SSO is env-only via `config/sso.php` and individual provider env vars.

---

## 2. Email/SMTP Configuration (MEDIUM VALUE)

**Purpose**: Configure email delivery without requiring environment variable changes and redeploy.

**Features**:
- SMTP server settings
- Email provider selection with provider-specific configuration
- Test email functionality
- Email templates preview
- From address and name configuration

### Supported Email Providers

| Provider | Type | Notes |
|----------|------|-------|
| **SMTP (Generic)** | SMTP | Any SMTP server (self-hosted, ISP, etc.) |
| **SendGrid** | API | Popular transactional email service |
| **Mailgun** | API | Developer-friendly with good deliverability |
| **Mailtrap** | SMTP/API | Testing/staging environment emails |
| **AWS SES** | API | Cost-effective at scale, requires AWS setup |
| **Postmark** | API | Focused on transactional email delivery |
| **Resend** | API | Modern developer-first email API |
| **Brevo (Sendinblue)** | API | Marketing + transactional combined |
| **SparkPost** | API | Enterprise-grade deliverability |
| **Mandrill (Mailchimp)** | API | Mailchimp's transactional service |

### Provider Configuration Fields

**Generic SMTP**:
- Host, Port, Encryption (TLS/SSL/None)
- Username, Password
- From address, From name

**API-based Providers** (SendGrid, Mailgun, AWS SES, etc.):
- API Key (encrypted storage)
- Region/Domain (provider-specific)
- From address, From name

**Mailtrap** (Development/Testing):
- Inbox credentials (SMTP)
- API token (for Email Testing API)
- Project/Inbox selection

**Current state**: Email is env-only via `config/mail.php`.

**Implementation scope**:
- New route: `/configuration/email`
- Backend: Store email config in system settings (encrypted)
- Frontend: Form-based configuration with test email button
- Dynamic form fields based on selected provider
- Support multiple email providers with dynamic configuration
- Provider health check / connection test

**Security considerations**:
- Encrypt sensitive credentials (API keys, passwords)
- Store in system settings table with encryption
- Allow admin-only access
- Never expose credentials in API responses

---

## 3. Storage Settings (LOW-MEDIUM VALUE)

**Purpose**: Configure file storage and upload policies.

**Features**:
- Storage driver selection (local, S3, etc.)
- Upload size limits
- Allowed file types
- Storage usage statistics
- Cleanup policies

**Implementation scope**:
- New route: `/configuration/storage`
- Backend: Storage configuration and statistics endpoint
- Frontend: Storage settings form and usage dashboard

**Database schema**:

```
storage_settings:
- driver (local, s3, etc.)
- max_file_size (bytes)
- allowed_extensions (JSON array)
- s3_bucket (nullable)
- s3_region (nullable)
- cleanup_after_days (nullable)
```

---

## 4. API/Webhook Settings (LOW-MEDIUM VALUE)

**Purpose**: Manage API tokens and outgoing webhooks.

**Features**:
- Personal API token management
- Webhook endpoint configuration
- Webhook event selection
- Webhook delivery logs

**Implementation scope**:
- New route: `/configuration/api`
- Backend: API token generation/revocation, webhook management
- Frontend: Token list, webhook configuration UI

**Database schema**:

```
personal_access_tokens (Laravel Sanctum - may already exist):
- id
- tokenable_type
- tokenable_id
- name
- token (hashed)
- abilities (JSON)
- last_used_at
- expires_at
- created_at

webhooks:
- id
- user_id
- url
- events (JSON array)
- secret
- active
- last_triggered_at
- created_at
```

---

## 5. Theme/Branding Settings (LOW VALUE)

**Purpose**: Visual customization without code changes.

**Features**:
- Logo upload
- Primary color customization
- Dark mode defaults
- Custom CSS injection

**Implementation scope**:
- New route: `/configuration/branding`
- Backend: File upload for logo, store theme settings
- Frontend: Theme customization UI with live preview

**Storage considerations**:
- Store logo in public storage
- Store theme colors in system settings
- Custom CSS stored as text in settings (with validation)

---

## Implementation Priority

| Feature | Priority | Effort | Value | Recommended Order |
|---------|----------|--------|-------|-------------------|
| SSO Configuration | HIGH | Medium | High | 1 |
| Email Configuration | MEDIUM | Medium | Medium | 2 |
| Storage Settings | LOW-MEDIUM | Medium | Medium | 3 |
| API/Webhooks | LOW-MEDIUM | High | Medium | 4 |
| Theme/Branding | LOW | Low | Low | 5 |

---

## Files Reference

**Backend**:
- `backend/config/sso.php` - Current SSO configuration
- `backend/config/mail.php` - Current email configuration
- `backend/config/filesystems.php` - Storage configuration
- `backend/app/Http/Controllers/Api/SettingController.php` - Generic settings

**Backend** (to be created):
- `backend/app/Http/Controllers/Api/SsoProviderController.php` - SSO provider CRUD
- `backend/app/Services/SsoProviderService.php` - SSO configuration service

**Frontend**:
- `frontend/app/(dashboard)/settings/` - Settings pages structure

**Frontend** (to be created):
- `frontend/app/(dashboard)/configuration/sso/page.tsx` - SSO settings page
- `frontend/components/configuration/SsoProviderCard.tsx` - Provider configuration card

**Documentation**:
- `docs/adr/012-admin-only-settings.md` - Admin-only settings decision
