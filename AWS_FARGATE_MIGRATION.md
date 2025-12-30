# AWS Fargate Migration Guide

This guide walks you through migrating Civix from Replit to AWS Fargate (Phase 2).

## Why This Migration is Easy

✅ **Same Codebase** - Zero code changes required
✅ **Same Database** - PostgreSQL (Neon → RDS)
✅ **Containerized** - Next.js builds standalone output
✅ **Stateless** - No file system dependencies
✅ **Environment Variables** - Simple config transfer

## Migration Overview

```
Replit (Phase 1)              →    AWS Fargate (Phase 2)
─────────────────────────────────────────────────────────
Next.js App                   →    Next.js App (same code)
Neon PostgreSQL               →    RDS PostgreSQL
Replit Secrets                →    AWS Secrets Manager
Replit Deployment             →    ECS Fargate + ALB
No CDN                        →    CloudFront
No monitoring                 →    CloudWatch
```

## Prerequisites

- [ ] AWS Account
- [ ] AWS CLI installed
- [ ] Docker installed locally
- [ ] Domain name (optional)

## Step 1: Containerize the Application

### Create Dockerfile

```dockerfile
# Already optimized for Fargate
FROM node:20-alpine AS base

# Install dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Build application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js (standalone mode)
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

Save this as `Dockerfile` in your project root.

### Test Docker Build Locally

```bash
# Build image
docker build -t civix:latest .

# Test locally
docker run -p 3000:3000 \
  -e DATABASE_URL="your-db-url" \
  -e NEXTAUTH_SECRET="your-secret" \
  civix:latest
```

## Step 2: Set Up AWS Infrastructure

### A. Create RDS PostgreSQL Database

```bash
aws rds create-db-instance \
  --db-instance-identifier civix-db \
  --db-instance-class db.t4g.micro \
  --engine postgres \
  --engine-version 15.5 \
  --master-username civixadmin \
  --master-user-password YOUR_SECURE_PASSWORD \
  --allocated-storage 20 \
  --vpc-security-group-ids sg-xxxxx \
  --db-subnet-group-name your-subnet-group \
  --backup-retention-period 7 \
  --storage-encrypted
```

### B. Export Data from Neon

```bash
# On Replit or local machine connected to Neon
pg_dump $DATABASE_URL > civix_backup.sql
```

### C. Import to RDS

```bash
# Connect to RDS
psql -h civix-db.xxxxx.us-east-1.rds.amazonaws.com \
     -U civixadmin \
     -d civix < civix_backup.sql
```

### D. Run Prisma Migrations on RDS

```bash
# Update DATABASE_URL to point to RDS
export DATABASE_URL="postgresql://civixadmin:password@civix-db.xxxxx.us-east-1.rds.amazonaws.com:5432/civix"

# Run migrations
npm run db:push
```

## Step 3: Push Docker Image to ECR

```bash
# Authenticate Docker to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  123456789012.dkr.ecr.us-east-1.amazonaws.com

# Create ECR repository
aws ecr create-repository --repository-name civix

# Tag image
docker tag civix:latest \
  123456789012.dkr.ecr.us-east-1.amazonaws.com/civix:latest

# Push to ECR
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/civix:latest
```

## Step 4: Create ECS Cluster and Service

### A. Create ECS Cluster

```bash
aws ecs create-cluster --cluster-name civix-cluster
```

### B. Create Task Definition

Save as `task-definition.json`:

```json
{
  "family": "civix-task",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::123456789012:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "civix",
      "image": "123456789012.dkr.ecr.us-east-1.amazonaws.com/civix:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:civix/database-url"
        },
        {
          "name": "NEXTAUTH_SECRET",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:civix/nextauth-secret"
        },
        {
          "name": "STRIPE_SECRET_KEY",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:civix/stripe-secret"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/civix",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

Register task definition:

```bash
aws ecs register-task-definition --cli-input-json file://task-definition.json
```

### C. Create Application Load Balancer

```bash
# Create ALB
aws elbv2 create-load-balancer \
  --name civix-alb \
  --subnets subnet-xxxxx subnet-yyyyy \
  --security-groups sg-xxxxx

# Create target group
aws elbv2 create-target-group \
  --name civix-targets \
  --protocol HTTP \
  --port 3000 \
  --vpc-id vpc-xxxxx \
  --target-type ip \
  --health-check-path /

# Create listener
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:... \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=forward,TargetGroupArn=arn:aws:...
```

### D. Create ECS Service

```bash
aws ecs create-service \
  --cluster civix-cluster \
  --service-name civix-service \
  --task-definition civix-task \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxxxx,subnet-yyyyy],securityGroups=[sg-xxxxx],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=civix,containerPort=3000"
```

## Step 5: Set Up CloudFront (Optional)

```bash
# Create CloudFront distribution pointing to ALB
aws cloudfront create-distribution \
  --distribution-config file://cloudfront-config.json
```

## Step 6: Configure Secrets Manager

```bash
# Store database URL
aws secretsmanager create-secret \
  --name civix/database-url \
  --secret-string "postgresql://..."

# Store NextAuth secret
aws secretsmanager create-secret \
  --name civix/nextauth-secret \
  --secret-string "your-secret"

# Store Stripe keys
aws secretsmanager create-secret \
  --name civix/stripe-secret \
  --secret-string "sk_live_..."
```

## Step 7: Set Up CloudWatch Monitoring

### Create Log Group

```bash
aws logs create-log-group --log-group-name /ecs/civix
```

### Create Alarms

```bash
# High CPU alarm
aws cloudwatch put-metric-alarm \
  --alarm-name civix-high-cpu \
  --alarm-description "Alert when CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold

# Error rate alarm
aws cloudwatch put-metric-alarm \
  --alarm-name civix-high-errors \
  --metric-name 5XXError \
  --namespace AWS/ApplicationELB \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold
```

## Step 8: Set Up CI/CD for Fargate

Update `.github/workflows/deploy-fargate.yml`:

```yaml
name: Deploy to Fargate

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Login to ECR
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build and push image
        run: |
          docker build -t civix .
          docker tag civix:latest $ECR_REGISTRY/civix:latest
          docker push $ECR_REGISTRY/civix:latest

      - name: Deploy to ECS
        run: |
          aws ecs update-service \
            --cluster civix-cluster \
            --service civix-service \
            --force-new-deployment
```

## Cost Estimation (Fargate vs Replit)

### Replit Costs
- Free tier: Limited, sleeps
- Hacker plan: $7/month

### AWS Fargate Costs (Estimated)
- **ECS Fargate**: ~$15/month (2 tasks, 0.25 vCPU, 0.5 GB each)
- **RDS db.t4g.micro**: ~$15/month
- **ALB**: ~$20/month
- **Data transfer**: ~$5/month
- **CloudWatch**: ~$5/month
- **Total**: ~$60/month for production-grade infrastructure

### What You Get for $60/month
- Auto-scaling (2-10 tasks)
- High availability (multi-AZ)
- Professional monitoring
- Automated backups
- SSL/TLS (via ALB or CloudFront)
- 99.99% uptime SLA

## Migration Validation Checklist

After migration, verify:

- [ ] Application loads at ALB DNS name
- [ ] Database queries work (check `/dashboard/tester`)
- [ ] All environment variables loaded correctly
- [ ] Logs appearing in CloudWatch
- [ ] Health checks passing
- [ ] Auto-scaling works (test with load)
- [ ] SSL certificate configured (if using custom domain)
- [ ] Stripe webhooks updated to new URL
- [ ] DNS updated (if using custom domain)

## Rollback Plan

If issues arise:

1. **Keep Replit running** during migration
2. **Test Fargate thoroughly** before DNS cutover
3. **Use Route53 weighted routing** for gradual migration
4. **Monitor CloudWatch** for 24-48 hours
5. **Ready to switch DNS back** if needed

## Zero-Downtime Migration Strategy

1. **Week 1**: Deploy to Fargate, test privately
2. **Week 2**: Route 10% traffic to Fargate (Route53)
3. **Week 3**: Route 50% traffic to Fargate
4. **Week 4**: Route 100% traffic to Fargate
5. **Week 5**: Decomission Replit

## Infrastructure as Code (Optional)

For repeatable deployments, use Terraform:

```hcl
# See terraform/ directory (future enhancement)
```

## Post-Migration Optimizations

Once stable on Fargate:

- Enable RDS read replicas for scaling
- Add Redis/ElastiCache for session storage
- Implement S3 for file uploads
- Add CloudFront for global CDN
- Set up AWS WAF for security
- Implement backup automation

## Support

For AWS-specific issues:
- [AWS Fargate Docs](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/AWS_Fargate.html)
- [AWS Support](https://aws.amazon.com/support/)

For Civix issues:
- See [ARCHITECTURE.md](./ARCHITECTURE.md)
- See [CONTRIBUTING.md](./CONTRIBUTING.md)

---

**Remember**: The hardest part of cloud migration is usually data and configuration. With Civix's clean architecture, it's just a container deployment.
