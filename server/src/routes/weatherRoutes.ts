import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { openWeatherProvider } from '../providers/openWeatherProvider.js';

const router = Router();

const stationParamSchema = z.object({
  stationCode: z.string().min(1).max(20)
});

const weatherQuerySchema = z.object({
  lat: z.coerce.number().optional(),
  lon: z.coerce.number().optional()
});

// GET /api/weather/station/:stationCode?lat=...&lon=...
router.get('/station/:stationCode', async (req: Request, res: Response) => {
  try {
    const paramParsed = stationParamSchema.safeParse(req.params);
    if (!paramParsed.success) {
      return res.status(400).json({ success: false, error: 'Invalid station code' });
    }

    const queryParsed = weatherQuerySchema.safeParse(req.query);
    const lat = (queryParsed.success && queryParsed.data.lat) ? queryParsed.data.lat : 21.2;
    const lon = (queryParsed.success && queryParsed.data.lon) ? queryParsed.data.lon : 72.8;

    const weather = await openWeatherProvider.getWeatherForLocation(paramParsed.data.stationCode, lat, lon);
    res.json({ success: true, data: weather });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Weather lookup failed' });
  }
});

export default router;
