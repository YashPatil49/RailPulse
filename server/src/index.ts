import dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: 'server/.env' });
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import trainRoutes from './routes/trainRoutes.js';
import weatherRoutes from './routes/weatherRoutes.js';
import intelligenceRoutes from './routes/intelligenceRoutes.js';

const app = express();
const port = Number(process.env.PORT || 4000);
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

app.use(cors({ origin: clientOrigin }));
app.use(express.json());

// Request logger for diagnostic insights
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'production' && req.path.startsWith('/api')) {
      console.log(`[API] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// Simple in-memory rate-limiter to protect external APIs
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
app.use('/api/', (req, res, next) => {
  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 120; // 120 requests per minute

  const record = rateLimitMap.get(ip);
  if (!record || record.resetAt < now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return next();
  }

  if (record.count >= maxRequests) {
    return res.status(429).json({
      success: false,
      error: 'Rate limit exceeded. Please wait a moment before sending more requests.'
    });
  }

  record.count++;
  next();
});

// Health check
app.get('/api/health', (_req, res) => {
  const mongoConnected = mongoose.connection.readyState === 1;
  res.json({
    success: true,
    service: 'railpulse-api',
    status: 'healthy',
    database: mongoConnected ? 'connected' : 'running-with-in-memory-fallback',
    providers: {
      railRadar: Boolean(process.env.RAILRADAR_API_KEY && process.env.RAILRADAR_API_KEY !== 'PASTE_RAILRADAR_API_KEY_HERE'),
      openWeather: Boolean(process.env.OPENWEATHER_API_KEY && process.env.OPENWEATHER_API_KEY !== 'PASTE_OPENWEATHER_API_KEY_HERE'),
      openTopography: Boolean(process.env.OPENTOPOGRAPHY_API_KEY && process.env.OPENTOPOGRAPHY_API_KEY !== 'PASTE_OPENTOPOGRAPHY_API_KEY_HERE'),
      overpass: true // Public OSM service
    },
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api/trains', trainRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api', intelligenceRoutes);

// Database Connection Bootstrap
async function connectDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri.includes('USERNAME:PASSWORD') || uri === 'PASTE_MONGODB_URI_HERE') {
    console.info('ℹ️  MONGODB_URI is not set. RailPulse is running with high-performance memory cache & live providers.');
    return;
  }
  try {
    await mongoose.connect(uri);
    console.log('✅ MongoDB connected successfully to RailPulse cluster');
  } catch (err: any) {
    console.warn('⚠️  MongoDB connection failed, running in memory-only mode:', err.message);
  }
}

connectDatabase().catch(err => console.error('MongoDB init error:', err));

app.listen(port, () => {
  console.log(`🚆 RailPulse API running on http://localhost:${port}`);
  console.log(`⚡ Client origin: ${clientOrigin}`);
});
