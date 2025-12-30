-- Cleanup E2E Test Data
-- Removes the test proponent user and related data

-- Delete user roles
DELETE FROM user_roles
WHERE account_user_id IN (
  SELECT au.id FROM account_users au
  JOIN users u ON au.user_id = u.id
  WHERE u.auth_guid = '71cb238c-147e-4d6b-85d1-de7f8659f049'
);

-- Delete account users
DELETE FROM account_users
WHERE user_id IN (
  SELECT id FROM users WHERE auth_guid = '71cb238c-147e-4d6b-85d1-de7f8659f049'
);

-- Delete user
DELETE FROM users WHERE auth_guid = '71cb238c-147e-4d6b-85d1-de7f8659f049';

-- Delete account (optional, if no other users)
DELETE FROM accounts WHERE proponent_id = 8888
  AND NOT EXISTS (
    SELECT 1 FROM account_users WHERE account_id = accounts.id
  );
