#!/usr/bin/env node
import 'source-map-support/register.js'
import * as cdk from 'aws-cdk-lib'
import { WhereAmIStack } from '../lib/stack.js'

const app = new cdk.App()
new WhereAmIStack(app, 'WhereAmIStack', {
  env: { 
    account: process.env.CDK_DEFAULT_ACCOUNT, 
    region: process.env.CDK_DEFAULT_REGION 
  },
})
