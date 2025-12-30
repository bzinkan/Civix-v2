# Civix - Regulatory Decision Engine

**Clear, defensible answers to compliance questions.**

Civix is a regulatory decision engine that turns fragmented local rules into clear, defensible answers—and monetizes the path to compliance.

## The Problem

Regulatory compliance is:

- Fragmented across thousands of local authorities
- Written for lawyers, not decision-makers
- Time-consuming to interpret
- Expensive to get wrong

People routinely ask:

- Can I build this on my property?
- Do I need a permit?
- What rules apply to this address?
- What steps do I need to take next?

The answers are rarely clear—and mistakes carry legal, financial, or safety risk.

## The Solution

Civix is an industry-agnostic rules engine that produces deterministic compliance answers with explainability.

**Free Tier**: Clear yes/no/conditional answers with rationale
**Paid Tier**: Step-by-step compliance execution guidance

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Database

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

For Replit, the DATABASE_URL will be automatically provided by Neon integration.

### 3. Initialize Database

```bash
npm run db:push
npm run db:seed
```

### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see the app.

### 5. Test the Rules Engine

Navigate to `/dashboard/tester` to test decision logic with sample data.

## Project Structure

```
civix-v2/
├── app/                    # Next.js app router
│   ├── api/               # API routes
│   │   ├── decisions/     # Decision evaluation endpoint
│   │   └── jurisdictions/ # Jurisdiction data
│   ├── dashboard/         # Dashboard pages
│   │   └── tester/        # Rule testing interface
│   └── page.tsx           # Landing page
├── lib/                   # Core application logic
│   ├── rules/             # Rules engine
│   │   ├── engine.ts      # Core evaluation logic
│   │   ├── animals.ts     # Animal regulations
│   │   └── zoning.ts      # Zoning regulations
│   ├── db/                # Database client
│   └── types/             # TypeScript types
├── prisma/                # Database schema and migrations
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Sample data
├── components/            # React components (future)
├── public/                # Static assets
└── tests/                 # Test files (future)
```

## Architecture

Civix uses a deterministic rules engine with explainability at its core:

1. **User provides structured inputs** (e.g., dog breed, property address)
2. **Engine evaluates against jurisdiction-specific rules**
3. **Rules produce outcomes**: ALLOWED, RESTRICTED, PROHIBITED, CONDITIONAL
4. **Results include rationale and legal citations**

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed technical documentation.

## Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Runtime**: Node.js 20+
- **Database**: PostgreSQL (Neon on Replit, RDS on Fargate)
- **ORM**: Prisma
- **Language**: TypeScript
- **Styling**: Tailwind CSS

## Development Roadmap

### Phase 1: Replit (Current - MVP)

- ✅ Core rules engine
- ✅ Pitbull ownership decision flow
- ✅ Sample jurisdiction (Denver, CO)
- ✅ Testing interface with debug output
- 🚧 Additional animal regulations
- 🚧 Zoning rules (fences)
- 📅 User accounts
- 📅 Payment integration

### Phase 2: AWS Fargate (Production)

- Multi-jurisdiction support
- Admin rule management UI
- Full report generation
- API access for partners
- CloudWatch monitoring
- Production deployment

## Key Features

### Rules Engine

- Deterministic decision logic
- Supports complex conditional rules
- Priority-based outcome aggregation
- Full evaluation trace for debugging

### Explainability

Every decision includes:

- Clear outcome (ALLOWED/RESTRICTED/PROHIBITED/CONDITIONAL)
- Human-readable rationale
- Matched rules and failed conditions
- Legal citations

### Scalability

- Industry-agnostic: One engine, multiple domains
- Horizontal scaling: Add new categories without infrastructure changes
- Vertical scaling: Add jurisdictions without code changes

## Business Model

**Free Tier**: Trust & Acquisition
- Clear, authoritative answers
- Jurisdiction-aware decisions
- Builds credibility and inbound demand

**Paid Tier**: Monetization
- Compliance reports ($9.99 - $49.99)
- Permit and approval workflows
- Required forms and documentation
- Pre-vetted service providers

## Testing

### Manual Testing

Use the built-in testing interface:

```bash
npm run dev
```

Navigate to `/dashboard/tester` and test rules with sample data.

### Unit Tests (Future)

```bash
npm test
```

## Deployment

### Replit (Phase 1)

1. Import project to Replit
2. Connect Neon PostgreSQL
3. Run `npm run db:push && npm run db:seed`
4. Click "Run"

### AWS Fargate (Phase 2)

See deployment documentation (coming soon).

## Contributing

This is a private/proprietary project. See the business plan for collaboration opportunities.

## Status

🚧 **Active Development**

Core architecture and infrastructure are locked.
Current focus: rule ingestion, jurisdiction coverage, and report depth.

## License

Private / Proprietary

---

Built with discipline, shipping with purpose.
