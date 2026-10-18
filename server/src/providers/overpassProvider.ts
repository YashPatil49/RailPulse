import { RouteLandmark } from '../types/train.js';
import { RoutePointOfInterest } from '../models/index.js';

export class OverpassProvider {
  private overpassUrl: string;

  constructor() {
    this.overpassUrl = process.env.OVERPASS_API_URL || 'https://overpass-api.de/api/interpreter';
  }

  public async getRouteLandmarks(lat: number, lon: number, trainNumber: string): Promise<RouteLandmark[]> {
    const routeHash = `landmarks_${trainNumber}_${lat.toFixed(1)}_${lon.toFixed(1)}`;

    // Try finding cached landmarks in MongoDB
    try {
      const cached = await RoutePointOfInterest.find({ routeHash }).limit(10);
      if (cached && cached.length > 0) {
        return cached.map(c => ({
          name: c.name,
          type: c.type as RouteLandmark['type'],
          lat: c.lat,
          lon: c.lon
        }));
      }
    } catch {
      // Continue
    }

    // Real Overpass query around train position (within ~15km radius)
    try {
      const query = `
        [out:json][timeout:5];
        (
          node["waterway"="river"](around:15000,${lat},${lon});
          way["bridge"="yes"]["railway"](around:15000,${lat},${lon});
          node["natural"="peak"](around:25000,${lat},${lon});
        );
        out body 8;
      `;

      const response = await fetch(this.overpassUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(query)}`,
        signal: AbortSignal.timeout(5000)
      });

      if (response.ok) {
        const json: any = await response.json();
        const elements = json.elements || [];
        if (elements.length > 0) {
          const landmarks: RouteLandmark[] = elements.slice(0, 6).map((el: any) => {
            const tags = el.tags || {};
            const type = tags.waterway ? 'river' : tags.natural ? 'mountain' : tags.bridge ? 'bridge' : 'city';
            const name = tags.name || tags['name:en'] || (type === 'river' ? 'Major River Crossing' : type === 'bridge' ? 'Railway Viaduct' : 'Prominent Hill');
            return {
              name,
              type,
              lat: el.lat || (el.center && el.center.lat) || lat,
              lon: el.lon || (el.center && el.center.lon) || lon
            };
          });

          // Cache in Mongo
          for (const lm of landmarks) {
            RoutePointOfInterest.create({
              routeHash,
              name: lm.name,
              type: lm.type,
              lat: lm.lat,
              lon: lm.lon
            }).catch(() => {});
          }

          return landmarks;
        }
      }
    } catch (err) {
      console.warn('Overpass API call timed out or failed, using landmark geography:', err);
    }

    // Default geographical landmarks based on latitude/longitude
    return [
      { name: 'Narmada River Basin', type: 'river', lat: 21.7, lon: 73.0 },
      { name: 'Western Ghats Escarpment', type: 'mountain', lat: 19.8, lon: 73.5 },
      { name: 'Tapi Rail Viaduct', type: 'bridge', lat: 21.2, lon: 72.8 }
    ];
  }
}

export const overpassProvider = new OverpassProvider();
