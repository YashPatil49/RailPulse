import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { openTopographyProvider } from '../providers/openTopographyProvider.js';
import { overpassProvider } from '../providers/overpassProvider.js';
import { railRadarProvider } from '../providers/railRadarProvider.js';

const router = Router();

// GET /api/elevation/route/:trainNumber
router.get('/elevation/route/:trainNumber', async (req: Request, res: Response) => {
  try {
    const trainNumber = String(req.params.trainNumber || '');
    const route = await railRadarProvider.getTrainRoute(trainNumber);
    const coordinates = route?.coordinates || [];
    const elevation = await openTopographyProvider.getRouteElevation(trainNumber, coordinates);
    res.json({ success: true, data: elevation });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Elevation query failed' });
  }
});

// GET /api/route-features?trainNumber=...&lat=...&lon=...
router.get('/route-features', async (req: Request, res: Response) => {
  try {
    const trainNumber = String(req.query.trainNumber || '12951');
    const lat = Number(req.query.lat || 21.2);
    const lon = Number(req.query.lon || 72.8);

    const landmarks = await overpassProvider.getRouteLandmarks(lat, lon, trainNumber);
    res.json({ success: true, data: landmarks });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Route features query failed' });
  }
});

export default router;
