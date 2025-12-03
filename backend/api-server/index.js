require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const locationHistory = []; // in-memory fallback

// Log all requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// MongoDB
const { connect } = require('./db');
const Location = require('./models/location');

let dbConnected = false;
const tryConnect = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) return;
  try {
    await connect(uri);
    dbConnected = true;
    console.log('Connected to MongoDB');
  } catch (err) {
    console.warn('MongoDB connection failed, continuing with in-memory data');
  }
};
tryConnect();

// POST /api/location
// Body: { userId: string, lat: number, lng: number, aqi?: number, address?: string }
app.post('/api/location', async (req, res) => {
  const { userId, lat, lng, aqi, address } = req.body || {};
  console.log('[POST /api/location] Received request:', { userId, lat, lng, aqi, address });
  
  if (!userId || lat === undefined || lng === undefined) {
    console.log('[POST /api/location] Missing required fields');
    return res.status(400).json({ error: 'userId, lat, lng are required' });
  }

  try {
    if (dbConnected) {
      const loc = await Location.create({
        userId,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        aqi: aqi !== undefined ? parseFloat(aqi) : null,
        address: address || null
      });
      console.log('[POST /api/location] Saved to MongoDB:', loc);
      return res.json({ success: true, locationId: loc._id });
    } else {
      console.log('[POST /api/location] DB not connected, using in-memory fallback');
      // in-memory fallback: just acknowledge
      return res.json({ success: true, message: 'location recorded (in-memory)' });
    }
  } catch (err) {
    console.error('[POST /api/location] Error:', err);
    return res.status(500).json({ error: 'failed to save location' });
  }
});

// In-memory storage for location history fallback
app.get("/api/location/all", (req, res) => {
  res.json(locationHistory);
});

// GET /api/location/history?userId=..
app.get('/api/location/history', async (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    if (dbConnected) {
      const docs = await Location.find({ userId }).sort({ 'timestamps.createdAt': -1 }).lean();
      return res.json({ history: docs });
    } else {
      // in-memory fallback: empty array
      return res.json({ history: [] });
    }
  } catch (err) {
    console.error('location history error', err);
    return res.status(500).json({ error: 'failed to fetch history' });
  }
});

// GET /api/location/all - Debug endpoint: retrieve ALL locations
app.get('/api/location/all', async (req, res) => {
  try {
    if (dbConnected) {
      const allDocs = await Location.find({}).sort({ 'timestamps.createdAt': -1 }).lean();
      console.log(`[GET /api/location/all] Found ${allDocs.length} locations`);
      return res.json({ 
        total: allDocs.length,
        locations: allDocs 
      });
    } else {
      console.log('[GET /api/location/all] DB not connected');
      return res.json({ total: 0, locations: [] });
    }
  } catch (err) {
    console.error('[GET /api/location/all] Error:', err);
    return res.status(500).json({ error: 'failed to fetch all locations' });
  }
});

app.listen(PORT, () => {
  console.log(`SmartAir Location Tracking API listening on ${PORT}`);
});
