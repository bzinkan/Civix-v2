# Civix File Structure

This document provides a complete overview of the Civix project structure.

## Root Level

```
Civix-v2/
├── .env.example              # Environment variable template
├── .eslintrc.json           # ESLint configuration
├── .gitignore               # Git ignore rules
├── .replit                  # Replit deployment config
├── replit.nix               # Nix package config for Replit
├── package.json             # NPM dependencies and scripts
├── tsconfig.json            # TypeScript configuration
├── next.config.js           # Next.js configuration
├── tailwind.config.ts       # Tailwind CSS configuration
├── postcss.config.js        # PostCSS configuration
├── README.md                # Project overview and quick start
├── ARCHITECTURE.md          # Detailed technical architecture
├── CONTRIBUTING.md          # Development guidelines
└── FILE_STRUCTURE.md        # This file
```

## Application Code (`app/`)

Next.js App Router structure:

```
app/
├── layout.tsx               # Root layout component
├── page.tsx                 # Landing page
├── globals.css              # Global styles
├── api/                     # API routes
│   ├── decisions/
│   │   └── route.ts        # POST /api/decisions - Evaluate compliance decisions
│   └── jurisdictions/
│       └── route.ts        # GET /api/jurisdictions - Fetch available jurisdictions
└── dashboard/
    └── tester/
        └── page.tsx        # /dashboard/tester - Rule testing interface
```

## Core Logic (`lib/`)

Business logic and utilities:

```
lib/
├── rules/                   # Rules engine
│   ├── engine.ts           # Core rule evaluation logic
│   ├── animals.ts          # Animal regulation questions/schemas
│   └── zoning.ts           # Zoning regulation questions/schemas
├── db/
│   └── index.ts            # Prisma client singleton
└── types/
    └── rules.ts            # TypeScript types for rules engine
```

## Database (`prisma/`)

Database schema and seed data:

```
prisma/
├── schema.prisma           # Database schema definition
└── seed.ts                 # Sample data for development
```

## Components (`components/`)

React components (currently empty, ready for future use):

```
components/
├── ui/                     # Reusable UI components (future)
├── layout/                 # Layout components (future)
└── forms/                  # Form components (future)
```

## Public Assets (`public/`)

Static files:

```
public/
├── images/                 # Image assets (future)
└── fonts/                  # Font files (future)
```

## Tests (`tests/`)

Test files (future):

```
tests/
├── unit/                   # Unit tests
└── integration/            # Integration tests
```

## Key File Descriptions

### Configuration Files

- **package.json**: Defines project dependencies, scripts, and metadata
- **tsconfig.json**: TypeScript compiler configuration with path aliases
- **next.config.js**: Next.js framework settings
- **tailwind.config.ts**: Tailwind CSS theme and plugin configuration
- **.env.example**: Template for environment variables (DATABASE_URL, STRIPE keys, etc.)
- **.replit**: Replit-specific deployment configuration

### Application Files

- **app/layout.tsx**: Root layout wrapping all pages
- **app/page.tsx**: Landing page with value proposition and CTAs
- **app/globals.css**: Global CSS with Tailwind directives and design tokens
- **app/api/decisions/route.ts**: Core API endpoint for rule evaluation
- **app/api/jurisdictions/route.ts**: API endpoint for jurisdiction data
- **app/dashboard/tester/page.tsx**: Interactive testing interface with debug output

### Rules Engine

- **lib/rules/engine.ts**: Deterministic rule evaluation logic
  - Evaluates conditions against user inputs
  - Aggregates outcomes by priority
  - Generates human-readable rationale
- **lib/rules/animals.ts**: Animal regulation definitions
  - Question schemas
  - Input validation (Zod)
  - Form field definitions
- **lib/rules/zoning.ts**: Zoning regulation definitions
  - Similar structure to animals.ts
  - Supports different question types

### Database

- **prisma/schema.prisma**: Full database schema
  - Jurisdictions (cities, counties)
  - Rulesets (versioned rule collections)
  - Rules (individual regulations with conditions)
  - Decisions (user queries and results)
  - Reports (paid compliance reports)
  - Users (account management)
  - AuditLog (change tracking)
- **prisma/seed.ts**: Sample data
  - Denver, CO jurisdiction
  - Sample animal ruleset
  - Pitbull ownership rule

### Documentation

- **README.md**: Project overview, quick start, roadmap
- **ARCHITECTURE.md**: Technical architecture and design decisions
- **CONTRIBUTING.md**: Development workflow and standards
- **FILE_STRUCTURE.md**: This file

## Future Structure

As the project grows, expect these additions:

```
components/
├── ui/
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Card.tsx
│   └── Badge.tsx
├── layout/
│   ├── Header.tsx
│   ├── Footer.tsx
│   └── Sidebar.tsx
└── forms/
    ├── DecisionForm.tsx
    └── ReportForm.tsx

app/
├── reports/
│   └── [id]/
│       └── page.tsx        # Individual report view
├── auth/
│   ├── login/
│   │   └── page.tsx
│   └── signup/
│       └── page.tsx
└── admin/
    ├── jurisdictions/
    │   └── page.tsx
    └── rules/
        └── page.tsx

lib/
├── rules/
│   ├── business.ts         # Business licensing
│   └── construction.ts     # Construction permits
├── stripe/
│   └── index.ts            # Stripe integration
└── auth/
    └── index.ts            # NextAuth configuration

tests/
├── unit/
│   └── rules-engine.test.ts
└── integration/
    └── decision-flow.test.ts
```

## NPM Scripts

Defined in package.json:

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Prisma Studio
- `npm run db:migrate` - Run migrations
- `npm run db:seed` - Seed database with sample data
- `npm test` - Run tests
- `npm run type-check` - TypeScript type checking

## Environment Variables

Required in `.env`:

```
DATABASE_URL=             # PostgreSQL connection string
NEXTAUTH_URL=            # App URL
NEXTAUTH_SECRET=         # Auth secret
STRIPE_SECRET_KEY=       # Stripe secret key
STRIPE_PUBLISHABLE_KEY=  # Stripe public key
STRIPE_WEBHOOK_SECRET=   # Stripe webhook secret
NODE_ENV=                # development | production
```

## Git Configuration

- **.gitignore**: Excludes node_modules, .env files, build outputs, IDE configs
- **.git/**: Git repository (initialized)

## Total File Count

As of initial setup:
- **25 files** across the project
- **7 directories** in app/
- **3 directories** in lib/
- **2 files** in prisma/
- **5 configuration files** at root
- **3 documentation files**
