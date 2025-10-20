# Debug & Test Scripts

This folder contains all debugging and testing scripts for the JobAI project.

## 📋 Available Scripts

### AI Feature Tests

| Script | Description | Usage |
|--------|-------------|-------|
| **test-ai-features.js** | Tests all AI features (resume parsing, job matching, insights) | `node debug-tests/test-ai-features.js` |
| **test-ai-matching.js** | Tests AI job matching algorithm | `node debug-tests/test-ai-matching.js` |
| **test-ai-job-search-api.js** | Tests V3 AI job search API endpoint | `node debug-tests/test-ai-job-search-api.js` |

### API Tests

| Script | Description | Usage |
|--------|-------------|-------|
| **test-apis.js** | Tests various API endpoints | `node debug-tests/test-apis.js` |

### Job Search Tests

| Script | Description | Usage |
|--------|-------------|-------|
| **test-job-normalization.js** | Tests job data normalization | `node debug-tests/test-job-normalization.js` |
| **test-job-search-debug.js** | Debug job search functionality | `node debug-tests/test-job-search-debug.js` |

## 🚀 Running Tests

### Run Individual Test
```bash
node debug-tests/test-ai-features.js
```

### Run All Tests (create a test runner)
```bash
# Coming soon: npm run test:debug
```

## 📝 Creating New Test Scripts

All new debugging and testing scripts should be created in this folder.

### Naming Convention
- **test-[feature].js** - Feature-specific tests
- **debug-[feature].js** - Debug scripts for troubleshooting
- **verify-[feature].js** - Verification scripts

### Template

```javascript
/**
 * Test: [Feature Name]
 * Description: [What this test does]
 * Usage: node debug-tests/test-[feature].js
 */

// Load environment variables
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') })

// Your test code here

async function runTest() {
  try {
    console.log('🧪 Testing [Feature Name]...')

    // Test logic here

    console.log('✅ Test passed!')
  } catch (error) {
    console.error('❌ Test failed:', error)
    process.exit(1)
  }
}

runTest()
```

## 🔧 Environment Variables

Tests use `.env.local` from the project root. Make sure the following are set:

```env
ANTHROPIC_API_KEY=your_key_here
NEXT_PUBLIC_SUPABASE_URL=your_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here
```

## 📊 Test Results

Test results are logged to console. For detailed debugging:
- Check network requests
- Review API responses
- Verify database state

## 🆘 Troubleshooting

### Common Issues

**Issue**: "API key not found"
**Fix**: Ensure `.env.local` exists in project root with valid keys

**Issue**: "Module not found"
**Fix**: Run `npm install` from project root

**Issue**: "Connection refused"
**Fix**: Ensure Next.js dev server is running if testing API endpoints

## 📚 Related Documentation

- [V2 vs V3 Complete Documentation](../docs/V2_V3_COMPLETE_DOCUMENTATION.md)
- [AI Implementation Guide](../docs/AI_JOB_SEARCH_IMPLEMENTATION.md)
- [API Documentation](../docs/)

---

**Last Updated**: 2025-10-12
**Maintained By**: Development Team
