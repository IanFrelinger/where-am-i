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
    let lat: number, lon: number
    
    // Check if we have direct coordinates
    if (q.lat && q.lon) {
      lat = Number(q.lat)
      lon = Number(q.lon)
    } 
    // Check if we have an IP address
    else if (q.ip) {
      // Use ipapi.co service to get coordinates from IP
      const ipUrl = `https://ipapi.co/${q.ip}/json/`
      
      const ipResponse = await fetch(ipUrl, {
        headers: { 
          'Accept': 'application/json',
          'User-Agent': 'where-am-i-app/1.0'
        }
      })

      if (!ipResponse.ok) {
        return { 
          statusCode: 400, 
          body: JSON.stringify({ error: 'Could not determine location for this IP address' })
        }
      }
      
      const ipData = await ipResponse.json()
      
      if (!ipData.latitude || !ipData.longitude) {
        return { 
          statusCode: 400, 
          body: JSON.stringify({ error: 'Could not determine coordinates for this IP address' })
        }
      }

      lat = parseFloat(ipData.latitude)
      lon = parseFloat(ipData.longitude)
    } else {
      return { 
        statusCode: 400, 
        body: JSON.stringify({ error: 'Either lat/lon coordinates or ip parameter is required' })
      }
    }
    
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return { 
        statusCode: 400, 
        body: JSON.stringify({ error: 'Invalid coordinates' })
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
          source: 'cache',
          coordinates: { lat, lon },
          timestamp: new Date().toISOString()
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
        source: 'live',
        coordinates: { lat, lon },
        timestamp: new Date().toISOString()
      }) 
    }
  } catch (err: any) {
    console.error('Combined geocoding error:', err)
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: 'Internal server error' })
    }
  }
}
