import { describe, it, expect, vi, beforeEach } from 'vitest'
import { handler } from './reverse'

// Mock AWS SDK
vi.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: vi.fn(() => ({
    send: vi.fn(),
  })),
  GetItemCommand: vi.fn(),
  PutItemCommand: vi.fn(),
}))

// Mock fetch
global.fetch = vi.fn()

describe('Reverse Geocoding Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.CACHE_TABLE = 'test-table'
    process.env.CACHE_TTL_DAYS = '7'
  })

  it('returns 400 for missing lat parameter', async () => {
    const event = {
      queryStringParameters: { lon: '123.456' }
    }

    const result = await handler(event as any, {} as any, {} as any)
    
    expect(result.statusCode).toBe(400)
    expect(JSON.parse(result.body!)).toHaveProperty('error')
  })

  it('returns 400 for missing lon parameter', async () => {
    const event = {
      queryStringParameters: { lat: '45.678' }
    }

    const result = await handler(event as any, {} as any, {} as any)
    
    expect(result.statusCode).toBe(400)
    expect(JSON.parse(result.body!)).toHaveProperty('error')
  })

  it('returns 400 for invalid lat parameter', async () => {
    const event = {
      queryStringParameters: { lat: 'invalid', lon: '123.456' }
    }

    const result = await handler(event as any, {} as any, {} as any)
    
    expect(result.statusCode).toBe(400)
    expect(JSON.parse(result.body!)).toHaveProperty('error')
  })

  it('returns 400 for invalid lon parameter', async () => {
    const event = {
      queryStringParameters: { lat: '45.678', lon: 'invalid' }
    }

    const result = await handler(event as any, {} as any, {} as any)
    
    expect(result.statusCode).toBe(400)
    expect(JSON.parse(result.body!)).toHaveProperty('error')
  })
})
