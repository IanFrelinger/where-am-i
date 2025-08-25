import { test, expect } from '@playwright/test';

test.describe('Debug Location Service Failure', () => {
  test('should investigate location service failure in detail', async ({ page }) => {
    // Grant location permission before navigating
    const context = page.context();
    await context.grantPermissions(['geolocation']);
    
    // Listen for console messages, errors, and network requests
    const consoleMessages: string[] = [];
    const consoleErrors: string[] = [];
    const networkErrors: string[] = [];
    
    page.on('console', msg => {
      consoleMessages.push(`${msg.type()}: ${msg.text()}`);
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    page.on('pageerror', error => {
      consoleErrors.push(`Page Error: ${error.message}`);
    });
    
    page.on('requestfailed', request => {
      networkErrors.push(`Failed Request: ${request.url()} - ${request.failure()?.errorText || 'Unknown error'}`);
    });
    
    // Navigate to the main page
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForLoadState('domcontentloaded');
    
    // Wait longer for location handling and any delayed errors
    await page.waitForTimeout(5000);
    
    console.log('=== LOCATION SERVICE DEBUG ===');
    console.log('Console messages:', consoleMessages);
    console.log('Console errors:', consoleErrors);
    console.log('Network errors:', networkErrors);
    
    // Check the current page state
    const pageState = await page.evaluate(() => {
      return {
        // Check if geolocation API is available
        geolocationAvailable: 'geolocation' in navigator,
        
        // Check if we're in a secure context (required for geolocation)
        isSecureContext: window.isSecureContext,
        
        // Check current page URL protocol
        protocol: window.location.protocol,
        
        // Check if there are any global errors
        globalError: (window as any).error,
        
        // Check for any location-related global variables
        hasLocationVars: {
          hasMap: !!(window as any).map,
          hasMapboxgl: !!(window as any).mapboxgl,
          hasGeolocation: !!(window as any).geolocation
        },
        
        // Check document ready state
        readyState: document.readyState,
        
        // Check for any error elements
        errorElements: {
          error: !!document.querySelector('.error'),
          errorText: document.querySelector('.error')?.textContent || '',
          loading: !!document.querySelector('.loading-container'),
          loadingText: document.querySelector('.loading-container')?.textContent || ''
        }
      };
    });
    
    console.log('Page state:', pageState);
    
    // Check if there are any location-related scripts or if they're failing
    const scriptStatus = await page.evaluate(() => {
      const scripts = Array.from(document.scripts);
      return {
        totalScripts: scripts.length,
                 externalScripts: scripts.filter(s => s.src).map(s => ({
           src: s.src,
           loaded: (s as any).complete,
           error: s.onerror ? 'Has error handler' : 'No error handler'
         })),
        inlineScripts: scripts.filter(s => !s.src).length
      };
    });
    
    console.log('Script status:', scriptStatus);
    
    // Check for any Mapbox-specific errors or missing dependencies
    const mapboxStatus = await page.evaluate(() => {
      try {
        // Check if Mapbox GL JS is loaded
        const mapboxgl = (window as any).mapboxgl;
        
        if (mapboxgl) {
          return {
            loaded: true,
            version: mapboxgl.version,
            accessToken: !!mapboxgl.accessToken,
            hasMap: typeof mapboxgl.Map === 'function'
          };
        } else {
          return {
            loaded: false,
            error: 'Mapbox GL JS not found in global scope'
          };
        }
      } catch (error) {
        return {
          loaded: false,
          error: `Error checking Mapbox: ${error.message}`
        };
      }
    });
    
    console.log('Mapbox status:', mapboxStatus);
    
    // Check for any geolocation API calls or errors
    const geolocationStatus = await page.evaluate(() => {
      try {
        // Check if geolocation is available
        if (!('geolocation' in navigator)) {
          return { available: false, error: 'Geolocation API not available' };
        }
        
        // Check if we're in a secure context
        if (!window.isSecureContext) {
          return { available: false, error: 'Not in secure context (HTTPS required)' };
        }
        
        return { 
          available: true, 
          secureContext: true,
          protocol: window.location.protocol
        };
      } catch (error) {
        return { available: false, error: `Error checking geolocation: ${error.message}` };
      }
    });
    
    console.log('Geolocation status:', geolocationStatus);
    
    // Check for any React/JavaScript errors in the application
    const appErrors = await page.evaluate(() => {
      const errorContainer = document.querySelector('.error');
      const loadingContainer = document.querySelector('.loading-container');
      
      return {
        errorVisible: !!errorContainer,
        errorText: errorContainer?.textContent || '',
        loadingVisible: !!loadingContainer,
        loadingText: loadingContainer?.textContent || '',
        bodyText: document.body.textContent?.substring(0, 500) || ''
      };
    });
    
    console.log('Application errors:', appErrors);
    
    // Take a screenshot for visual inspection
    await page.screenshot({ path: 'test-results/debug-location-service.png', fullPage: true });
    
    // Don't fail the test - this is just for debugging
    expect(true).toBe(true);
  });

  test('should try to manually trigger geolocation and see what happens', async ({ page }) => {
    // Grant location permission
    const context = page.context();
    await context.grantPermissions(['geolocation']);
    
    // Navigate to the page
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    console.log('=== MANUAL GEOLOCATION TEST ===');
    
    // Try to manually call the geolocation API
    const geolocationResult = await page.evaluate(async () => {
      try {
        if (!('geolocation' in navigator)) {
          return { success: false, error: 'Geolocation API not available' };
        }
        
        if (!window.isSecureContext) {
          return { success: false, error: 'Not in secure context' };
        }
        
        // Try to get current position
        return new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              resolve({
                success: true,
                coords: {
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                  accuracy: position.coords.accuracy
                }
              });
            },
            (error) => {
              resolve({
                success: false,
                error: `Geolocation error: ${error.message} (code: ${error.code})`
              });
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 60000
            }
          );
        });
      } catch (error) {
        return { success: false, error: `Exception: ${error.message}` };
      }
    });
    
    console.log('Manual geolocation result:', geolocationResult);
    
    // Wait a bit more to see if anything changes
    await page.waitForTimeout(5000);
    
    // Check if the page state changed after manual geolocation
    const updatedState = await page.evaluate(() => {
      return {
        errorVisible: !!document.querySelector('.error'),
        errorText: document.querySelector('.error')?.textContent || '',
        hasMapElements: document.querySelectorAll('*[class*="map"]').length > 0,
        hasCanvas: document.querySelectorAll('canvas').length > 0,
        hasMapboxglMap: !!document.querySelector('.mapboxgl-map')
      };
    });
    
    console.log('Updated state after manual geolocation:', updatedState);
    
    // Take another screenshot
    await page.screenshot({ path: 'test-results/debug-location-after-manual.png', fullPage: true });
    
    // Don't fail the test - this is just for debugging
    expect(true).toBe(true);
  });

  test('should check if there are any environment or configuration issues', async ({ page }) => {
    // Grant location permission
    const context = page.context();
    await context.grantPermissions(['geolocation']);
    
    // Navigate to the page
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    console.log('=== ENVIRONMENT CHECK ===');
    
    // Check environment variables and configuration
    const environmentInfo = await page.evaluate(() => {
      return {
        // Browser info
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        
        // Security context
        isSecureContext: window.isSecureContext,
        protocol: window.location.protocol,
        hostname: window.location.hostname,
        
        // Feature detection
        features: {
          geolocation: 'geolocation' in navigator,
          serviceWorker: 'serviceWorker' in navigator,
          localStorage: 'localStorage' in window,
          sessionStorage: 'sessionStorage' in window,
          indexedDB: 'indexedDB' in window
        },
        
        // Check for any global configuration
        globalConfig: {
          hasEnv: !!(window as any).ENV,
          hasConfig: !!(window as any).CONFIG,
          hasProcess: !!(window as any).process,
          hasNodeEnv: !!(window as any).process?.env?.NODE_ENV
        }
      };
    });
    
    console.log('Environment info:', environmentInfo);
    
         // Check if there are any missing environment variables or configuration
     const missingConfig = await page.evaluate(() => {
       const errors: string[] = [];
       
       // Check for common missing configuration
       if (!(window as any).mapboxgl) {
         errors.push('Mapbox GL JS not loaded');
       }
       
       // Check for any error messages in the DOM
       const errorElements = document.querySelectorAll('.error, [class*="error"], [id*="error"]');
       errorElements.forEach(el => {
         const text = el.textContent || '';
         if (text.includes('token') || text.includes('key') || text.includes('config')) {
           errors.push(`Configuration error: ${text}`);
         }
       });
       
       return errors;
     });
    
    console.log('Missing configuration:', missingConfig);
    
    // Check network requests to see if any are failing
    const networkStatus = await page.evaluate(() => {
      // Check if there are any failed image or script loads
      const images = Array.from(document.images);
      const scripts = Array.from(document.scripts);
      
      return {
        images: images.map(img => ({
          src: img.src,
          complete: img.complete,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight
        })),
                 scripts: scripts.map(script => ({
           src: script.src,
           complete: (script as any).complete,
           type: script.type
         }))
      };
    });
    
    console.log('Network status:', networkStatus);
    
    // Take a screenshot
    await page.screenshot({ path: 'test-results/debug-environment-check.png', fullPage: true });
    
    // Don't fail the test - this is just for debugging
    expect(true).toBe(true);
  });

  test('should try different geolocation strategies and mock location', async ({ page }) => {
    // Grant location permission
    const context = page.context();
    await context.grantPermissions(['geolocation']);
    
    // Try to set a mock geolocation position
    try {
      await context.addInitScript(() => {
        // Mock geolocation with a fixed position
         const mockPosition = {
           coords: {
             latitude: 38.836702359004654,
             longitude: -77.10348659698158,
             accuracy: 100,
             altitude: null,
             altitudeAccuracy: null,
             heading: null,
             speed: null
           },
           timestamp: Date.now()
         };
        
        // Override the geolocation API
        Object.defineProperty(navigator, 'geolocation', {
          value: {
            getCurrentPosition: (successCallback: any, errorCallback: any, options: any) => {
              // Simulate a small delay then return mock position
              setTimeout(() => {
                successCallback(mockPosition);
              }, 100);
            },
            watchPosition: (successCallback: any, errorCallback: any, options: any) => {
              // Return a watch ID
              const watchId = Math.floor(Math.random() * 1000000);
              setTimeout(() => {
                successCallback(mockPosition);
              }, 100);
              return watchId;
            },
            clearWatch: (watchId: number) => {
              // Clear the watch
            }
          },
          writable: true,
          configurable: true
        });
        
        console.log('Mock geolocation API installed');
      });
    } catch (error) {
      console.log('Could not install mock geolocation:', error);
    }
    
    // Navigate to the page
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for the page to load and handle the mock location
    await page.waitForTimeout(5000);
    
    console.log('=== MOCK LOCATION TEST ===');
    
    // Check if the mock location worked
    const mockLocationResult = await page.evaluate(async () => {
      try {
        if (!('geolocation' in navigator)) {
          return { success: false, error: 'Geolocation API not available' };
        }
        
        // Try to get current position with mock data
        return new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              resolve({
                success: true,
                coords: {
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                  accuracy: position.coords.accuracy
                },
                isMock: position.coords.latitude === 38.836702359004654 && position.coords.longitude === -77.10348659698158
              });
            },
            (error) => {
              resolve({
                success: false,
                error: `Geolocation error: ${error.message} (code: ${error.code})`
              });
            },
            {
              enableHighAccuracy: false, // Use low accuracy for faster response
              timeout: 5000, // Shorter timeout
              maximumAge: 300000 // 5 minutes cache
            }
          );
        });
      } catch (error) {
        return { success: false, error: `Exception: ${error.message}` };
      }
    });
    
    console.log('Mock location result:', mockLocationResult);
    
    // Wait a bit more to see if the application responds to the location
    await page.waitForTimeout(5000);
    
    // Check if the page state changed after getting location
    const updatedState = await page.evaluate(() => {
      return {
        errorVisible: !!document.querySelector('.error'),
        errorText: document.querySelector('.error')?.textContent || '',
        loadingVisible: !!document.querySelector('.loading-container'),
        loadingText: document.querySelector('.loading-container')?.textContent || '',
        hasMapElements: document.querySelectorAll('*[class*="map"]').length > 0,
        hasCanvas: document.querySelectorAll('canvas').length > 0,
        hasMapboxglMap: !!document.querySelector('.mapboxgl-map'),
        bodyText: document.body.textContent?.substring(0, 500) || ''
      };
    });
    
    console.log('Updated state after mock location:', updatedState);
    
    // Check if Mapbox GL JS is now available
    const mapboxStatus = await page.evaluate(() => {
      try {
        const mapboxgl = (window as any).mapboxgl;
        
        if (mapboxgl) {
          return {
            loaded: true,
            version: mapboxgl.version,
            accessToken: !!mapboxgl.accessToken,
            hasMap: typeof mapboxgl.Map === 'function'
          };
        } else {
          return {
            loaded: false,
            error: 'Mapbox GL JS still not found in global scope'
          };
        }
      } catch (error) {
        return {
          loaded: false,
          error: `Error checking Mapbox: ${error.message}`
        };
      }
    });
    
    console.log('Mapbox status after mock location:', mapboxStatus);
    
    // Take a screenshot
    await page.screenshot({ path: 'test-results/debug-mock-location.png', fullPage: true });
    
    // Don't fail the test - this is just for debugging
    expect(true).toBe(true);
  });
});
