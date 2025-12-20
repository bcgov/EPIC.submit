# E2E Test Data Seeding Helpers

These TypeScript helpers provide an easy way to seed test data from your Playwright tests by calling Python functions in the API container.

## Key Benefits

- ✅ **Python seeding logic** - Uses your SQLAlchemy models, matches API language
- ✅ **TypeScript test helpers** - Easy to use from Playwright tests
- ✅ **Reusable** - Seed different data for different test scenarios
- ✅ **Cleanup** - Remove test data after tests complete

## Usage Examples

### Basic Usage (beforeAll)

```typescript
import { test, expect } from '@playwright/test';
import { seedProponentUser, cleanupTestData } from '../helpers/seed';

test.describe('Proponent Dashboard', () => {
  const testGuid = '71cb238c-147e-4d6b-85d1-de7f8659f049';

  test.beforeAll(async () => {
    // Seed test user before all tests in this suite
    await seedProponentUser(testGuid);
  });

  test.afterAll(async () => {
    // Cleanup after all tests complete
    await cleanupTestData({ guid: testGuid });
  });

  test('should display user info', async ({ page }) => {
    // Your test code here
    await page.goto('/dashboard');
    await expect(page.getByText('E2E Proponent')).toBeVisible();
  });
});
```

### Custom User Data

```typescript
await seedProponentUser('custom-guid-123', {
  firstName: 'John',
  lastName: 'Doe',
  workEmail: 'john.doe@example.com',
  position: 'Project Manager',
  proponentId: 9999,
  roleName: 'SUBMISSION_ADMIN'
});
```

### Multiple Users Per Test

```typescript
test.describe('Multi-user scenario', () => {
  test.beforeEach(async () => {
    // Seed different users for each test
    await seedProponentUser('user-1-guid', { firstName: 'Alice' });
    await seedProponentUser('user-2-guid', { firstName: 'Bob' });
  });

  test.afterEach(async () => {
    await cleanupTestData({ guid: 'user-1-guid' });
    await cleanupTestData({ guid: 'user-2-guid' });
  });

  test('should handle collaboration', async ({ page }) => {
    // Test with multiple users
  });
});
```

### Using Default Test User

```typescript
import { seedDefaultProponentUser } from '../helpers/seed';

test.beforeAll(async () => {
  // Uses the standard test GUID: 71cb238c-147e-4d6b-85d1-de7f8659f049
  await seedDefaultProponentUser();
});
```

### Staff User

```typescript
import { seedStaffUser } from '../helpers/seed';

await seedStaffUser('staff-guid-456', {
  firstName: 'Admin',
  lastName: 'User',
  workEmail: 'admin@gov.bc.ca'
});
```

## Available Functions

### `seedProponentUser(guid, options?)`
Seeds a proponent user with account and role.

**Parameters:**
- `guid` (required): User's Keycloak GUID
- `options` (optional):
  - `proponentId`: Account proponent ID (default: 8888)
  - `firstName`: First name (default: 'E2E')
  - `lastName`: Last name (default: 'Proponent')
  - `position`: Job title (default: 'Test Administrator')
  - `workEmail`: Email (default: 'e2e.proponent@test.example.com')
  - `workPhone`: Phone (default: '555-0100')
  - `extension`: Extension (default: '101')
  - `roleName`: Role (default: 'PROJECT_ADMIN')

### `seedStaffUser(guid, options?)`
Seeds a staff user.

**Parameters:**
- `guid` (required): User's Keycloak GUID
- `options` (optional):
  - `firstName`: First name (default: 'E2E')
  - `lastName`: Last name (default: 'Staff')
  - `workEmail`: Email (default: 'e2e.staff@test.example.com')

### `cleanupTestData(options)`
Removes test data from database.

**Parameters:**
- `options`:
  - `guid`: User GUID to delete (optional)
  - `proponentId`: Proponent ID to delete (optional)

**Note:** Must specify at least one of `guid` or `proponentId`.

### `seedDefaultProponentUser()`
Convenience function that seeds the default test proponent user with GUID `71cb238c-147e-4d6b-85d1-de7f8659f049`.

## How It Works

1. **TypeScript helper** receives your parameters
2. **Builds Python script** with those parameters
3. **Executes Python script** in the API Docker container
4. **Python function** uses SQLAlchemy models to create data
5. **Data persists** in the test database for your tests to use

## Adding New Seeding Functions

To add new seeding functions:

1. **Add Python function** in `submit-api/scripts/seed_e2e_data.py`
2. **Add TypeScript wrapper** in `submit-web/playwright/helpers/seed.ts`
3. **Use in tests** via import

Example Python function:
```python
def seed_project(account_id: int, name: str = "Test Project") -> Project:
    """Seed a test project."""
    project = Project.create_project({
        'account_id': account_id,
        'name': name
    })
    db.session.commit()
    return project
```

Example TypeScript wrapper:
```typescript
export async function seedProject(accountId: number, name = 'Test Project') {
  const pythonScript = `
from scripts.seed_e2e_data import seed_project, create_app
app = create_app()
with app.app_context():
    seed_project(account_id=${accountId}, name='${name}')
  `;
  execSync(`docker exec $(docker compose -f docker-compose.e2e.yml ps -q api) python -c "${pythonScript}"`);
}
```
