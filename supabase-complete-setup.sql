-- ========================================
-- COMPLETE SUPABASE SETUP FROM SCRATCH
-- ========================================
-- This creates ALL necessary tables and the admin user
-- ========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- ENUMS
-- ========================================

DO $$ BEGIN
    CREATE TYPE subscription_status AS ENUM ('active', 'cancelled', 'past_due', 'paused');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE token_transaction_type AS ENUM ('purchase', 'spend', 'bonus', 'refund');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE ai_feature AS ENUM (
      'job_match',
      'resume_analysis',
      'cover_letter',
      'interview_prep',
      'salary_analysis',
      'company_research',
      'resume_optimization'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ========================================
-- CREATE USERS TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Authentication (links to auth.users)
  auth_user_id UUID UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,

  -- Profile
  full_name VARCHAR(255),
  profile_picture TEXT,

  -- Subscription
  is_premium BOOLEAN DEFAULT FALSE NOT NULL,
  subscription_id VARCHAR(255) UNIQUE,
  subscription_status subscription_status,
  subscription_end_date TIMESTAMP WITH TIME ZONE,
  subscription_created_at TIMESTAMP WITH TIME ZONE,

  -- Admin access
  is_admin BOOLEAN DEFAULT FALSE NOT NULL,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  last_login TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- ========================================
-- CREATE USER_TOKENS TABLE
-- ========================================

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

-- ========================================
-- CREATE TOKEN_TRANSACTIONS TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS token_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  type token_transaction_type NOT NULL,
  amount INTEGER NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ========================================
-- CREATE TOKEN_PACKAGES TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS token_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  name VARCHAR(255) NOT NULL,
  description TEXT,
  tokens INTEGER NOT NULL CHECK (tokens > 0),
  price_cents INTEGER NOT NULL CHECK (price_cents > 0),

  stripe_price_id VARCHAR(255) UNIQUE,

  is_popular BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ========================================
-- CREATE TOKEN_PURCHASES TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS token_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  package_id UUID REFERENCES token_packages(id) ON DELETE SET NULL,

  tokens_purchased INTEGER NOT NULL,
  amount_cents INTEGER NOT NULL,

  stripe_payment_intent_id VARCHAR(255) UNIQUE,
  stripe_charge_id VARCHAR(255),

  status VARCHAR(50) DEFAULT 'pending',
  completed_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ========================================
-- UPDATE AI_FEATURE_COSTS TABLE
-- ========================================

-- Add is_active column if missing
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_feature_costs') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_feature_costs' AND column_name = 'is_active') THEN
            ALTER TABLE ai_feature_costs ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
        END IF;
    ELSE
        -- Create table if it doesn't exist
        CREATE TABLE ai_feature_costs (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

          feature ai_feature NOT NULL UNIQUE,
          cost_tokens INTEGER NOT NULL CHECK (cost_tokens > 0),
          description TEXT,

          average_api_cost_usd DECIMAL(10, 6),
          is_active BOOLEAN DEFAULT TRUE,

          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        );
    END IF;
END $$;

-- ========================================
-- CREATE INDEXES
-- ========================================

CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin);
CREATE INDEX IF NOT EXISTS idx_users_is_premium ON users(is_premium);
CREATE INDEX IF NOT EXISTS idx_user_tokens_user_id ON user_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_token_transactions_user_id ON token_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_token_purchases_user_id ON token_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_token_packages_is_active ON token_packages(is_active);

-- ========================================
-- CREATE TRIGGERS
-- ========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_tokens_updated_at ON user_tokens;
CREATE TRIGGER update_user_tokens_updated_at BEFORE UPDATE ON user_tokens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_token_packages_updated_at ON token_packages;
CREATE TRIGGER update_token_packages_updated_at BEFORE UPDATE ON token_packages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ai_feature_costs_updated_at ON ai_feature_costs;
CREATE TRIGGER update_ai_feature_costs_updated_at BEFORE UPDATE ON ai_feature_costs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- ENABLE ROW LEVEL SECURITY
-- ========================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_feature_costs ENABLE ROW LEVEL SECURITY;

-- ========================================
-- CREATE RLS POLICIES
-- ========================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Users can view their own tokens" ON user_tokens;
DROP POLICY IF EXISTS "Users can view their own transactions" ON token_transactions;
DROP POLICY IF EXISTS "Anyone can view active packages" ON token_packages;
DROP POLICY IF EXISTS "Admins can manage packages" ON token_packages;
DROP POLICY IF EXISTS "Users can view their own purchases" ON token_purchases;
DROP POLICY IF EXISTS "Anyone can view active feature costs" ON ai_feature_costs;
DROP POLICY IF EXISTS "Admins can manage feature costs" ON ai_feature_costs;

-- Users policies
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  USING (auth_user_id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (auth_user_id = auth.uid());

CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND is_admin = TRUE
  ));

-- User tokens policies
CREATE POLICY "Users can view their own tokens"
  ON user_tokens FOR SELECT
  USING (user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));

-- Token transactions policies
CREATE POLICY "Users can view their own transactions"
  ON token_transactions FOR SELECT
  USING (user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));

-- Token packages policies
CREATE POLICY "Anyone can view active packages"
  ON token_packages FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Admins can manage packages"
  ON token_packages FOR ALL
  USING (EXISTS (
    SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND is_admin = TRUE
  ));

-- Token purchases policies
CREATE POLICY "Users can view their own purchases"
  ON token_purchases FOR SELECT
  USING (user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));

-- AI feature costs policies
CREATE POLICY "Anyone can view active feature costs"
  ON ai_feature_costs FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Admins can manage feature costs"
  ON ai_feature_costs FOR ALL
  USING (EXISTS (
    SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND is_admin = TRUE
  ));

-- ========================================
-- SEED DATA
-- ========================================

-- Insert AI feature costs
INSERT INTO ai_feature_costs (feature, cost_tokens, description, average_api_cost_usd)
VALUES
  ('job_match'::ai_feature, 5, 'AI-powered job matching analysis', 0.001),
  ('resume_analysis'::ai_feature, 10, 'Comprehensive resume analysis', 0.002),
  ('cover_letter'::ai_feature, 15, 'AI-generated cover letter', 0.003),
  ('interview_prep'::ai_feature, 20, 'Interview question preparation', 0.004),
  ('salary_analysis'::ai_feature, 8, 'Salary insights and negotiation tips', 0.002),
  ('company_research'::ai_feature, 12, 'Company culture and insights', 0.0025),
  ('resume_optimization'::ai_feature, 15, 'Tailored resume optimization', 0.003)
ON CONFLICT (feature) DO NOTHING;

-- Insert token packages
INSERT INTO token_packages (name, description, tokens, price_cents, is_popular, display_order)
VALUES
  ('Starter Pack', 'Perfect for getting started', 100, 499, FALSE, 1),
  ('Popular Pack', 'Most popular choice', 500, 1999, TRUE, 2),
  ('Pro Pack', 'Best value for serious job seekers', 1200, 3999, FALSE, 3),
  ('Ultimate Pack', 'Maximum value', 3000, 8999, FALSE, 4)
ON CONFLICT DO NOTHING;

-- ========================================
-- CREATE ADMIN USER
-- ========================================

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
        RAISE EXCEPTION 'Auth user not found with ID: %', v_admin_auth_id;
    END IF;

    RAISE NOTICE '✅ Found auth user: %', v_auth_email;

    -- Create or update user profile
    INSERT INTO users (auth_user_id, email, full_name, is_admin, is_premium)
    VALUES (v_admin_auth_id, v_auth_email, 'Admin User', TRUE, TRUE)
    ON CONFLICT (auth_user_id) DO UPDATE
    SET is_admin = TRUE, is_premium = TRUE
    RETURNING id INTO v_admin_user_id;

    RAISE NOTICE '✅ Admin user profile created/updated: %', v_admin_user_id;

    -- Credit tokens
    INSERT INTO user_tokens (user_id, balance, lifetime_earned, lifetime_purchased, lifetime_spent)
    VALUES (v_admin_user_id, 1000, 1000, 0, 0)
    ON CONFLICT (user_id) DO UPDATE
    SET balance = 1000, lifetime_earned = 1000;

    RAISE NOTICE '✅ Credited 1000 tokens';
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '🎉 SETUP COMPLETE!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Email: admin@jobai.com';
    RAISE NOTICE 'Password: Admin123!@#';
    RAISE NOTICE 'Login: http://localhost:3000/auth/login';
    RAISE NOTICE 'Admin: http://localhost:3000/admin';
    RAISE NOTICE '========================================';
END $$;

-- Verify
SELECT
    u.id,
    u.auth_user_id,
    u.email,
    u.is_admin,
    u.is_premium,
    ut.balance as tokens
FROM users u
LEFT JOIN user_tokens ut ON ut.user_id = u.id
WHERE u.email = 'admin@jobai.com';
