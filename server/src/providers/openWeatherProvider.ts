import { StationWeather } from '../types/train.js';
import { WeatherSnapshot } from '../models/index.js';

export class OpenWeatherProvider {
  private get apiKey(): string | undefined {
    return process.env.OPENWEATHER_API_KEY ? process.env.OPENWEATHER_API_KEY.trim() : undefined;
  }
  private memoryCache: Map<string, { data: StationWeather; expiresAt: number }> = new Map();

  public hasRealCredentials(): boolean {
    const key = this.apiKey;
    return Boolean(
      key &&
      key !== 'PASTE_OPENWEATHER_API_KEY_HERE' &&
      key.length > 5
    );
  }

  public async getWeatherForLocation(stationName: string, lat: number, lon: number): Promise<StationWeather> {
    const cacheKey = `${stationName}_${lat.toFixed(2)}_${lon.toFixed(2)}`;
    
    // Check in-memory cache first (valid for 20 minutes)
    const cached = this.memoryCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    // Check MongoDB cache if available
    try {
      const dbCached = await WeatherSnapshot.findOne({ stationCode: stationName });
      if (dbCached && dbCached.expiresAt > new Date()) {
        const result: StationWeather = {
          place: stationName.toUpperCase(),
          temp: `${Math.round(dbCached.tempC)}°`,
          tempC: dbCached.tempC,
          summary: `${dbCached.condition} · ${dbCached.humidity}% humidity`,
          wind: `${dbCached.windKmh} km/h wind`,
          rain: `${dbCached.rainProbability}% rain`,
          humidity: dbCached.humidity
        };
        this.memoryCache.set(cacheKey, { data: result, expiresAt: dbCached.expiresAt.getTime() });
        return result;
      }
    } catch {
      // MongoDB not connected or error, continue
    }

    // Call OpenWeather if API key is configured
    if (this.hasRealCredentials()) {
      try {
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`;
        const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
        if (res.ok) {
          const json: any = await res.json();
          const tempC = Math.round(json.main?.temp ?? 28);
          const condition = json.weather?.[0]?.main || 'Clear skies';
          const humidity = json.main?.humidity ?? 55;
          const windKmh = Math.round((json.wind?.speed ?? 3.5) * 3.6);
          const rainProb = json.rain ? 45 : 5;

          const result: StationWeather = {
            place: stationName.toUpperCase(),
            temp: `${tempC}°`,
            tempC,
            summary: `${condition} · ${humidity}% humidity`,
            wind: `${windKmh} km/h wind`,
            rain: `${rainProb}% rain`,
            humidity
          };

          const expiryTime = Date.now() + 20 * 60 * 1000;
          this.memoryCache.set(cacheKey, { data: result, expiresAt: expiryTime });

          // Save to MongoDB asynchronously
          WeatherSnapshot.findOneAndUpdate(
            { stationCode: stationName },
            {
              stationCode: stationName,
              tempC,
              condition,
              humidity,
              windKmh,
              rainProbability: rainProb,
              expiresAt: new Date(expiryTime),
              updatedAt: new Date()
            },
            { upsert: true }
          ).catch(() => {});

          return result;
        }
      } catch (err) {
        console.warn('OpenWeather request failed, using contextual weather fallback:', err);
      }
    }

    // Contextual fallback based on station geography
    const fallback = this.generateFallbackWeather(stationName);
    this.memoryCache.set(cacheKey, { data: fallback, expiresAt: Date.now() + 15 * 60 * 1000 });
    return fallback;
  }

  private generateFallbackWeather(place: string): StationWeather {
    const clean = place.toUpperCase();
    let temp = 28;
    let summary = 'Clear skies · 52% humidity';
    let wind = '12 km/h wind';
    let rain = '4% rain';

    if (clean.includes('MUMBAI') || clean.includes('SURAT') || clean.includes('VAPI')) {
      temp = 29;
      summary = 'Coastal breeze · 68% humidity';
      wind = '16 km/h wind';
      rain = '10% rain';
    } else if (clean.includes('KOTA') || clean.includes('DELHI') || clean.includes('MATHURA')) {
      temp = 32;
      summary = 'Sunny · 36% humidity';
      wind = '10 km/h wind';
      rain = '0% rain';
    } else if (clean.includes('BENGALURU') || clean.includes('PUNE')) {
      temp = 25;
      summary = 'Partly cloudy · 58% humidity';
      wind = '14 km/h wind';
      rain = '15% rain';
    }

    return {
      place: clean.split(' ')[0],
      temp: `${temp}°`,
      tempC: temp,
      summary,
      wind,
      rain
    };
  }
}

export const openWeatherProvider = new OpenWeatherProvider();
