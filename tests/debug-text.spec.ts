import { test, expect } from './fixtures/geolocation';
import { injectTestMapStyle, waitForMapReady } from './utils/test-map-style';

test.describe('Debug Text Content', () => {
  test('should show what text is actually present on the page', async ({ page }) => {
    // Inject test map style
    await injectTestMapStyle(page);
    
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for the map to be ready
    const mapReady = await waitForMapReady(page, 15000);
    expect(mapReady).toBe(true);
    
    // Get all the text content and analyze it
    const textAnalysis = await page.evaluate(() => {
      const body = document.body;
      const text = body.textContent || '';
      
      // Get all text nodes and their content
      const textNodes = [];
      const walker = document.createTreeWalker(
        body,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );
      
      let node;
      while (node = walker.nextNode()) {
        const content = node.textContent?.trim();
        if (content && content.length > 0) {
          textNodes.push({
            content: content,
            parent: node.parentElement?.tagName || 'unknown',
            className: node.parentElement?.className || ''
          });
        }
      }
      
      return {
        fullText: text,
        textLength: text.length,
        textNodes: textNodes,
        hasMapText: text.includes('map') || text.includes('Map'),
        hasMapboxText: text.includes('Mapbox') || text.includes('mapbox'),
        hasOpenStreetMapText: text.includes('OpenStreetMap'),
        hasCopyrightText: text.includes('©'),
        hasLocationText: text.includes('location') || text.includes('Location'),
        hasCoordinates: text.includes('38.') || text.includes('-77.') || text.includes('DC') || text.includes('Washington'),
        // Check for specific patterns
        patterns: {
          mapPattern: /map/gi,
          mapboxPattern: /mapbox/gi,
          osmPattern: /openstreetmap/gi,
          copyrightPattern: /©/g,
          locationPattern: /location/gi,
          coordinatePattern: /(38\.|-77\.|DC|Washington)/gi
        }
      };
    });
    
    console.log('=== TEXT CONTENT ANALYSIS ===');
    console.log('Full text length:', textAnalysis.textLength);
    console.log('Full text (first 500 chars):', textAnalysis.fullText.substring(0, 500));
    console.log('Text nodes found:', textAnalysis.textNodes.length);
    console.log('Text nodes:', textAnalysis.textNodes);
    console.log('Pattern matches:', {
      map: textAnalysis.fullText.match(textAnalysis.patterns.mapPattern)?.length || 0,
      mapbox: textAnalysis.fullText.match(textAnalysis.patterns.mapboxPattern)?.length || 0,
      osm: textAnalysis.fullText.match(textAnalysis.patterns.osmPattern)?.length || 0,
      copyright: textAnalysis.fullText.match(textAnalysis.patterns.copyrightPattern)?.length || 0,
      location: textAnalysis.fullText.match(textAnalysis.patterns.locationPattern)?.length || 0,
      coordinate: textAnalysis.fullText.match(textAnalysis.patterns.coordinatePattern)?.length || 0
    });
    
    // Take a screenshot for visual inspection
    await page.screenshot({ path: 'test-results/debug-text-content.png', fullPage: true });
    
    // Don't fail the test - this is just for debugging
    expect(true).toBe(true);
  });
});
