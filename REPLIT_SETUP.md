# Replit Setup Guide

This guide walks you through deploying Civix on Replit for Phase 1 (MVP).

## Prerequisites

- Replit account (free tier works)
- GitHub account (for repository import)

## Step 1: Import to Replit

1. Go to [Replit](https://replit.com)
2. Click "Create Repl"
3. Select "Import from GitHub"
4. Enter your repository URL: `https://github.com/bzinkan/Civix-v2`
5. Replit will automatically detect this as a Node.js project

## Step 2: Configure Database

Replit provides PostgreSQL through Neon integration:

1. In your Repl, click the "Database" icon in the sidebar
2. Click "Create database"
3. Select "PostgreSQL (Neon)"
4. Replit will automatically create a `DATABASE_URL` environment variable

The connection string will look like:
```
postgresql://user:password@host/database?sslmode=require
```

## Step 3: Set Environment Variables

Click "Secrets" (lock icon) in the sidebar and add:

```
DATABASE_URL=<auto-populated-by-neon>
NEXTAUTH_URL=<your-replit-url>
NEXTAUTH_SECRET=<generate-with-openssl>
NODE_ENV=development
```

To generate `NEXTAUTH_SECRET`, run in Shell:
```bash
openssl rand -base64 32
```

## Step 4: Install Dependencies

In the Shell tab, run:
```bash
npm install
```

This will install all packages from package.json.

## Step 5: Initialize Database

Run the following commands in order:

```bash
# Push schema to database
npm run db:push

# Seed with sample data
npm run db:seed
```

You should see output confirming:
- Jurisdiction created (Denver, CO)
- Ruleset created (animals)
- Rule created (pitbull_ownership)

## Step 6: Start the Application

Click the green "Run" button at the top, or run:
```bash
npm run dev
```

Replit will start the Next.js development server on port 3000.

## Step 7: Test the Application

1. Click the preview window that opens
2. You should see the Civix landing page
3. Navigate to the "Try the Decision Engine" button
4. Select Denver, CO from the jurisdiction dropdown
5. Fill in the pitbull ownership form
6. Click "Evaluate Decision"
7. You should see a decision result with rationale

## Troubleshooting

### Database Connection Issues

If you see `Can't reach database server`:

1. Check that DATABASE_URL is set in Secrets
2. Verify the Neon database is active
3. Try running `npm run db:push` again

### Build Errors

If you see TypeScript or build errors:

1. Make sure all dependencies installed: `npm install`
2. Check for syntax errors in the Shell output
3. Try clearing the cache: `rm -rf .next node_modules && npm install`

### Port Issues

If the app doesn't open:

1. Check that port 3000 is mapped correctly in `.replit` file
2. Try stopping and restarting the Repl

## Replit-Specific Files

- **.replit**: Defines run command and deployment settings
- **replit.nix**: Specifies Nix packages (Node.js 20, PostgreSQL)

## Deployment

Replit automatically deploys when you:

1. Click "Deploy" in the top right
2. Select deployment type (Autoscale recommended)
3. Replit will build and deploy your app

Your app will be available at a public URL like:
```
https://civix-v2.yourusername.repl.co
```

## Database Management

### View Data with Prisma Studio

```bash
npm run db:studio
```

Opens a GUI to view and edit database records.

### Add More Data

Edit `prisma/seed.ts` and run:
```bash
npm run db:seed
```

## Development Workflow

1. Make code changes in the editor
2. Replit auto-saves and hot-reloads
3. Test in the preview window
4. Use Shell for database commands
5. Check Console for logs

## Performance Tips

- Use `.replit` to configure deployment settings
- Optimize images (none yet, but plan ahead)
- Enable caching in `next.config.js` for production

## Next Steps

Once you've validated the MVP on Replit:

1. Add more jurisdictions via Prisma Studio or seed file
2. Implement additional rule categories
3. Test with real users
4. Gather feedback on decision quality
5. Plan migration to AWS Fargate (Phase 2)

## Cost Considerations

Replit Free Tier:
- Limited to 1 GB RAM
- Sleeps after inactivity
- Good for MVP testing

Replit Hacker Plan ($7/month):
- Always-on deployments
- More RAM and compute
- Custom domains

For production, migrate to AWS Fargate as planned.

## Support

For Replit-specific issues:
- [Replit Docs](https://docs.replit.com)
- [Replit Discord](https://replit.com/discord)

For Civix issues:
- See [CONTRIBUTING.md](./CONTRIBUTING.md)
- Check [ARCHITECTURE.md](./ARCHITECTURE.md)
