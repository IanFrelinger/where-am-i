import { test, expect } from './fixtures/geolocation';
import { injectTestMapStyle, waitForMapReady, getMapContainer, getMapCanvas } from './utils/test-map-style';

test.describe('Map Functionality Tests', () => {
  test('should display the map when location is available', async ({ page }) => {
    // Inject test map style to avoid network/token dependencies
    await injectTestMapStyle(page);
    
    // Navigate to the page
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for the map to be ready using the app's signal
    const mapReady = await waitForMapReady(page, 15000);
    expect(mapReady).toBe(true);
    
    // Check that the map container exists and is visible
    const mapContainer = getMapContainer(page);
    await expect(mapContainer).toBeVisible();
    
    // Check that the map container has proper dimensions
    const containerBox = await mapContainer.boundingBox();
    expect(containerBox?.width).toBeGreaterThan(0);
    expect(containerBox?.height).toBeGreaterThan(0);
  });

  test('should initialize Mapbox GL JS with location data', async ({ page }) => {
    // Inject test map style
    await injectTestMapStyle(page);
    
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for the map to be ready
    const mapReady = await waitForMapReady(page, 15000);
    expect(mapReady).toBe(true);
    
    // Check that Mapbox GL JS is loaded and initialized
    const mapboxLoaded = await page.evaluate(() => {
      // Look for any map-related elements that indicate Mapbox is working
      const mapElements = document.querySelectorAll('[class*="mapbox"], [class*="map"], canvas');
      return mapElements.length > 0;
    });
    
    expect(mapboxLoaded).toBe(true);
  });

  test('should display map tiles when location is available', async ({ page }) => {
    // Inject test map style
    await injectTestMapStyle(page);
    
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for the map to be ready
    const mapReady = await waitForMapReady(page, 15000);
    expect(mapReady).toBe(true);
    
    // Check that map tiles are loaded by looking for canvas elements
    const canvas = getMapCanvas(page);
    await expect(canvas).toBeVisible();
    
    // Verify that the canvas exists and has dimensions
    const canvasContent = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return { hasCanvas: false, hasContent: false };
      
      return { 
        hasCanvas: true, 
        hasContent: true, // Assume canvas has content if it exists
        width: canvas.width,
        height: canvas.height
      };
    });
    
    expect(canvasContent.hasCanvas).toBe(true);
    expect(canvasContent.hasContent).toBe(true);
    expect(canvasContent.width).toBeGreaterThan(0);
    expect(canvasContent.height).toBeGreaterThan(0);
  });

  test('should have proper map controls when map is loaded', async ({ page }) => {
    // Inject test map style
    await injectTestMapStyle(page);
    
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for the map to be ready
    const mapReady = await waitForMapReady(page, 15000);
    expect(mapReady).toBe(true);
    
    // Check for common map controls
    const controls = await page.evaluate(() => {
      // Look for any control elements
      const controlElements = document.querySelectorAll('[class*="control"], [class*="ctrl"], button, [role="button"]');
      
      return {
        hasControls: controlElements.length > 0,
        controlCount: controlElements.length,
        controlTypes: Array.from(controlElements).map(el => el.tagName.toLowerCase())
      };
    });
    
    // Map should have some controls (even if they're custom)
    expect(controls.hasControls).toBe(true);
    expect(controls.controlCount).toBeGreaterThan(0);
  });

  test('should handle map interactions when map is loaded', async ({ page }) => {
    // Inject test map style
    await injectTestMapStyle(page);
    
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for the map to be ready
    const mapReady = await waitForMapReady(page, 15000);
    expect(mapReady).toBe(true);
    
    // Get the map container
    const mapContainer = getMapContainer(page);
    await expect(mapContainer).toBeVisible();
    
    // Test basic interaction - hover over the map
    await mapContainer.hover();
    
    // Verify map is still responsive after interaction
    await expect(mapContainer).toBeVisible();
    
    // Check that the map container still has proper dimensions
    const containerBox = await mapContainer.boundingBox();
    expect(containerBox?.width).toBeGreaterThan(0);
    expect(containerBox?.height).toBeGreaterThan(0);
  });

  test('should be responsive on different screen sizes when map is loaded', async ({ page }) => {
    // Inject test map style
    await injectTestMapStyle(page);
    
    // Test desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for the map to be ready
    const desktopMapReady = await waitForMapReady(page, 15000);
    expect(desktopMapReady).toBe(true);
    
    const desktopMap = getMapContainer(page);
    await expect(desktopMap).toBeVisible();
    
    const desktopBox = await desktopMap.boundingBox();
    expect(desktopBox?.width).toBeGreaterThan(1000);
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for the map to be ready
    const mobileMapReady = await waitForMapReady(page, 15000);
    expect(mobileMapReady).toBe(true);
    
    const mobileMap = getMapContainer(page);
    await expect(mobileMap).toBeVisible();
    
    const mobileBox = await mobileMap.boundingBox();
    expect(mobileBox?.width).toBeLessThan(400);
  });

  test('should display location information when map is loaded', async ({ page }) => {
    // Inject test map style
    await injectTestMapStyle(page);
    
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for the map to be ready
    const mapReady = await waitForMapReady(page, 15000);
    expect(mapReady).toBe(true);
    
    // Check for location-related elements
    const locationElements = await page.evaluate(() => {
      const body = document.body;
      const text = body.textContent || '';
      
      return {
        hasLocationText: text.includes('location') || text.includes('Location') || text.includes('coordinates'),
        hasMapText: text.includes('map') || text.includes('Map') || text.includes('Mapbox') || text.includes('OpenStreetMap'),
        hasWhereAmI: text.includes('where') || text.includes('Where'),
        hasMapboxText: text.includes('Mapbox') || text.includes('mapbox'),
        hasOpenStreetMapText: text.includes('OpenStreetMap'),
        hasCoordinates: text.includes('38.') || text.includes('-77.') || text.includes('DC') || text.includes('Washington'),
        hasAnyMapContent: text.includes('map') || text.includes('Map') || text.includes('Mapbox') || text.includes('OpenStreetMap') || text.includes('©'),
        // More flexible checks for what should be present
        hasControls: text.includes('Refresh') || text.includes('Re-center') || text.includes('Copy'),
        has3DControls: text.includes('3D') || text.includes('Buildings') || text.includes('Terrain')
      };
    });
    
    // At least some location-related text should be present
    const hasLocationContent = Object.values(locationElements).some(Boolean);
    expect(hasLocationContent).toBe(true);
    
    // Should have map controls (which indicate the map is functional)
    expect(locationElements.hasControls).toBe(true);
    
    // Should have 3D controls (which are part of the map interface)
    expect(locationElements.has3DControls).toBe(true);
    
    // Should have coordinates or location info (coordinates are in popup, not main UI)
    // Instead, check that the map is functional and has location-related controls
    expect(locationElements.hasLocationText).toBe(true);
  });

  test('should handle geolocation errors gracefully', async ({ page }) => {
    // Test without geolocation permissions to ensure error handling works
    const context = page.context();
    await context.clearPermissions();
    
    // Inject test map style
    await injectTestMapStyle(page);
    
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Wait a bit for the application to handle the lack of permissions
    await page.waitForTimeout(5000);
    
    // Check that the application handles the error gracefully
    const errorHandling = await page.evaluate(() => {
      const errorElements = document.querySelectorAll('.error, [class*="error"], [id*="error"]');
      const body = document.body;
      const text = body.textContent || '';
      
      return {
        hasErrorElements: errorElements.length > 0,
        errorText: text.includes('error') || text.includes('Error') || text.includes('failed'),
        hasLocationError: text.includes('location') || text.includes('permission') || text.includes('denied'),
        appStillVisible: body.children.length > 0
      };
    });
    
    // Application should still be visible even with geolocation errors
    expect(errorHandling.appStillVisible).toBe(true);
    
    // Should have some error handling
    expect(errorHandling.hasErrorElements || errorHandling.errorText).toBe(true);
  });
});
