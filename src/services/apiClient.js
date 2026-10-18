// RailPulse Frontend API Client Layer

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

export async function searchTrains(query = '') {
  try {
    const res = await fetch(`${API_BASE_URL}/trains/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error('Search request failed');
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.warn('searchTrains API error:', err);
    return [];
  }
}

export async function getTrainStatus(trainNumber, date) {
  const queryParam = date ? `?date=${encodeURIComponent(date)}` : '';
  const res = await fetch(`${API_BASE_URL}/trains/${trainNumber}/status${queryParam}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch status for train ${trainNumber}`);
  }
  const json = await res.json();
  return json.data;
}

export async function getTrainRoute(trainNumber) {
  const res = await fetch(`${API_BASE_URL}/trains/${trainNumber}/route`);
  if (!res.ok) {
    throw new Error(`Failed to fetch route for train ${trainNumber}`);
  }
  const json = await res.json();
  return json.data;
}

export async function getStationWeather(stationCode, lat, lon) {
  try {
    const query = (lat && lon) ? `?lat=${lat}&lon=${lon}` : '';
    const res = await fetch(`${API_BASE_URL}/weather/station/${encodeURIComponent(stationCode)}${query}`);
    if (!res.ok) throw new Error('Weather fetch failed');
    const json = await res.json();
    return json.data;
  } catch (err) {
    console.warn('getStationWeather error:', err);
    return null;
  }
}

export async function getRouteElevation(trainNumber) {
  try {
    const res = await fetch(`${API_BASE_URL}/elevation/route/${trainNumber}`);
    if (!res.ok) throw new Error('Elevation fetch failed');
    const json = await res.json();
    return json.data;
  } catch (err) {
    console.warn('getRouteElevation error:', err);
    return null;
  }
}

export async function getRouteFeatures(trainNumber, lat, lon) {
  try {
    const query = (lat && lon) ? `?trainNumber=${trainNumber}&lat=${lat}&lon=${lon}` : `?trainNumber=${trainNumber}`;
    const res = await fetch(`${API_BASE_URL}/route-features${query}`);
    if (!res.ok) throw new Error('Route features fetch failed');
    const json = await res.json();
    return json.data;
  } catch (err) {
    console.warn('getRouteFeatures error:', err);
    return [];
  }
}
