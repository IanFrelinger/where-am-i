const { chromium } = require('playwright');

async function debugFrontend() {
  console.log('🎭 Starting Playwright debugging session...');
  
  const browser = await chromium.launch({ 
    headless: false, // Show browser for debugging
    slowMo: 1000, // Slow down actions for visibility
    timeout: 30000 // 30 second timeout for browser launch
  });
  
  const context = await browser.newContext({
    // Enable geolocation permissions
    permissions: ['geolocation'],
    // Set a mock location for testing
    geolocation: { longitude: -74.0060, latitude: 40.7128 },
    // Enable console logging
    logger: {
      isEnabled: (name, severity) => true,
      log: (name, severity, message, args) => {
        console.log(`[${name}] ${severity}: ${message}`);
        if (args.length > 0) console.log('Args:', args);
      }
    }
  });

  const page = await context.newPage();
  
  // Listen to console messages
  page.on('console', msg => {
    console.log(`📱 Console: ${msg.type()}: ${msg.text()}`);
  });

  // Listen to page errors
  page.on('pageerror', error => {
    console.error(`❌ Page Error: ${error.message}`);
  });

  // Listen to API requests
  page.on('request', request => {
    console.log(`🌐 Request: ${request.method()} ${request.url()}`);
  });

  // Listen to API responses
  page.on('response', response => {
    console.log(`📡 Response: ${response.status()} ${response.url()}`);
    if (response.status() >= 400) {
      console.error(`❌ Error Response: ${response.status()} ${response.url()}`);
    }
  });

  try {
    console.log('🔍 Navigating to your deployed app...');
    await page.goto('https://d1pxtwdttqrk2p.cloudfront.net');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    console.log('✅ Page loaded successfully');
    
    // Check if there are any JavaScript errors
    const errors = await page.evaluate(() => {
      return window.errors || [];
    });
    
    if (errors.length > 0) {
      console.log('⚠️ JavaScript errors found:', errors);
    }
    
    // Wait a bit for any geolocation requests
    console.log('⏳ Waiting for geolocation and API calls...');
    await page.waitForTimeout(5000);
    
    // Check the current page state
    const pageState = await page.evaluate(() => {
      return {
        title: document.title,
        hasMap: !!document.querySelector('[data-testid="map"]') || !!document.querySelector('.mapboxgl-map'),
        hasError: !!document.querySelector('.error'),
        hasLoading: !!document.querySelector('.loading'),
        hasLocation: !!document.querySelector('[data-testid="location"]') || !!document.querySelector('.location'),
        consoleErrors: window.errors || [],
        localStorage: Object.keys(localStorage),
        sessionStorage: Object.keys(sessionStorage)
      };
    });
    
    console.log('📊 Page State:', pageState);
    
    // Check if geolocation permission was granted
    const geolocationPermission = await page.evaluate(async () => {
      try {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        return result.state;
      } catch (e) {
        return 'error: ' + e.message;
      }
    });
    
    console.log('📍 Geolocation Permission:', geolocationPermission);
    
    // Try to trigger geolocation manually
    console.log('🎯 Attempting to trigger geolocation...');
    try {
      await page.evaluate(() => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              console.log('✅ Geolocation success:', position.coords);
              window.geolocationResult = position;
            },
            (error) => {
              console.error('❌ Geolocation error:', error);
              window.geolocationError = error;
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
          );
        } else {
          console.error('❌ Geolocation not supported');
        }
      });
      
      // Wait for geolocation result
      await page.waitForTimeout(3000);
      
      const geolocationResult = await page.evaluate(() => {
        return {
          success: window.geolocationResult || null,
          error: window.geolocationError || null
        };
      });
      
      if (geolocationResult.success) {
        console.log('✅ Geolocation successful:', geolocationResult.success.coords);
      } else if (geolocationResult.error) {
        console.error('❌ Geolocation failed:', geolocationResult.error);
      }
      
    } catch (e) {
      console.error('❌ Error testing geolocation:', e);
    }
    
    // Check for any API calls that might have been made
    console.log('🔍 Checking for API calls...');
    const apiCalls = await page.evaluate(() => {
      return window.apiCalls || [];
    });
    
    if (apiCalls.length > 0) {
      console.log('📡 API calls made:', apiCalls);
    }
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'debug-screenshot.png', fullPage: true });
    console.log('📸 Screenshot saved as debug-screenshot.png');
    
    // Check the HTML content for any error messages
    const errorElements = await page.$$('.error, [data-testid="error"], .alert, .message');
    for (const element of errorElements) {
      const text = await element.textContent();
      console.log('⚠️ Error element found:', text?.trim());
    }
    
    // Check for any loading states
    const loadingElements = await page.$$('.loading, [data-testid="loading"]');
    if (loadingElements.length > 0) {
      console.log('⏳ Loading elements found:', loadingElements.length);
    }
    
    console.log('🎉 Debugging session completed!');
    
  } catch (error) {
    console.error('❌ Debugging failed:', error);
  } finally {
    // Keep browser open for manual inspection with timeout
    console.log('🔍 Browser will stay open for manual inspection. Will auto-close in 30 seconds.');
    await new Promise((resolve) => {
      setTimeout(() => {
        console.log('⏰ Timeout reached, closing browser...');
        resolve();
      }, 30000); // 30 second timeout
    });
  }
}

// Run the debugging session
debugFrontend().catch(console.error);
