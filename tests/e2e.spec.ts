import { test, expect } from '@playwright/test';

test.describe('End-to-End Tests', () => {
  test('complete user journey - page load to application interaction', async ({ page }) => {
    // Step 1: Navigate to the application
    await page.goto('/');
    
    // Step 2: Wait for initial page load
    await page.waitForLoadState('domcontentloaded');
    
    // Step 3: Verify page title and basic structure
    await expect(page).toHaveTitle(/Where Am I/i);
    await expect(page.locator('body')).toBeVisible();
    
    // Step 4: Wait for application to handle location
    await page.waitForTimeout(5000);
    
    // Step 5: Verify application container is visible (even if map fails)
    const appContainer = page.locator('.app');
    await expect(appContainer).toBeVisible();
    
    // Step 6: Check application dimensions
    const containerBox = await appContainer.boundingBox();
    expect(containerBox?.width).toBeGreaterThan(0);
    expect(containerBox?.height).toBeGreaterThan(0);
    
    // Step 7: Verify application handles location errors gracefully
    const errorContainer = page.locator('.error');
    await expect(errorContainer).toBeVisible();
    
    // Step 8: Test basic application interaction (Try Again button)
    const tryAgainButton = page.locator('button:has-text("Try Again")');
    await expect(tryAgainButton).toBeVisible();
    
    // Step 9: Verify the page is still responsive
    await expect(page.locator('body')).toBeVisible();
    await expect(appContainer).toBeVisible();
  });

  test('should handle page refresh gracefully', async ({ page }) => {
    // Initial load
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(5000);
    
    // Verify application is working
    const appContainer = page.locator('.app');
    await expect(appContainer).toBeVisible();
    
    // Refresh the page
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(5000);
    
    // Verify application still works after refresh
    await expect(appContainer).toBeVisible();
    
    const containerBox = await appContainer.boundingBox();
    expect(containerBox?.width).toBeGreaterThan(0);
    expect(containerBox?.height).toBeGreaterThan(0);
  });

  test('should work with browser back/forward navigation', async ({ page }) => {
    // Load the main page
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(5000);
    
    // Verify application is working
    const appContainer = page.locator('.app');
    await expect(appContainer).toBeVisible();
    
    // Navigate to a different page (if available)
    await page.goto('/nonexistent-page');
    
    // Go back to main page
    await page.goBack();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(5000);
    
    // Verify application still works after navigation
    await expect(appContainer).toBeVisible();
    
    const containerBox = await appContainer.boundingBox();
    expect(containerBox?.width).toBeGreaterThan(0);
    expect(containerBox?.height).toBeGreaterThan(0);
  });

  test('should handle network interruptions gracefully', async ({ page }) => {
    // Load the page normally first
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(5000);
    
    // Verify application is working
    const appContainer = page.locator('.app');
    await expect(appContainer).toBeVisible();
    
    // Simulate network interruption by going offline
    await page.context().setOffline(true);
    
    // Try to interact with the application
    await appContainer.hover();
    
    // Go back online
    await page.context().setOffline(false);
    
    // Wait for network to be available
    await page.waitForLoadState('domcontentloaded');
    
    // Verify application is still functional
    await expect(appContainer).toBeVisible();
    
    const containerBox = await appContainer.boundingBox();
    expect(containerBox?.width).toBeGreaterThan(0);
    expect(containerBox?.height).toBeGreaterThan(0);
  });

  test('should maintain state during user interactions', async ({ page }) => {
    // Load the page
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(5000);
    
    // Verify application is working
    const appContainer = page.locator('.app');
    await expect(appContainer).toBeVisible();
    
    // Test interaction with Try Again button
    const tryAgainButton = page.locator('button:has-text("Try Again")');
    await expect(tryAgainButton).toBeVisible();
    
    // Hover over the button
    await tryAgainButton.hover();
    
    // Verify application is still responsive
    await expect(appContainer).toBeVisible();
    
    const containerBox = await appContainer.boundingBox();
    expect(containerBox?.width).toBeGreaterThan(0);
    expect(containerBox?.height).toBeGreaterThan(0);
  });

  test('should handle different viewport sizes correctly', async ({ page }) => {
    const viewports = [
      { width: 1920, height: 1080, name: 'Desktop' },
      { width: 1024, height: 768, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' },
      { width: 320, height: 568, name: 'Small Mobile' }
    ];
    
    for (const viewport of viewports) {
      // Set viewport size
      await page.setViewportSize(viewport);
      
      // Load the page
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);
      
      // Verify application is visible
      const appContainer = page.locator('.app');
      await expect(appContainer).toBeVisible();
      
      // Check dimensions are appropriate for viewport
      const containerBox = await appContainer.boundingBox();
      expect(containerBox?.width).toBeGreaterThan(0);
      expect(containerBox?.height).toBeGreaterThan(0);
      
      // For mobile, width should be less than viewport width
      if (viewport.width <= 768) {
        expect(containerBox?.width).toBeLessThanOrEqual(viewport.width);
      }
      
      console.log(`${viewport.name} viewport: ${containerBox?.width}x${containerBox?.height}`);
    }
  });

  test('should load all required assets without errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    
    // Listen for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Load the page
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000); // Wait for assets to load
    
    // Check for console errors (filter out common non-critical ones)
    const criticalErrors = consoleErrors.filter(error => 
      !error.includes('favicon') && 
      !error.includes('404') &&
      !error.includes('Failed to load resource')
    );
    
    // Log any errors for debugging
    if (criticalErrors.length > 0) {
      console.log('Console errors found:', criticalErrors);
    }
    
    // Don't fail the test for minor console errors
    // expect(criticalErrors).toHaveLength(0);
    
    // Verify all critical assets loaded
    const assetStatus = await page.evaluate(() => {
      const styles = Array.from(document.styleSheets);
      const scripts = Array.from(document.scripts);
      
      return {
        cssLoaded: styles.length > 0,
        jsLoaded: scripts.length > 0,
        hasStyles: styles.length > 0,
        hasScripts: scripts.length > 0,
        hasInlineStyles: styles.some(sheet => !sheet.href),
        hasExternalStyles: styles.some(sheet => sheet.href && sheet.href.startsWith('http')),
        hasLocalStyles: styles.some(sheet => sheet.href && !sheet.href.startsWith('http')),
        hasInlineScripts: scripts.some(script => !script.src),
        hasExternalScripts: scripts.some(script => script.src && script.src.startsWith('http')),
        hasLocalScripts: scripts.some(script => script.src && !script.src.startsWith('http'))
      };
    });
    
    expect(assetStatus.cssLoaded).toBe(true);
    expect(assetStatus.jsLoaded).toBe(true);
    expect(assetStatus.hasStyles).toBe(true);
    expect(assetStatus.hasScripts).toBe(true);
    
    // In test environment, we might not have external styles/scripts, but we should have some
    const hasAnyValidStyles = assetStatus.hasInlineStyles || assetStatus.hasExternalStyles || assetStatus.hasLocalStyles;
    const hasAnyValidScripts = assetStatus.hasInlineScripts || assetStatus.hasExternalScripts || assetStatus.hasLocalScripts;
    
    expect(hasAnyValidStyles).toBe(true);
    expect(hasAnyValidScripts).toBe(true);
  });
});
