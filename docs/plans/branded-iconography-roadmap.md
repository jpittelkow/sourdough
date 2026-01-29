# Branded Iconography Roadmap

Add consistent branded icons/logos for third-party providers across the application.

**Priority**: LOW  
**Status**: Planned  
**Dependencies**: None

---

## Overview

Multiple areas of the application reference third-party providers that would benefit from branded iconography for visual clarity and better UX. This roadmap identifies all locations and provides a plan to implement consistent icons.

## Areas Requiring Provider Icons

### 1. SSO Providers (Configuration > SSO)

| Provider | Icon Status | Notes |
|----------|-------------|-------|
| Google | Exists (inline in `sso-buttons.tsx`) | Google "G" logo |
| GitHub | Exists (inline) | Octocat mark |
| Microsoft | Exists (inline) | Square logo |
| Apple | Exists (inline) | Apple logo |
| Discord | Exists (inline) | Clyde logo |
| GitLab | **Missing** | Tanuki logo needed |
| OIDC/Enterprise | Exists (inline) | Generic key icon |

**Files:**
- `frontend/components/auth/sso-buttons.tsx` - Login page SSO buttons
- `frontend/app/(dashboard)/configuration/sso/page.tsx` - SSO settings page

### 2. Notification Channels (Configuration > Notifications, User Preferences)

| Channel | Icon Status | Notes |
|---------|-------------|-------|
| Email | Missing | Envelope icon |
| Telegram | Missing | Telegram logo |
| Discord | Missing | Can reuse from SSO |
| Slack | Missing | Slack logo |
| SMS (Twilio) | Missing | Twilio logo or phone icon |
| SMS (Vonage) | Missing | Vonage logo or phone icon |
| Signal | Missing | Signal logo |
| Web Push | Missing | Bell/notification icon |
| FCM | Missing | Firebase logo |

**Files:**
- `frontend/app/(dashboard)/configuration/notifications/page.tsx` - Admin notification settings
- `frontend/app/(dashboard)/user/preferences/page.tsx` - User notification preferences (if exists)

### 3. LLM Providers (Configuration > LLM System)

| Provider | Icon Status | Notes |
|----------|-------------|-------|
| OpenAI | Missing | OpenAI logo |
| Anthropic (Claude) | Missing | Anthropic logo |
| Google (Gemini) | Missing | Gemini logo or Google AI |
| Ollama | Missing | Ollama logo |
| Azure OpenAI | Missing | Azure logo |
| AWS Bedrock | Missing | AWS logo |

**Files:**
- `frontend/app/(dashboard)/configuration/llm-system/page.tsx` - LLM settings page

### 4. Mail Providers (Configuration > Email)

| Provider | Icon Status | Notes |
|----------|-------------|-------|
| SMTP | Missing | Generic mail server icon |
| Mailgun | Missing | Mailgun logo |
| SendGrid | Missing | SendGrid logo |
| Amazon SES | Missing | AWS/SES logo |
| Postmark | Missing | Postmark logo |

**Files:**
- `frontend/app/(dashboard)/configuration/email/page.tsx` - Email settings page

### 5. Backup Destinations (Configuration > Backup, if exists)

| Destination | Icon Status | Notes |
|-------------|-------------|-------|
| Local | Missing | Folder/disk icon |
| S3 | Missing | AWS S3 logo |
| SFTP | Missing | Server/upload icon |

**Files:**
- TBD - Backup configuration page

---

## Implementation Plan

### Phase 1: Create Shared Icon Infrastructure

- [ ] Create `frontend/components/provider-icons.tsx` with all provider icons
- [ ] Use inline SVGs for flexibility (no external image files needed)
- [ ] Support size prop (sm, md, lg)
- [ ] Ensure icons work in both light and dark themes
- [ ] Use official brand colors where appropriate
- [ ] Export individual icon components and a generic `ProviderIcon` lookup component

### Phase 2: Consolidate Existing Icons

- [ ] Extract icons from `sso-buttons.tsx` into shared component
- [ ] Add missing GitLab icon
- [ ] Refactor `sso-buttons.tsx` to use shared icons
- [ ] Test SSO login buttons still display correctly

### Phase 3: SSO Settings Page

- [ ] Add provider icons to SSO settings page card headers
- [ ] Display icon alongside provider name in each card

### Phase 4: Notification Settings

- [ ] Add channel icons to notification configuration sections
- [ ] Add channel icons to user preferences page

### Phase 5: LLM Settings

- [ ] Add provider icons to LLM configuration sections
- [ ] Display icon alongside provider name

### Phase 6: Email Settings

- [ ] Add provider icons to mail provider selection/display

### Phase 7: Backup Settings (Future)

- [ ] Add destination icons when backup UI is implemented

---

## Icon Sources & Guidelines

### Brand Logo Guidelines

- Use official SVG logos where available
- Simplify complex logos for small display sizes
- Ensure sufficient contrast in both light and dark modes
- For monochrome contexts, use `currentColor` fill
- For branded contexts, use official brand colors

### Generic Icon Guidelines

For services without distinct branding or for generic categories:
- Use Lucide icons where appropriate (already in project)
- Keep style consistent with existing UI

### Existing Icons in Project

The project already uses Lucide React icons. Check if any needed icons exist there before creating custom SVGs.

---

## Files to Create

```
frontend/components/provider-icons.tsx  (shared icon component)
```

## Files to Modify

```
frontend/components/auth/sso-buttons.tsx
frontend/app/(dashboard)/configuration/sso/page.tsx
frontend/app/(dashboard)/configuration/notifications/page.tsx
frontend/app/(dashboard)/configuration/llm-system/page.tsx
frontend/app/(dashboard)/configuration/email/page.tsx
```

---

## Related Roadmaps

- [SSO Settings Enhancement](sso-settings-enhancement-roadmap.md) - Phase 4 references this roadmap for SSO icons
