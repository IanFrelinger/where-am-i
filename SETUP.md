# 🚀 Where Am I - Setup Guide

This guide will help you get the "Where Am I?" geolocation app running locally and deployed to AWS.

## 📋 Prerequisites

- **Node.js 20+** - [Download here](https://nodejs.org/)
- **pnpm 9+** - Install with `npm install -g pnpm`
- **Git** - [Download here](https://git-scm.com/)

## 🏠 Local Development

### 1. Clone and Setup
```bash
# Clone the repository
git clone <your-repo-url>
cd where-am-i

# Install dependencies
pnpm install
```

### 2. Start Development Servers
```bash
# Start both frontend and backend
pnpm dev
```

This will start:
- **Frontend**: http://localhost:5173 (Vite + React + Mapbox GL JS)
- **Backend**: http://localhost:8787 (Express API with in-memory caching)

### 3. Test the App
1. Open http://localhost:5173 in your browser
2. Allow location access when prompted
3. Explore the enhanced map with 3D buildings and terrain
4. Test the API: `curl http://localhost:8787/api/health`

## ☁️ AWS Deployment

### Option A: GitHub Actions (Recommended)

1. **Fork/Clone** to your GitHub account
2. **Add AWS Secrets**:
   - Go to `Settings` → `Secrets and variables` → `Actions`
   - Add:
     - `AWS_ACCESS_KEY_ID`
     - `AWS_SECRET_ACCESS_KEY`
     - `AWS_REGION`
3. **Push to main** - automatic deployment!

### Option B: Local Deployment

1. **Configure AWS CLI**:
   ```bash
   aws configure
   ```

2. **Run deployment script**:
   ```bash
   ./deploy-local.sh
   ```

3. **Or deploy manually**:
   ```bash
   # Build everything
   pnpm build
   
   # Deploy infrastructure
   cd infra
   cdk bootstrap  # First time only
   cdk deploy
   
   # Sync frontend
   aws s3 sync packages/web/dist/ s3://$(cdk output SiteBucketName --output text) --delete
   
   # Invalidate cache
   aws cloudfront create-invalidation --distribution-id $(cdk output DistributionId --output text) --paths "/*"
   ```

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   CloudFront    │    │   S3 Static     │
│   (React +      │◄──►│   (CDN)         │◄──►│   Hosting       │
│   Mapbox GL JS) │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   API Gateway   │
                       │   (HTTP API)    │
                       └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   Lambda        │
                       │   (Node.js 20)  │
                       └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   DynamoDB      │
                       │   (Cache)       │
                       └─────────────────┘
```

## 🔧 Key Features

### Frontend
- **Mapbox GL JS**: Professional 3D mapping
- **3D Buildings**: Interactive building rendering
- **3D Terrain**: Elevation visualization
- **Geolocation**: Browser-based location detection
- **Responsive Design**: Mobile-friendly interface

### Backend
- **Express Server**: Local development
- **Lambda Functions**: Production deployment
- **In-Memory Cache**: Local development
- **DynamoDB**: Production caching with TTL
- **Reverse Geocoding**: Nominatim integration

### Infrastructure
- **S3**: Static website hosting
- **CloudFront**: Global CDN with HTTPS
- **API Gateway**: Serverless API management
- **Lambda**: Serverless compute
- **DynamoDB**: NoSQL database with TTL

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Test specific packages
pnpm --filter web test
pnpm --filter api test
```

## 📚 Environment Variables

### Frontend (.env)
```bash
VITE_MAPBOX_ACCESS_TOKEN=your_token_here
VITE_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
```

### Backend (.env)
```bash
PORT=8787
CACHE_TTL_DAYS=7
NOMINATIM_BASE=https://nominatim.openstreetmap.org
```

## 🚨 Troubleshooting

### Common Issues

1. **Port already in use**:
   ```bash
   # Kill processes on ports 5173/8787
   lsof -ti:5173 | xargs kill -9
   lsof -ti:8787 | xargs kill -9
   ```

2. **Geolocation not working**:
   - Use `http://localhost` (not `file://`)
   - Allow location access in browser
   - Check browser console for errors

3. **Build errors**:
   ```bash
   # Clean and rebuild
   rm -rf packages/*/dist packages/*/node_modules
   pnpm install
   pnpm build
   ```

4. **CDK deployment issues**:
   ```bash
   # Check AWS credentials
   aws sts get-caller-identity
   
   # Bootstrap CDK
   cd infra && cdk bootstrap
   ```

## 📖 Next Steps

1. **Custom Domain**: Add Route53 and ACM to CDK stack
2. **Monitoring**: Add CloudWatch alarms and dashboards
3. **Security**: Implement API key authentication
4. **Analytics**: Add user behavior tracking
5. **Mobile App**: Create React Native version

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/your-username/where-am-i/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/where-am-i/discussions)
- **Wiki**: [Project Wiki](https://github.com/your-username/where-am-i/wiki)
