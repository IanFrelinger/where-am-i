import { test, expect } from '@playwright/test';
import { setupMockLocation, waitForMapToLoad, isMapLoaded } from './utils/mock-location';

test.describe('Debug Mock Location Implementation', () => {
  test('should verify mock location is working and investigate why map still fails', async ({ page }) => {
    // Set up mock location data
    await setupMockLocation(page);
    
    // Navigate to the page
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Wait a bit for the page to process
    await page.waitForTimeout(5000);
    
    console.log('=== MOCK LOCATION VERIFICATION ===');
    
    // First, verify that our mock location is actually working
    const mockLocationTest = await page.evaluate(async () => {
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
                isMock: position.coords.latitude === 40.7128 && position.coords.longitude === -74.0060
              });
            },
            (error) => {
              resolve({
                success: false,
                error: `Geolocation error: ${error.message} (code: ${error.code})`
              });
            },
            {
              enableHighAccuracy: false,
              timeout: 5000,
              maximumAge: 300000
            }
          );
        });
      } catch (error) {
        return { success: false, error: `Exception: ${error.message}` };
      }
    });
    
    console.log('Mock location test result:', mockLocationTest);
    
    // Check the current page state
    const pageState = await page.evaluate(() => {
      return {
        // Check for any error elements
        errorVisible: !!document.querySelector('.error'),
        errorText: document.querySelector('.error')?.textContent || '',
        loadingVisible: !!document.querySelector('.loading-container'),
        loadingText: document.querySelector('.loading-container')?.textContent || '',
        
        // Check for map elements
        hasMapElements: document.querySelectorAll('*[class*="map"]').length > 0,
        hasCanvas: document.querySelectorAll('canvas').length > 0,
        hasMapboxglMap: !!document.querySelector('.mapboxgl-map'),
        hasMapboxglCanvas: !!document.querySelector('.mapboxgl-canvas'),
        
        // Check for any location-related text
        bodyText: document.body.textContent?.substring(0, 1000) || '',
        
        // Check if there are any console errors or warnings
        consoleErrors: (window as any).consoleErrors || [],
        consoleWarnings: (window as any).consoleWarnings || []
      };
    });
    
    console.log('Page state after mock location:', pageState);
    
    // Check if there are any JavaScript errors preventing the map from loading
    const jsErrors = await page.evaluate(() => {
      const errors: string[] = [];
      
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
    
    // Check if the application is actually calling the geolocation API
    const geolocationCalls = await page.evaluate(() => {
      // Check if there are any geolocation-related function calls
      const functions = Object.getOwnPropertyNames(window);
      const geolocationRelated = functions.filter(name => 
        name.toLowerCase().includes('geo') || 
        name.toLowerCase().includes('location') ||
        name.toLowerCase().includes('position')
      );
      
      return {
        geolocationFunctions: geolocationRelated,
        hasNavigatorGeolocation: 'geolocation' in navigator,
        geolocationType: typeof navigator.geolocation
      };
    });
    
    console.log('Geolocation API status:', geolocationCalls);
    
    // Wait a bit more to see if anything changes
    await page.waitForTimeout(10000);
    
    // Check if the page state changed
    const updatedState = await page.evaluate(() => {
      return {
        errorVisible: !!document.querySelector('.error'),
        errorText: document.querySelector('.error')?.textContent || '',
        hasMapElements: document.querySelectorAll('*[class*="map"]').length > 0,
        hasCanvas: document.querySelectorAll('canvas').length > 0,
        hasMapboxglMap: !!document.querySelector('.mapboxgl-map'),
        bodyText: document.body.textContent?.substring(0, 500) || ''
      };
    });
    
    console.log('Updated state after longer wait:', updatedState);
    
    // Take a screenshot for visual inspection
    await page.screenshot({ path: 'test-results/debug-mock-location-verification.png', fullPage: true });
    
    // Don't fail the test - this is just for debugging
    expect(true).toBe(true);
  });

  test('should check if the application is actually using the geolocation API', async ({ page }) => {
    // Set up mock location data
    await setupMockLocation(page);
    
    // Add a listener to capture any geolocation API calls
    await page.addInitScript(() => {
      // Override the geolocation API to log calls
      const originalGeolocation = navigator.geolocation;
      
      Object.defineProperty(navigator, 'geolocation', {
        value: {
          getCurrentPosition: (successCallback: any, errorCallback: any, options: any) => {
            console.log('🔍 getCurrentPosition called with options:', options);
            
            // Call the original mock implementation
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
            
            setTimeout(() => {
              console.log('📍 Mock position returned:', mockPosition);
              successCallback(mockPosition);
            }, 100);
          },
          watchPosition: (successCallback: any, errorCallback: any, options: any) => {
            console.log('🔍 watchPosition called with options:', options);
            return 1; // Return a watch ID
          },
          clearWatch: (watchId: number) => {
            console.log('🔍 clearWatch called with ID:', watchId);
          }
        },
        writable: true,
        configurable: true
      });
      
      console.log('🔍 Enhanced mock geolocation API installed');
    });
    
    // Navigate to the page
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for the page to load and process
    await page.waitForTimeout(5000);
    
    console.log('=== GEOLOCATION API USAGE CHECK ===');
    
    // Check if the application made any geolocation calls
    const apiUsage = await page.evaluate(() => {
      return {
        // Check if there are any geolocation-related console logs
        consoleLogs: (window as any).consoleLogs || [],
        
        // Check if the application has any geolocation-related code
        hasGeolocationCode: document.body.innerHTML.includes('geolocation') || 
                           document.body.innerHTML.includes('getCurrentPosition') ||
                           document.body.innerHTML.includes('watchPosition'),
        
        // Check for any location-related functions
        locationFunctions: Object.getOwnPropertyNames(window).filter(name => 
          name.toLowerCase().includes('geo') || 
          name.toLowerCase().includes('location')
        )
      };
    });
    
    console.log('Geolocation API usage:', apiUsage);
    
    // Check the current page state
    const currentState = await page.evaluate(() => {
      return {
        errorVisible: !!document.querySelector('.error'),
        errorText: document.querySelector('.error')?.textContent || '',
        hasMapElements: document.querySelectorAll('*[class*="map"]').length > 0,
        hasCanvas: document.querySelectorAll('canvas').length > 0,
        hasMapboxglMap: !!document.querySelector('.mapboxgl-map'),
        bodyText: document.body.textContent?.substring(0, 500) || ''
      };
    });
    
    console.log('Current page state:', currentState);
    
    // Take a screenshot
    await page.screenshot({ path: 'test-results/debug-geolocation-api-usage.png', fullPage: true });
    
    // Don't fail the test - this is just for debugging
    expect(true).toBe(true);
  });

  test('should set up mock location before navigation to avoid timing issues', async ({ page }) => {
    // Grant geolocation permission first
    const context = page.context();
    await context.grantPermissions(['geolocation']);
    
    // Set up mock location BEFORE navigating
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
      
      // Override the geolocation API immediately
      Object.defineProperty(navigator, 'geolocation', {
        value: {
          getCurrentPosition: (successCallback: any, errorCallback: any, options: any) => {
            console.log('🔍 getCurrentPosition called BEFORE navigation with options:', options);
            
            // Return mock position immediately
            console.log('📍 Mock position returned BEFORE navigation:', mockPosition);
            successCallback(mockPosition);
          },
          watchPosition: (successCallback: any, errorCallback: any, options: any) => {
            console.log('🔍 watchPosition called BEFORE navigation with options:', options);
            
            // Return a watch ID
            const watchId = Math.floor(Math.random() * 1000000);
            
            // Return mock position immediately
            console.log('📍 Mock position returned via watch BEFORE navigation:', mockPosition);
            successCallback(mockPosition);
            
            return watchId;
          },
          clearWatch: (watchId: number) => {
            console.log('🔍 clearWatch called BEFORE navigation with ID:', watchId);
          }
        },
        writable: true,
        configurable: true
      });
      
      console.log('🔍 Mock geolocation API installed BEFORE navigation');
    });
    
    console.log('Mock location set up BEFORE navigation');
    
    // Now navigate to the page
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for the page to load and process
    await page.waitForTimeout(5000);
    
    console.log('=== PRE-NAVIGATION MOCK LOCATION TEST ===');
    
    // Check if the application made any geolocation calls
    const geolocationCalls = await page.evaluate(() => {
      // Check if there are any geolocation-related console logs
      const logs = [];
      if (console.log) {
        // Try to capture console logs
        const originalLog = console.log;
        console.log = (...args) => {
          logs.push(args.join(' '));
          originalLog.apply(console, args);
        };
      }
      
      return {
        logs: logs,
        hasGeolocation: 'geolocation' in navigator,
        geolocationType: typeof navigator.geolocation
      };
    });
    
    console.log('Geolocation calls check:', geolocationCalls);
    
    // Check the current page state
    const currentState = await page.evaluate(() => {
      return {
        errorVisible: !!document.querySelector('.error'),
        errorText: document.querySelector('.error')?.textContent || '',
        hasMapElements: document.querySelectorAll('*[class*="map"]').length > 0,
        hasCanvas: document.querySelectorAll('canvas').length > 0,
        hasMapboxglMap: !!document.querySelector('.mapboxgl-map'),
        bodyText: document.body.textContent?.substring(0, 500) || ''
      };
    });
    
    console.log('Current page state with pre-navigation mock:', currentState);
    
    // Take a screenshot
    await page.screenshot({ path: 'test-results/debug-pre-navigation-mock.png', fullPage: true });
    
    // Don't fail the test - this is just for debugging
    expect(true).toBe(true);
  });
});
