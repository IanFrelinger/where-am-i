// Test script for combined geocoding function
import { handler } from './packages/api/dist/combined-geo.js';

// Test 1: IP address lookup
console.log('🧪 Testing IP address lookup...');
const ipEvent = {
  queryStringParameters: { ip: '8.8.8.8' }
};

try {
  const result = await handler(ipEvent);
  console.log('✅ IP lookup result:', JSON.parse(result.body));
} catch (error) {
  console.error('❌ IP lookup failed:', error);
}

// Test 2: Direct coordinates
console.log('\n🧪 Testing direct coordinates...');
const coordEvent = {
  queryStringParameters: { lat: '40.7128', lon: '-74.0060' }
};

try {
  const result = await handler(coordEvent);
  console.log('✅ Coordinates result:', JSON.parse(result.body));
} catch (error) {
  console.error('❌ Coordinates lookup failed:', error);
}

console.log('\n🎉 Tests completed!');
