#!/bin/bash

# Production deployment script with HTTPS and custom domain support
set -e

echo "🚀 Deploying Where Am I application with HTTPS..."

# Check if domain configuration exists
if [ ! -f "infra/config/domain.env" ]; then
    echo "❌ Domain configuration not found!"
    echo "Please copy infra/config/domain.env.example to infra/config/domain.env"
    echo "and update it with your domain information."
    exit 1
fi

# Load domain configuration
source infra/config/domain.env

# Validate domain configuration
if [ "$DOMAIN_NAME" = "your-domain.com" ] || [ -z "$DOMAIN_NAME" ]; then
    echo "❌ Please update DOMAIN_NAME in infra/config/domain.env with your actual domain"
    exit 1
fi

if [ "$API_SUBDOMAIN" = "api.your-domain.com" ] || [ -z "$API_SUBDOMAIN" ]; then
    echo "❌ Please update API_SUBDOMAIN in infra/config/domain.env with your actual API subdomain"
    exit 1
fi

echo "✅ Domain configuration loaded:"
echo "   Main Domain: $DOMAIN_NAME"
echo "   API Subdomain: $API_SUBDOMAIN"
echo "   AWS Region: $AWS_REGION"

# Check if AWS CLI is configured
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "❌ AWS CLI is not configured. Please run 'aws configure' first."
    exit 1
fi

# Check if CDK is installed
if ! command -v cdk &> /dev/null; then
    echo "📦 Installing AWS CDK..."
    npm install -g aws-cdk
fi

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Build the application
echo "🔨 Building application..."
pnpm build

# Deploy infrastructure with domain configuration
echo "☁️ Deploying infrastructure with HTTPS..."
cd infra
export DOMAIN_NAME="$DOMAIN_NAME"
export API_SUBDOMAIN="$API_SUBDOMAIN"
cdk deploy --require-approval never

# Get the S3 bucket name from CDK output
echo "📤 Uploading frontend to S3..."
BUCKET_NAME=$(aws cloudformation describe-stacks --stack-name WhereAmIStack --query 'Stacks[0].Outputs[?OutputKey==`SiteBucketName`].OutputValue' --output text)
aws s3 sync ../packages/web/dist s3://$BUCKET_NAME --delete

# Invalidate CloudFront cache
echo "🔄 Invalidating CloudFront cache..."
DISTRIBUTION_ID=$(aws cloudformation describe-stacks --stack-name WhereAmIStack --query 'Stacks[0].Outputs[?OutputKey==`DistributionId`].OutputValue' --output text)
aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*"

echo "✅ Deployment complete!"
echo "🌐 Your application is available at:"
echo "   Frontend: https://$DOMAIN_NAME"
echo "   API: https://$API_SUBDOMAIN"
echo ""
echo "🔒 HTTPS is automatically configured with SSL certificates"
echo "📱 CloudFront provides global CDN and DDoS protection"
echo "🚀 Route53 handles DNS management"
echo ""
echo "⚠️  Note: DNS changes may take up to 48 hours to propagate globally"
