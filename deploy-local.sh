#!/bin/bash

# Local deployment script for Where Am I app
set -e

echo "🚀 Starting local deployment..."

# Check prerequisites
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Please install and configure it first."
    exit 1
fi

if ! command -v cdk &> /dev/null; then
    echo "❌ AWS CDK not found. Installing..."
    npm install -g aws-cdk
fi

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Build packages
echo "🔨 Building packages..."
pnpm build

# Deploy infrastructure
echo "☁️  Deploying to AWS..."
cd infra
cdk deploy --require-approval never

# Get resource names from CDK outputs
SITE_BUCKET=$(cdk output SiteBucketName --output text)
DISTRIBUTION_ID=$(cdk output DistributionId --output text)
CLOUDFRONT_URL=$(cdk output CloudFrontURL --output text)

echo "📤 Syncing frontend to S3..."
aws s3 sync ../packages/web/dist/ s3://$SITE_BUCKET --delete

echo "🔄 Invalidating CloudFront cache..."
aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*"

echo "✅ Deployment complete!"
echo "🌐 Your app is available at: $CLOUDFRONT_URL"
echo "🔧 API Gateway: $(cdk output ApiGatewayURL --output text)"
echo "🗄️  S3 Bucket: $SITE_BUCKET"
echo "📊 DynamoDB Table: $(cdk output DynamoDBTableName --output text)"
