# Collapsible Settings UI Roadmap

Implement collapsible sections in configuration, settings, and preferences pages to organize provider/setting groups and save screen space.

## Background

Currently, settings pages like LLM Providers, Notifications, and SSO display all providers/sections expanded at once. As more providers are added, these pages become long and harder to navigate. Collapsible sections would:

- Reduce visual clutter
- Allow users to focus on one provider at a time
- Make pages more manageable on smaller screens
- Provide a consistent pattern across all configuration pages

## Goals

1. **Collapsible provider sections** - Each provider card/section can expand/collapse
2. **Consistent UX** - Same collapsible pattern across all config pages
3. **Persistence** - Remember which sections are expanded (optional)
4. **Accessibility** - Proper keyboard navigation and ARIA attributes
5. **Mobile-friendly** - Works well on responsive layouts

## Affected Pages

| Page | Section Type | Current State |
|------|--------------|---------------|
| `/configuration/llm-system` | LLM Providers (OpenAI, Anthropic, Google, etc.) | All expanded |
| `/configuration/notifications` | Notification Channels (Email, Slack, Discord, etc.) | All expanded |
| `/configuration/sso` | SSO Providers (Google, GitHub, Microsoft, etc.) | All expanded |
| `/configuration/backup` | Backup Providers (Local, S3, etc.) | All expanded |
| `/configuration/email` | SMTP settings | Single section |
| `/user/profile` | User preferences sections | Mixed |

## Phase 1: Create Collapsible Component

Create a reusable collapsible/accordion component using shadcn/ui.

- [ ] Evaluate using shadcn/ui `Accordion` or `Collapsible` component
- [ ] Create wrapper component if needed for consistent styling
- [ ] Support single-expand vs multi-expand modes
- [ ] Add smooth expand/collapse animations
- [ ] Include expand/collapse icon indicator (chevron)
- [ ] Support custom header content (icon, title, status badge)

**Files to create/modify:**
- `frontend/components/ui/collapsible-card.tsx` (or use existing shadcn component)

## Phase 2: LLM Providers Page

Apply collapsible sections to the LLM System settings page.

- [ ] Wrap each LLM provider (OpenAI, Anthropic, Google, Ollama, etc.) in collapsible
- [ ] Show provider name and enabled/disabled status in collapsed header
- [ ] Collapse all by default, expand on click
- [ ] Keep provider icon visible in collapsed state
- [ ] Ensure save functionality works for collapsed sections

**Files to modify:**
- `frontend/app/(dashboard)/configuration/llm-system/page.tsx`

## Phase 3: Notification Settings Page

Apply collapsible sections to the Notifications configuration page.

- [ ] Wrap each notification channel in collapsible
- [ ] Show channel name and enabled/disabled status in header
- [ ] Include channel icon in collapsed state
- [ ] Group related settings logically within each collapsible

**Files to modify:**
- `frontend/app/(dashboard)/configuration/notifications/page.tsx`

## Phase 4: SSO Providers Page

Apply collapsible sections to the SSO configuration page.

- [ ] Wrap each SSO provider in collapsible
- [ ] Show provider name, logo, and configured status in header
- [ ] Consider "Setup required" vs "Configured" visual indicators

**Files to modify:**
- `frontend/app/(dashboard)/configuration/sso/page.tsx`

## Phase 5: Backup Settings Page

Apply collapsible sections to the Backup configuration page.

- [ ] Wrap each backup provider/location in collapsible
- [ ] Show provider name and status in header

**Files to modify:**
- `frontend/app/(dashboard)/configuration/backup/page.tsx`

## Phase 6: User Preferences Page

Review and apply collapsible sections to user profile/preferences if beneficial.

- [ ] Evaluate which sections benefit from collapsible UI
- [ ] Apply consistently with other pages

**Files to modify:**
- `frontend/app/(dashboard)/user/profile/page.tsx`

## Phase 7: State Persistence (Optional)

Remember which sections users have expanded.

- [ ] Store expanded state in localStorage per page
- [ ] Restore state on page load
- [ ] Consider per-user database storage for cross-device sync (future)

## Phase 8: Testing & Polish

- [ ] Test keyboard navigation (Enter/Space to toggle)
- [ ] Verify ARIA attributes for accessibility
- [ ] Test on mobile viewports
- [ ] Ensure forms within collapsed sections validate correctly
- [ ] Test that save actions work regardless of collapsed state

## Phase 9: Documentation

- [ ] Update `docs/ai/patterns.md` with collapsible settings pattern
- [ ] Update relevant recipes if configuration page structure changes
- [ ] Document component usage in code comments

**Files to update:**
- `docs/ai/patterns.md`
- `docs/features.md` (mention UI improvement)

## Dependencies

- None (can start immediately)

## Priority

**LOW** - UI enhancement for better organization, not blocking other features

## Success Criteria

1. All multi-provider configuration pages use collapsible sections
2. Collapsible behavior is consistent across all pages
3. Collapsed headers show enough info to identify the section (name, icon, status)
4. Sections can be expanded/collapsed without affecting save functionality
5. Accessible via keyboard (Tab, Enter/Space)
6. Smooth animations on expand/collapse
7. Works well on mobile devices
