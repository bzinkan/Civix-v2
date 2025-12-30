# Civix Quick Reference

Essential commands and workflows for Civix development.

## Initial Setup

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your database URL and secrets

# Initialize database
npm run db:push
npm run db:seed

# Start development server
npm run dev
```

## Common Commands

### Development

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
```

### Database

```bash
npm run db:push      # Push schema changes (dev)
npm run db:migrate   # Create migration (production)
npm run db:studio    # Open Prisma Studio GUI
npm run db:seed      # Seed sample data
```

### Testing

```bash
npm test             # Run all tests
npm run test:watch   # Watch mode
```

### Docker (AWS Migration Prep)

```bash
# Build Docker image
docker build -t civix .

# Run with Docker Compose (full stack)
docker-compose up

# Stop containers
docker-compose down

# Test production build locally
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e NEXTAUTH_SECRET="your-secret" \
  civix
```

## Project URLs

- **Landing**: `/`
- **Rule Tester**: `/dashboard/tester`
- **API - Decisions**: `POST /api/decisions`
- **API - Jurisdictions**: `GET /api/jurisdictions`

## File Locations

### Add New Rule Domain
`lib/rules/{domain}.ts`

### Core Engine Logic
`lib/rules/engine.ts`

### Database Schema
`prisma/schema.prisma`

### API Routes
`app/api/{endpoint}/route.ts`

### UI Pages
`app/{route}/page.tsx`

## Database Schema Quick Reference

### Key Models

- **Jurisdiction**: Cities, counties (name, state, type)
- **Ruleset**: Rule collections per jurisdiction (category, version)
- **Rule**: Individual regulations (key, conditions, outcome, citation)
- **Decision**: User queries (inputs, outcome, rationale)
- **Report**: Paid reports (steps, forms, providers)
- **User**: Accounts (email, passwordHash, stripeId)

## Rule Structure

```typescript
{
  key: "stable_rule_identifier",
  description: "Human-readable description",
  outcome: "ALLOWED" | "RESTRICTED" | "PROHIBITED" | "CONDITIONAL",
  conditions: {
    type: "all" | "any",
    checks: [
      {
        field: "inputFieldName",
        operator: "equals" | "notEquals" | "greaterThan" | "lessThan" | "in" | "notIn",
        value: expectedValue,
        message: "User-facing error message"
      }
    ]
  },
  citation: "Legal reference",
  priority: 100
}
```

## Decision Flow

1. User submits inputs via form
2. API validates inputs against Zod schema
3. Fetch jurisdiction and active ruleset
4. Evaluate all rules using engine
5. Aggregate outcomes by priority
6. Generate rationale
7. Save decision to database
8. Return result to user

## Condition Operators

- `equals`: Exact match
- `notEquals`: Not equal
- `greaterThan`: Numeric comparison
- `lessThan`: Numeric comparison
- `in`: Value in array
- `notIn`: Value not in array
- `contains`: String contains
- `regex`: Regular expression match

## Outcome Priority

```
PROHIBITED > RESTRICTED > CONDITIONAL > ALLOWED
```

If any rule matches PROHIBITED, final outcome is PROHIBITED.

## Environment Variables

```bash
DATABASE_URL=             # PostgreSQL connection
NEXTAUTH_URL=            # App URL
NEXTAUTH_SECRET=         # Generate: openssl rand -base64 32
STRIPE_SECRET_KEY=       # Stripe API key
STRIPE_PUBLISHABLE_KEY=  # Stripe public key
NODE_ENV=                # development | production
```

## Git Workflow

```bash
# Stage changes
git add .

# Commit
git commit -m "feat: description"

# Push to GitHub
git push origin main
```

## Commit Message Conventions

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `refactor:` Code refactoring
- `test:` Tests
- `chore:` Maintenance

## Replit-Specific

```bash
# View Repl URL
echo $REPL_SLUG

# Check database connection
echo $DATABASE_URL

# View logs
cat .replit
```

## Debugging

### Enable Debug Mode in Tester

1. Navigate to `/dashboard/tester`
2. Check "Show debug output"
3. Submit a decision
4. View full evaluation trace

### Check Logs

```bash
# Development
npm run dev
# Watch console output

# Production
# Check Replit logs or CloudWatch (Fargate)
```

## Common Issues

### Database Connection Error

```bash
# Verify DATABASE_URL is set
echo $DATABASE_URL

# Re-push schema
npm run db:push
```

### Module Not Found

```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

### TypeScript Errors

```bash
# Generate Prisma client
npx prisma generate

# Check types
npm run type-check
```

## Performance Tips

- Keep rules deterministic
- Use database indexes (already configured)
- Cache jurisdiction lookups (future)
- Minimize condition complexity

## Security Checklist

- [ ] Never commit `.env` file
- [ ] Validate all user inputs with Zod
- [ ] Use Prisma for SQL queries (prevents injection)
- [ ] Verify Stripe webhook signatures
- [ ] Rate limit API endpoints (future)

## Next Steps After Setup

1. Test pitbull ownership flow
2. Add more jurisdictions
3. Create additional rules
4. Test edge cases
5. Validate legal accuracy
6. Deploy to Replit
7. Share with test users

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Zod Validation](https://zod.dev)
- [Replit Docs](https://docs.replit.com)

## Project Documentation

- [README.md](./README.md) - Overview
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Technical details
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Development guide
- [REPLIT_SETUP.md](./REPLIT_SETUP.md) - Replit deployment
- [FILE_STRUCTURE.md](./FILE_STRUCTURE.md) - File organization

---

Keep this file bookmarked for quick reference during development.
