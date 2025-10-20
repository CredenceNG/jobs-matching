-- ========================================
-- FIX ADMIN USER ACCESS
-- ========================================
-- This script adds missing columns and creates the admin user
-- Run this in Supabase SQL Editor
-- ========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add missing columns to existing tables
DO $$
BEGIN
    -- Add is_admin to users table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_admin') THEN
        ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE NOT NULL;
        RAISE NOTICE '✅ Added is_admin column to users table';
    ELSE
        RAISE NOTICE '⚠️  is_admin column already exists';
    END IF;

    -- Add is_active to ai_feature_costs if table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_feature_costs') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_feature_costs' AND column_name = 'is_active') THEN
            ALTER TABLE ai_feature_costs ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
            RAISE NOTICE '✅ Added is_active column to ai_feature_costs table';
        ELSE
            RAISE NOTICE '⚠️  is_active column already exists in ai_feature_costs';
        END IF;
    END IF;

    -- Add is_active to token_packages if table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'token_packages') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'token_packages' AND column_name = 'is_active') THEN
            ALTER TABLE token_packages ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
            RAISE NOTICE '✅ Added is_active column to token_packages table';
        ELSE
            RAISE NOTICE '⚠️  is_active column already exists in token_packages';
        END IF;
    END IF;
END $$;

-- Create index on is_admin if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_users_is_admin') THEN
        CREATE INDEX idx_users_is_admin ON users(is_admin);
        RAISE NOTICE '✅ Created index on is_admin';
    END IF;
END $$;

-- ========================================
-- CREATE ADMIN USER PROFILE
-- ========================================

DO $$
DECLARE
    v_admin_auth_id uuid := '0bcb5338-8bab-431a-9435-07a25e224770';
    v_admin_user_id uuid;
    v_auth_email text;
BEGIN
    -- Verify the auth user exists
    SELECT email INTO v_auth_email
    FROM auth.users
    WHERE id = v_admin_auth_id;

    IF v_auth_email IS NULL THEN
        RAISE NOTICE '❌ Auth user with ID % not found in auth.users', v_admin_auth_id;
        RAISE NOTICE '   Please create the auth user first at:';
        RAISE NOTICE '   https://supabase.com/dashboard/project/YOUR_PROJECT/auth/users';
        RETURN;
    END IF;

    RAISE NOTICE '✅ Found auth user: % (%)', v_auth_email, v_admin_auth_id;

    -- Check if user profile exists
    SELECT id INTO v_admin_user_id
    FROM users
    WHERE auth_user_id = v_admin_auth_id;

    IF v_admin_user_id IS NULL THEN
        -- Create new user profile
        INSERT INTO users (auth_user_id, email, full_name, is_admin, is_premium)
        VALUES (
            v_admin_auth_id,
            v_auth_email,
            'Admin User',
            TRUE,
            TRUE
        )
        RETURNING id INTO v_admin_user_id;

        RAISE NOTICE '✅ Created admin user profile with ID: %', v_admin_user_id;
    ELSE
        -- Update existing user to admin
        UPDATE users
        SET is_admin = TRUE,
            is_premium = TRUE
        WHERE id = v_admin_user_id;

        RAISE NOTICE '✅ Updated user % to admin', v_admin_user_id;
    END IF;

    -- Credit tokens if user_tokens table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_tokens') THEN
        INSERT INTO user_tokens (user_id, balance, lifetime_earned, lifetime_purchased, lifetime_spent)
        VALUES (v_admin_user_id, 1000, 1000, 0, 0)
        ON CONFLICT (user_id) DO UPDATE SET
            balance = EXCLUDED.balance,
            lifetime_earned = EXCLUDED.lifetime_earned;

        RAISE NOTICE '✅ Credited 1000 tokens to admin user';
    END IF;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '🎉 ADMIN USER SETUP COMPLETE!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Login at: http://localhost:3000/auth/login';
    RAISE NOTICE 'Email: %', v_auth_email;
    RAISE NOTICE 'Password: Admin123!@#';
    RAISE NOTICE 'Admin Dashboard: http://localhost:3000/admin';
    RAISE NOTICE '========================================';
END $$;

-- ========================================
-- VERIFICATION
-- ========================================

SELECT
    'Admin User Details:' as info,
    u.id,
    u.auth_user_id,
    u.email,
    u.full_name,
    u.is_admin,
    u.is_premium,
    COALESCE(ut.balance, 0) as token_balance
FROM users u
LEFT JOIN user_tokens ut ON ut.user_id = u.id
WHERE u.auth_user_id = '0bcb5338-8bab-431a-9435-07a25e224770';
