# Global Components Audit Roadmap

Audit existing codebase for violations of the global components principle and refactor duplicated logic into shared components.

**Priority:** MEDIUM  
**Dependencies:** None

## Background

The project has established a rule for [global components](.cursor/rules/global-components.mdc) requiring all reusable functionality to be implemented as shared components. This audit will identify existing violations and create a plan to consolidate duplicated logic.

## Phase 1: Audit & Discovery

- [ ] Scan all page components for inline implementations that should be shared
- [ ] Identify duplicated UI patterns across pages
- [ ] Identify duplicated hooks/logic across components
- [ ] Identify duplicated utility functions
- [ ] Document all findings with file locations and severity

### Areas to Audit

| Area | Location | Check For |
|------|----------|-----------|
| Dashboard pages | `frontend/app/(dashboard)/` | Inline components, duplicated state logic |
| Auth pages | `frontend/app/(auth)/` | Form patterns, validation logic |
| Configuration pages | `frontend/app/(dashboard)/configuration/` | Repeated settings UI patterns |
| Components | `frontend/components/` | Similar functionality that could be merged |
| Lib/Hooks | `frontend/lib/` | Duplicated utility functions |
| Backend Controllers | `backend/app/Http/Controllers/` | Repeated response patterns, validation |
| Backend Services | `backend/app/Services/` | Duplicated business logic |

## Phase 2: Prioritize & Plan

- [ ] Categorize findings by impact (HIGH/MEDIUM/LOW)
- [ ] Identify quick wins (easy consolidations)
- [ ] Identify complex refactors requiring careful planning
- [ ] Create task list with dependencies

### Prioritization Criteria

- **HIGH:** Duplicated logic that affects consistency (bugs fixed in one place but not others)
- **MEDIUM:** Duplicated UI patterns that affect maintainability
- **LOW:** Minor duplications with limited impact

## Phase 3: Refactor

- [ ] Extract shared components from identified duplications
- [ ] Create missing hooks for repeated state logic
- [ ] Consolidate utility functions
- [ ] Update all pages to use new shared components
- [ ] Remove deprecated inline implementations

## Phase 4: Prevention

- [ ] Update documentation with new shared components
- [ ] Add examples to `docs/ai/patterns.md` for common patterns found
- [ ] Add warnings to `docs/ai/anti-patterns.md` for common mistakes found
- [ ] Consider adding lint rules or automated checks

## Success Criteria

- [ ] No duplicated UI components across pages
- [ ] All repeated logic extracted to hooks/utilities
- [ ] Documentation updated with new shared components
- [ ] Team/AI aware of global component rule

## Notes

Reference the global components rule at `.cursor/rules/global-components.mdc` for guidelines on what should be shared vs. page-specific.
