# Auth UI Redesign Roadmap

Modernize the login, registration, and related authentication pages with improved visual design and UX.

**Priority**: MEDIUM  
**Status**: Completed (Core Done)  
**Last Updated**: 2026-01-29

**Remaining Work**: Optional visual polish (illustrations, page transitions, cross-browser testing)

---

## Overview

Update the authentication pages (login, register, forgot password, reset password, verify email) with a modern, polished design that creates a strong first impression and improves usability.

## Current State

- [x] Functional auth pages with form validation
- [x] SSO buttons integration
- [x] Two-factor authentication flow
- [x] Responsive centered card layout
- [x] Modern visual design (gradient + glassmorphism card)
- [ ] Engaging imagery/illustrations
- [x] Password strength indicator
- [x] Enhanced form interactions (password toggle, email availability)

## Auth Pages

| Page | File |
|------|------|
| Login | `frontend/app/(auth)/login/page.tsx` |
| Register | `frontend/app/(auth)/register/page.tsx` |
| Forgot Password | `frontend/app/(auth)/forgot-password/page.tsx` |
| Reset Password | `frontend/app/(auth)/reset-password/page.tsx` |
| Verify Email | `frontend/app/(auth)/verify-email/page.tsx` |
| Layout | `frontend/components/auth/auth-page-layout.tsx` |

## Phase 1: Layout Redesign

Update the `AuthPageLayout` with a modern split-screen or enhanced card design.

### Option A: Split-Screen Layout

- [ ] Left panel: Branding, illustration, or feature highlights
- [ ] Right panel: Auth form
- [ ] Responsive: Stack on mobile

### Option B: Enhanced Card Layout

- [x] Subtle background pattern or gradient
- [x] Card with shadow and rounded corners
- [ ] Animated background elements (optional)

### Tasks

- [x] Design mockup/decision on layout approach
- [x] Update `AuthPageLayout` component
- [x] Add background styling (gradient, pattern, or illustration)
- [x] Improve spacing and typography
- [x] Add subtle animations on load

## Phase 2: Form Enhancements

Improve the form UX and visual feedback.

### Tasks

- [x] Password visibility toggle (show/hide password)
- [x] Password strength indicator on registration
  - [x] Visual bar showing weak/medium/strong
  - [x] Requirements checklist (8+ chars, uppercase, number, etc.)
- [ ] Improved input styling with icons (email icon, lock icon)
- [x] Better focus states and transitions
- [x] Inline validation feedback (real-time email availability)
- [x] Loading states with skeleton/shimmer (SSO redirect)

## Phase 3: Visual Polish

Add visual elements that create a memorable experience.

### Tasks

- [ ] Custom illustrations or graphics
  - [ ] Option: Abstract shapes/patterns
  - [ ] Option: Character illustrations
  - [ ] Option: Product screenshots
- [ ] Smooth page transitions between auth pages
- [ ] Micro-interactions (button hover, input focus)
- [ ] Dark mode optimization
- [ ] Brand-consistent color usage

## Phase 4: SSO & Social Login

Enhance the SSO button presentation.

### Tasks

- [x] Improved SSO button styling with provider logos
- [x] Better visual hierarchy (SSO vs email login)
- [x] "Continue with" language consistency
- [x] Loading states for SSO redirects

## Phase 5: Accessibility & Polish

Final accessibility and cross-browser polish.

### Tasks

- [x] ARIA labels and screen reader testing
- [x] Keyboard navigation testing
- [x] Focus management (autofocus, tab order)
- [x] Error announcement for screen readers
- [ ] Cross-browser testing
- [x] Mobile touch target sizes (48x48 min for SSO buttons)

## Design Inspiration

Modern auth page patterns to consider:

1. **Split-screen**: Form on one side, branding/illustration on other (Linear, Notion)
2. **Gradient backgrounds**: Subtle gradients with glassmorphism card (Stripe)
3. **Illustration-heavy**: Friendly illustrations alongside form (Slack, Dropbox)
4. **Minimal**: Clean white/dark with strong typography (Apple)
5. **Animated**: Subtle background animations or particles (Vercel)

## Key Files

| File | Changes |
|------|---------|
| `frontend/components/auth/auth-page-layout.tsx` | Major layout redesign |
| `frontend/components/auth/sso-buttons.tsx` | Enhanced styling |
| `frontend/components/auth/auth-divider.tsx` | Visual update |
| `frontend/components/ui/password-input.tsx` | New: password toggle |
| `frontend/components/ui/password-strength.tsx` | New: strength indicator |
| `frontend/app/(auth)/login/page.tsx` | Use new components |
| `frontend/app/(auth)/register/page.tsx` | Use new components |
| `frontend/app/(auth)/forgot-password/page.tsx` | Visual updates |
| `frontend/app/(auth)/reset-password/page.tsx` | Visual updates |
| `frontend/app/(auth)/verify-email/page.tsx` | Visual updates |

## Dependencies

- None (uses existing shadcn/ui components)
- Optional: Illustration library or custom graphics

## Success Criteria

- [ ] Lighthouse accessibility score 90+
- [ ] Consistent with overall app branding
- [ ] Mobile-first responsive design
- [ ] Positive user feedback on visual design
- [ ] No regression in form functionality
