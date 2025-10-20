/**
 * Seed Test User for Development
 *
 * Creates a test user with tokens for testing the token purchase system
 *
 * Test User Credentials:
 * Email: test@jobai.com
 * Password: Test123456!
 */

-- Insert test user into auth.users table
-- Note: This assumes you're running this in Supabase SQL Editor or via supabase db execute

-- First, let's create a test user using Supabase Auth
-- You'll need to run this in Supabase Dashboard > SQL Editor

-- Create test user (Supabase will handle password hashing)
-- Note: You should use Supabase Dashboard > Authentication > Add User instead
-- OR use the signup endpoint

-- Alternative: Insert user tokens record directly
-- Assuming user already exists with id, otherwise create via Dashboard first

-- For development: Create a user via the signup endpoint
-- Then run this to give them initial tokens:

-- UPDATE user_tokens
-- SET token_balance = 1000,
--     total_tokens_purchased = 1000
-- WHERE user_id = 'YOUR_USER_ID_HERE';

-- Or insert if doesn't exist:
-- INSERT INTO user_tokens (user_id, token_balance, total_tokens_purchased)
-- VALUES ('YOUR_USER_ID_HERE', 1000, 1000)
-- ON CONFLICT (user_id) DO UPDATE
-- SET token_balance = 1000;
