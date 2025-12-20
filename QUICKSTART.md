# 🚀 Quick Start: Deploy Frontend to Vercel

## Deployment Strategy

This project uses a **split deployment architecture**:
- **Frontend**: Deployed to Vercel (automatic from GitHub)
- **Backend**: Deployed to AWS Lambda via SAM (manual or GitHub Actions)

The `.vercelignore` file ensures Vercel only deploys the Next.js frontend, ignoring all backend code.

---

## Frontend Deployment to Vercel (2 minutes)

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add these two secrets:

```
Name: AWS_ACCESS_KEY_ID
Value: <your-aws-access-key-id>

Name: AWS_SECRET_ACCESS_KEY
Value: <your-aws-secret-access-key>
```

**Don't have AWS credentials?**
- Log in to AWS Console
- Go to IAM → Users → Your User → Security Credentials
- Click "Create access key"
- Choose "Command Line Interface (CLI)"
- Copy the keys (you won't see the secret key again!)

---

## Step 1: Connect Vercel to GitHub (1 min)

1. Go to [Vercel](https://vercel.com)
2. Click **Add New** → **Project**
3. Import your GitHub repository
4. Vercel auto-detects Next.js configuration
5. Click **Deploy**

That's it! Your frontend is now live. 🎉

---

## Step 2: Configure Environment Variables in Vercel

1. In Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
2. Add the following:

```env
# For local development (using local API routes)
NEXT_PUBLIC_API_URL=/api

# For production with AWS backend (add after Step 3)
# NEXT_PUBLIC_API_URL=https://your-api-gateway-url.amazonaws.com/prod
# NEXT_PUBLIC_COGNITO_REGION=eu-west-1
# NEXT_PUBLIC_COGNITO_USER_POOL_ID=eu-west-1_xxxxxxx
# NEXT_PUBLIC_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxx
```

3. Click **Save**
4. Go to **Deployments** → Click **...** → **Redeploy**

---

## Step 3 (Optional): Deploy Backend to AWS

If you need the production backend (AWS Lambda, DynamoDB, Cognito):

### Configure GitHub Secrets for AWS

### Configure GitHub Secrets for AWS

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Add these secrets:

```
Name: AWS_ACCESS_KEY_ID
Value: <your-aws-access-key-id>

Name: AWS_SECRET_ACCESS_KEY
Value: <your-aws-secret-access-key>
```

### Deploy Backend to AWS

```bash
git add .
git commit -m "Deploy backend to AWS"
git push origin main
```

GitHub Actions will automatically deploy the backend to AWS Lambda.

### Update Vercel Environment Variables

After AWS deployment, update Vercel env vars with your API Gateway URL and Cognito IDs (from CloudFormation outputs).

---

## ✅ Deployment Complete!

**Frontend**: Live on Vercel (https://your-app.vercel.app)
**Backend** (optional): Running on AWS Lambda

---

## Automatic Deployments

### Frontend (Vercel)
- **Trigger**: Every push to `main` branch
- **Deploys**: Automatically via Vercel GitHub integration
- **Ignored files**: Backend code (via `.vercelignore`)

### Backend (AWS)
- **Trigger**: Push to `main` when backend files change
- **Deploys**: Via GitHub Actions → AWS SAM
- **Path filter**: Only deploys when `aws/` or `backend/` changes

---

## What Gets Deployed Where?

| Component | Vercel | AWS Lambda |
|-----------|--------|------------|
| Next.js Frontend | ✅ | ❌ |
| Next.js API Routes | ✅ | ❌ |
| AWS Lambda Functions | ❌ | ✅ |
| DynamoDB | ❌ | ✅ |
| Cognito | ❌ | ✅ |
| S3 Images | ❌ | ✅ |

---

## Testing Your Deployment

### Test Frontend
1. Visit your Vercel URL
2. Try signing up (uses local JSON database via Next.js API routes)
3. Search for rooms
4. Make a test booking

### Test Backend (if deployed to AWS)
```bash
# Test API endpoint
curl https://your-api-gateway-url.amazonaws.com/prod/rooms

# Test authentication
curl -X POST https://your-api-id.execute-api.eu-west-1.amazonaws.com/prod/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

---

## Troubleshooting

### Frontend Issues
- **Build failed**: Check Next.js build logs in Vercel dashboard
- **Environment variables missing**: Add them in Vercel settings and redeploy
- **API routes not working**: Ensure `NEXT_PUBLIC_API_URL=/api` is set

### Backend Issues (AWS)
- **Deployment failed**: Check GitHub Actions logs
- **Lambda errors**: View CloudWatch logs
- **Authentication fails**: Verify Cognito User Pool ID and Client ID

---

## Next Steps

- 📧 **Email Notifications**: Verify domain in AWS SES
- 💳 **Stripe Payments**: Add Stripe keys to AWS Secrets Manager
- 🔒 **Custom Domain**: Configure in Vercel settings
- 📊 **Analytics**: Enable Vercel Analytics

---

## Cost Breakdown

**Vercel**:
- Free tier: Unlimited deployments, 100GB bandwidth/month
- Hobby plan: Free for personal projects

**AWS** (if using backend):
- Free tier: 1M Lambda requests, 25GB DynamoDB storage
- Expected cost: $0-5/month for low traffic

---

## Documentation

- **[README.md](README.md)** - Project overview
- **[AWS-DEPLOYMENT-CHECKLIST.md](AWS-DEPLOYMENT-CHECKLIST.md)** - Full AWS deployment guide
- **[FIXES-SUMMARY.md](FIXES-SUMMARY.md)** - Performance fixes applied
- **[.vercelignore](.vercelignore)** - Files excluded from Vercel deployment

**Your Conference Room Booking System is live! 🎉**
