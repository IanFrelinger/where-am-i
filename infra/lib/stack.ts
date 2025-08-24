import { Stack, Duration, RemovalPolicy, CfnOutput } from 'aws-cdk-lib'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as cf from 'aws-cdk-lib/aws-cloudfront'
import * as s3orig from 'aws-cdk-lib/aws-cloudfront-origins'
import * as apigw from 'aws-cdk-lib/aws-apigatewayv2'
import * as apigwInt from 'aws-cdk-lib/aws-apigatewayv2-integrations'
import * as ddb from 'aws-cdk-lib/aws-dynamodb'
import * as lambda from 'aws-cdk-lib/aws-lambda-nodejs'
import * as lambdaRuntime from 'aws-cdk-lib/aws-lambda'
import * as iam from 'aws-cdk-lib/aws-iam'
import { Construct } from 'constructs'

export class WhereAmIStack extends Stack {
  constructor(scope: Construct, id: string, props?: any) {
    super(scope, id, props)

    // S3 bucket for static website hosting
    const siteBucket = new s3.Bucket(this, 'SiteBucket', {
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html', // SPA routing
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
        },
      ],
    })

    // DynamoDB table for geocoding cache
    const cacheTable = new ddb.Table(this, 'CacheTable', {
      partitionKey: { name: 'k', type: ddb.AttributeType.STRING },
      timeToLiveAttribute: 'ttl',
      billingMode: ddb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    })

    // Lambda function for reverse geocoding
    const reverseFunction = new lambda.NodejsFunction(this, 'ReverseFunction', {
      entry: '../packages/api/dist/reverse.js',
      runtime: lambdaRuntime.Runtime.NODEJS_20_X,
      timeout: Duration.seconds(30),
      memorySize: 256,
      environment: {
        CACHE_TABLE: cacheTable.tableName,
        CACHE_TTL_DAYS: '7',
      },
      bundling: {
        minify: true,
        sourceMap: true,
        target: 'es2020',
      },
    })

    // Grant DynamoDB permissions to Lambda
    cacheTable.grantReadWriteData(reverseFunction)

    // Lambda function for health check
    const healthFunction = new lambda.NodejsFunction(this, 'HealthFunction', {
      entry: '../packages/api/dist/health.js',
      runtime: lambdaRuntime.Runtime.NODEJS_20_X,
      timeout: Duration.seconds(10),
      memorySize: 128,
      bundling: {
        minify: true,
        sourceMap: true,
        target: 'es2020',
      },
    })

    // API Gateway HTTP API
    const httpApi = new apigw.HttpApi(this, 'WhereAmIApi', {
      corsPreflight: {
        allowHeaders: ['Content-Type', 'Accept'],
        allowMethods: [apigw.CorsHttpMethod.GET],
        allowOrigins: ['*'], // In production, restrict to your domain
        maxAge: Duration.days(1),
      },
      defaultIntegration: new apigwInt.HttpLambdaIntegration('DefaultIntegration', healthFunction),
    })

    // Add routes
    httpApi.addRoutes({
      path: '/health',
      methods: [apigw.HttpMethod.GET],
      integration: new apigwInt.HttpLambdaIntegration('HealthIntegration', healthFunction),
    })

    httpApi.addRoutes({
      path: '/reverse',
      methods: [apigw.HttpMethod.GET],
      integration: new apigwInt.HttpLambdaIntegration('ReverseIntegration', reverseFunction),
    })

    // CloudFront distribution
    const distribution = new cf.Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: new s3orig.S3Origin(siteBucket),
        viewerProtocolPolicy: cf.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cf.CachePolicy.CACHING_OPTIMIZED,
      },
      additionalBehaviors: {
        'api/*': {
          origin: new s3orig.HttpOrigin(`${httpApi.apiId}.execute-api.${Stack.of(this).region}.amazonaws.com`),
          cachePolicy: cf.CachePolicy.CACHING_DISABLED,
          originRequestPolicy: cf.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
          viewerProtocolPolicy: cf.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        },
      },
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
      ],
    })

    // Outputs
    new CfnOutput(this, 'CloudFrontURL', {
      value: `https://${distribution.distributionDomainName}`,
      description: 'CloudFront Distribution URL',
    })

    new CfnOutput(this, 'SiteBucketName', {
      value: siteBucket.bucketName,
      description: 'S3 Bucket Name for static assets',
    })

    new CfnOutput(this, 'ApiGatewayURL', {
      value: httpApi.url!,
      description: 'API Gateway URL',
    })

    new CfnOutput(this, 'DynamoDBTableName', {
      value: cacheTable.tableName,
      description: 'DynamoDB Cache Table Name',
    })

    new CfnOutput(this, 'DistributionId', {
      value: distribution.distributionId,
      description: 'CloudFront Distribution ID',
    })
  }
}
