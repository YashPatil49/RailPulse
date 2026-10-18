import React, { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { FiCompass, FiMapPin, FiNavigation, FiPlus, FiMinus } from 'react-icons/fi';
import { motion } from 'framer-motion';

export default function InteractiveMap({ train, onFollow }) {
  const mapContainer = useRef(null);
  const mapInstance = useRef(null);
  const trainMarkerRef = useRef(null);
  const [mapError, setMapError] = useState(false);
  const [isFollowing, setIsFollowing] = useState(true);

  const maptilerKey = import.meta.env.VITE_MAPTILER_API_KEY;
  const hasMaptilerKey = Boolean(
    maptilerKey &&
    maptilerKey !== 'PASTE_MAPTILER_API_KEY_HERE' &&
    maptilerKey.trim().length > 5
  );

  useEffect(() => {
    if (!mapContainer.current) return;

    // Build style: MapTiler if key present, else CartoDB Dark tiles
    const mapStyle = hasMaptilerKey
      ? `https://api.maptiler.com/maps/dataviz-dark/style.json?key=${maptilerKey}`
      : {
          version: 8,
          sources: {
            'carto-dark': {
              type: 'raster',
              tiles: [
                'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
                'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
                'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png'
              ],
              tileSize: 256,
              attribution: '© OpenStreetMap contributors, © CARTO'
            }
          },
          layers: [
            {
              id: 'carto-dark-layer',
              type: 'raster',
              source: 'carto-dark',
              minzoom: 0,
              maxzoom: 19
            }
          ]
        };

    let map;
    try {
      const initialCenter = [train?.currentLon || 75.8, train?.currentLat || 23.5];

      map = new maplibregl.Map({
        container: mapContainer.current,
        style: mapStyle,
        center: initialCenter,
        zoom: 5.5,
        attributionControl: false
      });

      mapInstance.current = map;

      map.on('error', (e) => {
        console.warn('MapLibre notice:', e);
        if (e?.error?.status === 403 || e?.status === 403 || (e?.message && String(e.message).includes('403'))) {
          // Switch gracefully to CartoDB dark raster style
          try {
            map.setStyle({
              version: 8,
              sources: {
                'carto-dark': {
                  type: 'raster',
                  tiles: [
                    'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
                    'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
                    'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png'
                  ],
                  tileSize: 256,
                  attribution: '© OpenStreetMap contributors, © CARTO'
                }
              },
              layers: [{ id: 'carto-dark-layer', type: 'raster', source: 'carto-dark' }]
            });
          } catch {}
        }
      });

      map.on('load', () => {
        updateMapData(map, train);
      });
    } catch (err) {
      console.warn('MapLibre WebGL initialization skipped:', err);
      setMapError(true);
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Update route and markers when train changes
  useEffect(() => {
    if (mapInstance.current && mapInstance.current.isStyleLoaded()) {
      updateMapData(mapInstance.current, train);
    }
  }, [train]);

  function updateMapData(map, trainData) {
    if (!trainData || !map) return;

    const coordinates = trainData.coordinates || (trainData.stations || []).map(s => [s.lon, s.lat]).filter(c => c[0] && c[1]);
    if (!coordinates || coordinates.length === 0) return;

    // 1. Route GeoJSON
    const routeGeoJSON = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates
      }
    };

    if (map.getSource('train-route')) {
      map.getSource('train-route').setData(routeGeoJSON);
    } else {
      map.addSource('train-route', {
        type: 'geojson',
        data: routeGeoJSON
      });

      // Glow route line underneath
      map.addLayer({
        id: 'train-route-glow',
        type: 'line',
        source: 'train-route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#72E7CC',
          'line-width': 7,
          'line-opacity': 0.25,
          'line-blur': 4
        }
      });

      // Main route line
      map.addLayer({
        id: 'train-route-line',
        type: 'line',
        source: 'train-route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#72E7CC',
          'line-width': 3,
          'line-opacity': 0.9
        }
      });
    }

    // 2. Train Marker
    const trainCoords = [trainData.currentLon || coordinates[0][0], trainData.currentLat || coordinates[0][1]];
    if (!trainMarkerRef.current) {
      const el = document.createElement('div');
      el.className = 'live-map-train-marker';
      el.innerHTML = `
        <div class="train-pulse-ring"></div>
        <div class="train-pulse-dot">
          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2.5" fill="none">
            <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
          </svg>
        </div>
      `;
      trainMarkerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat(trainCoords)
        .addTo(map);
    } else {
      trainMarkerRef.current.setLngLat(trainCoords);
    }

    // Follow camera if enabled
    if (isFollowing) {
      map.flyTo({
        center: trainCoords,
        zoom: Math.max(map.getZoom(), 6.5),
        duration: 1200,
        essential: true
      });
    }
  }

  const handleFollowClick = () => {
    setIsFollowing(true);
    if (mapInstance.current && train?.currentLon && train?.currentLat) {
      mapInstance.current.flyTo({
        center: [train.currentLon, train.currentLat],
        zoom: 7.2,
        duration: 1000
      });
    }
  };

  const zoomIn = () => {
    if (mapInstance.current) mapInstance.current.zoomIn();
  };

  const zoomOut = () => {
    if (mapInstance.current) mapInstance.current.zoomOut();
  };

  // Fallback to stylized RouteCanvas if WebGL has issues
  if (mapError) {
    const currentPosition = `${Math.max(14, Math.min(82, (train?.progressPercent || train?.progress || 30) + 20))}%`;
    return (
      <div className="route-canvas">
        <div className="map-topbar">
          <span><FiMapPin /> {train?.corridor || 'Trunk Railway Corridor'}</span>
          <button className="map-mode" onClick={() => setMapError(false)}><FiCompass /> Interactive View</button>
        </div>
        <div className="map-grid" />
        <div className="map-river" />
        <div className="map-route route-muted" />
        <div className="map-route route-live" style={{ width: `${Math.max(20, (train?.progressPercent || 30) + 2)}%` }} />
        <div className="route-station station-start"><span>{train?.source?.split(' ')[0]}</span><i /></div>
        <div className="route-station station-current"><span>{train?.currentStation || train?.current}</span><i /></div>
        <div className="route-station station-mid"><i /></div>
        <div className="route-station station-end"><span>{train?.destination?.split(' ')[0]}</span><i /></div>
        <motion.div className="train-marker" style={{ left: currentPosition }} animate={{ y: [0, -5, 0], rotate: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}>
          <FiNavigation />
        </motion.div>
        <div className="map-tooltip">
          <div className="tooltip-kicker">LIVE POSITION</div>
          <strong>{train?.trainNumber || train?.number} · {train?.trainName || train?.name}</strong>
          <span>Near {train?.currentStation || train?.current} · {train?.currentTime || train?.time} {train?.period}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="interactive-map-wrapper">
      <div ref={mapContainer} className="maplibre-container" />
      <div className="map-topbar overlay-bar">
        <span><FiMapPin /> {train?.corridor || 'Railway Corridor'}</span>
        <button
          className={`map-mode ${isFollowing ? 'active-mode' : ''}`}
          onClick={handleFollowClick}
        >
          <FiCompass /> Follow train
        </button>
      </div>

      <div className="map-controls">
        <button onClick={zoomIn} title="Zoom in"><span><FiPlus /></span></button>
        <button onClick={zoomOut} title="Zoom out"><span><FiMinus /></span></button>
        <button onClick={handleFollowClick} title="Center on train"><FiNavigation /></button>
      </div>

      <div className="map-tooltip live-geo-tooltip">
        <div className="tooltip-kicker">
          {train?.isLive ? 'LIVE RADAR TRACKING' : 'SCHEDULE TRACKING'}
        </div>
        <strong>{train?.trainNumber || train?.number} · {train?.trainName || train?.name}</strong>
        <span>Near {train?.currentStation || train?.current} · {train?.currentTime || train?.time} {train?.period}</span>
      </div>

      <div className="map-scale">
        {hasMaptilerKey ? 'MapTiler Vector' : 'OpenStreetMap Dark'}
      </div>
    </div>
  );
}
