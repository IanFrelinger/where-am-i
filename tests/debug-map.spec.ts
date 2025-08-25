import { test, expect } from '@playwright/test';

test.describe('Debug Map Structure', () => {
  test('should inspect page structure to find map elements', async ({ page }) => {
    // Navigate to the main page
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForLoadState('domcontentloaded');
    
    // Wait longer for any dynamic content and location handling
    await page.waitForTimeout(5000);
    
    // Get the page title
    const title = await page.title();
    console.log('Page title:', title);
    
    // Check for location permission errors
    const locationError = await page.locator('.error').isVisible();
    console.log('Location error visible:', locationError);
    
    if (locationError) {
      const errorText = await page.locator('.error').textContent();
      console.log('Error text:', errorText);
    }
    
    // Check for loading states
    const loadingContainer = await page.locator('.loading-container').isVisible();
    console.log('Loading container visible:', loadingContainer);
    
    // Get all elements with class names containing 'map'
    const mapElements = await page.evaluate(() => {
      const elements = document.querySelectorAll('*[class*="map"]');
      return Array.from(elements).map(el => ({
        tagName: el.tagName,
        className: el.className,
        id: el.id,
        textContent: el.textContent?.substring(0, 100) || '',
        visible: el.offsetWidth > 0 && el.offsetHeight > 0
      }));
    });
    
    console.log('Elements with "map" in class name:', mapElements);
    
    // Get all div elements to see the structure
    const allDivs = await page.evaluate(() => {
      const divs = document.querySelectorAll('div');
      return Array.from(divs).map(div => ({
        tagName: div.tagName,
        className: div.className,
        id: div.id,
        textContent: div.textContent?.substring(0, 100) || '',
        visible: div.offsetWidth > 0 && div.offsetHeight > 0,
        children: div.children.length
      }));
    });
    
    console.log('All div elements:', allDivs);
    
    // Look for any canvas elements
    const canvasElements = await page.evaluate(() => {
      const canvases = document.querySelectorAll('canvas');
      return Array.from(canvases).map(canvas => ({
        width: canvas.width,
        height: canvas.height,
        className: canvas.className,
        id: canvas.id,
        visible: canvas.offsetWidth > 0 && canvas.offsetHeight > 0
      }));
    });
    
    console.log('Canvas elements:', canvasElements);
    
    // Look for Mapbox-specific elements
    const mapboxElements = await page.evaluate(() => {
      const mapboxglMap = document.querySelector('.mapboxgl-map');
      const mapboxglCanvas = document.querySelector('.mapboxgl-canvas');
      const mapboxglContainer = document.querySelector('.mapboxgl-canvas-container');
      
      return {
        hasMapboxglMap: !!mapboxglMap,
        hasMapboxglCanvas: !!mapboxglCanvas,
        hasMapboxglContainer: !!mapboxglContainer,
        mapboxglMapClass: mapboxglMap?.className || '',
        mapboxglCanvasClass: mapboxglCanvas?.className || '',
        mapboxglContainerClass: mapboxglContainer?.className || ''
      };
    });
    
    console.log('Mapbox elements:', mapboxElements);
    
    // Look for any elements that might be the map container
    const potentialMapContainers = await page.evaluate(() => {
      const selectors = [
        '.map-container',
        '.map',
        '#map',
        '[data-testid*="map"]',
        '[class*="mapbox"]',
        '[class*="leaflet"]'
      ];
      
      const results = {};
      selectors.forEach(selector => {
        try {
          const element = document.querySelector(selector);
          results[selector] = {
            found: !!element,
            className: element?.className || '',
            id: element?.id || '',
            visible: element ? (element.offsetWidth > 0 && element.offsetHeight > 0) : false
          };
        } catch (e) {
          results[selector] = { found: false, error: e.message };
        }
      });
      
      return results;
    });
    
    console.log('Potential map containers:', potentialMapContainers);
    
    // Check for any buttons or interactive elements
    const buttons = await page.evaluate(() => {
      const buttonElements = document.querySelectorAll('button');
      return Array.from(buttonElements).map(btn => ({
        text: btn.textContent,
        className: btn.className,
        id: btn.id,
        visible: btn.offsetWidth > 0 && btn.offsetHeight > 0
      }));
    });
    
    console.log('Buttons found:', buttons);
    
    // Get the body content to see what's actually rendered
    const bodyContent = await page.evaluate(() => {
      return {
        innerHTML: document.body.innerHTML.substring(0, 2000),
        textContent: document.body.textContent?.substring(0, 500) || ''
      };
    });
    
    console.log('Body content preview:', bodyContent.textContent);
    
    // Check console for any errors
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      consoleMessages.push(`${msg.type()}: ${msg.text()}`);
    });
    
    // Wait a bit more to capture console messages
    await page.waitForTimeout(2000);
    
    console.log('Console messages:', consoleMessages);
    
    // Take a screenshot for visual inspection
    await page.screenshot({ path: 'test-results/debug-map-structure.png', fullPage: true });
    
    // Don't fail the test - this is just for debugging
    expect(true).toBe(true);
  });

  test('should try to grant location permission and see if map appears', async ({ page }) => {
    // Grant location permission before navigating
    const context = page.context();
    await context.grantPermissions(['geolocation']);
    
    // Navigate to the main page
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForLoadState('domcontentloaded');
    
    // Wait longer for location handling and map initialization
    await page.waitForTimeout(5000);
    
    console.log('After granting location permission...');
    
    // Check if the error is still there
    const locationError = await page.locator('.error').isVisible();
    console.log('Location error still visible:', locationError);
    
    // Check for map elements again
    const mapElements = await page.evaluate(() => {
      const elements = document.querySelectorAll('*[class*="map"]');
      return Array.from(elements).map(el => ({
        tagName: el.tagName,
        className: el.className,
        id: el.id,
        textContent: el.textContent?.substring(0, 100) || '',
        visible: el.offsetWidth > 0 && el.offsetHeight > 0
      }));
    });
    
    console.log('Map elements after location permission:', mapElements);
    
    // Check for any new divs that might have appeared
    const allDivs = await page.evaluate(() => {
      const divs = document.querySelectorAll('div');
      return Array.from(divs).map(div => ({
        tagName: div.tagName,
        className: div.className,
        id: div.id,
        textContent: div.textContent?.substring(0, 100) || '',
        visible: div.offsetWidth > 0 && div.offsetHeight > 0,
        children: div.children.length
      }));
    });
    
    console.log('All divs after location permission:', allDivs);
    
    // Take another screenshot
    await page.screenshot({ path: 'test-results/debug-map-with-permission.png', fullPage: true });
    
    // Don't fail the test - this is just for debugging
    expect(true).toBe(true);
  });

  test('should try clicking the Try Again button to see if map appears', async ({ page }) => {
    // Grant location permission before navigating
    const context = page.context();
    await context.grantPermissions(['geolocation']);
    
    // Navigate to the main page
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for the error to appear
    await page.waitForTimeout(2000);
    
    // Check if the Try Again button is visible
    const tryAgainButton = page.locator('button:has-text("Try Again")');
    const buttonVisible = await tryAgainButton.isVisible();
    console.log('Try Again button visible:', buttonVisible);
    
    if (buttonVisible) {
      console.log('Clicking Try Again button...');
      
      // Click the Try Again button
      await tryAgainButton.click();
      
      // Wait for potential changes
      await page.waitForTimeout(10000);
      
      console.log('After clicking Try Again...');
      
      // Check if the error is still there
      const locationError = await page.locator('.error').isVisible();
      console.log('Location error still visible:', locationError);
      
      // Check for map elements again
      const mapElements = await page.evaluate(() => {
        const elements = document.querySelectorAll('*[class*="map"]');
        return Array.from(elements).map(el => ({
          tagName: el.tagName,
          className: el.className,
          id: el.id,
          textContent: el.textContent?.substring(0, 100) || '',
          visible: el.offsetWidth > 0 && el.offsetHeight > 0
        }));
      });
      
      console.log('Map elements after clicking Try Again:', mapElements);
      
      // Check for any new divs that might have appeared
      const allDivs = await page.evaluate(() => {
        const divs = document.querySelectorAll('div');
        return Array.from(divs).map(div => ({
          tagName: div.tagName,
          className: div.className,
          id: div.id,
          textContent: div.textContent?.substring(0, 100) || '',
          visible: div.offsetWidth > 0 && div.offsetHeight > 0,
          children: div.children.length
        }));
      });
      
      console.log('All divs after clicking Try Again:', allDivs);
      
      // Check for any canvas elements
      const canvasElements = await page.evaluate(() => {
        const canvases = document.querySelectorAll('canvas');
        return Array.from(canvases).map(canvas => ({
          width: canvas.width,
          height: canvas.height,
          className: canvas.className,
          id: canvas.id,
          visible: canvas.offsetWidth > 0 && canvas.offsetHeight > 0
        }));
      });
      
      console.log('Canvas elements after clicking Try Again:', canvasElements);
      
      // Take another screenshot
      await page.screenshot({ path: 'test-results/debug-map-after-try-again.png', fullPage: true });
    }
    
    // Don't fail the test - this is just for debugging
    expect(true).toBe(true);
  });
});
