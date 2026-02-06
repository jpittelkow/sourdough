# Changelog Page Roadmap

Add a user-facing changelog page in the frontend so users can see what's new, what changed, and what was fixed across application versions.

**Priority**: MEDIUM  
**Status**: Not Started  
**Last Updated**: 2026-02-05

**Dependencies**:
- [Versioning System](versioning-system-roadmap.md) - Version numbers, VERSION file, release workflow (Phases 1-3 complete)

---

## Task Checklist

### Phase 1: Backend - Changelog Data Source (HIGH Priority)
- [ ] Create a `CHANGELOG.md` file in the project root (or use existing if present)
- [ ] Create a backend API endpoint (`GET /api/changelog`) that serves changelog entries
- [ ] Decide on data format: parse `CHANGELOG.md` (Keep a Changelog format) or use structured JSON/database
- [ ] Support pagination for large changelogs
- [ ] Include version number, date, and categorized entries (Added, Changed, Fixed, Removed, Security)

### Phase 2: Frontend - Changelog Page (HIGH Priority)
- [ ] Create changelog page at `frontend/app/(dashboard)/changelog/page.tsx`
- [ ] Display changelog entries grouped by version with release dates
- [ ] Use categorized sections (New Features, Improvements, Bug Fixes, Security)
- [ ] Style with existing UI components (cards, badges for categories)
- [ ] Mobile-responsive layout (mobile-first CSS)
- [ ] Add loading and empty states

### Phase 3: Navigation & Discovery (MEDIUM Priority)
- [ ] Add "What's New" or "Changelog" link to the sidebar or user menu
- [ ] Consider a notification badge/dot when there are unread changelog entries (entries newer than user's last visit)
- [ ] Add changelog to the search index (searchable via Cmd+K)
- [ ] Add page to `search-pages.ts` for static page search

### Phase 4: Release Integration (LOW Priority)
- [ ] Auto-generate changelog entries from GitHub release notes (via release workflow)
- [ ] Update `CHANGELOG.md` automatically on release (ties into versioning roadmap Phase 3 optional task)
- [ ] Consider a "What's New" modal/banner on first login after an update

---

## Proposed Implementation

### Data Format (Keep a Changelog)

Use the [Keep a Changelog](https://keepachangelog.com/) format in `CHANGELOG.md`:

```markdown
# Changelog

## [1.2.0] - 2026-02-10

### Added
- Changelog page for users to see version history
- "What's New" indicator in sidebar

### Fixed
- Settings page layout on mobile devices

## [1.1.0] - 2026-02-01

### Added
- In-app documentation and help center
- PWA install prompt

### Changed
- Improved notification delivery reliability
```

### API Response

```json
{
  "data": [
    {
      "version": "1.2.0",
      "date": "2026-02-10",
      "categories": {
        "added": [
          "Changelog page for users to see version history",
          "\"What's New\" indicator in sidebar"
        ],
        "fixed": [
          "Settings page layout on mobile devices"
        ]
      }
    }
  ],
  "meta": {
    "current_page": 1,
    "last_page": 3
  }
}
```

### Frontend Page Structure

```
frontend/app/(dashboard)/changelog/page.tsx   # Main changelog page
```

Each version displayed as a card with:
- Version number badge and release date
- Categorized list items with color-coded category labels
- Expandable/collapsible for older versions

---

## Files to Create

**New Files**:
- `CHANGELOG.md` - Changelog entries (Keep a Changelog format)
- `backend/app/Http/Controllers/Api/ChangelogController.php` - API endpoint
- `backend/app/Services/ChangelogService.php` - Parse and serve changelog data
- `frontend/app/(dashboard)/changelog/page.tsx` - Changelog page

**Files to Modify**:
- `backend/routes/api.php` - Add changelog route
- `frontend/components/sidebar.tsx` - Add changelog nav link
- `frontend/lib/search-pages.ts` - Add changelog to search index

---

## Related Roadmaps

- [Versioning System Roadmap](versioning-system-roadmap.md) - VERSION file, bump script, GitHub release workflow
- [In-App Documentation Roadmap](in-app-documentation-roadmap.md) - Help center pattern (similar user-facing content)
