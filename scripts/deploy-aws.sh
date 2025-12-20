# AWS Deployment Script
# This script deploys the entire backend to AWS using SAM

echo "🚀 Starting AWS deployment..."

# Check if AWS CLI is configured
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "❌ AWS CLI not configured. Run 'aws configure' first."
    exit 1
fi

# Navigate to AWS directory
cd aws

echo "📦 Building SAM application..."
sam build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "🚀 Deploying to AWS..."
sam deploy --guided

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo ""
    echo "📝 Next steps:"
    echo "1. Update .env.local with the output values"
    echo "2. Uncomment AWS code in backend services"
    echo "3. Deploy frontend to Vercel"
else
    echo "❌ Deployment failed"
    exit 1
fi
