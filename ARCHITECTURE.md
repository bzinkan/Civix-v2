# Civix Architecture

## Overview

Civix is a regulatory decision engine built on deterministic rule evaluation with explainability at its core.

## Core Principles

1. **Deterministic Decisions**: Same inputs always produce same outputs
2. **Explainable Results**: Every decision traceable to specific rules
3. **Stable Question Keys**: Questions identified by stable keys for long-term reliability
4. **Industry Agnostic**: One engine supports multiple regulatory domains
5. **Clear Monetization**: Free answers build trust, paid reports drive revenue

## Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Runtime**: Node.js 20+
- **Database**: PostgreSQL (Neon on Replit, RDS on Fargate)
- **ORM**: Prisma
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Deployment**: Replit (Phase 1) → AWS Fargate (Phase 2)

## Architecture Layers

### 1. Rules Engine (`lib/rules/`)

The core decision logic lives here. The engine is domain-separated:

```
lib/rules/
├── engine.ts         # Core evaluation logic
├── animals.ts        # Animal regulation definitions
├── zoning.ts         # Zoning regulation definitions
└── business.ts       # Business licensing (future)
```

**How it works:**

1. User provides structured inputs
2. Engine evaluates inputs against jurisdiction-specific rules
3. Rules produce outcomes: `ALLOWED`, `RESTRICTED`, `PROHIBITED`, `CONDITIONAL`
4. Engine aggregates results (priority: PROHIBITED > RESTRICTED > CONDITIONAL > ALLOWED)
5. Human-readable rationale generated from matched rules

**Rule Structure:**

```typescript
{
  key: "pitbull_ownership",
  description: "Pitbull ownership regulations",
  outcome: "CONDITIONAL",
  conditions: {
    type: "all",
    checks: [
      { field: "hasPermit", operator: "equals", value: true },
      { field: "hasInsurance", operator: "equals", value: true }
    ]
  },
  citation: "Denver Municipal Code § 8-55"
}
```

### 2. Database Schema (`prisma/schema.prisma`)

**Key Models:**

- `Jurisdiction`: Cities, counties, municipalities
- `Ruleset`: Category-specific rule collections per jurisdiction
- `Rule`: Individual rules with conditions and outcomes
- `Decision`: User queries and free-tier results
- `Report`: Paid compliance reports
- `User`: User accounts for saved decisions and purchases

**Versioning:**

Each ruleset has a version number. When rules change, increment the version and mark the old one as inactive. This ensures historical decisions remain valid.

### 3. API Layer (`app/api/`)

- `POST /api/decisions`: Evaluate a regulatory decision
- `GET /api/jurisdictions`: List available jurisdictions
- `POST /api/reports`: Purchase compliance report (future)

### 4. UI Layer (`app/`)

- `/`: Landing page with value proposition
- `/dashboard/tester`: Rule testing interface with debug output
- `/reports`: Paid compliance reports (future)

## Decision Flow

```
User Input → Jurisdiction Lookup → Fetch Active Ruleset → Evaluate Rules → Aggregate Outcome → Save Decision → Return Result
```

## Explainability

Every decision includes:

1. **Outcome**: ALLOWED/RESTRICTED/PROHIBITED/CONDITIONAL
2. **Rationale**: Human-readable explanation
3. **Matched Rules**: Which rules triggered
4. **Failed Conditions**: What requirements weren't met
5. **Citations**: Legal references

## Scaling Strategy

### Horizontal Scaling (Add Domains)

New regulatory categories require:

1. New question definitions (`lib/rules/{domain}.ts`)
2. New rules in database
3. No infrastructure changes

### Vertical Scaling (Add Jurisdictions)

New jurisdictions require:

1. Add jurisdiction record
2. Create rulesets for applicable categories
3. Add rules with jurisdiction-specific logic
4. No code changes

## Monetization Architecture

### Free Tier

- User submits question
- Receives clear answer with rationale
- Decision saved for future reference
- No account required (optional for history)

### Paid Tier

- User requests compliance report ($9.99 - $49.99)
- Receives:
  - Step-by-step compliance guide
  - Required forms and documentation
  - Pre-vetted service providers
  - Downloadable PDF

## Migration Path: Replit → Fargate

### Phase 1: Replit (Current)

- Built-in PostgreSQL (Neon)
- Zero DevOps
- Instant deployment
- Perfect for MVP validation

### Phase 2: AWS Fargate

**Changes Required:**

1. Database: Neon → RDS PostgreSQL
2. Deployment: Replit → Fargate + ALB
3. Add CloudWatch monitoring
4. Add CloudFront for caching
5. Secrets: Replit env vars → AWS Secrets Manager

**What Stays the Same:**

- Entire codebase
- Database schema
- API contracts
- UI/UX

## Testing Strategy

### Unit Tests

- Rule evaluation logic
- Condition operators
- Outcome aggregation

### Integration Tests

- Full decision flow
- Database queries
- API endpoints

### Manual Testing

- Use `/dashboard/tester` for rule validation
- Debug mode shows full evaluation trace

## Infrastructure Discipline

**What We Don't Do:**

- No microservices (single Next.js app)
- No unnecessary abstractions
- No premature optimization
- No feature flags (just ship)
- No complex CI/CD (GitHub Actions → deploy)

**What We Do:**

- Keep it boring and stable
- Test rules thoroughly
- Document everything
- Ship fast, iterate based on usage

## Future Considerations

### API Access (B2B)

Potential for API partnerships:

- Real estate platforms
- Legal tech companies
- Construction software

Rate-limited API access with usage-based pricing.

### AI Integration

Potential use of LLMs for:

- Parsing legal documents into rules
- Natural language question input
- Report generation

**Critical:** AI does NOT make decisions. Rules engine stays deterministic. AI only assists with ingestion and presentation.

## Development Workflow

1. Define question in `lib/rules/{domain}.ts`
2. Create ruleset and rules in database (via seed or admin UI)
3. Test in `/dashboard/tester`
4. Validate with actual legal documents
5. Deploy

## Security Considerations

- Input validation via Zod schemas
- SQL injection protection (Prisma ORM)
- Stripe webhook signature verification
- Rate limiting on API endpoints (future)

## Performance

- Database indexes on frequently queried fields
- No client-side rule evaluation (server only)
- Caching at CDN layer (future)

## Monitoring (Phase 2)

- CloudWatch metrics for API latency
- Database query performance
- Decision evaluation times
- User conversion funnel (free → paid)
