-- Manual migration to remove Supabase dependency
-- This migration:
-- 1. Adds a password column
-- 2. Drops the auth_user_id column (after data cleanup)

-- Step 1: Add password column (nullable for now)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password" VARCHAR(255);

-- Step 2: For existing users, we need to set a temporary password
-- WARNING: These users will need to reset their passwords
-- You should send password reset emails to: admin@jobai.com and test@jobai.com

-- Step 3: Drop the auth_user_id column (removes Supabase dependency)
ALTER TABLE "users" DROP COLUMN IF EXISTS "auth_user_id";

-- Step 4: Generate Prisma client
-- Run: npx prisma generate
