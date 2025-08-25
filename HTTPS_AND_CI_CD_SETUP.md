# 🔒 HTTPS & CI/CD Setup Guide

This guide will help you set up HTTPS encryption with custom domains and GitHub Actions for automatic deployments.

## 🎯 **What We're Setting Up**

1. **🔒 HTTPS Encryption** with SSL certificates
2. **🌐 Custom Domain** support (your-domain.com)
3. **🚀 GitHub Actions** for automatic deployments
4. **📱 Route53** DNS management
5. **🛡️ CloudFront** global CDN with DDoS protection

## 📋 **Prerequisites**

- ✅ AWS account with proper permissions
- ✅ Domain name (e.g., your-domain.com)
- ✅ GitHub repository
- ✅ AWS CDK bootstrapped (already done)

## 🔧 **Step 1: Domain Configuration**

### **1.1 Create Domain Configuration File**

```bash
# Copy the example configuration
cp infra/config/domain.env.example infra/config/domain.env

# Edit the configuration with your domain
nano infra/config/domain.env
```

### **1.2 Update Domain Configuration**

Edit `infra/config/domain.env`:

```bash
# Your main domain (e.g., example.com)
DOMAIN_NAME=your-actual-domain.com

# API subdomain (e.g., api.example.com)
API_SUBDOMAIN=api.your-actual-domain.com

# AWS Region
AWS_REGION=us-east-2
```

### **1.3 Verify Domain Ownership**

Ensure your domain is registered and you have access to manage DNS records.

## 🚀 **Step 2: Deploy with HTTPS**

### **2.1 Deploy Infrastructure**

```bash
# Deploy with domain configuration
./deploy-with-domain.sh
```

This will:
- ✅ Create Route53 hosted zone
- ✅ Request SSL certificate from ACM
- ✅ Deploy CloudFront with custom domain
- ✅ Configure API Gateway with custom domain
- ✅ Set up all necessary DNS records

### **2.2 Verify Deployment**

After deployment, check:
- **Frontend**: https://your-domain.com
- **API**: https://api.your-domain.com/health

## 🔑 **Step 3: GitHub Actions Setup**

### **3.1 Add Repository Secrets**

Go to your GitHub repository:
1. **Settings** → **Secrets and variables** → **Actions**
2. Add these secrets:

```
AWS_ACCESS_KEY_ID          - Your AWS access key
AWS_SECRET_ACCESS_KEY      - Your AWS secret key
AWS_REGION                 - us-east-2
DOMAIN_NAME                - your-domain.com
API_SUBDOMAIN              - api.your-domain.com
```

### **3.2 Enable GitHub Actions**

1. Go to **Actions** tab in your repository
2. Click **Enable Actions**
3. The workflow will automatically run on pushes to main/master

## 🔄 **Step 4: Automatic Deployments**

### **4.1 How It Works**

1. **Push to main/master** → Triggers deployment
2. **Tests run** → Ensures code quality
3. **Security scan** → Checks for vulnerabilities
4. **Infrastructure deploys** → Updates AWS resources
5. **Application deploys** → Uploads new code
6. **Cache invalidated** → Ensures fresh content
7. **Release created** → Documents the deployment

### **4.2 Manual Deployment**

You can also trigger deployments manually:
1. Go to **Actions** tab
2. Click **🚀 Deploy to Production**
3. Click **Run workflow**

## 🌐 **Step 5: DNS Configuration**

### **5.1 Route53 Setup**

The deployment automatically creates:
- **Hosted Zone** for your domain
- **A Records** pointing to CloudFront
- **API Gateway** custom domain

### **5.2 Nameserver Update**

After deployment, update your domain registrar's nameservers to point to Route53:
1. Get nameservers from AWS Console → Route53 → Hosted Zones
2. Update your domain registrar with these nameservers
3. Wait for DNS propagation (up to 48 hours)

## 🔒 **Step 6: SSL Certificate**

### **6.1 Automatic Certificate Management**

- **ACM** automatically requests SSL certificates
- **DNS validation** ensures domain ownership
- **Auto-renewal** keeps certificates current
- **Multiple domains** supported (main + www + api)

### **6.2 Certificate Status**

Check certificate status in AWS Console:
1. **Certificate Manager** → Certificates
2. Verify status is **Issued**
3. Check validation method is **DNS validation**

## 🧪 **Step 7: Testing**

### **7.1 Test Frontend**

```bash
# Test HTTPS redirect
curl -I http://your-domain.com
# Should redirect to https://your-domain.com

# Test HTTPS
curl -I https://your-domain.com
# Should return 200 OK
```

### **7.2 Test API**

```bash
# Test health endpoint
curl https://api.your-domain.com/health

# Test reverse geocoding
curl "https://api.your-domain.com/reverse?lat=40.7128&lon=-74.0060"
```

### **7.3 Test Security Headers**

```bash
# Check security headers
curl -I https://your-domain.com | grep -i security
```

## 🚨 **Troubleshooting**

### **Common Issues**

1. **Certificate Pending Validation**
   - Check Route53 for validation records
   - Wait for DNS propagation

2. **Domain Not Found**
   - Verify nameservers are updated
   - Check Route53 hosted zone

3. **HTTPS Not Working**
   - Verify certificate is issued
   - Check CloudFront distribution settings

4. **GitHub Actions Fail**
   - Check AWS credentials
   - Verify repository secrets

### **Debug Commands**

```bash
# Check CDK status
cd infra && cdk diff

# Check CloudFormation
aws cloudformation describe-stacks --stack-name WhereAmIStack

# Check CloudFront
aws cloudfront get-distribution --id YOUR_DISTRIBUTION_ID

# Check Route53
aws route53 list-hosted-zones
```

## 📊 **Monitoring & Maintenance**

### **CloudWatch Alarms**

The infrastructure includes:
- **Lambda function** monitoring
- **API Gateway** metrics
- **CloudFront** performance data
- **DynamoDB** capacity monitoring

### **Cost Optimization**

- **S3** - Pay per request
- **Lambda** - Pay per execution
- **CloudFront** - Pay per transfer
- **Route53** - Fixed monthly cost

## 🎉 **Congratulations!**

You now have:
- ✅ **Production-ready infrastructure** with HTTPS
- ✅ **Custom domain** support
- ✅ **Automatic deployments** via GitHub Actions
- ✅ **Global CDN** with DDoS protection
- ✅ **SSL certificates** with auto-renewal
- ✅ **Professional CI/CD pipeline**

## 🚀 **Next Steps**

1. **Custom Domain**: Update `domain.env` with your actual domain
2. **Deploy**: Run `./deploy-with-domain.sh`
3. **Configure DNS**: Update nameservers at your registrar
4. **Test**: Verify HTTPS and custom domain work
5. **Automate**: Push to main/master for automatic deployments

## 📞 **Support**

- **Issues**: Create GitHub issue
- **Documentation**: Check this guide
- **AWS**: Check CloudFormation events
- **CDK**: Run `cdk doctor` for diagnostics

---

**Happy Deploying! 🚀🔒🌐**
