import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient, GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb'

const ddb = new DynamoDBClient({})
const TABLE = process.env.CACHE_TABLE!
const TTL_DAYS = Number(process.env.CACHE_TTL_DAYS ?? 7)

const round = (n: number, p = 5) => Number(n.toFixed(p))
const keyFor = (lat: number, lon: number) => `${round(lat)}:${round(lon)}`

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const q = event.queryStringParameters ?? {}
    const lat = Number(q.lat), lon = Number(q.lon)
    
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return { 
        statusCode: 400, 
        body: JSON.stringify({ error: 'lat and lon parameters are required and must be valid numbers' })
      }
    }

    const key = keyFor(lat, lon)
    
    // 1) Try cache first
    const cached = await ddb.send(new GetItemCommand({
      TableName: TABLE, 
      Key: { k: { S: key } }
    }))
    
    const item = cached.Item
    if (item?.addr?.S) {
      return { 
        statusCode: 200, 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          address: item.addr.S, 
          source: 'cache' 
        }) 
      }
    }

    // 2) Live lookup from Nominatim
    const url = new URL('https://nominatim.openstreetmap.org/reverse')
    url.searchParams.set('format', 'jsonv2')
    url.searchParams.set('lat', String(lat))
    url.searchParams.set('lon', String(lon))
    url.searchParams.set('zoom', '18')
    url.searchParams.set('addressdetails', '1')

    const res = await fetch(url.toString(), {
      headers: { 
        'Accept': 'application/json', 
        'User-Agent': 'where-am-i-takehome/1.0' 
      }
    })

    if (!res.ok) {
      return { 
        statusCode: res.status, 
        body: JSON.stringify({ error: 'Upstream geocoding service error' })
      }
    }
    
    const data = await res.json()
    const address = data.display_name ?? ''

    // 3) Store in cache with TTL
    const ttl = Math.floor(Date.now() / 1000) + TTL_DAYS * 86400
    await ddb.send(new PutItemCommand({
      TableName: TABLE,
      Item: { 
        k: { S: key }, 
        addr: { S: address }, 
        ttl: { N: String(ttl) } 
      }
    }))

    return { 
      statusCode: 200, 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        address, 
        source: 'live' 
      }) 
    }
  } catch (err: any) {
    console.error('Reverse geocoding error:', err)
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: 'Internal server error' })
    }
  }
}
