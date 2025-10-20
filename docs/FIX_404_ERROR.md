# Fix: 404 Error on /resume-jobs-v3

## Problem
`http://localhost:3000/resume-jobs-v3` returns 404 error.

## Solution

### Quick Fix (Restart Dev Server)

**Option 1: Use the restart script**
```bash
./restart-server.sh
npm run dev
```

**Option 2: Manual restart**
```bash
# 1. Stop the dev server (Ctrl+C in terminal)

# 2. Clear cache
rm -rf .next
rm -rf node_modules/.cache

# 3. Start again
npm run dev

# 4. Wait for build to complete (watch for "compiled successfully")

# 5. Visit: http://localhost:3000/resume-jobs-v3
```

---

## Why This Happens

Next.js caches routes and sometimes doesn't pick up new pages until you:
1. Clear the `.next` cache directory
2. Restart the dev server

This is common when adding new pages to an existing Next.js app.

---

## Verification Steps

### Step 1: Check File Exists
```bash
ls -la src/app/resume-jobs-v3/page.tsx
```
Should show: `-rw-r--r--  1 user  staff  36632 ... page.tsx` ✅

### Step 2: Check Server Is Running
```bash
curl http://localhost:3000
```
Should return HTML (not "connection refused")

### Step 3: Check Build Logs
When you run `npm run dev`, look for:
```
✓ Compiled /resume-jobs-v3 in XXXms
```

If you see errors instead, that's the issue.

---

## Common Issues

### Issue 1: Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Fix:**
```bash
# Kill the process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
npm run dev -- -p 3001
```

### Issue 2: Module Not Found
```
Module not found: Can't resolve 'xyz'
```

**Fix:**
```bash
npm install
npm run dev
```

### Issue 3: TypeScript Errors
```
Type error: ...
```

**Fix:**
Check the error message. Common fixes:
```bash
# Restart TypeScript server in your editor
# Or reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

---

## Test Other Pages

To verify the server is working, try these pages:
- `http://localhost:3000/` - Home page
- `http://localhost:3000/resume-jobs-v2` - V2 page
- `http://localhost:3000/api/health` - API health check

If these also return 404, the server might not be running or is on a different port.

---

## Alternative: Access Via Direct Navigation

If `/resume-jobs-v3` still doesn't work after restart, try:

1. Go to `http://localhost:3000/`
2. Manually change URL to `/resume-jobs-v3`
3. If that works, there might be a routing issue

Or create a link on the homepage:
```typescript
// In src/app/page.tsx
<Link href="/resume-jobs-v3">Try V3</Link>
```

---

## Nuclear Option (If Nothing Works)

```bash
# 1. Stop server
# Ctrl+C

# 2. Clean everything
rm -rf .next
rm -rf node_modules
rm -rf package-lock.json

# 3. Reinstall
npm install

# 4. Start fresh
npm run dev

# This should definitely work
```

---

## Success Checklist

After restarting, you should see:
- [ ] Terminal shows "✓ Compiled successfully"
- [ ] No red errors in terminal
- [ ] `http://localhost:3000/resume-jobs-v3` loads
- [ ] Page shows "Let AI Find Your Perfect Job" heading
- [ ] Can upload resume file

---

## Still Not Working?

Check these:

1. **Correct directory?**
   ```bash
   pwd
   # Should be: /Users/itopa/projects/jobai-search
   ```

2. **Right page file?**
   ```bash
   cat src/app/resume-jobs-v3/page.tsx | head -5
   # Should show: 'use client'
   ```

3. **Server actually running?**
   ```bash
   ps aux | grep "next dev"
   # Should show a process
   ```

4. **Port correct?**
   Sometimes Next.js uses port 3001 if 3000 is busy.
   Check terminal output for actual port.

---

## Expected Output After Restart

```bash
$ npm run dev

> jobai-search@1.0.0 dev
> next dev

  ▲ Next.js 14.x.x
  - Local:        http://localhost:3000
  - Environments: .env.local

 ✓ Ready in 2.3s
 ○ Compiling / ...
 ✓ Compiled / in 1.2s
 ○ Compiling /resume-jobs-v3 ...
 ✓ Compiled /resume-jobs-v3 in 890ms
```

Then `http://localhost:3000/resume-jobs-v3` should work! ✅
