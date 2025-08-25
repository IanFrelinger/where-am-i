import { test, expect } from './fixtures/geolocation';
import { injectTestMapStyle } from './utils/test-map-style';

test.describe('Debug Application State', () => {
  test('should investigate why the map ready signal is not being emitted', async ({ page }) => {
    // Inject test map style
    await injectTestMapStyle(page);
    
    // Navigate to the page
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Wait a bit for the application to load
    await page.waitForTimeout(5000);
    
    console.log('=== APPLICATION STATE INVESTIGATION ===');
    
    // Check the current page state
    const pageState = await page.evaluate(() => {
      return {
        // Check for any error elements
        errorVisible: !!document.querySelector('.error'),
        errorText: document.querySelector('.error')?.textContent || '',
        loadingVisible: !!document.querySelector('.loading-container'),
        loadingText: document.querySelector('.loading-container')?.textContent || '',
        
        // Check for map elements
        hasMapElements: document.querySelectorAll('[data-testid="map"], .map-container, .enhanced-map').length > 0,
        hasCanvas: document.querySelectorAll('canvas').length > 0,
        hasMapboxglMap: !!document.querySelector('.mapboxgl-map'),
        
        // Check for any location-related text
        bodyText: document.body.textContent?.substring(0, 1000) || '',
        
        // Check if our test style was injected
        hasTestStyle: !!(window as any).__TEST_STYLE__,
        testStyleType: typeof (window as any).__TEST_STYLE__,
        
        // Check if the map ready signal exists
        hasMapReady: !!(window as any).__MAP_READY__,
        mapReadyValue: (window as any).__MAP_READY__,
        
        // Check for any console errors
        consoleErrors: (window as any).consoleErrors || [],
        
        // Check if geolocation was called
        geolocationCalled: false, // We'll check this separately
      };
    });
    
    console.log('Page state:', pageState);
    
    // Check if geolocation was actually called
    const geolocationStatus = await page.evaluate(() => {
      // Check if there are any geolocation-related console logs
      const logs = [];
      if (console.log) {
        // Try to capture any geolocation-related logs
        const originalLog = console.log;
        console.log = (...args) => {
          const logText = args.join(' ');
          if (logText.includes('geo') || logText.includes('location') || logText.includes('map')) {
            logs.push(logText);
          }
          originalLog.apply(console, args);
        };
      }
      
      return {
        logs: logs,
        hasGeolocation: 'geolocation' in navigator,
        geolocationType: typeof navigator.geolocation
      };
    });
    
    console.log('Geolocation status:', geolocationStatus);
    
    // Check if the application is actually trying to get location
    const locationAttempts = await page.evaluate(() => {
      // Look for any location-related elements or text
      const body = document.body;
      const text = body.textContent || '';
      
      return {
        hasLocationText: text.includes('location') || text.includes('Location'),
        hasErrorText: text.includes('error') || text.includes('Error') || text.includes('failed'),
        hasLoadingText: text.includes('loading') || text.includes('Loading') || text.includes('Getting'),
        hasWelcomeText: text.includes('welcome') || text.includes('Welcome') || text.includes('Click'),
        hasMapText: text.includes('map') || text.includes('Map'),
        hasWhereAmIText: text.includes('where') || text.includes('Where'),
        hasCoordinates: text.includes('38.') || text.includes('-77.') || text.includes('DC') || text.includes('Washington')
      };
    });
    
    console.log('Location attempts:', locationAttempts);
    
    // Check if there are any JavaScript errors preventing the map from loading
    const jsErrors = await page.evaluate(() => {
      const errors = [];
      
      // Check for common JavaScript errors
      if (!(window as any).mapboxgl) {
        errors.push('Mapbox GL JS not loaded');
      }
      
      // Check for any global error objects
      if ((window as any).error) {
        errors.push(`Global error: ${(window as any).error}`);
      }
      
      // Check for any unhandled promise rejections
      if ((window as any).unhandledRejection) {
        errors.push(`Unhandled rejection: ${(window as any).unhandledRejection}`);
      }
      
      return errors;
    });
    
    console.log('JavaScript errors:', jsErrors);
    
    // Take a screenshot for visual inspection
    await page.screenshot({ path: 'test-results/debug-app-state.png', fullPage: true });
    
    // Don't fail the test - this is just for debugging
    expect(true).toBe(true);
  });
});
