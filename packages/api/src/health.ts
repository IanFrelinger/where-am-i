import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'

export const handler: APIGatewayProxyHandlerV2 = async () => {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'where-am-i-api'
    })
  }
}
