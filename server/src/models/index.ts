import mongoose, { Schema, Document } from 'mongoose';

// 1. Train Model
export interface ITrain extends Document {
  trainNumber: string;
  trainName: string;
  source: string;
  destination: string;
  sourceCode: string;
  destinationCode: string;
  daysOfRun: string[];
  totalDistanceKm: number;
  averageSpeedKmH?: number;
  updatedAt: Date;
}

const TrainSchema = new Schema<ITrain>({
  trainNumber: { type: String, required: true, unique: true, index: true },
  trainName: { type: String, required: true, index: true },
  source: { type: String, required: true },
  destination: { type: String, required: true },
  sourceCode: { type: String, required: true },
  destinationCode: { type: String, required: true },
  daysOfRun: { type: [String], default: [] },
  totalDistanceKm: { type: Number, default: 0 },
  averageSpeedKmH: { type: Number },
  updatedAt: { type: Date, default: Date.now }
});

// 2. Station Model
export interface IStation extends Document {
  code: string;
  name: string;
  state: string;
  zone?: string;
  lat: number;
  lon: number;
}

const StationSchema = new Schema<IStation>({
  code: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true, index: true },
  state: { type: String, required: true },
  zone: { type: String },
  lat: { type: Number, required: true },
  lon: { type: Number, required: true }
});

// 3. TrainRoute Model
export interface ITrainRoute extends Document {
  trainNumber: string;
  stations: Array<{
    stationCode: string;
    stationName: string;
    day: number;
    distanceKm: number;
    arrivalTime: string;
    departureTime: string;
    haltMinutes: number;
    lat: number;
    lon: number;
  }>;
  coordinates: [number, number][]; // [lon, lat] for GeoJSON
  routeHash: string;
  updatedAt: Date;
}

const TrainRouteSchema = new Schema<ITrainRoute>({
  trainNumber: { type: String, required: true, unique: true, index: true },
  stations: [{
    stationCode: String,
    stationName: String,
    day: Number,
    distanceKm: Number,
    arrivalTime: String,
    departureTime: String,
    haltMinutes: Number,
    lat: Number,
    lon: Number
  }],
  coordinates: { type: [[Number]], default: [] },
  routeHash: { type: String, index: true },
  updatedAt: { type: Date, default: Date.now }
});

// 4. JourneyStatusSnapshot Model
export interface IJourneyStatusSnapshot extends Document {
  trainNumber: string;
  journeyDate: string;
  currentStation: string;
  nextStation: string;
  delayMinutes: number;
  currentLat: number;
  currentLon: number;
  progressPercent: number;
  status: string;
  rawPayload?: any;
  createdAt: Date;
}

const JourneyStatusSnapshotSchema = new Schema<IJourneyStatusSnapshot>({
  trainNumber: { type: String, required: true, index: true },
  journeyDate: { type: String, required: true, index: true },
  currentStation: { type: String, required: true },
  nextStation: { type: String, required: true },
  delayMinutes: { type: Number, default: 0 },
  currentLat: { type: Number },
  currentLon: { type: Number },
  progressPercent: { type: Number, default: 0 },
  status: { type: String, required: true },
  rawPayload: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 7 } // 7-day TTL
});

JourneyStatusSnapshotSchema.index({ trainNumber: 1, journeyDate: 1, createdAt: -1 });

// 5. WeatherSnapshot Model
export interface IWeatherSnapshot extends Document {
  stationCode: string;
  tempC: number;
  condition: string;
  humidity: number;
  windKmh: number;
  rainProbability: number;
  expiresAt: Date;
  updatedAt: Date;
}

const WeatherSnapshotSchema = new Schema<IWeatherSnapshot>({
  stationCode: { type: String, required: true, unique: true, index: true },
  tempC: { type: Number, required: true },
  condition: { type: String, required: true },
  humidity: { type: Number, required: true },
  windKmh: { type: Number, required: true },
  rainProbability: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true, expires: 0 }, // MongoDB TTL auto-cleanup
  updatedAt: { type: Date, default: Date.now }
});

// 6. ElevationProfile Model
export interface IElevationProfile extends Document {
  routeHash: string;
  trainNumber: string;
  points: Array<{
    distanceKm: number;
    elevationM: number;
    label?: string;
  }>;
  highestElevationM: number;
  lowestElevationM: number;
  updatedAt: Date;
}

const ElevationProfileSchema = new Schema<IElevationProfile>({
  routeHash: { type: String, required: true, unique: true, index: true },
  trainNumber: { type: String, required: true, index: true },
  points: [{
    distanceKm: Number,
    elevationM: Number,
    label: String
  }],
  highestElevationM: { type: Number, default: 0 },
  lowestElevationM: { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now }
});

// 7. RoutePointOfInterest (Landmarks)
export interface IRoutePointOfInterest extends Document {
  routeHash: string;
  name: string;
  type: string; // river, bridge, tunnel, mountain, city
  lat: number;
  lon: number;
  description?: string;
}

const RoutePointOfInterestSchema = new Schema<IRoutePointOfInterest>({
  routeHash: { type: String, required: true, index: true },
  name: { type: String, required: true },
  type: { type: String, required: true },
  lat: { type: Number, required: true },
  lon: { type: Number, required: true },
  description: { type: String }
});

export const Train = mongoose.models.Train || mongoose.model<ITrain>('Train', TrainSchema);
export const Station = mongoose.models.Station || mongoose.model<IStation>('Station', StationSchema);
export const TrainRoute = mongoose.models.TrainRoute || mongoose.model<ITrainRoute>('TrainRoute', TrainRouteSchema);
export const JourneyStatusSnapshot = mongoose.models.JourneyStatusSnapshot || mongoose.model<IJourneyStatusSnapshot>('JourneyStatusSnapshot', JourneyStatusSnapshotSchema);
export const WeatherSnapshot = mongoose.models.WeatherSnapshot || mongoose.model<IWeatherSnapshot>('WeatherSnapshot', WeatherSnapshotSchema);
export const ElevationProfile = mongoose.models.ElevationProfile || mongoose.model<IElevationProfile>('ElevationProfile', ElevationProfileSchema);
export const RoutePointOfInterest = mongoose.models.RoutePointOfInterest || mongoose.model<IRoutePointOfInterest>('RoutePointOfInterest', RoutePointOfInterestSchema);
