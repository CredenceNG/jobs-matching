-- ========================================
-- SAFE SUPABASE DATABASE SETUP
-- ========================================
-- This version checks if objects exist before creating
-- Run this script in your Supabase SQL Editor
-- Dashboard → SQL Editor → New Query → Paste and Run
-- ========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- ENUMS (Create only if they don't exist)
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
-- TABLES
-- ========================================

-- Users table (extends auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Authentication (should match auth.users.id)
  auth_user_id UUID UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,

  -- Profile basics
  full_name VARCHAR(255),
  profile_picture TEXT,

  -- Subscription management
  is_premium BOOLEAN DEFAULT FALSE NOT NULL,
  subscription_id VARCHAR(255) UNIQUE,
  subscription_status subscription_status,
  subscription_end_date TIMESTAMP WITH TIME ZONE,
  subscription_created_at TIMESTAMP WITH TIME ZONE,

  -- Admin flag
  is_admin BOOLEAN DEFAULT FALSE NOT NULL,

  -- Tracking
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  last_login TIMESTAMP WITH TIME ZONE,

  -- Soft delete
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Add is_admin column if it doesn't exist
DO $$
BEGIN
    ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE NOT NULL;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- User tokens table (tracks token balance and history)
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

-- Token transactions (audit log of all token changes)
CREATE TABLE IF NOT EXISTS token_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  type token_transaction_type NOT NULL,
  amount INTEGER NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Token packages (available for purchase)
CREATE TABLE IF NOT EXISTS token_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  name VARCHAR(255) NOT NULL,
  description TEXT,
  tokens INTEGER NOT NULL CHECK (tokens > 0),
  price_cents INTEGER NOT NULL CHECK (price_cents > 0),

  -- Stripe integration
  stripe_price_id VARCHAR(255) UNIQUE,

  -- Display
  is_popular BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Token purchases (history of token purchases)
CREATE TABLE IF NOT EXISTS token_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  package_id UUID REFERENCES token_packages(id) ON DELETE SET NULL,

  tokens_purchased INTEGER NOT NULL,
  amount_cents INTEGER NOT NULL,

  -- Stripe payment info
  stripe_payment_intent_id VARCHAR(255) UNIQUE,
  stripe_charge_id VARCHAR(255),

  -- Status
  status VARCHAR(50) DEFAULT 'pending',
  completed_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- AI feature costs (token costs per feature)
CREATE TABLE IF NOT EXISTS ai_feature_costs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  feature ai_feature NOT NULL UNIQUE,
  cost_tokens INTEGER NOT NULL CHECK (cost_tokens > 0),
  description TEXT,

  -- Cost tracking
  average_api_cost_usd DECIMAL(10, 6),

  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ========================================
-- INDEXES
-- ========================================

CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);
CREATE INDEX IF NOT EXISTS idx_users_is_premium ON users(is_premium);
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin);
CREATE INDEX IF NOT EXISTS idx_user_tokens_user_id ON user_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_token_transactions_user_id ON token_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_token_transactions_type ON token_transactions(type);
CREATE INDEX IF NOT EXISTS idx_token_transactions_created_at ON token_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_token_purchases_user_id ON token_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_token_purchases_stripe_payment_intent ON token_purchases(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_token_packages_is_active ON token_packages(is_active);

-- ========================================
-- TRIGGERS
-- ========================================

-- Update updated_at timestamp automatically
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
-- ROW LEVEL SECURITY (RLS)
-- ========================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_feature_costs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
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

-- Token packages policies (public read)
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

-- AI feature costs policies (public read)
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

-- Insert default AI feature costs (only if table is empty)
INSERT INTO ai_feature_costs (feature, cost_tokens, description, average_api_cost_usd)
SELECT * FROM (VALUES
  ('job_match'::ai_feature, 5, 'AI-powered job matching analysis', 0.001),
  ('resume_analysis'::ai_feature, 10, 'Comprehensive resume analysis', 0.002),
  ('cover_letter'::ai_feature, 15, 'AI-generated cover letter', 0.003),
  ('interview_prep'::ai_feature, 20, 'Interview question preparation', 0.004),
  ('salary_analysis'::ai_feature, 8, 'Salary insights and negotiation tips', 0.002),
  ('company_research'::ai_feature, 12, 'Company culture and insights', 0.0025),
  ('resume_optimization'::ai_feature, 15, 'Tailored resume optimization', 0.003)
) AS v(feature, cost_tokens, description, average_api_cost_usd)
WHERE NOT EXISTS (SELECT 1 FROM ai_feature_costs WHERE feature = v.feature);

-- Insert default token packages (only if table is empty)
INSERT INTO token_packages (name, description, tokens, price_cents, is_popular, display_order)
SELECT * FROM (VALUES
  ('Starter Pack', 'Perfect for getting started', 100, 499, FALSE, 1),
  ('Popular Pack', 'Most popular choice', 500, 1999, TRUE, 2),
  ('Pro Pack', 'Best value for serious job seekers', 1200, 3999, FALSE, 3),
  ('Ultimate Pack', 'Maximum value', 3000, 8999, FALSE, 4)
) AS v(name, description, tokens, price_cents, is_popular, display_order)
WHERE NOT EXISTS (SELECT 1 FROM token_packages LIMIT 1);

-- ========================================
-- CREATE ADMIN USER
-- ========================================

DO $$
DECLARE
    v_admin_auth_id uuid;
    v_admin_user_id uuid;
BEGIN
    -- Find the auth user ID for admin@jobai.com
    SELECT id INTO v_admin_auth_id
    FROM auth.users
    WHERE email = 'admin@jobai.com';

    IF v_admin_auth_id IS NULL THEN
        RAISE NOTICE '⚠️  Auth user admin@jobai.com not found. Auth user was created earlier (ID: 0bcb5338-8bab-431a-9435-07a25e224770)';
        RAISE NOTICE '   Using the existing auth user ID...';
        v_admin_auth_id := '0bcb5338-8bab-431a-9435-07a25e224770';
    ELSE
        RAISE NOTICE '✅ Found auth user: %', v_admin_auth_id;
    END IF;

    -- Check if user exists in users table
    SELECT id INTO v_admin_user_id
    FROM users
    WHERE auth_user_id = v_admin_auth_id;

    IF v_admin_user_id IS NULL THEN
        -- Create new user record
        INSERT INTO users (auth_user_id, email, full_name, is_admin, is_premium, subscription_status)
        VALUES (
            v_admin_auth_id,
            'admin@jobai.com',
            'Admin User',
            TRUE,
            TRUE,
            'active'
        )
        RETURNING id INTO v_admin_user_id;

        RAISE NOTICE '✅ Created admin user with ID: %', v_admin_user_id;
    ELSE
        -- Update existing user
        UPDATE users
        SET is_admin = TRUE,
            is_premium = TRUE,
            subscription_status = 'active'
        WHERE id = v_admin_user_id;

        RAISE NOTICE '✅ Updated existing user to admin: %', v_admin_user_id;
    END IF;

    -- Give admin 1000 tokens
    INSERT INTO user_tokens (user_id, balance, lifetime_earned, lifetime_purchased, lifetime_spent)
    VALUES (v_admin_user_id, 1000, 1000, 0, 0)
    ON CONFLICT (user_id) DO UPDATE SET
        balance = user_tokens.balance + 1000,
        lifetime_earned = user_tokens.lifetime_earned + 1000;

    RAISE NOTICE '✅ Credited 1000 tokens to admin user';
    RAISE NOTICE '';
    RAISE NOTICE '🎉 ADMIN USER SETUP COMPLETE!';
    RAISE NOTICE '   Email: admin@jobai.com';
    RAISE NOTICE '   Password: Admin123!@#';
    RAISE NOTICE '';
END $$;

-- ========================================
-- VERIFICATION QUERY
-- ========================================

-- Verify admin user was created
SELECT
    u.id,
    u.auth_user_id,
    u.email,
    u.full_name,
    u.is_admin,
    u.is_premium,
    ut.balance as token_balance
FROM users u
LEFT JOIN user_tokens ut ON ut.user_id = u.id
WHERE u.email = 'admin@jobai.com';
