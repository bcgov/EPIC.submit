# E2E Test Data Seeding Helpers

These TypeScript helpers provide an easy way to seed test data from your Playwright tests by calling Python scripts in the API container via `docker compose exec`.

## Key Benefits

- ✅ **Per-test isolation** - Each test seeds its own data using `beforeEach` hooks
- ✅ **Python seeding logic** - Uses your SQLAlchemy models, matches API language
- ✅ **Docker exec pattern** - Runs Python scripts directly in the API container
- ✅ **CLI-based** - Python scripts accept command-line arguments
- ✅ **Automatic cleanup** - Remove test data after each test completes

## Usage Examples

### Basic Usage (Recommended)

Use `beforeEach` and `afterEach` for maximum test isolation:

```typescript
import { test, expect } from '@playwright/test';
import { seedProponentUser, cleanupTestData } from '../helpers/seed';

test.describe('Proponent Dashboard', () => {
  const testGuid = '71cb238c-147e-4d6b-85d1-de7f8659f049';

  test.beforeEach(async ({ page }) => {
    // Seed test user before each test
    seedProponentUser(testGuid);

    await kcLogout(page);
  });

  test.afterEach(() => {
    // Cleanup after each test
    cleanupTestData({ guid: testGuid });
  });

  test('should display user info', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByText('E2E Proponent')).toBeVisible();
  });
});
```

### Custom User Data

Customize any user field with options:

```typescript
seedProponentUser('custom-guid-123', {
  proponentId: 9999,
  firstName: 'John',
  lastName: 'Doe',
  position: 'Project Manager',
  workEmail: 'john.doe@example.com',
  workPhone: '555-0200',
  extension: '102',
  role: 'SUBMISSION_ADMIN'
});
```

### Multiple Users Per Test

Each test can seed multiple users with unique GUIDs:

```typescript
test.describe('Multi-user scenario', () => {
  test.beforeEach(() => {
    // Seed different users for each test
    seedProponentUser('user-1-guid', {
      firstName: 'Alice',
      proponentId: 8888
    });
    seedProponentUser('user-2-guid', {
      firstName: 'Bob',
      proponentId: 9999
    });
  });

  test.afterEach(() => {
    cleanupTestData({ guid: 'user-1-guid' });
    cleanupTestData({ guid: 'user-2-guid' });
  });

  test('should handle collaboration', async ({ page }) => {
    // Test with multiple users
  });
});
```

### Cleanup by Proponent ID

You can also cleanup by proponent ID instead of GUID:

```typescript
test.afterEach(() => {
  cleanupTestData({ proponentId: 8888 });
});
```

## Available Functions

### `seedProponentUser(guid, options?)`

Seeds a proponent user with account and role by calling the Python script with CLI arguments.

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
  - `role`: Role (default: 'PROJECT_ADMIN')

**Returns:** `void` (synchronous)

**Example:**
```typescript
seedProponentUser('71cb238c-147e-4d6b-85d1-de7f8659f049');

// With custom options
seedProponentUser('test-guid-123', {
  firstName: 'Jane',
  lastName: 'Smith',
  role: 'SUBMISSION_ADMIN'
});
```

### `cleanupTestData(options)`

Removes test data from database by calling the Python script with `--cleanup` flag.

**Parameters:**
- `options`:
  - `guid`: User GUID to delete (optional)
  - `proponentId`: Proponent ID to delete (optional)

**Note:** Must specify at least one of `guid` or `proponentId`.

**Returns:** `void` (synchronous)

**Example:**
```typescript
// Cleanup by GUID
cleanupTestData({ guid: 'test-guid-123' });

// Cleanup by proponent ID
cleanupTestData({ proponentId: 8888 });

// Cleanup both (if associated)
cleanupTestData({
  guid: 'test-guid-123',
  proponentId: 8888
});
```

## How It Works

1. **TypeScript helper** receives your parameters
2. **Builds CLI command** with those parameters (e.g., `--guid test-123 --first-name John`)
3. **Executes via docker compose exec**: `docker compose exec -T api python scripts/seed_e2e_data.py [args]`
4. **Python script** parses CLI args with argparse
5. **Python function** uses SQLAlchemy models to create data
6. **Data persists** in the test database for your tests to use

## Command Execution Example

When you call:
```typescript
seedProponentUser('test-123', { firstName: 'John' });
```

It executes:
```bash
docker compose -f docker-compose.e2e.yml exec -T api \
  python scripts/seed_e2e_data.py \
  --guid test-123 \
  --first-name "John"
```

## Adding New Seeding Functions

To add new seeding functions:

1. **Add Python function** in `submit-api/scripts/seed_e2e_data.py`
2. **Add CLI arguments** in the `main()` function's argparse setup
3. **Add TypeScript wrapper** in `submit-web/playwright/helpers/seed.ts`
4. **Use in tests** via import

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

Example CLI argument in `main()`:
```python
parser.add_argument('--project-name', type=str, default='Test Project', help='Project name')
parser.add_argument('--account-id', type=int, help='Account ID for project')

# In the seeding logic:
if args.account_id:
    seed_project(args.account_id, name=args.project_name)
```

Example TypeScript wrapper:
```typescript
export function seedProject(accountId: number, name = 'Test Project'): void {
  const args = `--account-id ${accountId} --project-name "${name}"`;
  execPythonInContainer(`python scripts/seed_e2e_data.py ${args}`);
}
```

## Best Practices

1. **Use beforeEach/afterEach** for test isolation
2. **Use unique GUIDs** for parallel test execution
3. **Always cleanup** in `afterEach` to prevent test pollution
4. **Seed minimal data** - only what the test needs
5. **Use descriptive GUIDs** in test files (e.g., const testGuid = '...')

## Troubleshooting

### Tests fail with "container not found"
- Ensure docker-compose.e2e.yml services are running
- Check that the API container is healthy before tests run

### Python script errors
- Run the Python script manually to debug:
  ```bash
  docker compose -f docker-compose.e2e.yml exec -T api \
    python scripts/seed_e2e_data.py --guid test-123
  ```

### Data persists between test runs
- Ensure `test.afterEach()` cleanup hooks are running
- Check that GUID matches between seed and cleanup calls
