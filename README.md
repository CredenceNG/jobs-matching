# JobAI - AI-Powered Job Search Platform

A Next.js application that helps job seekers find, match, and apply to jobs using AI-powered matching, resume parsing, and personalized career insights.

## 🚀 Features

### Free Tier

- **Job Search**: Browse and search through 10,000+ job postings
- **AI Matching**: Get AI-powered job match scores (50 matches/month)
- **Resume Parsing**: Upload and parse your resume automatically
- **Basic Profile**: Create and manage your professional profile
- **Job Tracking**: Save and track job applications

### Premium Tier ($3/month)

- **Unlimited AI Matching**: No limits on job match analysis
- **Cover Letter Generation**: AI-generated personalized cover letters
- **Interview Preparation**: AI-powered interview questions and practice
- **Saved Search Alerts**: Email/SMS notifications for new matching jobs
- **Advanced Analytics**: Detailed career insights and recommendations
- **Salary Analysis**: Market salary data and negotiation tips

## 🏗️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase PostgreSQL
- **AI Services**: Anthropic Claude (Sonnet 4.5), OpenAI (GPT-4o-mini)
- **Authentication**: Supabase Auth
- **Payments**: Stripe
- **Email**: SendGrid
- **Deployment**: Netlify
- **Caching**: Redis (Upstash)

## 📋 Prerequisites

- Node.js 18.17+
- npm or yarn
- Supabase account
- Anthropic API key
- OpenAI API key
- SendGrid account
- Stripe account (for payments)

## 🛠️ Local Development Setup

### 1. Clone and Install

```bash
git clone <your-repo>
cd jobai-nextjs
npm install
```

### 2. Environment Configuration

Copy the environment template and fill in your API keys:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your actual API keys:

```bash
# Required for basic functionality
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ANTHROPIC_API_KEY=your-anthropic-api-key
OPENAI_API_KEY=your-openai-api-key
SENDGRID_API_KEY=your-sendgrid-api-key
```

### 3. Database Setup

Initialize Supabase locally (optional):

```bash
# Install Supabase CLI
npm install -g supabase

# Start local Supabase (optional)
supabase start

# Or use your hosted Supabase instance
# Run migrations on your hosted instance
supabase db push
```

Apply the database schema:

```bash
# Run migrations
npm run db:migrate

# Seed sample data (development)
npm run db:seed
```

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
jobai-nextjs/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Authentication pages
│   │   ├── (dashboard)/       # Main application
│   │   ├── api/               # API endpoints
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Home page
│   ├── components/            # React components
│   │   ├── ai/               # AI-related components
│   │   ├── jobs/             # Job-related components
│   │   ├── auth/             # Authentication components
│   │   └── ui/               # UI components (shadcn/ui)
│   ├── lib/                   # Utility libraries
│   │   ├── ai/               # AI service clients
│   │   ├── database/         # Database utilities
│   │   ├── cache/            # Caching layer
│   │   └── utils/            # General utilities
│   ├── hooks/                # Custom React hooks
│   └── types/                # TypeScript type definitions
├── supabase/                 # Database schema and migrations
├── public/                   # Static assets
└── docs/                     # Documentation
```

## 🔧 Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server
npm run lint            # Run ESLint
npm run type-check      # TypeScript type checking

# Database
npm run db:migrate      # Run database migrations
npm run db:seed         # Seed database with sample data
npm run db:reset        # Reset database (development only)
```

## 🤖 AI Integration

### Claude (Anthropic)

- **Primary AI**: Used for complex reasoning tasks
- **Use cases**: Job matching, cover letters, career insights
- **Cost**: ~$3 per 1M tokens (input)

### OpenAI GPT-4o-mini

- **Fallback AI**: Used for cost-effective operations
- **Use cases**: Resume parsing, simple matching
- **Cost**: ~$0.15 per 1M tokens (input)

### Cost Optimization

- **Caching**: 24-hour cache for job matches
- **Rate Limiting**: Per-user quotas for free vs premium
- **Model Selection**: Auto-fallback based on complexity
- **Budget Monitoring**: Daily spend tracking with alerts

## 💳 Payment Integration

### Stripe Configuration

- **Monthly**: $3/month premium subscription
- **Annual**: $30/year (17% discount)
- **Features**: Unlimited AI, alerts, advanced analytics

### Webhook Setup

Configure webhook endpoint in Stripe dashboard:

```
https://your-domain.com/api/payments/webhook
```

## 📧 Email Service (Resend)

1. **Create Resend Account:**

   - Sign up at [Resend](https://resend.com)
   - Verify your domain
   - Generate an API key

2. **Configure Email Settings:**
   ```env
   RESEND_API_KEY="your_resend_api_key_here"
   RESEND_FROM_EMAIL="noreply@yourdomain.com"
   RESEND_FROM_NAME="JobAI"
   ```

## 🚀 Deployment

### Netlify Deployment

1. **Build Settings**:

   - Build command: `npm run build`
   - Publish directory: `.next`

2. **Environment Variables**:
   Set all production environment variables in Netlify dashboard

3. **Functions**:
   API routes automatically deploy as Netlify Functions

### Environment Variables (Production)

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=your-production-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-production-service-key
ANTHROPIC_API_KEY=your-anthropic-key
OPENAI_API_KEY=your-openai-key
SENDGRID_API_KEY=your-sendgrid-key

# Payments
STRIPE_SECRET_KEY=your-production-stripe-key
STRIPE_WEBHOOK_SECRET=your-webhook-secret

# Optional (Performance)
UPSTASH_REDIS_URL=your-redis-url
UPSTASH_REDIS_TOKEN=your-redis-token
```

## 📊 Monitoring & Analytics

### Cost Tracking

- Daily AI spend monitoring
- Per-user usage analytics
- Budget alerts via email

### Performance Monitoring

- API response times
- Cache hit rates
- Error tracking

### User Analytics

- Feature usage metrics
- Conversion tracking
- Engagement analytics

## 🔒 Security

### Data Protection

- Row Level Security (RLS) in Supabase
- JWT token validation
- Input sanitization
- CORS configuration

### Privacy Compliance

- GDPR compliance mode
- CCPA compliance
- Data retention policies
- User data export/deletion

## 🧪 Testing

### Unit Tests

```bash
npm run test
```

### Integration Tests

```bash
npm run test:integration
```

### E2E Tests

```bash
npm run test:e2e
```

## 🔧 Configuration

### Feature Flags

Enable/disable features via environment variables:

```bash
FEATURE_RESUME_PARSING=true
FEATURE_COVER_LETTER_GENERATION=true
FEATURE_INTERVIEW_PREP=true
FEATURE_SMS_ALERTS=false
```

### Rate Limiting

Configure per-user limits:

```bash
RATE_LIMIT_JOB_SEARCH=100      # searches per hour
RATE_LIMIT_AI_REQUESTS=50      # AI requests per hour
AI_USER_DAILY_LIMIT_USD=1.00   # daily AI spend limit
```

## 📚 API Documentation

### Authentication

All API endpoints require JWT authentication except:

- `GET /api/jobs/search` (public job search)
- `POST /api/auth/*` (authentication endpoints)

### Rate Limiting

- **Free users**: 100 job searches/hour, 50 AI requests/day
- **Premium users**: 1000 job searches/hour, unlimited AI

### Error Handling

API returns consistent error format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs/](./docs/)
- **Issues**: GitHub Issues
- **Email**: support@jobai.dev
- **Discord**: [Join our community](https://discord.gg/jobai)

## 🗺️ Roadmap

### Q1 2024

- [ ] Advanced AI matching with company culture fit
- [ ] Integration with LinkedIn/GitHub for profile import
- [ ] Mobile app (React Native)

### Q2 2024

- [ ] AI-powered salary negotiation guidance
- [ ] Company research and insights
- [ ] Bulk job application features

### Q3 2024

- [ ] Interview scheduling integration
- [ ] Career path recommendations
- [ ] Skills assessment and gap analysis

---

Built with ❤️ using Next.js, Supabase, and AI
