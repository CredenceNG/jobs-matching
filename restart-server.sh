#!/bin/bash

echo "🔄 Restarting Next.js Development Server..."
echo ""

# Kill existing dev servers
echo "1. Stopping any running dev servers..."
pkill -f "next dev" 2>/dev/null
sleep 2

# Clear Next.js cache
echo "2. Clearing .next cache..."
rm -rf .next

# Clear node_modules/.cache
echo "3. Clearing node cache..."
rm -rf node_modules/.cache 2>/dev/null

echo ""
echo "✅ Cache cleared!"
echo ""
echo "Now run:"
echo "  npm run dev"
echo ""
echo "Then visit: http://localhost:3000/resume-jobs-v3"
echo ""
