-- Check what schema we're in and what tables exist

-- Show current schema
SELECT current_schema();

-- List ALL tables in public schema
SELECT schemaname, tablename
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check auth.users
SELECT 'auth.users count' as info, COUNT(*) as count
FROM auth.users;

-- Check if there's a users table in auth schema
SELECT schemaname, tablename
FROM pg_tables
WHERE tablename = 'users';
