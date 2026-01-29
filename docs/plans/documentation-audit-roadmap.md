# Documentation Audit Roadmap

Comprehensive audit of AI development documentation (recipes, patterns, anti-patterns) against the actual codebase to ensure accuracy, consistency, and usefulness.

**Priority:** MEDIUM  
**Dependencies:** None  
**Estimated Effort:** Medium

## Goals

1. Verify all recipes and patterns reflect current codebase implementation
2. Ensure code examples are accurate and follow current conventions
3. Identify outdated, missing, or misleading documentation
4. Review documentation clarity and organization
5. Ensure file references point to existing files

---

## Phase 1: Recipes Audit

Verify each recipe matches the actual codebase patterns and conventions.

### Task 1.1: API & Backend Recipes
- [ ] **add-api-endpoint.md** - Verify route patterns, controller structure, middleware usage
- [ ] **add-admin-protected-action.md** - Verify admin middleware, authorization patterns
- [ ] **add-backup-destination.md** - Verify backup service patterns, channel implementation
- [ ] **add-llm-provider.md** - Verify LLM service patterns, provider implementation
- [ ] **add-notification-channel.md** - Verify notification channel patterns
- [ ] **trigger-notifications.md** - Verify notification triggering patterns

### Task 1.2: Frontend Recipes
- [ ] **add-config-page.md** - Verify config page patterns, form handling, API integration
- [ ] **add-settings-page.md** - Verify settings page patterns, SettingService usage
- [ ] **add-dashboard-widget.md** - Verify dashboard widget patterns
- [ ] **add-ui-component.md** - Verify UI component patterns, shadcn/ui usage
- [ ] **make-component-responsive.md** - Verify responsive patterns, useIsMobile hook

### Task 1.3: Cross-Cutting Recipes
- [ ] **add-sso-provider.md** - Verify SSO implementation patterns
- [ ] **add-tests.md** - Verify test patterns, file locations, conventions
- [ ] **code-review.md** - Verify checklist items are still relevant

---

## Phase 2: Patterns Audit

Verify `docs/ai/patterns.md` code examples match actual codebase.

### Task 2.1: Backend Patterns
- [ ] Verify controller patterns match actual controllers
- [ ] Verify service layer patterns match actual services
- [ ] Verify model patterns match actual models
- [ ] Verify SettingService patterns match implementation
- [ ] Verify middleware patterns match actual middleware

### Task 2.2: Frontend Patterns
- [ ] Verify API call patterns match `frontend/lib/api.ts`
- [ ] Verify component patterns match actual components
- [ ] Verify form handling patterns match actual usage
- [ ] Verify error handling patterns match actual usage
- [ ] Verify responsive patterns match actual usage

### Task 2.3: Pattern Completeness
- [ ] Identify patterns used in codebase but not documented
- [ ] Identify deprecated patterns still documented
- [ ] Add missing patterns discovered during audit

---

## Phase 3: Anti-Patterns Audit

Verify `docs/ai/anti-patterns.md` is accurate and complete.

### Task 3.1: Review Existing Anti-Patterns
- [ ] Verify each anti-pattern is still relevant
- [ ] Verify "correct" examples actually work
- [ ] Check for anti-patterns that are now acceptable

### Task 3.2: Anti-Pattern Completeness
- [ ] Identify common mistakes from journal entries
- [ ] Add new anti-patterns discovered during development
- [ ] Cross-reference with code-review.md checklist

---

## Phase 4: Context Loading Audit

Verify `docs/ai/context-loading.md` references exist and are correct.

### Task 4.1: File Reference Verification
- [ ] Verify all file paths exist
- [ ] Verify ADR references are current
- [ ] Verify service/component references are current
- [ ] Remove references to deleted/moved files

### Task 4.2: Task Type Coverage
- [ ] Verify task types cover common development scenarios
- [ ] Add missing task types if needed
- [ ] Update file recommendations based on actual development patterns

---

## Phase 5: Supporting Documentation Audit

Review related AI documentation for accuracy and clarity.

### Task 5.1: Architecture Documentation
- [ ] **architecture-map.md** - Verify data flow descriptions
- [ ] **README.md (AI guide)** - Verify quick links, gotchas section
- [ ] **architecture.md** - Verify ADR file references

### Task 5.2: Clarity Review
- [ ] Review documentation for unclear explanations
- [ ] Simplify overly complex sections
- [ ] Add examples where helpful
- [ ] Ensure consistent terminology

### Task 5.3: Organization Review
- [ ] Check for duplicated information across files
- [ ] Verify cross-references between files are correct
- [ ] Identify documentation gaps

---

## Phase 6: Verification & Cleanup

Final verification and cleanup tasks.

### Task 6.1: Final Verification
- [ ] Run through one recipe end-to-end to verify accuracy
- [ ] Verify all internal links work
- [ ] Check for outdated version references

### Task 6.2: Documentation Updates
- [ ] Update last-modified dates where relevant
- [ ] Add "Last Audited" notes to documentation
- [ ] Create journal entry documenting audit findings

---

## Success Criteria

- All recipes produce working code when followed
- All patterns match actual codebase implementations
- All file references point to existing files
- Documentation is clear, accurate, and actionable
- No outdated or misleading information remains

## Notes

- This audit can be done incrementally
- Each recipe/pattern should be tested by following it for a real task
- Findings should be documented in a journal entry
- Consider adding automated checks for file references
