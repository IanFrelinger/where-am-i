// Simple in-memory LRU cache for local development
class SimpleCache {
  private cache = new Map<string, { value: any; expiry: number }>();
  private maxSize: number;

  constructor(maxSize = 100) {
    this.maxSize = maxSize;
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  set(key: string, value: any, ttlMs: number): void {
    // Remove oldest items if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      value,
      expiry: Date.now() + ttlMs
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

const cache = new SimpleCache(100);
const TTL_DAYS = Number(process.env.CACHE_TTL_DAYS || 7);
const TTL_MS = TTL_DAYS * 24 * 60 * 60 * 1000;

const round = (n: number, p = 5) => Number(n.toFixed(p));
const keyFor = (lat: number, lon: number) => `${round(lat)}:${round(lon)}`;

export const reverseGeocodeHandler = async (event: any) => {
  try {
    const q = event.queryStringParameters ?? {};
    const lat = Number(q.lat), lon = Number(q.lon);
    
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'lat and lon parameters are required and must be valid numbers' })
      };
    }

    const key = keyFor(lat, lon);

    // 1) Try cache
    const cached = cache.get(key);
    if (cached) {
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          address: cached.address, 
          source: 'cache',
          coordinates: { lat, lon },
          timestamp: new Date().toISOString()
        })
      };
    }

    // 2) Live lookup (public Nominatim)
    const url = new URL('https://nominatim.openstreetmap.org/reverse');
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('lat', String(lat));
    url.searchParams.set('lon', String(lon));
    url.searchParams.set('zoom', '18');
    url.searchParams.set('addressdetails', '1');

    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'where-am-i-app/1.0'
      }
    });

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: 'Upstream geocoding service error' })
      };
    }

    const data = await response.json();
    const address = data.display_name || 'Address not found';

    // 3) Store in cache
    cache.set(key, { address }, TTL_MS);

    return {
      statusCode: 200,
      body: JSON.stringify({
        address,
        source: 'live',
        coordinates: { lat, lon },
        timestamp: new Date().toISOString()
      })
    };

  } catch (error: any) {
    console.error('Reverse geocoding error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
