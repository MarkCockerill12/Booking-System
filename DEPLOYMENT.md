# Deployment Guide

This guide walks through deploying the Conference Room Booking System to production.

## Table of Contents

1. [Local Development](#local-development)
2. [GitHub Setup](#github-setup)
3. [AWS Deployment](#aws-deployment)
4. [Vercel Frontend Deployment](#vercel-frontend-deployment)
5. [Stripe Configuration](#stripe-configuration)
6. [Monitoring & Logs](#monitoring--logs)

---

## Local Development

### Prerequisites

- Node.js 18+ and npm
- Git

### Setup

1. Clone the repository:
```bash
git clone <your-repo-url>
cd conference-booking-system
```

2. Run setup script:
```bash
chmod +x scripts/setup-local.sh
./scripts/setup-local.sh
```

3. Configure environment:
```bash
cp .env.local.example .env.local
# Edit .env.local with your settings
```

4. Start development servers:
```bash
npm run dev
```

This starts:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

---

## GitHub Setup

### 1. Create Repository

```bash
git init
git add .
git commit -m "Initial commit: Conference booking system"
```

### 2. Push to GitHub

```bash
git remote add origin https://github.com/your-username/conference-booking.git
git branch -M main
git push -u origin main
```

### 3. Configure Secrets

Go to **Settings → Secrets and variables → Actions** and add:

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `VERCEL_TOKEN` (optional, for automated Vercel deployment)

The GitHub Actions CI/CD pipeline will automatically:
- Run tests on pull requests
- Deploy backend to AWS on merge to `main`
- Deploy frontend to Vercel

---

## AWS Deployment

### Prerequisites

- AWS CLI installed and configured
- AWS SAM CLI installed
- AWS account with appropriate permissions

### 1. Configure AWS CLI

```bash
aws configure
```

Enter your:
- AWS Access Key ID
- AWS Secret Access Key
- Default region (e.g., `eu-west-1`)
- Output format (json)

### 2. Uncomment Production Code

In your codebase, uncomment all AWS-related code:

**Backend files to update:**
- `backend/middleware/auth.ts` - Uncomment Cognito auth
- `backend/routes/*.ts` - Uncomment DynamoDB code
- `backend/services/notifications.ts` - Uncomment SNS/SES code

**Lambda files:**
- `aws/lambdas/booking/index.ts`
- `aws/lambdas/financial/index.ts`
- `aws/lambdas/weather/index.ts`
- `aws/lambdas/rooms/index.ts`

### 3. Deploy with SAM

```bash
chmod +x scripts/deploy-aws.sh
./scripts/deploy-aws.sh
```

Or manually:

```bash
cd aws
sam build
sam deploy --guided
```

Follow the prompts:
- Stack Name: `conference-booking-prod`
- AWS Region: `eu-west-1`
- Confirm changes: Y
- Allow SAM CLI IAM role creation: Y
- Save arguments to config file: Y

### 4. Note the Outputs

SAM will output important values:
- API Gateway URL
- Cognito User Pool ID
- Cognito Client ID
- S3 Bucket Name

**Save these values!** You'll need them for environment variables.

### 5. Update Environment Variables

Update `.env.local` with the SAM outputs:

```bash
# Example outputs
API_GATEWAY_URL=https://abc123.execute-api.eu-west-1.amazonaws.com/prod
COGNITO_USER_POOL_ID=eu-west-1_abc123
COGNITO_CLIENT_ID=abc123xyz456
S3_BUCKET_NAME=conference-room-images-123456789
```

---

## Vercel Frontend Deployment

### 1. Install Vercel CLI

```bash
npm i -g vercel
```

### 2. Login to Vercel

```bash
vercel login
```

### 3. Deploy

```bash
vercel --prod
```

### 4. Configure Environment Variables

In Vercel Dashboard → Project → Settings → Environment Variables, add:

```
NEXT_PUBLIC_API_URL=https://your-api-gateway-url.amazonaws.com/prod
NEXT_PUBLIC_COGNITO_REGION=eu-west-1
NEXT_PUBLIC_COGNITO_USER_POOL_ID=eu-west-1_xxx
NEXT_PUBLIC_COGNITO_CLIENT_ID=xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
```

### 5. Configure Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed

---

## Stripe Configuration

### 1. Create Stripe Account

Go to https://stripe.com and create an account.

### 2. Get API Keys

Dashboard → Developers → API Keys:
- Copy **Publishable key** → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- Copy **Secret key** → `STRIPE_SECRET_KEY`

### 3. Add to AWS Secrets Manager

```bash
aws secretsmanager create-secret \
  --name stripe-api-key \
  --secret-string '{"secret_key":"sk_live_xxxxx"}'
```

### 4. Configure Webhooks (Optional)

For payment confirmations:

1. Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-api.amazonaws.com/prod/webhooks/stripe`
3. Select events: `payment_intent.succeeded`, `charge.refunded`
4. Copy webhook secret → Store in Secrets Manager

### 5. Uncomment Stripe Code

In frontend:
- `lib/stripe-client.ts` - Uncomment production code
- `app/booking/[id]/page.tsx` - Uncomment Stripe payment flow

In backend:
- `aws/lambdas/financial/index.ts` - Already uncommented

---

## Monitoring & Logs

### CloudWatch Logs

All Lambda functions automatically log to CloudWatch:

```bash
aws logs tail /aws/lambda/BookingFunction --follow
```

Or use AWS Console → CloudWatch → Log groups

### CloudWatch Metrics

Monitor:
- Lambda invocations
- API Gateway requests
- DynamoDB read/write capacity
- SQS queue depth

Set up alarms for:
- High error rates
- Payment failures
- Queue backing up

### X-Ray Tracing (Optional)

Enable AWS X-Ray in SAM template for distributed tracing:

```yaml
Globals:
  Function:
    Tracing: Active
```

---

## Troubleshooting

### Issue: Frontend can't connect to backend

**Solution:** Check CORS settings in API Gateway and verify `NEXT_PUBLIC_API_URL` is correct.

### Issue: Cognito authentication fails

**Solution:** Verify Cognito User Pool and Client IDs are correct in environment variables.

### Issue: Payments not processing

**Solution:** Check SQS queue for messages. View CloudWatch logs for Financial Lambda.

### Issue: Database read/write failures

**Solution:** Check DynamoDB table names match environment variables. Verify IAM permissions.

---

## Scaling Considerations

### Current Architecture (Serverless)

- Handles ~10k concurrent users
- Auto-scales with demand
- Pay-per-request pricing

### For Higher Scale (>50k users)

1. **Add DynamoDB caching** - Enable DAX for read-heavy operations
2. **API Gateway caching** - Cache GET requests for rooms/locations
3. **CloudFront CDN** - Add in front of API Gateway
4. **Provisioned capacity** - Switch DynamoDB to provisioned for cost optimization

### For Massive Scale (>100k users)

Consider migrating hot path services to:
- AWS ECS/Fargate (containerized)
- Amazon RDS with read replicas
- ElastiCache Redis for session storage

---

## Security Checklist

- [ ] All environment variables are stored securely (Secrets Manager)
- [ ] API Gateway has rate limiting enabled
- [ ] DynamoDB tables have encryption at rest
- [ ] S3 bucket is not publicly accessible
- [ ] Cognito MFA is enabled (optional)
- [ ] CloudWatch logs are retained appropriately
- [ ] IAM roles follow least privilege principle
- [ ] Stripe webhook signatures are verified

---

## Cost Estimation

### Monthly costs for low traffic (0-1000 bookings/month):

- **AWS Lambda**: ~$5
- **DynamoDB**: ~$2 (pay-per-request)
- **API Gateway**: ~$3
- **Cognito**: Free tier
- **S3**: ~$1
- **SQS/SNS/SES**: ~$1
- **Total AWS**: ~$12/month

- **Vercel**: Free tier
- **Stripe**: Transaction fees only (2.9% + $0.30 per transaction)

### At scale (10,000 bookings/month):

- Total AWS: ~$50-100/month
- Consider provisioned capacity for cost optimization

---

## Support

For issues:
1. Check CloudWatch logs
2. Review GitHub Actions workflow logs
3. Verify environment variables
4. Check AWS service health dashboard

For DevOps module questions, contact your university supervisor.
