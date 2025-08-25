#!/bin/bash

# Deploy script for Where Am I application
set -e

echo "🚀 Deploying Where Am I application..."

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

# Deploy infrastructure
echo "☁️ Deploying infrastructure..."
cd infra
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
aws cloudformation describe-stacks --stack-name WhereAmIStack --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontURL`].OutputValue' --output text
