import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

const app = express();
const port = Number(process.env.PORT || 4000);
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

// MongoDB connection: paste your URI in server/.env as MONGODB_URI.
async function connectDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn('MONGODB_URI is not set. Running with provider mocks until you add it.');
    return;
  }
  await mongoose.connect(uri);
  console.log('MongoDB connected');
}

const demoTrains = [
  { trainNumber: '12951', trainName: 'Mumbai Rajdhani', source: 'Mumbai Central', destination: 'New Delhi' },
  { trainNumber: '12952', trainName: 'New Delhi Rajdhani', source: 'New Delhi', destination: 'Mumbai Central' }
];

app.get('/api/health', (_req, res) => res.json({ success: true, service: 'railpulse-api' }));
app.get('/api/trains/search', (req, res) => {
  const query = String(req.query.q || '').toLowerCase();
  const data = demoTrains.filter(train => `${train.trainNumber} ${train.trainName}`.toLowerCase().includes(query));
  // Replace this mock response with your RailRadar provider adapter once the API key is added.
  res.json({ success: true, data });
});
app.get('/api/trains/:trainNumber/status', (req, res) => {
  // RailRadar API key is read from process.env.RAILRADAR_API_KEY.
  res.json({ success: true, data: { trainNumber: req.params.trainNumber, status: 'On time', lastUpdatedAt: new Date().toISOString() } });
});

connectDatabase().catch(error => console.error('MongoDB connection failed:', error.message));
app.listen(port, () => console.log(`RailPulse API running on http://localhost:${port}`));
