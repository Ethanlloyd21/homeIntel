import { defineBackend } from '@aws-amplify/backend'
import { Duration, RemovalPolicy, Stack } from 'aws-cdk-lib'
import {
  HttpApi,
  HttpMethod,
  CorsHttpMethod,
  CfnStage,
} from 'aws-cdk-lib/aws-apigatewayv2'
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations'
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb'
import { api } from './functions/api/resource.js'

const backend = defineBackend({ api })
const stack = backend.createStack('relointel-api')
const cache = new Table(Stack.of(backend.api.resources.lambda), 'ApiCache', {
  partitionKey: { name: 'id', type: AttributeType.STRING },
  billingMode: BillingMode.PAY_PER_REQUEST,
  timeToLiveAttribute: 'expiresAt',
  // This table holds disposable public API responses, not user profiles.
  removalPolicy: RemovalPolicy.DESTROY,
})
cache.grantReadWriteData(backend.api.resources.lambda)
backend.api.addEnvironment('CACHE_TABLE_NAME', cache.tableName)

const httpApi = new HttpApi(stack, 'PublicApi', {
  corsPreflight: {
    allowOrigins: ['*'],
    allowMethods: [CorsHttpMethod.GET],
    allowHeaders: ['content-type'],
    maxAge: Duration.days(1),
  },
})
httpApi.addRoutes({
  path: '/api/{proxy+}',
  methods: [HttpMethod.GET],
  integration: new HttpLambdaIntegration(
    'ApiIntegration',
    backend.api.resources.lambda,
  ),
})
const stage = httpApi.defaultStage!.node.defaultChild as CfnStage
stage.defaultRouteSettings = {
  throttlingBurstLimit: 50,
  throttlingRateLimit: 25,
}

backend.addOutput({ custom: { apiUrl: httpApi.apiEndpoint } })
