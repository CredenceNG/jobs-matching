-- ========================================
-- STEP BY STEP ADMIN SETUP WITH VERIFICATION
-- ========================================

-- STEP 1: Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255),
  is_premium BOOLEAN DEFAULT FALSE NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- STEP 2: Verify users table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        RAISE NOTICE '✅ users table exists';
    ELSE
        RAISE EXCEPTION '❌ users table was not created';
    END IF;
END $$;

-- STEP 3: Create user_tokens table
CREATE TABLE IF NOT EXISTS user_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- STEP 4: Verify user_tokens table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_tokens') THEN
        RAISE NOTICE '✅ user_tokens table exists';
    ELSE
        RAISE EXCEPTION '❌ user_tokens table was not created';
    END IF;
END $$;

-- STEP 5: Create admin user profile
INSERT INTO users (auth_user_id, email, full_name, is_admin, is_premium)
VALUES (
    '0bcb5338-8bab-431a-9435-07a25e224770',
    'admin@jobai.com',
    'Admin User',
    TRUE,
    TRUE
)
ON CONFLICT (auth_user_id) DO UPDATE
SET is_admin = TRUE, is_premium = TRUE;

-- STEP 6: Verify admin user was created
DO $$
DECLARE
    v_count integer;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM users
    WHERE auth_user_id = '0bcb5338-8bab-431a-9435-07a25e224770';

    IF v_count > 0 THEN
        RAISE NOTICE '✅ Admin user exists in users table';
    ELSE
        RAISE EXCEPTION '❌ Admin user was not created';
    END IF;
END $$;

-- STEP 7: Create tokens for admin user
INSERT INTO user_tokens (user_id, balance)
SELECT id, 1000
FROM users
WHERE auth_user_id = '0bcb5338-8bab-431a-9435-07a25e224770'
ON CONFLICT (user_id) DO UPDATE
SET balance = 1000;

-- STEP 8: Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tokens ENABLE ROW LEVEL SECURITY;

-- STEP 9: Create policies
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT USING (auth_user_id = auth.uid());

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

-- FINAL VERIFICATION
SELECT
    '🎉 SETUP COMPLETE' as status,
    u.id,
    u.email,
    u.is_admin,
    u.is_premium,
    ut.balance as tokens
FROM users u
JOIN user_tokens ut ON ut.user_id = u.id
WHERE u.auth_user_id = '0bcb5338-8bab-431a-9435-07a25e224770';
