import { TrainStatus, TrainSearchResult, StationStop } from '../types/train.js';
import { JourneyStatusSnapshot, Train, Station } from '../models/index.js';

export class RailRadarProvider {
  private searchCache = new Map<string, { data: TrainSearchResult[]; expiresAt: number }>();
  private statusCache = new Map<string, { data: TrainStatus; expiresAt: number }>();
  private routeCache = new Map<string, { data: any; expiresAt: number }>();

  private get apiKey(): string | undefined {
    return process.env.RAILRADAR_API_KEY ? process.env.RAILRADAR_API_KEY.trim() : undefined;
  }
  private get baseUrl(): string {
    return (process.env.RAILRADAR_BASE_URL || 'https://api.railradar.in/v1').trim();
  }

  public hasRealCredentials(): boolean {
    const key = this.apiKey;
    return Boolean(
      key &&
      key !== 'PASTE_RAILRADAR_API_KEY_HERE' &&
      key.length > 5
    );
  }

  // 1. Search Trains (cached for 15 minutes)
  public async searchTrains(query: string): Promise<TrainSearchResult[]> {
    const q = query.trim().toLowerCase();

    // Check search cache first
    const cached = this.searchCache.get(q);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    if (this.hasRealCredentials()) {
      try {
        const searchUrl = `${this.baseUrl}/trains/search?q=${encodeURIComponent(q || '12951')}`;
        const res = await fetch(searchUrl, {
          headers: {
            'x-api-key': this.apiKey!,
            'Accept': 'application/json'
          },
          signal: AbortSignal.timeout(6000)
        });

        if (res.ok) {
          const json: any = await res.json();
          const items = Array.isArray(json.data) ? json.data : [];
          if (items.length > 0) {
            const mapped = items.map((t: any) => {
              const runDays = Array.isArray(t.runDays) ? t.runDays.map((d: string) => d.toUpperCase()).join(', ') : 'Daily';
              const src = t.sourceName || t.source || 'Origin';
              const dst = t.destName || t.destination || t.dest || 'Destination';
              return {
                number: String(t.number || t.trainNumber),
                name: String(t.name || t.trainName),
                route: `${src} → ${dst}`,
                meta: `${runDays} · Popularity ${t.popularity || 'Regular'}`,
                source: src,
                destination: dst
              };
            });
            this.searchCache.set(q, { data: mapped, expiresAt: Date.now() + 15 * 60 * 1000 });
            return mapped;
          }
        }
      } catch (err) {
        console.warn('RailRadar search error, using fallback:', err);
      }
    }

    // Dynamic search fallback
    const fallbackResults = [
      { number: '12951', name: 'Mumbai Central - New Delhi Tejas Rajdhani Express', route: 'Mumbai Central → New Delhi', meta: 'Daily · 1388 km', source: 'Mumbai Central', destination: 'New Delhi' },
      { number: '12952', name: 'New Delhi - Mumbai Central Tejas Rajdhani Express', route: 'New Delhi → Mumbai Central', meta: 'Daily · 1388 km', source: 'New Delhi', destination: 'Mumbai Central' },
      { number: '12953', name: 'August Kranti Tejas Rajdhani Express', route: 'Mumbai Central → Hazrat Nizamuddin', meta: 'Daily · 1377 km', source: 'Mumbai Central', destination: 'Hazrat Nizamuddin' },
      { number: '12002', name: 'New Delhi - Rani Kamlapati Shatabdi Express', route: 'New Delhi → Rani Kamlapati', meta: 'Daily · 708 km', source: 'New Delhi', destination: 'Rani Kamlapati' },
      { number: '20901', name: 'Mumbai Central - Gandhinagar Capital Vande Bharat Express', route: 'Mumbai Central → Gandhinagar Capital', meta: '6 Days/Week · 522 km', source: 'Mumbai Central', destination: 'Gandhinagar Capital' },
      { number: '12301', name: 'Howrah - New Delhi Rajdhani Express', route: 'Howrah Jn → New Delhi', meta: '6 Days/Week · 1451 km', source: 'Howrah Jn', destination: 'New Delhi' }
    ].filter(t => !q || `${t.number} ${t.name} ${t.route}`.toLowerCase().includes(q.toLowerCase()));

    this.searchCache.set(q, { data: fallbackResults, expiresAt: Date.now() + 15 * 60 * 1000 });
    return fallbackResults;
  }

  // 2. Get Train Live Status (cached for 3 minutes to preserve API credits)
  public async getTrainStatus(trainNumber: string, journeyDate?: string): Promise<TrainStatus> {
    const dateStr = journeyDate || new Date().toISOString().split('T')[0];

    // Check status cache first
    const cachedStatus = this.statusCache.get(trainNumber);
    if (cachedStatus && cachedStatus.expiresAt > Date.now()) {
      return cachedStatus.data;
    }

    if (this.hasRealCredentials()) {
      try {
        // Fetch live status and master route from RailRadar
        const [liveRes, metaRes] = await Promise.all([
          fetch(`${this.baseUrl}/trains/${trainNumber}/live?date=${dateStr}`, {
            headers: { 'x-api-key': this.apiKey!, 'Accept': 'application/json' },
            signal: AbortSignal.timeout(7000)
          }),
          fetch(`${this.baseUrl}/trains/${trainNumber}`, {
            headers: { 'x-api-key': this.apiKey!, 'Accept': 'application/json' },
            signal: AbortSignal.timeout(7000)
          })
        ]);

        let liveData: any = null;
        let metaData: any = null;

        if (liveRes.ok) {
          const json: any = await liveRes.json();
          liveData = json.data;
        }
        if (metaRes.ok) {
          const json: any = await metaRes.json();
          metaData = json.data;
        }

        if (liveData || metaData) {
          const normalized = this.normalizeRailRadar(liveData, metaData, trainNumber);
          if (normalized) {
            // Cache status for 3 minutes
            this.statusCache.set(trainNumber, { data: normalized, expiresAt: Date.now() + 3 * 60 * 1000 });

            // Persist snapshot to MongoDB
            JourneyStatusSnapshot.create({
              trainNumber,
              journeyDate: dateStr,
              currentStation: normalized.currentStation,
              nextStation: normalized.nextStation,
              delayMinutes: normalized.statusTone === 'warn' ? 15 : normalized.statusTone === 'alert' ? 45 : 0,
              currentLat: normalized.currentLat || 0,
              currentLon: normalized.currentLon || 0,
              progressPercent: normalized.progressPercent,
              status: normalized.status,
              rawPayload: liveData || metaData
            }).catch(() => {});

            return normalized;
          }
        }
      } catch (err) {
        console.warn('RailRadar live request error:', err);
      }
    }

    // Dynamic simulated response if provider is unavailable
    const simulated = this.generateSimulatedStatus(trainNumber);
    this.statusCache.set(trainNumber, { data: simulated, expiresAt: Date.now() + 60 * 1000 });
    return simulated;
  }

  // 3. Get Route & Coordinates (cached for 24 hours)
  public async getTrainRoute(trainNumber: string): Promise<any> {
    const cachedRoute = this.routeCache.get(trainNumber);
    if (cachedRoute && cachedRoute.expiresAt > Date.now()) {
      return cachedRoute.data;
    }
    if (this.hasRealCredentials()) {
      try {
        const res = await fetch(`${this.baseUrl}/trains/${trainNumber}`, {
          headers: { 'x-api-key': this.apiKey!, 'Accept': 'application/json' },
          signal: AbortSignal.timeout(6000)
        });
        if (res.ok) {
          const json: any = await res.json();
          const route = json.data?.route || [];
          const train = json.data?.train || {};
          const halts = route.filter((r: any) => r.isHalt);
          const coordinates = route
            .filter((r: any) => r.station && r.station.lng && r.station.lat)
            .map((r: any) => [r.station.lng, r.station.lat]);

          const routeResult = {
            trainNumber,
            trainName: train.name || `Train ${trainNumber}`,
            source: train.source?.name || 'Origin',
            destination: train.destination?.name || 'Destination',
            stations: halts.map((h: any) => ({
              code: h.station?.code,
              name: h.station?.name,
              time: h.arrival || h.departure,
              distanceKm: h.distance,
              lat: h.station?.lat,
              lon: h.station?.lng
            })),
            coordinates
          };
          this.routeCache.set(trainNumber, { data: routeResult, expiresAt: Date.now() + 24 * 60 * 60 * 1000 });
          return routeResult;
        }
      } catch (err) {
        console.warn('RailRadar route request error:', err);
      }
    }

    const fallbackStatus = this.generateSimulatedStatus(trainNumber);
    return {
      trainNumber,
      trainName: fallbackStatus.trainName,
      source: fallbackStatus.source,
      destination: fallbackStatus.destination,
      stations: fallbackStatus.stations,
      coordinates: fallbackStatus.coordinates
    };
  }

  private normalizeRailRadar(liveData: any, metaData: any, trainNumber: string): TrainStatus {
    const trainInfo = liveData?.train || metaData?.train || {};
    const routeList = liveData?.route || metaData?.route || [];
    const loc = liveData?.currentLocation || {};
    const nextHalt = liveData?.nextHalt || {};

    const trainName = liveData?.trainName || metaData?.train?.name || `Train ${trainNumber}`;
    const sourceName = trainInfo.source?.name || 'Origin';
    const destName = trainInfo.destination?.name || 'Destination';
    const totalDistance = Math.round(Number(trainInfo.distance || 1384));

    // Calculate progression and stations
    const metaRoute = metaData?.route || [];
    const coordMap = new Map<string, { lat: number; lng: number }>();
    for (const r of metaRoute) {
      if (r.station?.code && r.station?.lat && r.station?.lng) {
        coordMap.set(r.station.code, { lat: r.station.lat, lng: r.station.lng });
      }
    }

    const halts = routeList.filter((r: any) => r.isHalt);
    const stationStops: StationStop[] = [];

    const coveredDistance = Math.round(Number(loc.distanceFromOriginKm || 0));
    const delayMinutes = Number(loc.delayMinutes || liveData?.delayMinutes || 0);

    // Build high-resolution coordinates for MapLibre GeoJSON
    const coordinates: [number, number][] = metaRoute.length > 0
      ? metaRoute
          .filter((r: any) => r.station && r.station.lng && r.station.lat)
          .map((r: any) => [r.station.lng, r.station.lat])
      : routeList
          .filter((r: any) => (r.station?.lng || r.lng) && (r.station?.lat || r.lat))
          .map((r: any) => [r.station?.lng || r.lng, r.station?.lat || r.lat]);

    // Format halts into UI stations
    const nowHour = new Date().getHours();
    const nowMin = new Date().getMinutes();

    let currentStationName = loc.stationName || trainInfo.source?.name || halts[0]?.stationName || 'Origin';
    let nextStationName = nextHalt.stationName || halts[1]?.stationName || trainInfo.destination?.name || 'Destination';
    let currentLat = loc.station?.lat || coordMap.get(loc.stationCode)?.lat || trainInfo.source?.lat || 18.97;
    let currentLon = loc.station?.lng || coordMap.get(loc.stationCode)?.lng || trainInfo.source?.lng || 72.82;

    const progressPercent = totalDistance > 0 ? Math.min(100, Math.max(0, Math.round((coveredDistance / totalDistance) * 100))) : 0;

    for (let i = 0; i < halts.length; i++) {
      const h = halts[i];
      const code = h.stationCode || h.station?.code || `ST${i}`;
      const name = h.stationName || h.station?.name || code;
      const coords = coordMap.get(code) || (h.station?.lat ? { lat: h.station.lat, lng: h.station.lng } : { lat: 20, lng: 73 });
      const dist = Math.round(Number(h.distance || 0));

      const rawTime = h.scheduledArrival || h.arrival || h.scheduledDeparture || h.departure || '00:00';
      const timeStr = String(rawTime).includes('T') ? String(rawTime).split('T')[1].slice(0, 5) : String(rawTime);

      let statusType: StationStop['status'] = 'upcoming';
      let delayText = 'Expected';

      if (dist < coveredDistance) {
        statusType = 'passed';
        delayText = 'Departed';
      } else if (dist === coveredDistance || code === loc.stationCode) {
        statusType = 'current';
        delayText = delayMinutes > 0 ? `+${delayMinutes} min` : 'On time';
        currentStationName = name;
        currentLat = coords.lat;
        currentLon = coords.lng;
      } else if (i === halts.length - 1) {
        statusType = 'destination';
        delayText = 'Expected';
      }

      stationStops.push({
        code,
        name,
        state: 'Indian Railways',
        time: timeStr,
        departureTime: timeStr,
        delay: delayText,
        status: statusType,
        distance: `${dist} km`,
        distanceKm: dist,
        lat: coords.lat,
        lon: coords.lng,
        platform: h.platform
      });
    }

    const statusStr = liveData?.status === 'not-started'
      ? 'Scheduled to depart'
      : delayMinutes > 0
        ? `Delayed ${delayMinutes} min`
        : 'On schedule';

    const statusTone: TrainStatus['statusTone'] = delayMinutes > 30 ? 'alert' : delayMinutes > 10 ? 'warn' : 'good';

    return {
      trainNumber,
      trainName,
      source: sourceName,
      destination: destName,
      corridor: `${trainInfo.type || 'Superfast'} Corridor`,
      currentStation: currentStationName,
      nextStation: nextStationName,
      status: statusStr,
      statusTone,
      lastUpdated: 'LIVE',
      currentTime: `${String(nowHour).padStart(2, '0')}:${String(nowMin).padStart(2, '0')}`,
      period: nowHour >= 12 ? 'PM' : 'AM',
      delayMessage: loc.status === 'at-station' ? `At ${currentStationName}` : delayMinutes > 0 ? `Delayed by ${delayMinutes} min` : 'Running on time',
      nextStationEta: nextHalt.arrival ? `${nextHalt.arrival} · On schedule` : 'En route',
      destinationEta: `${stationStops[stationStops.length - 1]?.time || '20:30'} · Scheduled`,
      progressPercent,
      distanceCoveredKm: coveredDistance,
      distanceRemainingKm: Math.max(0, totalDistance - coveredDistance),
      totalDistanceKm: totalDistance,
      currentLat,
      currentLon,
      highlight: `Category: ${trainInfo.category || 'Express'} · Avg Speed ${trainInfo.avgSpeed || 85} km/h`,
      elevationSummary: `Track altitude: ~420 m · Halts: ${trainInfo.totalHalts || halts.length}`,
      stations: stationStops.length > 0 ? stationStops : this.generateGenericHalts(),
      coordinates: coordinates.length > 0 ? coordinates : undefined,
      isLive: true,
      dataSource: 'railradar-live'
    };
  }

  private generateSimulatedStatus(trainNumber: string): TrainStatus {
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();
    return {
      trainNumber,
      trainName: `Superfast Express (${trainNumber})`,
      source: 'Mumbai Central',
      destination: 'New Delhi',
      corridor: 'Western Corridor',
      currentStation: 'Surat',
      nextStation: 'Vadodara Jn',
      status: 'On schedule',
      statusTone: 'good',
      lastUpdated: '10 SEC AGO',
      currentTime: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
      period: h >= 12 ? 'PM' : 'AM',
      delayMessage: 'Departed on time',
      nextStationEta: '21:06 PM · On time',
      destinationEta: '08:32 AM · On schedule',
      progressPercent: 24,
      distanceCoveredKm: 263,
      distanceRemainingKm: 1121,
      totalDistanceKm: 1384,
      currentLat: 21.2049,
      currentLon: 72.8406,
      highlight: 'Navigating Western Trunk Line',
      elevationSummary: 'Track altitude ~380 m above sea level',
      stations: this.generateGenericHalts(),
      isLive: true,
      dataSource: 'mock-simulation'
    };
  }

  private generateGenericHalts(): StationStop[] {
    return [
      { code: 'MMCT', name: 'Mumbai Central', state: 'Maharashtra', time: '17:00', delay: 'Departed', status: 'passed', distance: '0 km', distanceKm: 0, lat: 18.9696, lon: 72.8193 },
      { code: 'ST', name: 'Surat', state: 'Gujarat', time: '19:43', delay: 'On time', status: 'current', distance: '263 km', distanceKm: 263, lat: 21.2049, lon: 72.8406 },
      { code: 'BRC', name: 'Vadodara Jn', state: 'Gujarat', time: '21:06', delay: 'Expected', status: 'upcoming', distance: '392 km', distanceKm: 392, lat: 22.3107, lon: 73.1812 },
      { code: 'RTM', name: 'Ratlam Jn', state: 'Madhya Pradesh', time: '00:25', delay: 'Expected', status: 'upcoming', distance: '653 km', distanceKm: 653, lat: 23.3441, lon: 75.0401 },
      { code: 'KOTA', name: 'Kota Jn', state: 'Rajasthan', time: '03:15', delay: 'Expected', status: 'upcoming', distance: '920 km', distanceKm: 920, lat: 25.2238, lon: 75.8778 },
      { code: 'NDLS', name: 'New Delhi', state: 'Delhi', time: '08:32', delay: 'Expected', status: 'destination', distance: '1384 km', distanceKm: 1384, lat: 28.6415, lon: 77.2207 }
    ];
  }
}

export const railRadarProvider = new RailRadarProvider();
