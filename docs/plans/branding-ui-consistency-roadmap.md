# Branding & UI Consistency Roadmap

Refactor header, logo placement, create app icon for collapsed sidebar, and ensure consistent app name usage throughout the application.

**Priority**: HIGH  
**Status**: Active Development  
**Last Updated**: 2026-01-27

**Dependencies**:
- ~~[Settings Restructure](settings-restructure-roadmap.md)~~ ✅ Complete - Configuration page structure for `/configuration/branding`

---

## Task Checklist

### Header Refactor (HIGH Priority) ✅ COMPLETE
- [x] Remove theme toggle from header (moved to user preferences)
- [x] Audit current header layout and identify improvements
- [x] Redesign header component for better UX
- [x] Improve logo placement and sizing
- [x] Ensure header is responsive across all breakpoints
- [x] Update header styles to match overall design system

### Logo & App Icon (HIGH Priority) - Partial
- [x] Create app icon variant for collapsed sidebar
- [ ] Add favicon and PWA icons (multiple sizes)
- [x] Ensure logo scales appropriately in all contexts
- [x] Create logo component that handles different display modes (full, icon-only)
- [ ] Add logo to sign-in page and authentication screens

### App Name Consistency (MEDIUM Priority) - In Progress
- [x] Create centralized app name configuration (single source of truth)
- [ ] Make app name dynamic from system settings (not just env vars)
- [ ] Use app name from settings when no logo is present
- [ ] Update sign-in page to use configured app name
- [ ] Update sign-up/registration pages to use configured app name
- [ ] Update password reset pages to use configured app name
- [ ] Update email templates to use configured app name
- [ ] Update page titles to include page name (e.g., "Recipes | Sourdough", "Dashboard | Sourdough")
- [ ] Update meta tags to use configured app name
- [ ] Update any hardcoded "Sourdough" references throughout codebase
- [ ] Add app name to footer (if applicable)

### System Settings Defaults (MEDIUM Priority) ✅ COMPLETE
- [x] Make Application URL field optional (not required) in System Settings
- [x] Default Application Name to "Sourdough" when empty
- [x] Update validation schema to allow empty/optional app_url
- [x] Ensure backend handles missing app_url gracefully

### Theme & Color Customization (HIGH Priority)
- [ ] Add primary color picker to branding configuration
- [ ] Add secondary color picker to branding configuration
- [ ] Apply primary/secondary colors throughout the app (buttons, links, accents)
- [ ] Remove default dark mode (make light mode the default)
- [ ] Ensure theme colors work in both light and dark modes
- [ ] Store color preferences in database/settings

### Logo & Branding Configuration (HIGH Priority)
- [ ] Verify logo upload functionality works correctly
- [ ] Verify logo URLs are correctly generated and accessible
- [ ] Test logo display across all pages (header, sidebar, auth pages)
- [ ] Add app name setting to system configuration page
- [ ] Add logo upload to branding configuration
- [ ] Add app icon upload to branding configuration
- [ ] Add favicon upload/configuration
- [ ] Persist branding settings to database

### Typography - Header Fonts (MEDIUM Priority)
- [ ] Add Newsreader font from Google Fonts
- [ ] Refactor header components to use Newsreader for headings
- [ ] Update typography configuration/CSS variables
- [ ] Ensure font loads correctly (preload, fallbacks)
- [ ] Test typography across all pages and components

### Configuration Integration (MEDIUM Priority)
- [x] Create branding configuration page at `/configuration/branding`
- [ ] Add live preview for branding changes
- [ ] Support custom CSS injection (advanced)
- [ ] Add reset to defaults option

---

## Current State

**Completed (2026-01-27)**:
- Header refactored with Logo component (removed Settings icon, uses centralized config)
- Logo component created with full/icon/text variants and automatic fallbacks
- Sidebar shows icon variant when collapsed, full variant when expanded
- Centralized app configuration at `frontend/config/app.ts`
- Environment variables for app name customization

**In Progress (2026-01-27)**:
- Making app name dynamic from system settings (not just env vars)
- App name from settings will be used when no logo is present
- Creating app-config context/hook to fetch settings from API

**Remaining Problems**:
- ~~Header layout may need improvements for better UX~~ ✅ Fixed
- ~~Collapsed sidebar lacks proper app icon representation~~ ✅ Fixed
- App name is static (env vars only) - needs to be dynamic from system settings
- App name should be used from settings when no logo is present
- App name hardcoded in auth pages (login, register, password reset)
- Sign-in and other pages do not display app branding/logo
- Dark mode is currently the default (should be light mode)
- No color customization options for primary/secondary colors
- Logo upload functionality needs verification
- Header fonts need to be refactored to use Newsreader font
- ~~Application URL is required in System Settings (should be optional)~~ ✅ Fixed
- ~~Application Name has no default value (should default to "Sourdough")~~ ✅ Fixed

**Key Files**:
- `frontend/config/app.ts` - Centralized app configuration (NEW)
- `frontend/components/logo.tsx` - Logo component with variants (NEW)
- `frontend/components/header.tsx` - Refactored header
- `frontend/components/sidebar.tsx` - Updated sidebar with logo
- `frontend/app/(auth)/login/page.tsx` - Sign-in page (needs branding)
- `frontend/app/(auth)/register/page.tsx` - Registration page (needs branding)
- `frontend/components/theme-provider.tsx` - Theme defaults
- `frontend/app/globals.css` - CSS color variables
- `frontend/app/(dashboard)/configuration/system/page.tsx` - System Settings (app_url/app_name defaults)

---

## Proposed Implementation

### 1. Centralized App Configuration

Create a configuration file/context for app-wide branding:

```typescript
// frontend/config/app.ts
export const APP_CONFIG = {
  name: process.env.NEXT_PUBLIC_APP_NAME || 'Sourdough',
  shortName: process.env.NEXT_PUBLIC_APP_SHORT_NAME || 'SD',
  logo: '/images/logo.svg',
  icon: '/images/icon.svg',  // For collapsed sidebar
  favicon: '/favicon.ico',
  colors: {
    primary: process.env.NEXT_PUBLIC_PRIMARY_COLOR || '#3b82f6',    // Blue
    secondary: process.env.NEXT_PUBLIC_SECONDARY_COLOR || '#6366f1', // Indigo
  },
  defaultTheme: 'light', // Changed from 'dark' to 'light'
};
```

### 2. Color Customization

Colors should be stored and applied via CSS variables:

```css
/* frontend/app/globals.css */
:root {
  --primary: var(--custom-primary, 221.2 83.2% 53.3%);
  --secondary: var(--custom-secondary, 210 40% 96.1%);
}
```

**Color Picker Component**:
```typescript
// frontend/components/color-picker.tsx
import { HexColorPicker } from 'react-colorful';

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
}
```

### 2. Logo Component

Create a flexible logo component:

```typescript
// frontend/components/logo.tsx
interface LogoProps {
  variant: 'full' | 'icon' | 'text';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Logo({ variant, size = 'md', className }: LogoProps) {
  // Render appropriate logo variant
}
```

### 3. Header Improvements

- Review and improve header spacing and alignment
- Ensure proper visual hierarchy
- Add user dropdown integration (per settings-restructure-roadmap)
- Improve mobile responsiveness

### 4. Sidebar Icon Mode

When sidebar is collapsed:
- Show app icon instead of full logo
- Icon should be recognizable at small sizes
- Maintain consistent branding feel

### 5. Auth Page Updates

Update all authentication pages to use centralized branding:
- Sign-in page: Logo + app name prominently displayed
- Sign-up page: Consistent branding with sign-in
- Password reset: Same branding treatment
- Email verification: Branded messaging

---

## Implementation Plan

### Phase 1: Configuration & Logo Component

1. **Create app configuration**
   - Add `frontend/config/app.ts` with branding constants
   - Add environment variables for customization
   - Create TypeScript types for configuration

2. **Create Logo component**
   - Support multiple variants (full, icon, text-only)
   - Support multiple sizes
   - Use app configuration for values

### Phase 2: Header & Sidebar Refactor

1. **Update header**
   - Import and use Logo component
   - Review and improve layout
   - Ensure responsive behavior

2. **Update sidebar**
   - Use Logo component with variant switching
   - Show `icon` variant when collapsed
   - Show `full` variant when expanded

### Phase 3: App Name Consistency

1. **Update auth pages**
   - Sign-in, sign-up, password reset pages
   - Use app name from configuration
   - Add logo to auth pages

2. **Update page metadata**
   - Page titles: Include page name with app name (e.g., "Recipes | Sourdough", "Dashboard | Sourdough")
   - All pages should follow consistent title format: "{Page Name} | {App Name}"
   - Meta descriptions with app name
   - Open Graph tags

3. **Search and replace**
   - Find all hardcoded "Sourdough" references
   - Replace with configuration value where appropriate

### Phase 4: Theme & Color Customization

1. **Remove default dark mode**
   - Update theme provider to default to light mode
   - Ensure user preference is respected if set
   - Update any hardcoded dark mode defaults

2. **Implement color picker**
   - Add primary color picker component to branding settings
   - Add secondary color picker component
   - Use a color picker library (e.g., react-colorful, @radix-ui/react-color)

3. **Apply colors throughout app**
   - Update CSS variables for primary/secondary colors
   - Ensure buttons, links, accents use theme colors
   - Test color contrast for accessibility

### Phase 5: Typography - Newsreader Font

1. **Add Newsreader font**
   - Import Newsreader from Google Fonts via `next/font/google`
   - Configure font weights (400, 500, 600, 700 as needed)
   - Set up proper fallback fonts

2. **Update typography styles**
   - Create CSS variables for header font family
   - Apply Newsreader to h1, h2, h3, h4, h5, h6 elements
   - Update any component-specific heading styles

3. **Test and verify**
   - Ensure font loads without layout shift (preload)
   - Test on all pages with headings
   - Verify readability and visual consistency

### Phase 6: Branding Configuration Page

1. **Create branding settings page**
   - Route: `/configuration/branding`
   - Sections: Logo, Colors, Theme

2. **Verify existing functionality**
   - Test logo upload end-to-end
   - Verify logo URLs are correctly served
   - Check logo display on all pages

3. **Add live preview**
   - Preview branding changes before saving
   - Show preview in a mock header/sidebar component

---

## Files to Create

**Created Files** ✅:
- `frontend/config/app.ts` - App configuration constants
- `frontend/components/logo.tsx` - Flexible logo component
- `frontend/public/images/.gitkeep` - Directory for future logo uploads

**Still Needed**:
- `frontend/components/color-picker.tsx` - Color picker component for branding settings
- `public/images/icon.svg` - App icon (optional - text fallback works)

**Modified Files** ✅:
- `frontend/components/header.tsx` - Uses Logo component, improved layout
- `frontend/components/sidebar.tsx` - Uses Logo component with variants
- `.env.example` - Added branding variables

**Still Need Modification**:
- `frontend/lib/app-config.ts` - **NEW** - Context/hook to fetch app name and logo from settings API
- `frontend/config/app.ts` - Update to support dynamic values from settings
- `frontend/components/logo.tsx` - Use dynamic app name from settings when no logo
- `frontend/components/providers.tsx` - Add AppConfigProvider
- `frontend/app/page.tsx` - Use dynamic app name instead of hardcoded "Sourdough"
- `frontend/app/layout.tsx` - Use dynamic app name in metadata (with SSR-safe defaults)
- `frontend/components/theme-provider.tsx` - Change default theme to light
- `frontend/app/globals.css` - Add CSS variables for primary/secondary colors and header font
- `frontend/app/(auth)/login/page.tsx` - Add branding
- `frontend/app/(auth)/register/page.tsx` - Add branding
- ~~`frontend/app/(dashboard)/configuration/system/page.tsx` - Make app_url optional, default app_name to "Sourdough"~~ ✅ Complete

**Dependencies to Add**:
- `react-colorful` - Lightweight color picker component (or alternative)

---

## Environment Variables

```env
# App Branding
NEXT_PUBLIC_APP_NAME=Sourdough
NEXT_PUBLIC_APP_SHORT_NAME=SD

# Theme Colors (hex values)
NEXT_PUBLIC_PRIMARY_COLOR=#3b82f6
NEXT_PUBLIC_SECONDARY_COLOR=#6366f1

# Default theme (light or dark)
NEXT_PUBLIC_DEFAULT_THEME=light
```

---

## Related Roadmaps

- [Settings Restructure Roadmap](settings-restructure-roadmap.md) - Branding section in configuration
- [Integration Settings Roadmap](integration-settings-roadmap.md) - Theming options
