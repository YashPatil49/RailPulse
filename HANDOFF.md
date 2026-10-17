# RailPulse — Developer Handoff & Completion Guide

RailPulse is a MERN-based real-time Indian train journey intelligence dashboard. It combines live train status, animated route visualization, station timelines, journey analytics, weather, elevation, and route surroundings in a premium glassmorphism interface.

## 1. Current implementation status

### Implemented

- React + Vite frontend
- Express + TypeScript backend foundation
- MongoDB connection bootstrap
- Premium dark glassmorphism UI
- Responsive desktop/mobile layout
- Framer Motion animations
- Train search modal with `Ctrl/Cmd + K`
- Dynamic local records for 12951, 12952, and 12953
- Dynamic train title, route, status, stations, progress, weather, and map labels
- Mock backend search/status endpoints
- API-key placeholder files
- `design.md` visual design system

### Not yet implemented

- Real RailRadar integration
- Real MapTiler/MapLibre route map
- Real OpenWeather data
- Real OpenTopography elevation data
- Real Overpass route surroundings
- Persistent Train, Station, and JourneySnapshot models
- Journey analytics history
- Authentication and synced saved trains
- Notifications
- Production caching, rate limiting, logging, and tests

The frontend currently uses local demo data so the UI can be reviewed before credentials are added.

## 2. Project structure

```text
railpulse/
  src/main.jsx              # Main React UI and demo data
  src/styles.css            # Glassmorphism design system
  server/src/index.ts       # Express API and MongoDB bootstrap
  server/.env.example       # Backend credentials template
  .env.example              # Frontend credentials template
  design.md                 # Design system
  HANDOFF.md                # This guide
```

## 3. Stop the website completely

If the project is running in a terminal, press:

```text
Ctrl + C
```

Do this in every terminal running the frontend or backend.

If the terminal was closed but Node is still running, use PowerShell:

```powershell
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
```

Check whether ports are still occupied:

```powershell
netstat -ano | Select-String ':5173'
netstat -ano | Select-String ':4000'
```

## 4. Start the website again

```powershell
cd "C:\Users\Yash Patil\OneDrive\Documents\ChatGPT\New project"
npm install
npm run dev
```

Open the frontend:

```text
http://localhost:5173
```

Test the backend:

```text
http://localhost:4000/api/health
```

Run only the frontend:

```powershell
npm run dev:client
```

Run only the backend:

```powershell
npm run dev:server
```

Build the frontend:

```powershell
npm run build
```

## 5. API keys and environment variables

Do not paste real credentials into `.env.example` files. Create the real files locally.

Create the frontend file:

```powershell
Copy-Item .env.example .env.local
```

Edit `.env.local`:

```env
# Public browser key used by the MapLibre/MapTiler map.
VITE_MAPTILER_API_KEY=PASTE_MAPTILER_API_KEY_HERE

# Local Express API URL.
VITE_API_BASE_URL=http://localhost:4000/api
```

Create the backend file:

```powershell
Copy-Item server/.env.example server/.env
```

Edit `server/.env`:

```env
# MongoDB Atlas or local MongoDB connection string.
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/railpulse

# RailRadar secret API key and documented base URL.
RAILRADAR_API_KEY=PASTE_RAILRADAR_API_KEY_HERE
RAILRADAR_BASE_URL=PASTE_RAILRADAR_BASE_URL_HERE

# OpenWeather secret API key.
OPENWEATHER_API_KEY=PASTE_OPENWEATHER_API_KEY_HERE

# OpenTopography secret API key.
OPENTOPOGRAPHY_API_KEY=PASTE_OPENTOPOGRAPHY_API_KEY_HERE

# Overpass usually does not require a key.
OVERPASS_API_URL=https://overpass-api.de/api/interpreter

PORT=4000
CLIENT_ORIGIN=http://localhost:5173
```

Never expose these in frontend code or commit them to Git:

- `MONGODB_URI`
- `RAILRADAR_API_KEY`
- `OPENWEATHER_API_KEY`
- `OPENTOPOGRAPHY_API_KEY`

Only browser-safe values should use the `VITE_` prefix.

## 6. MongoDB setup

1. Create a MongoDB Atlas project or install MongoDB locally.
2. Create a database named `railpulse`.
3. Create a database user and password.
4. Allow the development machine IP in Atlas Network Access.
5. Copy the connection string into `server/.env` as `MONGODB_URI`.
6. Restart the backend.

The current backend already calls `mongoose.connect()` when `MONGODB_URI` exists. The next coder should add these models:

```text
User
Train
Station
TrainRoute
JourneyStatusSnapshot
SavedJourney
WeatherSnapshot
ElevationProfile
RoutePointOfInterest
```

Recommended indexes:

- `Train.trainNumber`: unique
- `Station.code`: unique
- `JourneyStatusSnapshot`: train number + journey date + timestamp
- `WeatherSnapshot`: station code + expiry time
- `ElevationProfile.routeHash`: unique

## 7. Real API connection architecture

The browser must call the Express server. It should not call secret third-party APIs directly.

```text
React frontend
    -> Express route
    -> Provider adapter
    -> External API
    -> Normalize response
    -> Cache response
    -> Return stable RailPulse response
```

Create these provider files:

```text
server/src/providers/railRadarProvider.ts
server/src/providers/mapTilerProvider.ts
server/src/providers/openWeatherProvider.ts
server/src/providers/openTopographyProvider.ts
server/src/providers/overpassProvider.ts
```

Use interfaces so the UI is not coupled to one provider:

```ts
export interface TrainDataProvider {
  searchTrains(query: string): Promise<TrainSearchResult[]>;
  getTrainStatus(trainNumber: string, journeyDate: string): Promise<TrainStatus>;
  getTrainRoute(trainNumber: string): Promise<TrainRoute>;
}
```

## 8. APIs to implement

### RailRadar

Implement:

```http
GET /api/trains/search?q=12951
GET /api/trains/:trainNumber
GET /api/trains/:trainNumber/status?date=YYYY-MM-DD
GET /api/trains/:trainNumber/route
```

Tasks:

1. Read the exact RailRadar documentation.
2. Confirm its authentication header and endpoint paths.
3. Read the key from `process.env.RAILRADAR_API_KEY`.
4. Normalize provider responses into stable RailPulse types.
5. Handle missing location, cancelled train, completed train, stale data, and provider errors.
6. Cache status responses for roughly 30–60 seconds.
7. Add retries with exponential backoff.
8. Add rate limiting.

### MapTiler and MapLibre

Use `VITE_MAPTILER_API_KEY` in a frontend map component.

1. Create a MapLibre map.
2. Load MapTiler style tiles.
3. Render route geometry as GeoJSON.
4. Render the train position as a marker or GeoJSON point.
5. Animate the marker when the live position changes.
6. Render completed and remaining route layers.
7. Render station markers and current-station highlight.
8. Add follow-train camera mode.
9. Show a fallback if the key or route is unavailable.

The existing CSS map is a visual fallback and should be replaced with real MapLibre after route coordinates are available.

### OpenWeather

Implement:

```http
GET /api/weather/station/:stationCode
GET /api/weather/route?trainNumber=12951
```

Return temperature, feels-like temperature, humidity, wind, condition, rain probability, and visibility. Cache weather for 15–30 minutes.

### OpenTopography

Implement:

```http
GET /api/elevation/route/:routeHash
```

Use Turf.js to sample route points, request elevation in batches, cache by route hash, and return chart-ready points plus highest/lowest elevation.

### Overpass

Implement:

```http
GET /api/route-features?routeHash=...
```

Use it for rivers, lakes, mountains, ghats, bridges, tunnels, monuments, tourist attractions, cities, and districts. Cache the result instead of querying on every refresh.

## 9. Frontend API replacement

Create:

```text
src/services/apiClient.js
src/services/trainService.js
src/services/weatherService.js
src/services/analyticsService.js
```

Example:

```js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function getTrainStatus(trainNumber, date) {
  const response = await fetch(
    `${API_BASE_URL}/trains/${trainNumber}/status?date=${date}`
  );

  if (!response.ok) throw new Error('Unable to load train status');
  return response.json();
}
```

Replace the local `trainData` usage gradually. Keep it as a development fallback when the API is unavailable.

The frontend state should include:

- `selectedTrainNumber`
- `journeyDate`
- `trainStatus`
- `trainRoute`
- `stations`
- `weather`
- `analytics`
- `lastUpdatedAt`
- `isLoading`
- `error`

TanStack Query is recommended for caching, polling, retries, and request deduplication.

## 10. Auto-refresh requirements

- Default interval: 60 seconds
- Manual refresh button
- Pause polling when the browser tab is hidden
- Resume polling when visible
- Show last successful update time
- Show a stale-data badge
- Stop after repeated provider failures
- Do not allow overlapping refresh requests

## 11. Roadmap from the original PRD

### Phase 1 — Live tracking MVP

1. Connect RailRadar search.
2. Connect RailRadar running status.
3. Normalize train and station data.
4. Add Train and Station MongoDB models.
5. Add real route coordinates.
6. Replace CSS map with MapLibre.
7. Add animated live train marker.
8. Add current and next station logic.
9. Add auto-refresh and stale-data handling.
10. Add shareable journey URL.
11. Add loading, empty, and error states.
12. Test desktop and mobile layouts.

### Phase 2 — Journey intelligence

1. Store periodic journey snapshots.
2. Add distance and delay analytics.
3. Add timeline charts.
4. Add OpenWeather integration.
5. Add elevation profile.
6. Add Overpass route features.
7. Add authentication.
8. Sync favourites and recent journeys.
9. Add browser notifications.
10. Add production monitoring, rate limiting, and structured logging.

## 12. Security requirements

- Keep all secret provider keys on the Express server.
- Validate query parameters and dates with Zod.
- Add a CORS allow-list using `CLIENT_ORIGIN`.
- Add rate limiting to search and live-status routes.
- Sanitize train numbers and external response fields.
- Use HttpOnly cookies if authentication is added.
- Never commit `.env`, `.env.local`, or `server/.env`.
- Validate external coordinates before storing or rendering them.

## 13. Testing checklist

### Frontend

- Search by train number and name.
- Select all three demo trains.
- Verify every dashboard field changes.
- Verify search empty state.
- Verify refresh animation.
- Verify share button fallback.
- Verify mobile layout.
- Verify map fallback without a key.

### Backend

- `/api/health` returns success.
- Invalid train number returns a useful error.
- Provider timeout returns a friendly error.
- Missing API key does not crash the server.
- MongoDB unavailable mode is handled safely.
- Stale status is labelled correctly.
- Rate limiting blocks excessive requests.

## 14. Prompt for the next AI coder

```text
You are continuing work on RailPulse, a MERN-based real-time Indian train journey intelligence platform.

Read HANDOFF.md, design.md, package.json, src/main.jsx, src/styles.css, and server/src/index.ts before changing anything.

Current state:
- React/Vite frontend with premium dark glassmorphism UI.
- Framer Motion animations are already used.
- The UI supports three local demo trains and changes all dashboard details when a train is selected.
- Express + TypeScript backend exists.
- MongoDB connection bootstrap exists.
- Backend currently returns mock search/status responses.
- API key placeholders exist in .env.example and server/.env.example.

Primary goal:
Connect real APIs while preserving the current visual design.

Implement in this order:

1. Add MongoDB models for Train, Station, TrainRoute, JourneyStatusSnapshot, WeatherSnapshot, ElevationProfile, and RoutePointOfInterest.
2. Create provider adapters for RailRadar, OpenWeather, OpenTopography, and Overpass.
3. Add request validation with Zod.
4. Implement stable Express APIs for search, details, live status, route geometry, weather, elevation, analytics, and route features.
5. Keep secret provider keys server-side; only MapTiler's public browser key may be used in the frontend.
6. Add caching, retry, stale-data handling, and rate limiting.
7. Add a frontend service layer and replace demo data with API requests, keeping demo fallback behavior.
8. Add TanStack Query for polling and cache management.
9. Replace the CSS map fallback with MapLibre + MapTiler without losing the current glass UI.
10. Add real route animation, station markers, current-station highlight, completed/remaining route, and follow-train camera mode.
11. Add loading, empty, error, stale, and unavailable-data states.
12. Add journey snapshot analytics, weather cards, elevation profile, and route features.
13. Add authentication and synced saved trains only after the live tracking MVP is stable.

Do not redesign this into a generic admin or government portal. Preserve the premium direction: dark navy canvas, glass cards, mint/blue accents, restrained gradients, smooth transitions, animated live states, and responsive mobile behavior.

After implementation:
- Run npm run build.
- Run backend TypeScript validation.
- Test /api/health.
- Test search and train switching.
- Document every new environment variable.
- Report which integrations are real and which remain mocked.
```

## 15. Definition of done

RailPulse is ready for a portfolio release when:

- A user can search a real train.
- A user can open a real journey dashboard.
- Live status is fetched through the backend.
- The map displays real route geometry and train coordinates.
- The dashboard updates without a page refresh.
- Stale and unavailable data are clearly communicated.
- Weather and analytics are populated from backend services.
- MongoDB stores trains, stations, and journey snapshots.
- API keys are not exposed to the browser.
- The interface works on desktop and mobile.
- A README includes setup, architecture, screenshots, and deployment instructions.
