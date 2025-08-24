import express from 'express';
import cors from 'cors';
import { reverseGeocodeHandler } from './reverse-local.js';

const app = express();
const PORT = process.env.PORT || 8787;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/reverse', async (req, res) => {
  try {
    const result = await reverseGeocodeHandler({
      queryStringParameters: req.query,
      httpMethod: 'GET',
      path: '/api/reverse'
    } as any);
    
    res.status(result.statusCode || 200).json(JSON.parse(result.body || '{}'));
  } catch (error) {
    console.error('Error in reverse geocoding:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Local API server running on http://localhost:${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌍 Reverse geocoding: http://localhost:${PORT}/api/reverse?lat=40.7128&lon=-74.0060`);
});

export default app;
