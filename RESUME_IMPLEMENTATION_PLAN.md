# RailPulse — Resume-Focused Implementation Plan

## 1. Resume positioning

Present RailPulse as a real-time geospatial product, not just a train-tracking website.

Recommended project title:

```text
RailPulse — Real-Time Train Journey Intelligence Platform
```

Recommended one-line description:

```text
Built a full-stack MERN platform that visualizes live train movement, route progress, station ETAs, delay insights, weather, and journey analytics through an animated MapLibre interface.
```

The strongest resume signals are:

- Real-time data polling
- Multiple third-party API integrations
- Backend provider abstraction
- MongoDB data modeling
- Geospatial visualization
- MapLibre and Turf.js usage
- API caching and rate limiting
- Responsive premium UI
- Loading, stale-data, and failure states
- Production deployment and documentation

## 2. What to include on your resume

### Resume bullet points after Phase 1

- Developed a MERN-based real-time train tracking platform with train search, live running status, station ETAs, journey progress, delay indicators, and shareable journey links.
- Built an interactive MapLibre route visualization with animated train markers, current-station highlighting, completed/remaining route layers, and camera-follow mode.
- Designed an Express provider-adapter layer to normalize railway API responses and isolate the frontend from third-party provider formats.
- Implemented MongoDB models and caching for trains, stations, route geometry, and journey status snapshots.

### Resume bullet points after Phase 2

- Integrated weather, elevation, and route-surroundings data to create a journey intelligence dashboard with weather cards, elevation profiles, route landmarks, and delay analytics.
- Implemented polling, stale-data detection, retry handling, request validation, and API rate limiting for reliable live-data delivery.
- Built a responsive glassmorphism interface with animated transitions, skeleton states, accessible controls, and mobile-first layouts.

Do not claim a feature until it is connected to a real API and tested.

## 3. Recommended implementation order

### Milestone 1 — Stabilize the current project

Goal: preserve the current design while making the code easier to extend.

Tasks:

1. Keep the existing Vite frontend running.
2. Keep the Express backend running.
3. Extract the current train records from `src/main.jsx` into a data module.
4. Convert the main JSX into reusable components without changing the visual output.
5. Add TypeScript types for train, station, route, weather, and journey status.
6. Add a frontend API client folder.
7. Add a clear loading/error state model.

Deliverable: same visual experience, cleaner code structure, no behavior regression.

### Milestone 2 — Connect real train search and status

Goal: make the core dashboard genuinely live.

Tasks:

1. Confirm RailRadar endpoints and authentication format.
2. Add `RAILRADAR_API_KEY` and `RAILRADAR_BASE_URL` to `server/.env`.
3. Create `server/src/providers/railRadarProvider.ts`.
4. Add `GET /api/trains/search`.
5. Add `GET /api/trains/:trainNumber/status`.
6. Add `GET /api/trains/:trainNumber/route`.
7. Normalize all provider responses into internal types.
8. Replace the selected-train demo record with API data.
9. Keep demo data as a fallback for local development.
10. Add stale, unavailable, cancelled, completed, and not-started states.

Deliverable: selecting a real train updates the dashboard with real backend data.

### Milestone 3 — Add real geospatial mapping

Goal: make the map the strongest portfolio feature.

Tasks:

1. Add `VITE_MAPTILER_API_KEY` to `.env.local`.
2. Install and configure MapLibre GL JS.
3. Replace the CSS-only map with a MapLibre component.
4. Render route geometry as GeoJSON.
5. Render stations as map markers or GeoJSON points.
6. Render current train coordinates.
7. Animate the train marker between updates.
8. Style completed and remaining route segments.
9. Add current station highlighting.
10. Add follow-train camera mode.
11. Preserve the current map fallback if MapTiler is unavailable.

Deliverable: real train movement appears on the interactive map.

### Milestone 4 — Add MongoDB persistence

Goal: demonstrate real backend and database engineering.

Tasks:

1. Configure `MONGODB_URI` in `server/.env`.
2. Create Train and Station schemas.
3. Store route geometry and route hashes.
4. Create JourneyStatusSnapshot documents during polling.
5. Add indexes for train number, station code, journey date, and timestamps.
6. Add TTL expiry for temporary status/weather cache records.
7. Read cached data before calling providers.
8. Save provider failures and stale status safely without crashing.

Deliverable: the app persists useful data and reduces third-party API calls.

### Milestone 5 — Reliability and production quality

Goal: make the project defensible in interviews.

Tasks:

1. Add Zod validation for route parameters and query strings.
2. Add API rate limiting.
3. Add retry with exponential backoff.
4. Add timeout handling for external providers.
5. Add structured error responses.
6. Add request logging without exposing API keys.
7. Add automated unit tests for provider normalization.
8. Add API tests for health, search, status, and failure cases.
9. Add frontend tests for search, selection, loading, and error states.
10. Add CI build verification.

Deliverable: predictable behavior under provider failures and invalid input.

### Milestone 6 — Journey intelligence

Goal: expand the MVP into a differentiated product.

Tasks:

1. Store periodic journey snapshots.
2. Calculate distance covered and remaining with Turf.js.
3. Calculate completion percentage.
4. Add delay history charts.
5. Add station arrival history.
6. Add OpenWeather cards for current, next, and destination stations.
7. Add OpenTopography elevation profiles.
8. Add Overpass nearby landmarks and route features.
9. Add route summary and journey statistics.

Deliverable: the product gives useful travel intelligence instead of only showing a location.

### Milestone 7 — Optional advanced features

Implement only after the core product is reliable:

- User authentication
- Saved trains synced across devices
- Browser notifications
- Delay threshold alerts
- Destination approaching alerts
- Journey history
- Admin/provider monitoring dashboard

## 4. Do not change what is already implemented

The following are deliberate product decisions and should be preserved:

### Visual direction

- Do not replace the premium glassmorphism design with a generic admin dashboard.
- Keep the dark navy background and translucent glass cards.
- Preserve mint and electric-blue accent colors.
- Preserve rounded cards, subtle borders, soft shadows, and restrained gradients.
- Keep Manrope for interface text and DM Mono for metadata/status labels.
- Keep the overall Apple Maps, Linear, Stripe, and Notion-inspired visual language.

### Existing UI behavior

- Keep the search modal and `Ctrl/Cmd + K` shortcut.
- Keep dynamic switching between the three demo trains.
- Keep the responsive mobile layout.
- Keep animated train movement and route progress.
- Keep the journey progress card.
- Keep the station timeline.
- Keep the weather, delay, and route-highlight insight cards.
- Keep the refresh button and its animation.
- Keep the share action.
- Keep loading and fallback states when adding real APIs.

### Architecture decisions

- Do not call secret provider APIs directly from React.
- Do not expose MongoDB, RailRadar, OpenWeather, or OpenTopography credentials in frontend code.
- Do not remove the Express backend in favor of direct browser requests.
- Do not tightly couple the UI to RailRadar's response shape.
- Do not delete demo data; keep it as a local fallback and development fixture.
- Do not hardcode real API responses inside JSX after integration.
- Do not store secrets in `.env.example`.

### Data behavior

- Do not show fake data as “live” after real API integration is complete.
- Always display a last-updated timestamp.
- Clearly label stale, unavailable, estimated, and cached values.
- Gracefully handle cancelled, completed, not-started, and location-unavailable trains.

## 5. Suggested future folder structure

```text
src/
  app/
    App.jsx
    router.jsx
  components/
    ui/
    layout/
    map/
    train/
    journey/
    feedback/
  features/
    train-search/
    live-status/
    journey-map/
    analytics/
    weather/
  services/
    apiClient.js
    trainService.js
    weatherService.js
    analyticsService.js
  hooks/
    useTrainSearch.js
    useLiveStatus.js
    useAutoRefresh.js
  types/
    train.js
    journey.js
    weather.js
  utils/
    distance.js
    dates.js
    formatting.js

server/src/
  config/
  controllers/
  routes/
  services/
  providers/
  models/
  middleware/
  jobs/
  utils/
  types/
```

## 6. Portfolio deliverables

Before adding the project to your resume, prepare:

1. A deployed frontend URL.
2. A deployed backend URL or documented local setup.
3. A GitHub repository with a clean README.
4. Two or three screenshots or a short product demo video.
5. An architecture diagram.
6. A database schema diagram.
7. An API integration table.
8. A short performance and reliability section.
9. A list of known limitations.
10. A short demo script for interviews.

### README sections

- Product overview
- Screenshots
- Features
- Tech stack
- Architecture
- Environment setup
- API setup
- MongoDB setup
- Local development commands
- Deployment
- Testing
- Known limitations
- Future roadmap

## 7. Interview demo flow

Use this order in a portfolio walkthrough:

1. Search for a train by number.
2. Select the train and show the dashboard changing.
3. Explain that the browser calls your Express API.
4. Show the live status and last-updated timestamp.
5. Show the animated route and current train position.
6. Explain caching and provider adapters.
7. Show MongoDB journey snapshots.
8. Trigger or explain a stale-data/error state.
9. Show the responsive mobile layout.
10. Explain one tradeoff and one future improvement.

## 8. Final success criteria

RailPulse is resume-ready when:

- Real train search works.
- Real running status works through the backend.
- MapLibre displays real route geometry and coordinates.
- The dashboard changes without a page refresh.
- MongoDB stores useful train and journey data.
- Provider errors and stale responses are handled clearly.
- API keys remain private.
- The UI retains its premium visual identity.
- The app works on desktop and mobile.
- The README, architecture diagram, screenshots, and demo URL are ready.
