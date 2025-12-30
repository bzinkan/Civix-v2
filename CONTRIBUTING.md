# Contributing to Civix

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up your `.env` file (see `.env.example`)
4. Initialize the database: `npm run db:push && npm run db:seed`
5. Run the dev server: `npm run dev`

## Project Structure

See [README.md](./README.md) for the complete project structure.

## Adding New Rules

### 1. Define the Question

Add your question definition to the appropriate domain file in `lib/rules/`:

```typescript
// lib/rules/animals.ts
export const animalQuestions = {
  your_question_key: {
    key: 'your_question_key',
    title: 'Your question title?',
    description: 'Brief description',
    category: 'animals',
    inputSchema: z.object({
      // Define your input schema
    }),
    fields: [
      // Define your form fields
    ],
  },
}
```

### 2. Create Rules in Database

Add rules via seed file or admin interface (future):

```typescript
await prisma.rule.create({
  data: {
    rulesetId: 'your-ruleset-id',
    key: 'your_rule_key',
    description: 'Rule description',
    outcome: 'CONDITIONAL',
    conditions: {
      type: 'all',
      checks: [
        { field: 'fieldName', operator: 'equals', value: true },
      ],
    },
    citation: 'Legal citation',
  },
})
```

### 3. Test Your Rules

Use the `/dashboard/tester` interface to validate your rule logic:

1. Select the jurisdiction
2. Choose your question category
3. Fill in test inputs
4. Enable debug mode to see evaluation trace
5. Verify outcomes match expectations

## Code Standards

- TypeScript strict mode enabled
- Use Prisma for all database queries
- Follow Next.js App Router conventions
- Keep rules deterministic (no random outputs)
- Always include legal citations where applicable

## Database Changes

When modifying the schema:

1. Edit `prisma/schema.prisma`
2. Run `npm run db:push` (dev) or `npm run db:migrate` (production)
3. Update seed file if needed

## Testing Checklist

Before submitting changes:

- [ ] Rules produce deterministic outputs
- [ ] All conditions have clear error messages
- [ ] Citations are accurate
- [ ] Debug output is readable
- [ ] No console errors in browser
- [ ] TypeScript compiles without errors

## Documentation

When adding features:

- Update README.md if user-facing
- Update ARCHITECTURE.md if architectural
- Add inline comments for complex logic
- Include examples in rule definitions

## Questions?

For questions about the architecture or business logic, refer to [ARCHITECTURE.md](./ARCHITECTURE.md).
