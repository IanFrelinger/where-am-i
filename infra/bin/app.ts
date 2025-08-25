#!/usr/bin/env node
import 'source-map-support/register.js'
import * as cdk from 'aws-cdk-lib'
import { WhereAmIStackSimple } from '../lib/stack-simple.js'

const app = new cdk.App()
new WhereAmIStackSimple(app, 'WhereAmIStack', {
  env: { 
    account: process.env.CDK_DEFAULT_ACCOUNT, 
    region: process.env.CDK_DEFAULT_REGION 
  },
})
