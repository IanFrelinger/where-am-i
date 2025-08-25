#!/bin/bash

# Comprehensive Test Suite for Where Am I Application
set -e

echo "🧪 Starting Where Am I Application Test Suite..."
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run a test
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_status="$3"
    
    echo -e "\n${BLUE}🔍 Testing: $test_name${NC}"
    echo "Command: $test_command"
    
    if eval "$test_command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PASS: $test_name${NC}"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}❌ FAIL: $test_name${NC}"
        ((TESTS_FAILED++))
        return 1
    fi
}

# Function to test HTTP endpoints
test_http_endpoint() {
    local test_name="$1"
    local url="$2"
    local expected_status="$3"
    
    echo -e "\n${BLUE}🔍 Testing: $test_name${NC}"
    echo "URL: $url"
    
    local response_code
    response_code=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$response_code" = "$expected_status" ]; then
        echo -e "${GREEN}✅ PASS: $test_name (HTTP $response_code)${NC}"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}❌ FAIL: $test_name (Expected HTTP $expected_status, got HTTP $response_code)${NC}"
        ((TESTS_FAILED++))
        return 1
    fi
}

# Function to test API functionality
test_api_functionality() {
    local test_name="$1"
    local url="$2"
    local expected_pattern="$3"
    
    echo -e "\n${BLUE}🔍 Testing: $test_name${NC}"
    echo "URL: $url"
    
    local response
    response=$(curl -s "$url" 2>/dev/null || echo "ERROR")
    
    if [[ "$response" != "ERROR" && "$response" =~ $expected_pattern ]]; then
        echo -e "${GREEN}✅ PASS: $test_name${NC}"
        echo "Response: ${response:0:100}..."
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}❌ FAIL: $test_name${NC}"
        echo "Response: $response"
        ((TESTS_FAILED++))
        return 1
    fi
}

echo -e "\n${YELLOW}📋 Prerequisites Check${NC}"
echo "========================"

# Check AWS CLI
run_test "AWS CLI Configuration" "aws sts get-caller-identity > /dev/null 2>&1" 0

# Check CDK
run_test "CDK Installation" "command -v cdk > /dev/null" 0

# Check pnpm
run_test "pnpm Installation" "command -v pnpm > /dev/null" 0

# Check Node.js
run_test "Node.js Installation" "command -v node > /dev/null" 0

echo -e "\n${YELLOW}🌐 Infrastructure Status Check${NC}"
echo "=================================="

# Get stack outputs
echo "📊 Getting CloudFormation stack outputs..."
STACK_OUTPUTS=$(aws cloudformation describe-stacks --stack-name WhereAmIStack --query 'Stacks[0].Outputs' --output json 2>/dev/null)

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Stack outputs retrieved successfully${NC}"
    
    # Extract values
    CLOUDFRONT_URL=$(echo "$STACK_OUTPUTS" | jq -r '.[] | select(.OutputKey=="CloudFrontURL") | .OutputValue')
    API_URL=$(echo "$STACK_OUTPUTS" | jq -r '.[] | select(.OutputKey=="ApiGatewayURL") | .OutputValue')
    S3_BUCKET=$(echo "$STACK_OUTPUTS" | jq -r '.[] | select(.OutputKey=="SiteBucketName") | .OutputValue')
    DISTRIBUTION_ID=$(echo "$STACK_OUTPUTS" | jq -r '.[] | select(.OutputKey=="DistributionId") | .OutputValue')
    
    echo "CloudFront URL: $CLOUDFRONT_URL"
    echo "API Gateway URL: $API_URL"
    echo "S3 Bucket: $S3_BUCKET"
    echo "Distribution ID: $DISTRIBUTION_ID"
else
    echo -e "${RED}❌ Failed to get stack outputs${NC}"
    exit 1
fi

echo -e "\n${YELLOW}🌍 Frontend Accessibility Tests${NC}"
echo "=================================="

# Test CloudFront frontend
test_http_endpoint "CloudFront Frontend" "$CLOUDFRONT_URL" "200"

# Test S3 bucket directly
test_http_endpoint "S3 Bucket Direct Access" "https://$S3_BUCKET.s3.us-east-2.amazonaws.com/index.html" "200"

echo -e "\n${YELLOW}🔌 API Gateway Tests${NC}"
echo "=========================="

# Test API Gateway health endpoint
test_http_endpoint "API Gateway Health Check" "$API_URL/health" "200"

# Test API Gateway reverse endpoint
test_api_functionality "API Gateway Reverse Lookup" "$API_URL/reverse?ip=8.8.8.8" ".*location.*"

echo -e "\n${YELLOW}🗄️ S3 Content Tests${NC}"
echo "======================"

# Check if S3 bucket has content
run_test "S3 Bucket Content Check" "aws s3 ls s3://$S3_BUCKET/ | grep -q index.html" 0

# Check specific files
run_test "S3 index.html Exists" "aws s3 ls s3://$S3_BUCKET/index.html > /dev/null" 0
run_test "S3 CSS Exists" "aws s3 ls s3://$S3_BUCKET/assets/ | grep -q .css" 0
run_test "S3 JavaScript Exists" "aws s3 ls s3://$S3_BUCKET/assets/ | grep -q .js" 0

echo -e "\n${YELLOW}🔄 CloudFront Cache Tests${NC}"
echo "=========================="

# Check CloudFront distribution status
run_test "CloudFront Distribution Enabled" "aws cloudfront get-distribution --id $DISTRIBUTION_ID --query 'Distribution.Status' --output text | grep -q 'Deployed'" 0

# Check CloudFront origin configuration
run_test "CloudFront Origin Configuration" "aws cloudfront get-distribution --id $DISTRIBUTION_ID --query 'Distribution.DistributionConfig.Origins.Items[0].DomainName' --output text | grep -q $S3_BUCKET" 0

echo -e "\n${YELLOW}🔐 Security Tests${NC}"
echo "=================="

# Check if S3 bucket is private (should be for CloudFront)
run_test "S3 Bucket Private Access" "aws s3api get-public-access-block --bucket $S3_BUCKET --query 'PublicAccessBlockConfiguration.RestrictPublicBuckets' --output text | grep -q 'true'" 0

# Check CloudFront OAI
run_test "CloudFront OAI Configuration" "aws cloudfront get-distribution --id $DISTRIBUTION_ID --query 'Distribution.DistributionConfig.Origins.Items[0].S3OriginConfig.OriginAccessIdentity' --output text | grep -q 'origin-access-identity'" 0

echo -e "\n${YELLOW}📱 Application Functionality Tests${NC}"
echo "====================================="

# Test the actual application functionality
echo -e "\n${BLUE}🔍 Testing: Application Reverse IP Lookup${NC}"
echo "Testing reverse lookup for Google DNS (8.8.8.8)..."

RESPONSE=$(curl -s "$API_URL/reverse?ip=8.8.8.8" 2>/dev/null || echo "ERROR")

if [[ "$RESPONSE" != "ERROR" ]]; then
    echo "Response received: ${RESPONSE:0:200}..."
    
    if [[ "$RESPONSE" =~ "location" ]] || [[ "$RESPONSE" =~ "country" ]] || [[ "$RESPONSE" =~ "city" ]]; then
        echo -e "${GREEN}✅ PASS: Reverse IP lookup working${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ FAIL: Reverse IP lookup not returning expected data${NC}"
        echo "Full response: $RESPONSE"
        ((TESTS_FAILED++))
    fi
else
    echo -e "${RED}❌ FAIL: No response from API${NC}"
    ((TESTS_FAILED++))
fi

echo -e "\n${YELLOW}📊 Test Results Summary${NC}"
echo "========================"
echo -e "${GREEN}✅ Tests Passed: $TESTS_PASSED${NC}"
echo -e "${RED}❌ Tests Failed: $TESTS_FAILED${NC}"
echo -e "Total Tests: $((TESTS_PASSED + TESTS_FAILED))"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All tests passed! Your application is working correctly.${NC}"
    exit 0
else
    echo -e "\n${RED}⚠️  Some tests failed. Check the output above for details.${NC}"
    exit 1
fi
