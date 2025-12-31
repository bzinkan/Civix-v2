# Civix AI Setup Guide

## Overview

Civix now features a **hybrid AI + deterministic rules system**:

1. **AI Layer** (Gemini/Claude/OpenAI): Handles natural language understanding, category matching, and conversation
2. **Deterministic Engine**: Evaluates rules with 100% accuracy once inputs are collected

## Architecture

```
User Question
    ↓
AI detects jurisdiction (Cincinnati, OH)
    ↓
AI matches to category (animals/zoning/etc.)
    ↓
AI asks clarifying questions to collect inputs
    ↓
Deterministic engine evaluates rules
    ↓
Response with exact citations
```

## Getting Started

### 1. Install Dependencies

```bash
cd C:\Users\zinka\Documents\Civix-v2
npm install
```

This will install:
- `@google/generative-ai` - Gemini API
- `@anthropic-ai/sdk` - Claude API
- `openai` - OpenAI API
- `@fingerprintjs/fingerprintjs` - Anonymous user tracking
- `date-fns` - Date utilities

### 2. Get API Keys

#### Gemini (Google AI)
1. Go to https://makersuite.google.com/app/apikey
2. Click "Create API Key"
3. Copy the key

#### Claude (Anthropic)
1. Go to https://console.anthropic.com/
2. Sign up or login
3. Go to "API Keys" → "Create Key"
4. Copy the key

#### OpenAI
1. Go to https://platform.openai.com/api-keys
2. Sign up or login
3. Click "Create new secret key"
4. Copy the key

### 3. Configure Environment Variables

Create or update your `.env` file:

```bash
# Copy from example
cp .env.example .env
```

Add your API keys to `.env`:

```env
# AI Providers
GEMINI_API_KEY="your-actual-gemini-key-here"
ANTHROPIC_API_KEY="your-actual-anthropic-key-here"
OPENAI_API_KEY="your-actual-openai-key-here"

# AI Configuration
AI_PRIMARY_PROVIDER="gemini"  # Primary: gemini (cheapest, fastest)
AI_FALLBACK_ENABLED="true"    # Auto-fallback if primary fails
FREE_QUERY_LIMIT="3"          # Free queries per month
```

### 4. Update Database Schema

```bash
npm run db:push
```

This creates new tables:
- `Conversation` - Multi-turn AI conversations
- `Message` - Individual messages in conversations
- `AnonymousUsage` - Track free tier limits
- `Citation` - Legal citations for rules

Updates existing tables:
- `Rule` - Added AI matching fields (canonicalQuestions, keywords, requiredInputs)
- `User` - Added subscription tracking, query credits

### 5. Test AI Providers

Create a test file to verify your API keys work:

```typescript
// test-ai.ts
import { testProvider, getAvailableProviders } from './lib/ai/providers';

async function test() {
  const available = getAvailableProviders();
  console.log('Available providers:', available);

  for (const provider of available) {
    const works = await testProvider(provider);
    console.log(`${provider}: ${works ? '✅ Working' : '❌ Failed'}`);
  }
}

test();
```

Run it:
```bash
npx tsx test-ai.ts
```

## Project Structure

```
lib/
├── ai/
│   ├── providers.ts          # Multi-provider AI client (Gemini/Claude/OpenAI)
│   ├── matcher.ts             # Category matching, input extraction
│   └── conversation.ts        # Conversation orchestration
├── auth/
│   └── usage-limiter.ts       # Free tier tracking
├── rules/
│   ├── engine.ts              # (existing) Deterministic rule evaluator
│   └── evaluator.ts           # Bridge between AI and rules engine
├── types/
│   └── conversation.ts        # TypeScript types
└── db.ts                      # Prisma client

app/
├── api/
│   └── query/
│       └── route.ts           # Main query API endpoint
└── ask/
    └── page.tsx               # Query interface UI

components/
└── query/
    └── QueryInterface.tsx     # React conversation component
```

## Usage Flow

### For End Users

1. Visit `/ask`
2. Type question: "Can I keep chickens in Cincinnati?"
3. AI conversation:
   - Detects jurisdiction: Cincinnati, OH
   - Matches category: animals → chickens
   - Asks clarifying questions
4. Deterministic evaluation returns exact answer with citations

### API Usage

```typescript
// POST /api/query
const response = await fetch('/api/query', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: "Can I keep chickens?",
    conversationId: null,  // null for new conversation
    fingerprint: "user-fingerprint-here"
  })
});

const data = await response.json();
// data.type: 'question' | 'clarification' | 'result' | 'error' | 'paywall'
// data.message: AI response
// data.conversationId: Continue conversation with this ID
```

## Adding Rules for Cincinnati

### Step 1: Add Jurisdiction

```typescript
await db.jurisdiction.create({
  data: {
    id: 'cincinnati-oh',
    name: 'Cincinnati, OH',
    type: 'city',
    state: 'OH',
  }
});
```

### Step 2: Create Ruleset

```typescript
await db.ruleset.create({
  data: {
    jurisdictionId: 'cincinnati-oh',
    category: 'animals',
    version: 1,
    isActive: true,
  }
});
```

### Step 3: Add Rules

```typescript
await db.rule.create({
  data: {
    rulesetId: 'your-ruleset-id',
    key: 'chickens_residential',
    description: 'Chickens allowed in residential zones',
    outcome: 'CONDITIONAL',

    // AI matching fields
    subcategory: 'chickens',
    canonicalQuestions: [
      'Can I keep chickens?',
      'Are chickens allowed?',
      'Can I have chickens in my backyard?'
    ],
    keywords: ['chicken', 'poultry', 'hens', 'roosters'],
    requiredInputs: ['propertyZone', 'numberOfChickens', 'hasRoosters'],

    // Rule logic
    conditions: {
      type: 'all',
      checks: [
        { field: 'propertyZone', operator: 'equals', value: 'residential' },
        { field: 'numberOfChickens', operator: 'lessThan', value: 6 },
        { field: 'hasRoosters', operator: 'equals', value: false }
      ]
    },

    priority: 0
  }
});
```

### Step 4: Add Citations

```typescript
await db.citation.create({
  data: {
    ruleId: 'your-rule-id',
    ordinanceNumber: 'Cincinnati Municipal Code',
    section: '701-15',
    title: 'Urban Agriculture',
    text: 'Up to 5 hens permitted on residential lots...',
    url: 'https://...',
    pageNumber: 42
  }
});
```

## AI Provider Strategy

### Cost Optimization

**Current Setup (Recommended):**
- **Primary: Gemini Flash 2.0** (~$0.001 per query)
- **Fallback: Claude Sonnet 4.5** (~$0.003 per query)
- **Backup: OpenAI GPT-4o-mini** (~$0.0002 per query)

**Cost at 10,000 queries/month:**
- 90% Gemini: $9
- 10% Claude fallback: $3
- **Total: ~$12/month** vs $300/month for Claude-only

### When to Use Each Provider

The system automatically uses:
1. **Gemini first** - cheap, fast, huge context window
2. **Falls back to Claude** - if Gemini blocks or fails
3. **OpenAI** - for specific tasks (embeddings, etc.)

You can override per-task:

```typescript
// Use Claude for complex reasoning
await callAI(messages, { provider: 'anthropic', useProModel: true });

// Use Gemini for simple tasks
await callAI(messages, { provider: 'gemini', useProModel: false });
```

## Free Tier Limits

- **Anonymous users**: 3 queries (tracked by browser fingerprint)
- **Logged-in free users**: 3 queries/month
- **Paid users**: Unlimited or based on credits

Change the limit in `.env`:
```env
FREE_QUERY_LIMIT="5"  # Increase to 5 free queries
```

## Next Steps

1. **Extract Cincinnati Rules** - Parse PDF and structure rules
2. **Test End-to-End** - Ask real questions, verify answers
3. **Add More Categories** - Zoning, building, business, etc.
4. **Add More Cities** - Scale to 100+ jurisdictions
5. **Payment Integration** - Stripe for paid tier
6. **Report Generation** - Step-by-step compliance guides

## Troubleshooting

### AI Provider Errors

```bash
# Test each provider
npx tsx test-ai.ts
```

If a provider fails:
- Check API key in `.env`
- Verify account has credits/is active
- Check API status page

### Database Errors

```bash
# Reset database
npm run db:push

# Check schema
npx prisma studio
```

### CORS Errors

If testing from different domains, update Next.js config for API routes.

## Development Tips

### Add New Rule Category

1. Add to database with `subcategory`, `canonicalQuestions`, `keywords`
2. AI will automatically match user questions
3. No code changes needed!

### Debug AI Matching

Check conversation in database:
```sql
SELECT * FROM "Conversation" WHERE id = 'your-conversation-id';
SELECT * FROM "Message" WHERE "conversationId" = 'your-conversation-id';
```

### Monitor Costs

Log token usage:
```typescript
// In lib/ai/providers.ts
console.log(`${provider} used ${tokensUsed} tokens`);
```

Track monthly spend in each provider's dashboard.

## Questions?

Check the main [README.md](./README.md) for overall project info.

---

Built with Gemini Flash 2.0 🚀
