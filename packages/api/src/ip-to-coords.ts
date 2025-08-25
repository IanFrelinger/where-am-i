import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const q = event.queryStringParameters ?? {}
    const ip = q.ip
    
    if (!ip) {
      return { 
        statusCode: 400, 
        body: JSON.stringify({ error: 'ip parameter is required' })
      }
    }

    // Use ipapi.co service to get coordinates from IP
    const url = `https://ipapi.co/${ip}/json/`
    
    const response = await fetch(url, {
      headers: { 
        'Accept': 'application/json',
        'User-Agent': 'where-am-i-app/1.0'
      }
    })

    if (!response.ok) {
      return { 
        statusCode: response.status, 
        body: JSON.stringify({ error: 'IP geolocation service error' })
      }
    }
    
    const data = await response.json()
    
    // Check if we got valid coordinates
    if (!data.latitude || !data.longitude) {
      return { 
        statusCode: 400, 
        body: JSON.stringify({ error: 'Could not determine location for this IP address' })
      }
    }

    return { 
      statusCode: 200, 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        ip,
        coordinates: {
          lat: parseFloat(data.latitude),
          lon: parseFloat(data.longitude)
        },
        location: {
          city: data.city,
          region: data.region,
          country: data.country_name,
          timezone: data.timezone
        },
        timestamp: new Date().toISOString()
      }) 
    }
  } catch (err: any) {
    console.error('IP to coordinates error:', err)
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: 'Internal server error' })
    }
  }
}
