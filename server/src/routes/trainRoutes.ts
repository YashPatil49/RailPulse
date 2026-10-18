import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { railRadarProvider } from '../providers/railRadarProvider.js';
import { openWeatherProvider } from '../providers/openWeatherProvider.js';

const router = Router();

const searchQuerySchema = z.object({
  q: z.string().optional()
});

const trainParamSchema = z.object({
  trainNumber: z.string().min(1).max(10).regex(/^[a-zA-Z0-9]+$/)
});

const statusQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
});

// GET /api/trains/search?q=...
router.get('/search', async (req: Request, res: Response) => {
  try {
    const parsed = searchQuerySchema.safeParse(req.query);
    const query = parsed.success && parsed.data.q ? parsed.data.q : '';
    const results = await railRadarProvider.searchTrains(query);
    res.json({ success: true, count: results.length, data: results });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Train search failed' });
  }
});

// GET /api/trains/:trainNumber/status?date=...
router.get('/:trainNumber/status', async (req: Request, res: Response) => {
  try {
    const paramParsed = trainParamSchema.safeParse(req.params);
    if (!paramParsed.success) {
      return res.status(400).json({ success: false, error: 'Invalid train number format' });
    }

    const queryParsed = statusQuerySchema.safeParse(req.query);
    const date = queryParsed.success ? queryParsed.data.date : undefined;

    const status = await railRadarProvider.getTrainStatus(paramParsed.data.trainNumber, date);

    // Also enrich with live weather for current station if possible
    if (status.currentLat && status.currentLon) {
      try {
        const weather = await openWeatherProvider.getWeatherForLocation(
          status.currentStation,
          status.currentLat,
          status.currentLon
        );
        status.weather = weather;
      } catch {
        // Fallback or leave existing
      }
    }

    res.json({ success: true, data: status });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Unable to retrieve train status' });
  }
});

// GET /api/trains/:trainNumber/route
router.get('/:trainNumber/route', async (req: Request, res: Response) => {
  try {
    const paramParsed = trainParamSchema.safeParse(req.params);
    if (!paramParsed.success) {
      return res.status(400).json({ success: false, error: 'Invalid train number format' });
    }

    const route = await railRadarProvider.getTrainRoute(paramParsed.data.trainNumber);
    res.json({ success: true, data: route });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Unable to retrieve train route' });
  }
});

// GET /api/trains/:trainNumber (General metadata)
router.get('/:trainNumber', async (req: Request, res: Response) => {
  try {
    const paramParsed = trainParamSchema.safeParse(req.params);
    if (!paramParsed.success) {
      return res.status(400).json({ success: false, error: 'Invalid train number' });
    }
    const route = await railRadarProvider.getTrainRoute(paramParsed.data.trainNumber);
    res.json({ success: true, data: route });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
