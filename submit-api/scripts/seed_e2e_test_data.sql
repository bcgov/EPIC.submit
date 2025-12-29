-- E2E Test Data for Playwright Tests
-- Seeds a test proponent user with account for E2E testing

-- ============================================================
-- PROPONENT TEST USER
-- ============================================================

-- Create proponent user in users table
INSERT INTO users (auth_guid, type, status_id, created_date, updated_date)
VALUES ('71cb238c-147e-4d6b-85d1-de7f8659f049', 'PROPONENT', 1, NOW(), NOW())
ON CONFLICT (auth_guid) DO NOTHING;

-- Create account for proponent (using test proponent_id 8888)
INSERT INTO accounts (proponent_id, created_date, updated_date)
VALUES (8888, NOW(), NOW())
ON CONFLICT (proponent_id) DO NOTHING;

-- Create account_user entry
INSERT INTO account_users (
  user_id,
  account_id,
  first_name,
  last_name,
  position,
  work_email_address,
  work_contact_number,
  extension_number,
  created_date,
  updated_date
)
SELECT
  u.id,
  a.id,
  'E2E',
  'Proponent',
  'Test Administrator',
  'e2e.proponent@test.example.com',
  '555-0100',
  '101',
  NOW(),
  NOW()
FROM users u
CROSS JOIN accounts a
WHERE u.auth_guid = '71cb238c-147e-4d6b-85d1-de7f8659f049'
  AND a.proponent_id = 8888
ON CONFLICT DO NOTHING;

-- Create user role (PROJECT_ADMIN role for full access)
INSERT INTO user_roles (
  account_user_id,
  account_project_id,
  package_ids,
  active,
  role_id,
  created_date,
  updated_date
)
SELECT
  au.id,
  NULL,  -- NULL for account-wide role
  NULL,  -- NULL for project-wide role
  TRUE,
  r.id,
  NOW(),
  NOW()
FROM account_users au
JOIN users u ON au.user_id = u.id
CROSS JOIN roles r
WHERE u.auth_guid = '71cb238c-147e-4d6b-85d1-de7f8659f049'
  AND r.role_name = 'PROJECT_ADMIN'
ON CONFLICT DO NOTHING;

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================

-- Verify the proponent user was created
DO $$
DECLARE
  user_count INTEGER;
  account_count INTEGER;
  account_user_count INTEGER;
  user_role_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count FROM users WHERE auth_guid = '71cb238c-147e-4d6b-85d1-de7f8659f049';
  SELECT COUNT(*) INTO account_count FROM accounts WHERE proponent_id = 8888;
  SELECT COUNT(*) INTO account_user_count FROM account_users au
    JOIN users u ON au.user_id = u.id
    WHERE u.auth_guid = '71cb238c-147e-4d6b-85d1-de7f8659f049';
  SELECT COUNT(*) INTO user_role_count FROM user_roles ur
    JOIN account_users au ON ur.account_user_id = au.id
    JOIN users u ON au.user_id = u.id
    WHERE u.auth_guid = '71cb238c-147e-4d6b-85d1-de7f8659f049';

  RAISE NOTICE '=== Seed Verification ===';
  RAISE NOTICE 'Users created: %', user_count;
  RAISE NOTICE 'Accounts created: %', account_count;
  RAISE NOTICE 'Account users created: %', account_user_count;
  RAISE NOTICE 'User roles created: %', user_role_count;

  IF user_count = 1 AND account_count = 1 AND account_user_count = 1 THEN
    RAISE NOTICE '✓ E2E test data seeded successfully!';
  ELSE
    RAISE WARNING '⚠ Some data may not have been created. Check the logs above.';
  END IF;
END $$;

-- Optional: View the created data
-- SELECT u.*, au.*, a.*, ur.*, r.*
-- FROM users u
-- JOIN account_users au ON u.id = au.user_id
-- JOIN accounts a ON au.account_id = a.id
-- LEFT JOIN user_roles ur ON au.id = ur.account_user_id
-- LEFT JOIN roles r ON ur.role_id = r.id
-- WHERE u.auth_guid = '71cb238c-147e-4d6b-85d1-de7f8659f049';
