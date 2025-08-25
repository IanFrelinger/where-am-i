import { test as base } from '@playwright/test';

export const test = base.extend<{
  mockCoords: { latitude: number; longitude: number; accuracy?: number };
}>({
  // Default DC-ish coords
  mockCoords: [{ latitude: 38.836702359004654, longitude: -77.10348659698158, accuracy: 5 }, { scope: 'test' }],

  context: async ({ browser, mockCoords }, use) => {
    const context = await browser.newContext({
      permissions: ['geolocation'],
      geolocation: {
        latitude: mockCoords.latitude,
        longitude: mockCoords.longitude,
        accuracy: mockCoords.accuracy ?? 5
      }
    });

    // Robust polyfill for both getCurrentPosition and watchPosition
    await context.addInitScript((coords) => {
      const successPayload = () => ({
        coords: {
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy ?? 5,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null
        },
        timestamp: Date.now()
      });

      const watchers = new Map<number, (p: any) => void>();
      let nextId = 1;

      Object.defineProperty(navigator, 'geolocation', {
        configurable: true,
        value: {
          getCurrentPosition: (success: PositionCallback, _error?: PositionErrorCallback, _opts?: PositionOptions) => {
            try { 
              console.log('🔍 getCurrentPosition called - returning mock position immediately');
              success(successPayload() as any); 
            } catch (e) {
              console.error('Error in mock getCurrentPosition:', e);
            }
          },
          watchPosition: (success: PositionCallback, _error?: PositionErrorCallback, _opts?: PositionOptions) => {
            const id = nextId++;
            watchers.set(id, success as any);
            console.log(`🔍 watchPosition called - returning mock position immediately with ID: ${id}`);
            // Immediately emit one reading so apps that rely on watch get data
            try { 
              (success as any)(successPayload()); 
            } catch (e) {
              console.error('Error in mock watchPosition:', e);
            }
            return id;
          },
          clearWatch: (id: number) => { 
            console.log(`🔍 clearWatch called with ID: ${id}`);
            watchers.delete(id); 
          }
        }
      });

      console.log(`🔍 Robust geolocation mock installed with coordinates: ${coords.latitude}, ${coords.longitude}`);
    }, { latitude: mockCoords.latitude, longitude: mockCoords.longitude, accuracy: mockCoords.accuracy });

    await use(context);
    await context.close();
  },
});

export const expect = test.expect;
