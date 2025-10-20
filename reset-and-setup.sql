-- ========================================
-- RESET AND SETUP DATABASE
-- ========================================
-- This will clean up existing data and create admin user properly
-- ========================================

-- Step 1: Clean up existing admin user data (if any)
DO $$
DECLARE
    v_admin_auth_id uuid := '0bcb5338-8bab-431a-9435-07a25e224770';
BEGIN
    -- Delete existing user_tokens for this user
    DELETE FROM user_tokens
    WHERE user_id IN (SELECT id FROM users WHERE auth_user_id = v_admin_auth_id);

    -- Delete existing user profile
    DELETE FROM users WHERE auth_user_id = v_admin_auth_id;

    RAISE NOTICE '✅ Cleaned up existing admin user data';
END $$;

-- Step 2: Now create fresh admin user
DO $$
DECLARE
    v_admin_auth_id uuid := '0bcb5338-8bab-431a-9435-07a25e224770';
    v_admin_user_id uuid;
    v_auth_email text;
BEGIN
    -- Get auth user email
    SELECT email INTO v_auth_email
    FROM auth.users
    WHERE id = v_admin_auth_id;

    IF v_auth_email IS NULL THEN
        RAISE EXCEPTION '❌ Auth user not found with ID: %', v_admin_auth_id;
    END IF;

    RAISE NOTICE '✅ Found auth user: %', v_auth_email;

    -- Create user profile
    INSERT INTO users (auth_user_id, email, full_name, is_admin, is_premium)
    VALUES (v_admin_auth_id, v_auth_email, 'Admin User', TRUE, TRUE)
    RETURNING id INTO v_admin_user_id;

    RAISE NOTICE '✅ Created user profile with ID: %', v_admin_user_id;

    -- Verify the user was created
    IF v_admin_user_id IS NULL THEN
        RAISE EXCEPTION '❌ Failed to create user profile';
    END IF;

    -- Credit tokens
    INSERT INTO user_tokens (user_id, balance, lifetime_earned, lifetime_purchased, lifetime_spent)
    VALUES (v_admin_user_id, 1000, 1000, 0, 0);

    RAISE NOTICE '✅ Credited 1000 tokens';
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '🎉 ADMIN USER READY!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Login: http://localhost:3000/auth/login';
    RAISE NOTICE 'Email: %', v_auth_email;
    RAISE NOTICE 'Password: Admin123!@#';
    RAISE NOTICE 'Admin: http://localhost:3000/admin';
    RAISE NOTICE '========================================';
END $$;

-- Step 3: Verify setup
SELECT
    '✅ Admin User Verification' as status,
    u.id as user_id,
    u.auth_user_id,
    u.email,
    u.is_admin,
    u.is_premium,
    ut.balance as tokens
FROM users u
JOIN user_tokens ut ON ut.user_id = u.id
WHERE u.auth_user_id = '0bcb5338-8bab-431a-9435-07a25e224770';
