export interface ReverseGeocodeResponse {
  address: string
  source: 'cache' | 'live'
}

export async function reverseGeocode(lat: number, lon: number): Promise<ReverseGeocodeResponse> {
  const url = `/api/reverse?lat=${lat}&lon=${lon}`
  const res = await fetch(url, { 
    headers: { 'Accept': 'application/json' } 
  })
  
  if (!res.ok) {
    throw new Error(`Reverse geocode failed: ${res.status}`)
  }
  
  return res.json()
}

export async function healthCheck(): Promise<{ status: string }> {
  const res = await fetch('/api/health', {
    headers: { 'Accept': 'application/json' }
  })
  
  if (!res.ok) {
    throw new Error(`Health check failed: ${res.status}`)
  }
  
  return res.json()
}
