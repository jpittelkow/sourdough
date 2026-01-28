# Versioning System Roadmap

Implement a versioning system that displays the application version in the settings/configuration area and provides automated version management via GitHub Actions.

**Priority**: MEDIUM  
**Status**: Phase 1 Complete (Version Display) ✅ - Phase 2 & 3 Pending (Future Work)  
**Last Updated**: 2026-01-27

**Dependencies**:
- [Settings Restructure](settings-restructure-roadmap.md) - Configuration page where version is displayed

---

## Task Checklist

### Version Display (HIGH Priority) ✅ COMPLETE
- [x] Create version configuration file with current version (VERSION file exists)
- [x] Display version in settings/configuration footer
- [x] Display version in main sidebar footer (always visible when logged in)
- [x] Display version on landing page (public visibility)
- [x] Add version to API health check endpoint (backend endpoint exists at `/api/version`)
- [x] Show version in "About" section or modal

### Version Management (HIGH Priority)
- [ ] Create VERSION file in project root
- [ ] Create script to update version across codebase
- [ ] Update package.json version (frontend)
- [ ] Update composer.json version (backend)
- [ ] Generate CHANGELOG entries

### GitHub Action Automation (MEDIUM Priority)
- [ ] Create GitHub Action for version bump on release
- [ ] Support semantic versioning (major.minor.patch)
- [ ] Auto-generate release notes
- [ ] Tag releases automatically
- [ ] Optional: Auto-update CHANGELOG.md

### Version Checking (LOW Priority)
- [ ] Add version check endpoint to backend API
- [ ] Compare running version vs latest release
- [ ] Display update notification in admin area (when newer version available)

---

## Current State

**Problems**:
- No centralized version number
- Version not displayed anywhere in the UI
- Manual version management is error-prone
- No automated release process

**Goal**: Single source of truth for version that is:
- Displayed to users in the UI
- Updated automatically via GitHub Actions
- Consistent across frontend, backend, and documentation

---

## Proposed Implementation

### 1. Version File Structure

Create a central VERSION file and supporting configuration:

```
sourdough/
├── VERSION                    # Single source of truth: "1.0.0"
├── version.json              # Extended version info
├── frontend/
│   └── config/version.ts     # Frontend version export
└── backend/
    └── config/version.php    # Backend version config
```

**version.json** (detailed version info):
```json
{
  "version": "1.0.0",
  "build": "2026-01-27T12:00:00Z",
  "commit": "abc1234",
  "channel": "stable"
}
```

### 2. Version Display Locations

**Settings/Configuration Area**:
- Footer of configuration page: "Sourdough v1.0.0"
- System info section with detailed version

**API Endpoint**:
```
GET /api/health
{
  "status": "healthy",
  "version": "1.0.0",
  "build": "2026-01-27T12:00:00Z"
}
```

**Frontend**:
- Footer component (optional)
- About modal in user dropdown
- Settings page footer

### 3. Version Update Script

Create a script to update version across all files:

```bash
# scripts/bump-version.sh
#!/bin/bash
# Usage: ./scripts/bump-version.sh 1.2.0

NEW_VERSION=$1

# Update VERSION file
echo "$NEW_VERSION" > VERSION

# Update package.json
npm --prefix frontend version "$NEW_VERSION" --no-git-tag-version

# Update composer.json
# Update version.json with build info
# etc.
```

### 4. GitHub Action Workflow

**.github/workflows/release.yml**:

```yaml
name: Release

on:
  workflow_dispatch:
    inputs:
      version_type:
        description: 'Version bump type'
        required: true
        default: 'patch'
        type: choice
        options:
          - patch
          - minor
          - major
      custom_version:
        description: 'Custom version (optional, overrides type)'
        required: false

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Calculate new version
        id: version
        run: |
          CURRENT=$(cat VERSION)
          if [ -n "${{ inputs.custom_version }}" ]; then
            NEW_VERSION="${{ inputs.custom_version }}"
          else
            # Calculate based on type (patch/minor/major)
            NEW_VERSION=$(./scripts/bump-version.sh --calculate ${{ inputs.version_type }})
          fi
          echo "version=$NEW_VERSION" >> $GITHUB_OUTPUT
      
      - name: Update version files
        run: ./scripts/bump-version.sh ${{ steps.version.outputs.version }}
      
      - name: Commit and tag
        run: |
          git config user.name github-actions
          git config user.email github-actions@github.com
          git add .
          git commit -m "Release v${{ steps.version.outputs.version }}"
          git tag "v${{ steps.version.outputs.version }}"
          git push origin main --tags
      
      - name: Create GitHub Release
        uses: softprops/action-gh-release@v1
        with:
          tag_name: v${{ steps.version.outputs.version }}
          generate_release_notes: true
```

---

## Implementation Plan

### Phase 1: Version File & Display

1. **Create VERSION file**
   - Add `VERSION` file to project root with initial version (e.g., `0.1.0`)
   - Create `version.json` with extended info

2. **Frontend version display**
   - Create `frontend/config/version.ts` that reads version
   - Add version display to settings/configuration footer
   - Consider adding "About" section to user dropdown

3. **Backend version endpoint**
   - Add version to health check response
   - Create version config in Laravel

### Phase 2: Version Update Script

1. **Create bump script**
   - `scripts/bump-version.sh` for version updates
   - Update VERSION, package.json, composer.json
   - Update version.json with build timestamp

2. **Document manual process**
   - How to bump version locally
   - When to bump (before release)

### Phase 3: GitHub Action

1. **Create release workflow**
   - Manual trigger with version type selection
   - Automated version calculation
   - Commit, tag, and release creation

2. **Test workflow**
   - Test with patch bump
   - Test with minor bump
   - Test with custom version

### Phase 4: Update Notifications (Future)

1. **Version check API**
   - Endpoint to check for updates
   - Compare against GitHub releases

2. **Admin notification**
   - Show notification when update available
   - Link to release notes

---

## Files to Create

**New Files**:
- `VERSION` - Version number file (e.g., "0.1.0")
- `version.json` - Extended version metadata
- `frontend/config/version.ts` - Frontend version module
- `backend/config/version.php` - Backend version config
- `scripts/bump-version.sh` - Version update script
- `.github/workflows/release.yml` - Release automation

**Files to Modify**:
- `frontend/package.json` - Ensure version field exists
- `backend/composer.json` - Ensure version field exists
- `frontend/app/(dashboard)/configuration/page.tsx` - Add version display
- `backend/routes/api.php` - Add version to health endpoint

---

## Semantic Versioning Guide

Follow [Semantic Versioning 2.0.0](https://semver.org/):

- **MAJOR** (1.x.x → 2.0.0): Breaking changes, incompatible API changes
- **MINOR** (1.0.x → 1.1.0): New features, backwards compatible
- **PATCH** (1.0.0 → 1.0.1): Bug fixes, backwards compatible

**Pre-release versions**: `1.0.0-alpha.1`, `1.0.0-beta.1`, `1.0.0-rc.1`

---

## Version Display Mockup

**Configuration Page Footer**:
```
┌─────────────────────────────────────────────────────────────┐
│  Configuration                                              │
│  ┌──────────────┐  ┌──────────────────────────────────────┐│
│  │ System       │  │                                      ││
│  │ Users        │  │  [Configuration Content]             ││
│  │ ...          │  │                                      ││
│  └──────────────┘  └──────────────────────────────────────┘│
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│  Sourdough v1.0.0 • Build 2026-01-27                       │
└─────────────────────────────────────────────────────────────┘
```

**User Dropdown "About"**:
```
┌────────────────┐
│ My Profile     │
│ Preferences    │
│ ────────────── │
│ About          │ → Opens modal with version info
│ Sign Out       │
└────────────────┘
```

---

## Related Roadmaps

- [Settings Restructure Roadmap](settings-restructure-roadmap.md) - Configuration page where version displays
- [Branding & UI Consistency Roadmap](branding-ui-consistency-roadmap.md) - App name shown with version
