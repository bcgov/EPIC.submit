-- E2E Test Users for Cypress
-- Replace REPLACE_WITH_KEYCLOAK_STAFF_USER_ID and REPLACE_WITH_KEYCLOAK_PROPONENT_USER_ID
-- with actual user IDs from Keycloak (found in Keycloak Admin Console -> Users -> [user] -> ID field)

-- ============================================================
-- STAFF TEST USER
-- ============================================================

-- -- Create staff user in users table
-- INSERT INTO users (auth_guid, type, status_id)
-- VALUES ('REPLACE_WITH_KEYCLOAK_STAFF_USER_ID', 'STAFF', 1)
-- ON CONFLICT (auth_guid) DO NOTHING;

-- -- Create staff_user entry
-- INSERT INTO staff_users (user_id, first_name, last_name, work_email_address)
-- SELECT id, 'E2E', 'Staff', 'e2e.staff@example.com'
-- FROM users
-- WHERE auth_guid = 'REPLACE_WITH_KEYCLOAK_STAFF_USER_ID'
-- ON CONFLICT (user_id) DO NOTHING;

-- -- ============================================================
-- -- PROPONENT TEST USER
-- -- ============================================================

-- -- Create proponent user in users table
-- INSERT INTO users (auth_guid, type, status_id)
-- VALUES ('REPLACE_WITH_KEYCLOAK_PROPONENT_USER_ID', 'PROPONENT', 1)
-- ON CONFLICT (auth_guid) DO NOTHING;

-- -- Create account for proponent (using test proponent_id 9999)
-- INSERT INTO accounts (proponent_id)
-- VALUES (9999)
-- ON CONFLICT (proponent_id) DO NOTHING;

-- -- Create account_user entry
-- INSERT INTO account_users (
--   user_id,
--   account_id,
--   first_name,
--   last_name,
--   position,
--   work_email_address,
--   work_contact_number
-- )
-- SELECT
--   u.id,
--   a.id,
--   'E2E',
--   'Proponent',
--   'Test User',
--   'e2e.proponent@example.com',
--   '555-0100'
-- FROM users u
-- CROSS JOIN accounts a
-- WHERE u.auth_guid = 'REPLACE_WITH_KEYCLOAK_PROPONENT_USER_ID'
--   AND a.proponent_id = 9999
-- ON CONFLICT DO NOTHING;

-- ============================================================
-- VERIFICATION QUERIES (optional - run to verify)
-- ============================================================

-- Verify staff user
-- SELECT u.*, su.* FROM users u
-- JOIN staff_users su ON u.id = su.user_id
-- WHERE u.auth_guid = 'REPLACE_WITH_KEYCLOAK_STAFF_USER_ID';

-- Verify proponent user
-- SELECT u.*, au.*, a.* FROM users u
-- JOIN account_users au ON u.id = au.user_id
-- JOIN accounts a ON au.account_id = a.id
-- WHERE u.auth_guid = 'REPLACE_WITH_KEYCLOAK_PROPONENT_USER_ID';
