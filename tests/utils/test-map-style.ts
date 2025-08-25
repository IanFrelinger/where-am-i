/**
 * Test map style utilities to avoid network/token dependencies
 */

export const TEST_MAP_STYLE = {
  "version": 8,
  "sources": {
    "osm-raster": {
      "type": "raster",
      "tiles": ["https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"],
      "tileSize": 256
    }
  },
  "layers": [
    { 
      "id": "osm", 
      "type": "raster", 
      "source": "osm-raster",
      "paint": {
        "raster-opacity": 0.8
      }
    }
  ]
};

/**
 * Injects the test map style into the page
 * This avoids requiring Mapbox tokens or external network access
 */
export async function injectTestMapStyle(page: any) {
  await page.addInitScript(() => {
    (window as any).__TEST_STYLE__ = {
      "version": 8,
      "sources": {
        "osm-raster": {
          "type": "raster",
          "tiles": ["https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"],
          "tileSize": 256
        }
      },
      "layers": [
        { 
          "id": "osm", 
          "type": "raster", 
          "source": "osm-raster",
          "paint": {
            "raster-opacity": 0.8
          }
        }
      ]
    };
    
    console.log('🗺️ Test map style injected - using OpenStreetMap tiles');
  });
}

/**
 * Waits for the map to be ready using the app's readiness signal
 * This is more reliable than waiting for vendor CSS classes
 */
export async function waitForMapReady(page: any, timeout: number = 15000) {
  try {
    // Wait for the app's map ready signal
    await page.waitForFunction(
      () => (window as any).__MAP_READY__ === true, 
      null, 
      { timeout }
    );
    
    console.log('✅ Map ready signal received');
    return true;
  } catch (error) {
    console.log('❌ Map ready signal not received within timeout:', error.message);
    return false;
  }
}

/**
 * Checks if the map is currently ready
 */
export async function isMapReady(page: any): Promise<boolean> {
  try {
    return await page.evaluate(() => (window as any).__MAP_READY__ === true);
  } catch (error) {
    console.log('Error checking map ready status:', error.message);
    return false;
  }
}

/**
 * Gets the map container element using a reliable selector
 */
export function getMapContainer(page: any) {
  return page.locator('[data-testid="map"], #map, .map-container').first();
}

/**
 * Gets the map canvas element
 */
export function getMapCanvas(page: any) {
  return page.locator('[data-testid="map"] canvas, #map canvas, .map-container canvas').first();
}
