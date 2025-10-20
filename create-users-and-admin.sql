-- ========================================
-- CREATE USERS TABLE AND ADMIN USER
-- ========================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum for subscription status
DO $$ BEGIN
    CREATE TYPE subscription_status AS ENUM ('active', 'cancelled', 'past_due', 'paused');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255),
  profile_picture TEXT,
  is_premium BOOLEAN DEFAULT FALSE NOT NULL,
  subscription_id VARCHAR(255) UNIQUE,
  subscription_status subscription_status,
  subscription_end_date TIMESTAMP WITH TIME ZONE,
  subscription_created_at TIMESTAMP WITH TIME ZONE,
  is_admin BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  last_login TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create user_tokens table
CREATE TABLE IF NOT EXISTS user_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
  lifetime_earned INTEGER NOT NULL DEFAULT 0,
  lifetime_purchased INTEGER NOT NULL DEFAULT 0,
  lifetime_spent INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tokens ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT USING (auth_user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own profile" ON users;
CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE USING (auth_user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all users" ON users;
CREATE POLICY "Admins can view all users"
  ON users FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND is_admin = TRUE)
  );

DROP POLICY IF EXISTS "Users can view their own tokens" ON user_tokens;
CREATE POLICY "Users can view their own tokens"
  ON user_tokens FOR SELECT USING (
    user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
  );

-- Create admin user
DO $$
DECLARE
    v_admin_auth_id uuid := '0bcb5338-8bab-431a-9435-07a25e224770';
    v_admin_user_id uuid;
BEGIN
    -- Insert admin user
    INSERT INTO users (auth_user_id, email, full_name, is_admin, is_premium)
    VALUES (v_admin_auth_id, 'admin@jobai.com', 'Admin User', TRUE, TRUE)
    ON CONFLICT (auth_user_id) DO UPDATE
    SET is_admin = TRUE, is_premium = TRUE
    RETURNING id INTO v_admin_user_id;

    -- Credit tokens
    INSERT INTO user_tokens (user_id, balance, lifetime_earned, lifetime_purchased, lifetime_spent)
    VALUES (v_admin_user_id, 1000, 1000, 0, 0)
    ON CONFLICT (user_id) DO UPDATE
    SET balance = 1000, lifetime_earned = 1000;

    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ SETUP COMPLETE!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Login: http://localhost:3000/auth/login';
    RAISE NOTICE 'Email: admin@jobai.com';
    RAISE NOTICE 'Password: Admin123!@#';
    RAISE NOTICE '========================================';
END $$;
