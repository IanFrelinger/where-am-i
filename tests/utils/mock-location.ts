/**
 * Utility function to mock geolocation data for Playwright tests
 * This solves the issue where the map doesn't load due to geolocation timeouts
 */

export interface MockLocationOptions {
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

export const DEFAULT_MOCK_LOCATION = {
  latitude: 38.836702359004654, // Washington, DC area
  longitude: -77.10348659698158,
  accuracy: 100,
  enableHighAccuracy: false,
  timeout: 1000,
  maximumAge: 300000 // 5 minutes
};

/**
 * Sets up mock geolocation data for a Playwright page
 * @param page - The Playwright page object
 * @param options - Optional custom location data
 */
export async function setupMockLocation(
  page: any, 
  options: MockLocationOptions = {}
) {
  const config = { ...DEFAULT_MOCK_LOCATION, ...options };
  
  // Grant geolocation permission first
  const context = page.context();
  await context.grantPermissions(['geolocation']);
  
  // Add mock geolocation script with enhanced implementation
  await context.addInitScript(() => {
    // Mock geolocation with the specified position
    const mockPosition = {
      coords: {
        latitude: config.latitude,
        longitude: config.longitude,
        accuracy: config.accuracy,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null
      },
      timestamp: Date.now()
    };
    
    // Enhanced geolocation API override with immediate response
    Object.defineProperty(navigator, 'geolocation', {
      value: {
        getCurrentPosition: (successCallback: any, errorCallback: any, options: any) => {
          console.log('🔍 getCurrentPosition called with options:', options);
          
          // Return mock position immediately (no delay)
          console.log('📍 Mock position returned immediately:', mockPosition);
          successCallback(mockPosition);
        },
        watchPosition: (successCallback: any, errorCallback: any, options: any) => {
          console.log('🔍 watchPosition called with options:', options);
          
          // Return a watch ID
          const watchId = Math.floor(Math.random() * 1000000);
          
          // Return mock position immediately
          console.log('📍 Mock position returned via watch immediately:', mockPosition);
          successCallback(mockPosition);
          
          return watchId;
        },
        clearWatch: (watchId: number) => {
          console.log('🔍 clearWatch called with ID:', watchId);
          // Clear the watch
        }
      },
      writable: true,
      configurable: true
    });
    
    console.log(`🔍 Enhanced mock geolocation API installed with coordinates: ${config.latitude}, ${config.longitude}`);
  });
  
  // Wait a moment to ensure the mock is set up
  await page.waitForTimeout(100);
  
  console.log(`Mock location set up: ${config.latitude}, ${config.longitude}`);
}

/**
 * Sets up mock geolocation with a specific city's coordinates
 * @param page - The Playwright page object
 * @param city - City name for predefined coordinates
 */
export async function setupMockLocationByCity(page: any, city: string) {
  const cityCoordinates: Record<string, { latitude: number; longitude: number }> = {
    'washington-dc': { latitude: 38.836702359004654, longitude: -77.10348659698158 },
    'new-york': { latitude: 40.7128, longitude: -74.0060 },
    'london': { latitude: 51.5074, longitude: -0.1278 },
    'tokyo': { latitude: 35.6762, longitude: 139.6503 },
    'sydney': { latitude: -33.8688, longitude: 151.2093 },
    'san-francisco': { latitude: 37.7749, longitude: -122.4194 },
    'paris': { latitude: 48.8566, longitude: 2.3522 },
    'berlin': { latitude: 52.5200, longitude: 13.4050 },
    'mumbai': { latitude: 19.0760, longitude: 72.8777 },
    'beijing': { latitude: 39.9042, longitude: 116.4074 },
    'cairo': { latitude: 30.0444, longitude: 31.2357 }
  };
  
  const coords = cityCoordinates[city.toLowerCase()];
  if (!coords) {
    throw new Error(`Unknown city: ${city}. Available cities: ${Object.keys(cityCoordinates).join(', ')}`);
  }
  
  await setupMockLocation(page, coords);
}

/**
 * Waits for the map to load after setting up mock location
 * @param page - The Playwright page object
 * @param timeout - Maximum time to wait in milliseconds
 */
export async function waitForMapToLoad(page: any, timeout: number = 10000) {
  try {
    // Wait for map elements to appear
    await page.waitForSelector('.mapboxgl-map', { timeout });
    await page.waitForSelector('canvas', { timeout });
    
    console.log('Map loaded successfully!');
    return true;
  } catch (error) {
    console.log('Map failed to load within timeout:', error.message);
    return false;
  }
}

/**
 * Checks if the map is currently loaded and visible
 * @param page - The Playwright page object
 */
export async function isMapLoaded(page: any): Promise<boolean> {
  try {
    const mapElements = await page.evaluate(() => {
      return {
        hasMapboxglMap: !!document.querySelector('.mapboxgl-map'),
        hasCanvas: !!document.querySelector('canvas'),
        hasMapContainer: !!document.querySelector('.map-container') || !!document.querySelector('.mapboxgl-canvas-container')
      };
    });
    
    return mapElements.hasMapboxglMap && mapElements.hasCanvas;
  } catch (error) {
    console.log('Error checking map status:', error.message);
    return false;
  }
}
