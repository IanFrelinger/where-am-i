# Where Am I? 🌍

A geolocation web application built with Node.js + TypeScript on AWS, demonstrating backend skills, cloud fluency, and sound software design.

## 🚀 Quick Start

### Prerequisites
- **Node.js 20+** 
- **pnpm 9+**

### One-Command Setup & Run
```bash
# Install dependencies
pnpm install

# Start development servers (frontend + backend)
pnpm dev
```

### What This Does
- **Frontend**: Vite dev server at http://localhost:5173
- **Backend**: Express API server at http://localhost:8787  
- **Proxy**: Frontend automatically proxies `/api/*` to backend

### Test the Setup
1. **Open**: http://localhost:5173
2. **Allow location access** when prompted
3. **Health check**: `curl http://localhost:8787/api/health`
4. **API test**: `curl "http://localhost:8787/api/reverse?lat=40.7128&lon=-74.0060"`

### Production Build
```bash
# Build both packages
pnpm build

# Start production servers
pnpm start
```

### AWS Deployment (Optional)
```bash
# Deploy to AWS
pnpm deploy

# Clean up AWS resources
pnpm destroy
```

## 🏗️ Architecture

This is a monorepo with the following structure:

```
where-am-i/
├─ packages/
│  ├─ web/               # Vite + TypeScript frontend (Leaflet/MapLibre)
│  └─ api/               # Lambda handlers (Node 20 + TypeScript)
├─ infra/                # AWS CDK (TypeScript)
├─ .github/workflows/    # CI/CD pipelines
└─ package.json          # Workspace configuration
```

### Frontend
- **Framework**: Vite + TypeScript + React
- **Map**: Mapbox GL JS with 3D buildings and terrain
- **Features**: Geolocation, reverse geocoding, accuracy display, 3D visualization
- **Dev Server**: http://localhost:5173

### Backend
- **Runtime**: Node.js 20 (local Express server + AWS Lambda for production)
- **API**: Express dev server + API Gateway HTTP API for production
- **Cache**: In-memory LRU cache (local) + DynamoDB with TTL (production)
- **Geocoding**: Nominatim proxy with intelligent caching
- **Dev Server**: http://localhost:8787

### Infrastructure
- **CDN**: CloudFront distribution
- **Hosting**: S3 static website
- **API**: API Gateway + Lambda
- **Database**: DynamoDB cache table
- **Security**: HTTPS, CORS, security headers

## 🔧 Development

### Local Development
The `pnpm dev` command runs both frontend and backend concurrently:
- **Frontend**: Vite dev server with hot reload and Mapbox GL JS
- **Backend**: Express server with in-memory caching and esbuild + nodemon
- **Proxy**: Frontend automatically routes `/api/*` requests to backend

### API Endpoints
- `GET /api/health` - Health check
- `GET /api/reverse?lat={lat}&lon={lon}` - Reverse geocoding

### Environment Variables
- `CACHE_TABLE` - DynamoDB table name
- `CACHE_TTL_DAYS` - Cache TTL in days (default: 7)

## 🚀 Deployment

### Option 1: GitHub Actions (Recommended)
The repository includes a complete CI/CD pipeline that automatically deploys to AWS on every push to `main`.

#### Setup:
1. **Fork/Clone** this repository to your GitHub account
2. **Add AWS Secrets** to your repository:
   - Go to `Settings` → `Secrets and variables` → `Actions`
   - Add the following secrets:
     - `AWS_ACCESS_KEY_ID`: Your AWS access key
     - `AWS_SECRET_ACCESS_KEY`: Your AWS secret key  
     - `AWS_REGION`: Your AWS region (e.g., `us-east-1`)

3. **Push to main** - the workflow will automatically:
   - Run tests and build
   - Bootstrap CDK (if needed)
   - Deploy infrastructure
   - Sync frontend to S3
   - Invalidate CloudFront cache

### Option 2: Local Deployment
If you prefer to deploy locally:

#### Prerequisites:
- AWS CLI configured with appropriate permissions
- AWS CDK installed: `npm install -g aws-cdk`
- Node.js 20+ and pnpm 9+

#### Steps:
```bash
# Install dependencies
pnpm install

# Build packages
pnpm build

# Bootstrap CDK (first time only)
cd infra
cdk bootstrap

# Deploy
cdk deploy

# Sync frontend to S3
aws s3 sync packages/web/dist/ s3://$(cdk output SiteBucketName --output text) --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id $(cdk output DistributionId --output text) --paths "/*"
```

### AWS Resources Created:
- **S3 Bucket**: Static website hosting
- **CloudFront Distribution**: CDN with HTTPS
- **API Gateway**: HTTP API for backend
- **Lambda Functions**: Reverse geocoding + health check
- **DynamoDB**: Cache table with TTL
- **IAM Roles**: Least-privilege permissions

### Cost Estimate:
- **S3**: ~$0.023/GB/month + requests
- **CloudFront**: ~$0.085/GB + requests  
- **Lambda**: ~$0.20 per 1M requests
- **DynamoDB**: ~$1.25 per 1M requests
- **API Gateway**: ~$1.00 per 1M requests

**Total**: Typically <$5/month for low traffic

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Frontend tests
pnpm --filter web test

# Backend tests
pnpm --filter api test
```

## 📊 Cost Analysis

- **S3**: ~$0.023/GB/month
- **CloudFront**: ~$0.085/GB (first 10TB)
- **Lambda**: ~$0.20 per 1M requests
- **DynamoDB**: ~$1.25 per 1M requests
- **API Gateway**: ~$1.00 per 1M requests

**Total**: Near-zero cost at small scale, fully serverless.

## 🔒 Security & Privacy

- HTTPS end-to-end via CloudFront
- CORS restricted to site origin
- No PII storage (rounded coordinates only)
- Rate limiting via API Gateway
- Security headers (CSP, HSTS)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🙏 Acknowledgments

- OpenStreetMap for map tiles and geocoding data
- Leaflet for the mapping library
- AWS CDK for infrastructure as code
