# GitHub Actions Docker Integration Guide

This guide explains how to set up GitHub Actions to automatically build, test, and deploy Docker containers for your "Where Am I" application.

## 🚀 Overview

The GitHub Actions workflows will:
1. **Build and test** your application
2. **Build Docker images** (production and development)
3. **Push to GitHub Container Registry** (ghcr.io)
4. **Deploy to AWS** (S3, CloudFront, Lambda)
5. **Optionally deploy containers** to ECS/ECR

## 📁 Workflow Files

### 1. `docker-build.yml` - Docker Build Pipeline
- **Triggers**: Changes to packages, Dockerfiles, or docker-compose.yml
- **Features**: 
  - Multi-stage Docker builds
  - Container testing
  - Security scanning with Trivy
  - GitHub Container Registry publishing

### 2. `deploy.yml` - Main Deployment Pipeline
- **Triggers**: Push to main branch
- **Features**:
  - Docker image building
  - AWS CDK deployment
  - Optional ECS/ECR deployment
  - Automatic releases

## 🔧 Setup Instructions

### 1. Enable GitHub Actions
1. Go to your repository on GitHub
2. Click on the **Actions** tab
3. Click **Enable Actions**

### 2. Required Secrets
Add these secrets in your repository (`Settings` → `Secrets and variables` → `Actions`):

#### AWS Credentials (Required)
```
AWS_ACCESS_KEY_ID          - Your AWS access key
AWS_SECRET_ACCESS_KEY      - Your AWS secret key
AWS_REGION                 - Your AWS region (e.g., us-east-1)
```

#### Optional Container Deployment
```
ECR_REPOSITORY_URI        - ECR repository URI (e.g., 123456789.dkr.ecr.us-east-1.amazonaws.com/where-am-i)
ECS_CLUSTER               - ECS cluster name
ECS_SERVICE               - ECS service name
```

### 3. Repository Permissions
Ensure GitHub Actions has permission to:
- Read repository contents
- Write packages (for Container Registry)
- Create releases

Go to `Settings` → `Actions` → `General` → `Workflow permissions`

## 🐳 Docker Images

### Production Image
- **Tag**: `ghcr.io/your-username/where-am-i:latest`
- **Features**: Multi-stage build, optimized size, security hardened

### Development Image
- **Tag**: `ghcr.io/your-username/where-am-i:dev`
- **Features**: Hot reloading, development dependencies

## 📋 Workflow Execution

### On Push to Main
1. **Test**: Run tests and linting
2. **Docker Build**: Build and test containers
3. **Build**: Build application packages
4. **Deploy**: Deploy to AWS infrastructure
5. **Container Deploy**: Optionally deploy to ECS/ECR
6. **Release**: Create GitHub release with Docker images

### On Pull Request
1. **Test**: Run tests and linting
2. **Docker Build**: Build containers (no push)
3. **Security Scan**: Run Trivy vulnerability scan

## 🔍 Monitoring and Debugging

### View Workflow Runs
1. Go to **Actions** tab
2. Click on workflow name
3. Click on specific run
4. View logs for each step

### Common Issues

#### Docker Build Failures
- Check Dockerfile syntax
- Verify all required files are present
- Check `.dockerignore` configuration

#### Container Test Failures
- Verify ports are correctly exposed
- Check application startup time
- Review container logs

#### AWS Deployment Issues
- Verify AWS credentials
- Check CDK bootstrap status
- Review CloudFormation stack events

## 🚀 Manual Testing

### Test Docker Images Locally
```bash
# Pull latest image
docker pull ghcr.io/your-username/where-am-i:latest

# Run container
docker run -p 5173:5173 -p 8787:8787 ghcr.io/your-username/where-am-i:latest

# Test endpoints
curl http://localhost:5173/
curl http://localhost:8787/api/health
```

### Test with Docker Compose
```bash
# Use published images
docker-compose -f docker-compose.prod.yml up -d
```

## 📊 Performance Optimization

### Build Caching
- **GitHub Actions Cache**: Leverages GHA cache for faster builds
- **Docker Layer Caching**: Reuses layers between builds
- **Dependency Caching**: Caches pnpm dependencies

### Parallel Execution
- **Independent Jobs**: Test, build, and deploy run in parallel where possible
- **Dependency Management**: Jobs wait for required dependencies

## 🔒 Security Features

### Container Security
- **Trivy Scanning**: Automated vulnerability scanning
- **Non-root User**: Containers run as non-root
- **Base Image Updates**: Regular base image updates

### Infrastructure Security
- **IAM Least Privilege**: Minimal required permissions
- **Secrets Management**: Secure handling of credentials
- **HTTPS Only**: All endpoints use HTTPS

## 📈 Scaling Considerations

### Container Registry
- **GitHub Container Registry**: Free for public repositories
- **Image Limits**: 500GB storage, 10GB per image
- **Rate Limits**: 100 requests per hour for anonymous users

### AWS Resources
- **S3**: Pay per use storage and requests
- **CloudFront**: Global CDN with edge locations
- **Lambda**: Serverless compute with auto-scaling

## 🛠️ Customization

### Modify Workflows
1. Edit `.github/workflows/*.yml` files
2. Adjust triggers, jobs, and steps
3. Add custom actions or scripts

### Environment-Specific Deployments
```yaml
# Add environment-specific deployments
- name: Deploy to Staging
  if: github.ref == 'refs/heads/develop'
  run: ./deploy-staging.sh

- name: Deploy to Production
  if: github.ref == 'refs/heads/main'
  run: ./deploy-production.sh
```

### Custom Docker Tags
```yaml
# Add custom tags
tags: |
  type=ref,event=branch
  type=ref,event=pr
  type=sha,prefix={{branch}}-
  type=raw,value=latest,enable={{is_default_branch}}
  type=raw,value=stable,enable={{is_default_branch}}
  type=raw,value=v{{version}},enable={{is_default_branch}}
```

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Build Action](https://github.com/docker/build-push-action)
- [GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)

## 🆘 Support

If you encounter issues:
1. Check workflow logs for error details
2. Verify all secrets are correctly configured
3. Test Docker builds locally first
4. Review GitHub Actions documentation

## 🔄 Continuous Improvement

The workflows are designed to be:
- **Maintainable**: Clear structure and documentation
- **Extensible**: Easy to add new features
- **Reliable**: Comprehensive testing and error handling
- **Secure**: Built-in security scanning and best practices
