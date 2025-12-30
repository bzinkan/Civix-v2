# Prisma Troubleshooting Guide for AWS Fargate

Common Prisma issues when deploying to containers and how to fix them.

## Issue 1: "Cannot find module '@prisma/client'"

### Symptoms
```
Error: Cannot find module '@prisma/client'
Module not found: Can't resolve '@prisma/client'
```

### Root Cause
Prisma Client wasn't generated in the Docker image.

### Solution A: Use the Robust Dockerfile

Use `Dockerfile.fargate` instead of `Dockerfile`:

```bash
docker build -f Dockerfile.fargate -t civix:latest .
```

### Solution B: Update package.json postinstall

Add to your `package.json`:

```json
{
  "scripts": {
    "postinstall": "prisma generate"
  }
}
```

This ensures Prisma Client generates after `npm install`.

## Issue 2: "PrismaClient is unable to run in the browser"

### Symptoms
```
Error: PrismaClient is unable to run in the browser.
In case this error is unexpected for you, please report it in...
```

### Root Cause
Prisma Client is being imported in a client-side component.

### Solution
Ensure all Prisma imports are in:
- API routes (`app/api/**/route.ts`)
- Server components only
- Server actions

**Bad (Client Component):**
```tsx
'use client'
import { prisma } from '@/lib/db' // ❌ Wrong!

export default function Component() {
  // ...
}
```

**Good (API Route):**
```tsx
// app/api/something/route.ts
import { prisma } from '@/lib/db' // ✅ Correct!

export async function GET() {
  const data = await prisma.user.findMany()
  return Response.json(data)
}
```

## Issue 3: "Can't reach database server"

### Symptoms
```
Error: Can't reach database server at `xxx.xxx.xxx.xxx:5432`
```

### Root Cause
Container can't connect to RDS database (network/security issue).

### Solution

#### 1. Check Security Groups

Your ECS tasks must be in a security group that allows:
- **Outbound**: Port 5432 to RDS security group
- Your RDS security group must allow:
- **Inbound**: Port 5432 from ECS security group

```bash
# Check ECS task security group
aws ecs describe-tasks --cluster civix-cluster --tasks TASK_ARN

# Update RDS security group
aws ec2 authorize-security-group-ingress \
  --group-id sg-rds-xxxxx \
  --protocol tcp \
  --port 5432 \
  --source-group sg-ecs-xxxxx
```

#### 2. Check DATABASE_URL

Ensure your DATABASE_URL is correct:

```bash
# Correct format
DATABASE_URL="postgresql://username:password@rds-endpoint.region.rds.amazonaws.com:5432/civix?schema=public&sslmode=require"
```

**Important**: RDS requires `sslmode=require` at the end!

#### 3. Test Connection from Container

```bash
# Exec into running container
aws ecs execute-command \
  --cluster civix-cluster \
  --task TASK_ARN \
  --container civix \
  --interactive \
  --command "/bin/sh"

# Inside container, test connection
apk add postgresql-client
psql $DATABASE_URL -c "SELECT 1"
```

## Issue 4: "Prisma schema is missing"

### Symptoms
```
Error: Could not resolve prisma/schema.prisma
Schema not found
```

### Root Cause
Prisma schema not copied to Docker image.

### Solution

Verify Dockerfile has:

```dockerfile
# Copy Prisma schema
COPY prisma ./prisma

# Generate client
RUN npx prisma generate
```

Also check `.dockerignore` doesn't exclude `prisma/`:

```bash
# .dockerignore should NOT have:
# prisma/  ❌ Remove this line!
```

## Issue 5: Binary Target Mismatch

### Symptoms
```
Error: The current binary target is "darwin-arm64" but expected "linux-musl-openssl-3.0.x"
```

### Root Cause
Prisma binary was generated for wrong platform (Mac/Windows instead of Linux).

### Solution

Update `prisma/schema.prisma`:

```prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "linux-musl-openssl-3.0.x"]
}
```

Then rebuild:

```bash
npx prisma generate
docker build -f Dockerfile.fargate -t civix:latest .
```

## Issue 6: "Pool timeout" or Connection Errors

### Symptoms
```
Error: Timed out fetching a new connection from the connection pool
Can't acquire connection from pool
```

### Root Cause
Too many Prisma Client instances or connection pool exhausted.

### Solution A: Use Prisma Client Singleton

Ensure you're using the singleton pattern (already implemented):

```typescript
// lib/db/index.ts ✅
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### Solution B: Configure Connection Pool

Update Prisma schema:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")

  // Add connection pool settings
  connection_limit = 10
  pool_timeout     = 20
}
```

Or in DATABASE_URL:

```bash
DATABASE_URL="postgresql://...?connection_limit=10&pool_timeout=20"
```

## Issue 7: Migrations Not Running

### Symptoms
Database is missing tables or columns after deployment.

### Root Cause
Migrations weren't applied to production database.

### Solution

#### Option A: Manual Migration (Recommended for Production)

```bash
# Connect to RDS via bastion or local machine
export DATABASE_URL="postgresql://..."

# Run migrations
npx prisma migrate deploy
```

#### Option B: Auto-migrate on Startup (Development Only)

Update Dockerfile to run migrations on start:

```dockerfile
# Create startup script
RUN echo '#!/bin/sh\n\
npx prisma migrate deploy\n\
node server.js' > /app/start.sh && chmod +x /app/start.sh

CMD ["/app/start.sh"]
```

**⚠️ Warning**: Auto-migrations in production can cause issues. Better to run manually.

## Issue 8: Environment Variables Not Loading

### Symptoms
```
Invalid `prisma.xxx.findMany()` invocation:
Environment variable not found: DATABASE_URL
```

### Root Cause
Environment variables not passed to container.

### Solution

#### For ECS Task Definition:

```json
{
  "containerDefinitions": [{
    "environment": [
      {"name": "NODE_ENV", "value": "production"}
    ],
    "secrets": [
      {
        "name": "DATABASE_URL",
        "valueFrom": "arn:aws:secretsmanager:region:account:secret:civix/database-url"
      }
    ]
  }]
}
```

#### For docker-compose:

```yaml
services:
  app:
    environment:
      DATABASE_URL: ${DATABASE_URL}
    # OR
    env_file:
      - .env
```

#### Test in Container:

```bash
# Exec into container
docker exec -it civix-app sh

# Check if env var exists
echo $DATABASE_URL
env | grep DATABASE
```

## Complete Debugging Checklist

When facing Prisma issues on Fargate:

- [ ] Prisma schema exists at `prisma/schema.prisma`
- [ ] `prisma generate` runs in Dockerfile
- [ ] Binary target includes `linux-musl-openssl-3.0.x`
- [ ] `node_modules/.prisma` is copied to final image
- [ ] DATABASE_URL is set in ECS task definition
- [ ] DATABASE_URL includes `?sslmode=require` for RDS
- [ ] Security groups allow ECS → RDS on port 5432
- [ ] RDS is in same VPC as ECS tasks (or VPC peering configured)
- [ ] Prisma Client only imported in server-side code
- [ ] Using singleton Prisma Client pattern
- [ ] Migrations have been applied to RDS

## Quick Test Script

Run this to verify Prisma setup:

```bash
#!/bin/bash
# test-prisma.sh

echo "1. Testing Prisma Client generation..."
npx prisma generate || exit 1

echo "2. Testing database connection..."
npx prisma db pull || exit 1

echo "3. Testing query..."
npx prisma studio --browser none &
STUDIO_PID=$!
sleep 2
kill $STUDIO_PID

echo "✅ All Prisma checks passed!"
```

## Still Having Issues?

### Enable Prisma Debug Logs

```typescript
// lib/db/index.ts
export const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})
```

### Check Container Logs

```bash
# Get logs from ECS task
aws logs tail /ecs/civix --follow

# Get logs from Docker
docker logs -f civix-app
```

### Use CloudWatch Insights

Query for Prisma errors:

```
fields @timestamp, @message
| filter @message like /Prisma/
| sort @timestamp desc
| limit 100
```

## Common Fargate-Specific Issues

### Issue: Task Fails Immediately

Check:
- [ ] Image exists in ECR
- [ ] Task execution role has ECR pull permissions
- [ ] Secrets Manager permissions configured
- [ ] CloudWatch logs group exists

### Issue: Health Checks Failing

```bash
# Test health endpoint
curl http://task-ip:3000/api/health

# Check response
{
  "status": "healthy",
  "database": "connected"
}
```

If database shows "disconnected", it's a Prisma connection issue.

## Prevention Tips

1. **Always test Docker build locally first**
   ```bash
   docker build -f Dockerfile.fargate -t civix:test .
   docker run -p 3000:3000 -e DATABASE_URL="..." civix:test
   ```

2. **Use docker-compose for full integration test**
   ```bash
   docker-compose up
   # Test at http://localhost:3000
   ```

3. **Test migrations before deploying**
   ```bash
   npx prisma migrate deploy --preview-feature
   ```

4. **Monitor connection pool usage**
   ```typescript
   // Add to lib/db/index.ts
   console.log('Prisma pool:', await prisma.$queryRaw`SELECT COUNT(*) FROM pg_stat_activity`)
   ```

## Need More Help?

- [Prisma Deployment Docs](https://www.prisma.io/docs/guides/deployment)
- [Prisma Docker Guide](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-aws-fargate)
- [AWS ECS Troubleshooting](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/troubleshooting.html)
