# Microservices Deployment Guide

This project uses a **microservices architecture** with:
- **Frontend**: Vercel (Next.js static/SSR pages)
- **Backend**: AWS Lambda + API Gateway (5 microservices)

---

## Architecture Overview

```
┌─────────────────┐
│  Vercel         │
│  (Frontend)     │
│  - Next.js App  │
│  - React Pages  │
└────────┬────────┘
         │ HTTPS
         ▼
┌──────────────────────────────────────────┐
│  AWS API Gateway                         │
│  https://xxx.execute-api.region.aws.com/ │
└────────┬─────────────────────────────────┘
         │
         ├──► Lambda: Auth (Cognito)
         ├──► Lambda: Booking (DynamoDB)
         ├──► Lambda: Rooms (DynamoDB)
         ├──► Lambda: Weather (OpenWeather + Cache)
         ├──► Lambda: Financial (Stripe)
         └──► Lambda: Notification (SES)
```

---

## Step 1: Deploy AWS Backend

### Prerequisites
```bash
# Install AWS SAM CLI
npm install -g aws-sam-cli

# Configure AWS credentials
aws configure
# AWS Access Key ID: <your-key>
# AWS Secret Access Key: <your-secret>
# Default region: us-east-1
# Default output format: json
```

### Build and Deploy
```bash
# Navigate to project root
cd conference-room-app

# Build Lambda functions
sam build --template-file aws/template.yaml

# Deploy to AWS (first time - guided)
sam deploy --guided

# Answer prompts:
# Stack Name: conference-booking-prod
# AWS Region: us-east-1
# Confirm changes before deploy: Y
# Allow SAM CLI IAM role creation: Y
# Save arguments to configuration file: Y
# SAM configuration file: samconfig.toml
```

### After Deployment
SAM will output:
```
Outputs:
  ApiGatewayUrl: https://abc123xyz.execute-api.us-east-1.amazonaws.com/prod
  UserPoolId: us-east-1_ABC123XYZ
  UserPoolClientId: 1a2b3c4d5e6f7g8h9i0j
  ...
```

**Save these values!** You'll need them for frontend configuration.

---

## Step 2: Configure Frontend

### Update `.env.local`
```bash
# Copy example file
cp .env.example .env.local

# Edit .env.local with your AWS values:
NEXT_PUBLIC_API_URL=https://abc123xyz.execute-api.us-east-1.amazonaws.com/prod
NEXT_PUBLIC_COGNITO_REGION=us-east-1
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_ABC123XYZ
NEXT_PUBLIC_COGNITO_CLIENT_ID=1a2b3c4d5e6f7g8h9i0j

# Optional: Add Stripe keys if using payments
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

---

## Step 3: Deploy Frontend to Vercel

### Via Vercel Dashboard (Easiest)
1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
5. Add Environment Variables (from Step 2)
6. Click "Deploy"

### Via Vercel CLI (Alternative)
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod

# Add environment variables via dashboard or:
vercel env add NEXT_PUBLIC_API_URL production
# Paste: https://abc123xyz.execute-api.us-east-1.amazonaws.com/prod
```

---

## Step 4: Test the Deployment

### 1. Test Backend (AWS)
```bash
# Test auth endpoint
curl https://your-api-gateway-url/prod/auth/signup \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","name":"Test User"}'

# Should return: {"success":true,"data":{...}}
```

### 2. Test Frontend (Vercel)
Visit your Vercel URL (e.g., `https://your-app.vercel.app`)

- Try signing up
- Try logging in
- Check browser DevTools → Network to see API calls going to AWS

---

## Local Development

For local development with **local API routes** instead of AWS:

```bash
# 1. Comment out AWS URL in .env.local
# NEXT_PUBLIC_API_URL=

# 2. Add JWT secret for local auth
JWT_SECRET=your-dev-secret-key

# 3. Run dev server
npm run dev

# App will use app/api/ routes (local JSON database)
```

---

## Microservices Breakdown

| Service | Path | Technology | Purpose |
|---------|------|------------|---------|
| **Auth** | `/auth/*` | Cognito | User signup, login, logout, session |
| **Booking** | `/bookings/*` | DynamoDB | Create/read/update bookings |
| **Rooms** | `/rooms/*` | DynamoDB | List/filter rooms, get room details |
| **Weather** | `/weather` | OpenWeather + DynamoDB | Weather data for dynamic pricing |
| **Financial** | `/payments/*` | Stripe | Payment processing, refunds |
| **Notification** | N/A (SNS) | SES | Email notifications for bookings |

---

## Monitoring & Logs

### CloudWatch Logs
```bash
# View logs for specific Lambda
aws logs tail /aws/lambda/BookingFunction --follow

# View all Lambda logs
sam logs --stack-name conference-booking-prod --tail
```

### DynamoDB
```bash
# List tables
aws dynamodb list-tables

# Scan bookings table
aws dynamodb scan --table-name BookingsTable
```

### API Gateway
- Go to AWS Console → API Gateway
- Select your API → "Stages" → "prod"
- Enable CloudWatch Logs for detailed request/response logging

---

## Troubleshooting

### Frontend shows "Network Error"
**Cause**: CORS issue or wrong API URL  
**Fix**: Check `.env.local` has correct `NEXT_PUBLIC_API_URL`

### "Not authenticated" errors
**Cause**: Cognito token not being sent  
**Fix**: Check browser localStorage has `authToken`, verify Cognito config

### Lambda timeout errors
**Cause**: DynamoDB query taking too long  
**Fix**: Add indexes to DynamoDB tables, increase Lambda timeout in `template.yaml`

### "Table does not exist"
**Cause**: SAM deployment incomplete  
**Fix**: Run `sam deploy` again, check CloudFormation stack status

---

## Cost Estimate (AWS Free Tier)

For **1,000 users/month**:
- Lambda: **FREE** (1M requests/month free)
- API Gateway: **$3.50** ($3.50 per million requests)
- DynamoDB: **FREE** (25GB free, 25 read/write capacity units)
- Cognito: **FREE** (50,000 MAU free)
- SES: **FREE** (62,000 emails/month free)

**Total: ~$3-5/month** (mostly API Gateway)

Vercel: **FREE** (Hobby plan for personal projects)

---

## Next Steps

1. ✅ Deploy AWS backend
2. ✅ Configure environment variables
3. ✅ Deploy frontend to Vercel
4. 🔄 Set up custom domain (optional)
5. 🔄 Enable CloudWatch monitoring
6. 🔄 Set up CI/CD with GitHub Actions (when ready)

---

**Need Help?**
- AWS SAM Docs: https://docs.aws.amazon.com/serverless-application-model/
- Vercel Docs: https://vercel.com/docs
- Next.js Docs: https://nextjs.org/docs
