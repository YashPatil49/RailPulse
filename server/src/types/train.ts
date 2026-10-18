export interface StationStop {
  code: string;
  name: string;
  state: string;
  time: string;
  departureTime?: string;
  delay: string;
  status: 'passed' | 'current' | 'upcoming' | 'destination';
  distance: string;
  distanceKm: number;
  lat?: number;
  lon?: number;
  platform?: string;
}

export interface TrainStatus {
  trainNumber: string;
  trainName: string;
  source: string;
  destination: string;
  corridor: string;
  currentStation: string;
  nextStation: string;
  status: string;
  statusTone: 'good' | 'warn' | 'alert' | 'neutral';
  lastUpdated: string;
  currentTime: string;
  period: string;
  delayMessage: string;
  nextStationEta: string;
  destinationEta: string;
  progressPercent: number;
  distanceCoveredKm: number;
  distanceRemainingKm: number;
  totalDistanceKm: number;
  currentLat?: number;
  currentLon?: number;
  weather?: StationWeather;
  highlight?: string;
  elevationSummary?: string;
  stations: StationStop[];
  coordinates?: [number, number][]; // [lon, lat] pairs for GeoJSON
  isLive: boolean;
  dataSource: 'railradar-live' | 'mock-simulation' | 'cached-database';
}

export interface TrainSearchResult {
  number: string;
  name: string;
  route: string;
  meta: string;
  source: string;
  destination: string;
}

export interface StationWeather {
  place: string;
  temp: string;
  tempC?: number;
  summary: string;
  wind: string;
  rain: string;
  humidity?: number;
  icon?: string;
}

export interface ElevationPoint {
  distanceKm: number;
  elevationM: number;
  label?: string;
}

export interface RouteLandmark {
  name: string;
  type: 'river' | 'bridge' | 'mountain' | 'tunnel' | 'city' | 'station';
  lat: number;
  lon: number;
  distanceKm?: number;
}
