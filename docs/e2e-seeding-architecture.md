# E2E Seeding Architecture

## Overview

This document describes the modular architecture for E2E test data seeding. The design balances simplicity for basic tests with scalability for complex future scenarios.

## Current Implementation: Phase 1 (Refactored)

### Directory Structure

```
submit-api/
├── scripts/
│   ├── seed_e2e_data.py          # CLI entry point (backward compatible)
│   └── seeds/                     # Domain-organized seed modules
│       ├── __init__.py            # Exports all seeding functions
│       ├── core.py                # Account, User, Project seeding
│       └── cleanup.py             # Centralized cleanup logic
```

### Design Principles

1. **Domain modules** - Group related models together
2. **Single Responsibility** - Each module handles one domain
3. **Flat imports** - All functions re-exported from `seeds/__init__.py`
4. **CLI stays simple** - `seed_e2e_data.py` remains the interface
5. **Backward compatible** - Existing Playwright fixtures don't break

## Usage from Playwright

### Simple Test (Existing Pattern - Still Works)

```typescript
// submit-web/playwright/fixtures/db.fixtures.ts
export const authenticatedProponentWithProject = test.extend({
  async authenticatedProponentWithProject({ page }, use) {
    const guid = 'e2e-test-guid';

    // Still works exactly as before
    await seedProponentWithProject(guid);

    await kcLogin(page, PROPONENT_USERNAME, PROPONENT_PASSWORD);
    await page.goto('/proponent/projects');

    await use({ page, accountProjectId: 7777 });

    await cleanupTestData({ guid });
  }
});
```

## Future Phases (Not Yet Implemented)

When adding new test scenarios (packages, reviews, documents), new domain modules will be added:

- `seeds/submissions.py` - Package, Item, PackageMetadata seeding
- `seeds/reviews.py` - SubmissionReview, SubmissionReviewEntry seeding
- `seeds/workflows.py` - UpdateRequest seeding
- `seeds/documents.py` - Document seeding
- `seeds/scenarios.py` - Pre-built complex scenarios

These will be added incrementally as E2E tests are written that need them.

## Migration from Old Structure

**Phase 1 (Completed):** Extract existing functions to modular structure

- ✅ Move core seeding functions to `seeds/core.py`
- ✅ Move cleanup to `seeds/cleanup.py`
- ✅ Update `seed_e2e_data.py` to import from modules
- ✅ Verify all existing Playwright tests still pass

**Future Phases:** Add new domains as needed for new tests

## Benefits

### For Simple Tests
✅ **No change required** - Existing fixtures work as-is
✅ **Still just one CLI call** - `seed_e2e_data.py --with-project`
✅ **Fast execution** - No overhead

### For Future Complex Tests
✅ **Easy to find logic** - Domain-organized modules
✅ **Reusable functions** - Import from `seeds.submissions`, etc.
✅ **Scalable** - Add new domains without bloating one file

### For Maintainability
✅ **Organized by domain** - Easy to locate relevant code
✅ **Single Responsibility** - Each module has clear focus
✅ **Testable** - Can unit test seeding functions separately
✅ **Self-documenting** - Module names indicate what they seed

## Alternative Considered: Builder Pattern

The builder pattern (fluent API) was considered but rejected for E2E tests because:

- ❌ Doesn't work well across docker exec boundary (TypeScript → CLI → Python)
- ❌ CLI arguments are simpler and more debuggable
- ❌ Would require JSON config passing or Python code as strings

**Builder pattern is better suited for Python integration tests**, not E2E tests called from TypeScript.

For E2E seeding via docker exec, **function-based approach is optimal**.
