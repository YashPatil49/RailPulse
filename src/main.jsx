import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FiActivity, FiArrowUpRight, FiBell, FiBookmark, FiCalendar, FiChevronRight,
  FiClock, FiCloudRain, FiCompass, FiHeart, FiMapPin, FiMenu, FiNavigation,
  FiRefreshCw, FiSearch, FiShare2, FiSliders, FiSun, FiWind, FiX, FiCheck
} from 'react-icons/fi';
import './styles.css';
import InteractiveMap from './components/InteractiveMap.jsx';
import {
  searchTrains,
  getTrainStatus,
  getRouteElevation,
  getRouteFeatures
} from './services/apiClient.js';

// Fallback baseline in case network is disconnected
const fallbackBaseline = {
  number: '12951',
  name: 'Mumbai Rajdhani Express',
  source: 'Mumbai Central',
  destination: 'New Delhi',
  corridor: 'Western Corridor',
  current: 'Surat',
  next: 'Vadodara Jn',
  status: 'On schedule',
  statusTone: 'good',
  lastUpdated: '12 SEC AGO',
  time: '19:43',
  period: 'PM',
  delayMessage: 'Departed on time',
  nextTime: '21:06 PM · +0 min',
  destinationTime: '08:32 AM · On schedule',
  progress: 19,
  covered: 263,
  remaining: 1121,
  total: 1384,
  weather: { place: 'SURAT', temp: '28°', summary: 'Clear skies · 52% humidity', wind: '12 km/h wind', rain: '4% rain' },
  highlight: 'Crossing the Tapi Basin',
  elevation: 'Track altitude ~380 m above sea level',
  stations: [
    { code: 'MMCT', name: 'Mumbai Central', state: 'Maharashtra', time: '17:00', delay: 'Departed', status: 'passed', distance: '0 km' },
    { code: 'BVI', name: 'Borivali', state: 'Maharashtra', time: '17:22', delay: 'Departed', status: 'passed', distance: '30 km' },
    { code: 'ST', name: 'Surat', state: 'Gujarat', time: '19:43', delay: 'On time', status: 'current', distance: '263 km' },
    { code: 'BRC', name: 'Vadodara Jn', state: 'Gujarat', time: '21:06', delay: '+0 min', status: 'upcoming', distance: '392 km' },
    { code: 'RTM', name: 'Ratlam Jn', state: 'Madhya Pradesh', time: '00:25', delay: 'Expected', status: 'upcoming', distance: '653 km' },
    { code: 'KOTA', name: 'Kota Jn', state: 'Rajasthan', time: '03:15', delay: 'Expected', status: 'upcoming', distance: '920 km' },
    { code: 'NDLS', name: 'New Delhi', state: 'Delhi', time: '08:32', delay: 'Expected', status: 'destination', distance: '1384 km' }
  ]
};

function GlassCard({ children, className = '', ...props }) {
  return <div className={`glass-card ${className}`} {...props}>{children}</div>;
}

function Pill({ children, tone = 'neutral' }) {
  return (
    <span className={`pill pill-${tone}`}>
      <span className="pill-dot" />
      {children}
    </span>
  );
}

function SectionLabel({ eyebrow, title, action }) {
  return (
    <div className="section-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      {action}
    </div>
  );
}

function Header({ onMenu }) {
  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand-mark"><FiActivity /></div>
        <div>
          <strong>RAIL<span>PULSE</span></strong>
          <small>JOURNEY INTELLIGENCE</small>
        </div>
      </div>
      <nav>
        <a className="active">Live journeys</a>
        <a>Insights</a>
        <a>Saved trains</a>
      </nav>
      <div className="header-actions">
        <button className="icon-button notification" title="Notifications">
          <FiBell /><i />
        </button>
        <button className="avatar">YP</button>
        <button className="mobile-menu icon-button" onClick={onMenu}>
          <FiMenu />
        </button>
      </div>
    </header>
  );
}

function SearchPanel({ onClose, onSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounceTimer = useRef(null);

  const fetchResults = useCallback(async (q) => {
    setLoading(true);
    try {
      const data = await searchTrains(q);
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResults('');
  }, [fetchResults]);

  const handleQueryChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      if (!val || val.trim().length >= 2) {
        fetchResults(val.trim());
      }
    }, 400);
  };

  return (
    <motion.div
      className="search-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="search-panel glass-card"
        initial={{ y: -18, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="search-panel-head">
          <div>
            <span className="eyebrow">TRACK A JOURNEY</span>
            <h2>Find your train</h2>
          </div>
          <button className="icon-button" onClick={onClose}><FiX /></button>
        </div>

        <div className="search-input large">
          <FiSearch />
          <input
            autoFocus
            placeholder="Search train number or name (e.g. 12951, Vande Bharat, Shatabdi)..."
            value={query}
            onChange={handleQueryChange}
          />
          <kbd>⌘ K</kbd>
        </div>

        <div className="search-results">
          {loading && (
            <div className="empty-state">
              <FiRefreshCw className="spinning" />
              <span>Searching railway database...</span>
            </div>
          )}

          {!loading && results.map(item => (
            <button
              className="result-row"
              key={item.number}
              onClick={() => onSelect(item.number)}
            >
              <span className="train-number">{item.number}</span>
              <span className="result-main">
                <strong>{item.name}</strong>
                <small>{item.route} · {item.meta}</small>
              </span>
              <FiChevronRight />
            </button>
          ))}

          {!loading && results.length === 0 && (
            <div className="empty-state">
              <FiSearch />
              <strong>No trains found</strong>
              <span>Try a 5-digit train number like 12951, 12002, 20901, 12301...</span>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function App() {
  const [selectedNumber, setSelectedNumber] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('train') || '12951';
  });

  const [train, setTrain] = useState(fallbackBaseline);
  const [loading, setLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState(Date.now());
  const [timeAgoText, setTimeAgoText] = useState('JUST NOW');

  // Load train data from backend
  const loadTrainData = useCallback(async (trainNum) => {
    try {
      const liveData = await getTrainStatus(trainNum);
      if (liveData) {
        // Map backend response fields into frontend model
        setTrain({
          number: liveData.trainNumber,
          name: liveData.trainName,
          source: liveData.source,
          destination: liveData.destination,
          corridor: liveData.corridor,
          current: liveData.currentStation,
          currentStation: liveData.currentStation,
          next: liveData.nextStation,
          status: liveData.status,
          statusTone: liveData.statusTone,
          lastUpdated: 'JUST NOW',
          time: liveData.currentTime,
          currentTime: liveData.currentTime,
          period: liveData.period,
          delayMessage: liveData.delayMessage,
          nextTime: liveData.nextStationEta,
          destinationTime: liveData.destinationEta,
          progress: liveData.progressPercent,
          progressPercent: liveData.progressPercent,
          covered: liveData.distanceCoveredKm,
          remaining: liveData.distanceRemainingKm,
          total: liveData.totalDistanceKm,
          currentLat: liveData.currentLat,
          currentLon: liveData.currentLon,
          coordinates: liveData.coordinates,
          weather: liveData.weather || {
            place: liveData.currentStation?.toUpperCase() || 'STATION',
            temp: '29°',
            summary: 'Clear skies · 55% humidity',
            wind: '14 km/h wind',
            rain: '5% rain'
          },
          highlight: liveData.highlight || 'Navigating Indian Railways corridor',
          elevation: liveData.elevationSummary || 'Altitude: ~380 m above sea level',
          stations: liveData.stations || [],
          isLive: liveData.isLive,
          dataSource: liveData.dataSource
        });
        setLastFetchTime(Date.now());
      }
    } catch (err) {
      console.warn('Backend load failed, using local fallback state:', err);
    }
  }, []);

  // Initial load and whenever selectedNumber changes
  useEffect(() => {
    loadTrainData(selectedNumber);
  }, [selectedNumber, loadTrainData]);

  // Auto-refresh polling every 60 seconds
  useEffect(() => {
    const pollInterval = setInterval(() => {
      loadTrainData(selectedNumber);
    }, 60000);
    return () => clearInterval(pollInterval);
  }, [selectedNumber, loadTrainData]);

  // Update "XX SEC AGO" counter
  useEffect(() => {
    const timer = setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - lastFetchTime) / 1000);
      if (elapsedSeconds < 10) setTimeAgoText('JUST NOW');
      else if (elapsedSeconds < 60) setTimeAgoText(`${elapsedSeconds} SEC AGO`);
      else setTimeAgoText(`${Math.floor(elapsedSeconds / 60)} MIN AGO`);
    }, 5000);
    return () => clearInterval(timer);
  }, [lastFetchTime]);

  const selectTrain = (number) => {
    setSelectedNumber(number);
    setSaved(false);
    setSearchOpen(false);
    // Update browser URL without reload
    const newUrl = `${window.location.pathname}?train=${number}`;
    window.history.pushState({ path: newUrl }, '', newUrl);
  };

  const refresh = async () => {
    setRefreshing(true);
    await loadTrainData(selectedNumber);
    setTimeout(() => setRefreshing(false), 800);
  };

  const handleShare = () => {
    const url = `${window.location.origin}${window.location.pathname}?train=${train.number}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <Header onMenu={() => setMenuOpen(!menuOpen)} />

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="mobile-nav"
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
          >
            <a>Live journeys</a>
            <a>Insights</a>
            <a>Saved trains</a>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="page-wrap">
        <section className="hero-row">
          <div>
            <div className="breadcrumb">
              <span>JOURNEYS</span>
              <FiChevronRight />
              <span>LIVE RADAR TRACKING</span>
            </div>
            <h1>Move with<br /><em>confidence.</em></h1>
            <p className="hero-copy">
              A clearer way to follow every mile.<br />
              Live rail intelligence for the journeys that matter.
            </p>
          </div>

          <button className="search-trigger glass-card" onClick={() => setSearchOpen(true)}>
            <span className="search-icon"><FiSearch /></span>
            <span className="search-copy">
              <strong>Search a train</strong>
              <small>Number or name (e.g. 12951, 12002)</small>
            </span>
            <kbd>⌘ K</kbd>
          </button>
        </section>

        <motion.section
          className="journey-head"
          key={train.number}
          initial={{ opacity: 0.3, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="journey-title">
            <div className="train-badge"><FiNavigation /></div>
            <div>
              <div className="overline">
                <span>{train.dataSource === 'railradar-live' ? 'LIVE RADAR' : 'ACTIVE JOURNEY'}</span>
                <i /> UPDATED {timeAgoText}
                {train.dataSource && (
                  <span className="badge-stale">
                    {train.dataSource === 'railradar-live' ? 'LIVE FEED' : 'SIMULATED'}
                  </span>
                )}
              </div>
              <h2>{train.number} <span>·</span> {train.name}</h2>
              <p>{train.source} <FiArrowUpRight /> {train.destination}</p>
            </div>
          </div>

          <div className="journey-actions">
            <Pill tone={train.statusTone}>{train.status}</Pill>
            <button
              className={`action-button ${saved ? 'saved' : ''}`}
              onClick={() => setSaved(!saved)}
            >
              {saved ? <FiHeart fill="currentColor" /> : <FiBookmark />}
              {saved ? 'Saved' : 'Save journey'}
            </button>
            <button className="action-button primary" onClick={handleShare}>
              {copied ? <FiCheck /> : <FiShare2 />}
              {copied ? 'Copied link!' : 'Share'}
            </button>
          </div>
        </motion.section>

        <section className="hero-grid">
          <GlassCard className="map-card">
            <InteractiveMap train={train} />
          </GlassCard>

          <div className="side-stack">
            <GlassCard className="status-card">
              <div className="card-topline">
                <span className="eyebrow">CURRENT STATUS</span>
                <button
                  className={`refresh-button ${refreshing ? 'spinning' : ''}`}
                  onClick={refresh}
                >
                  <FiRefreshCw /> Refresh
                </button>
              </div>

              <div className="status-main">
                <div>
                  <span className="status-label">Near {train.current}</span>
                  <strong>{train.time}<span> {train.period}</span></strong>
                  <small>{train.delayMessage}</small>
                </div>
                <div className="status-orb"><FiNavigation /></div>
              </div>

              <div className="status-divider" />

              <div className="status-grid">
                <div>
                  <span>Next stop</span>
                  <strong>{train.next}</strong>
                  <small>{train.nextTime}</small>
                </div>
                <div>
                  <span>Destination</span>
                  <strong>{train.destination.split('(')[0].trim()}</strong>
                  <small>{train.destinationTime}</small>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="progress-card">
              <div className="card-topline">
                <span className="eyebrow">JOURNEY PROGRESS</span>
                <span className="muted">{train.total?.toLocaleString()} km total</span>
              </div>

              <div className="progress-number">
                <strong>{train.progress}<span>%</span></strong>
                <div>
                  <span>{train.covered} km completed</span>
                  <small>{train.remaining} km remaining</small>
                </div>
              </div>

              <div className="progress-line">
                <motion.i
                  key={train.number}
                  initial={{ width: 0 }}
                  animate={{ width: `${train.progress}%` }}
                  transition={{ duration: 1.4, ease: 'easeOut' }}
                />
              </div>

              <div className="progress-cities">
                <span>{train.source.split(' ')[0].toUpperCase()}</span>
                <span>{train.destination.split(' ')[0].toUpperCase()}</span>
              </div>
            </GlassCard>
          </div>
        </section>

        <section className="lower-grid">
          <div className="stations-section">
            <SectionLabel
              eyebrow="ROUTE TIMELINE"
              title="The road ahead"
              action={<button className="text-button">All {train.stations?.length || 0} stops <FiArrowUpRight /></button>}
            />
            <GlassCard className="timeline-card">
              <div className="timeline-line" />
              {train.stations && train.stations.map((station) => (
                <div className={`station-row ${station.status}`} key={station.code}>
                  <div className="station-node">
                    {station.status === 'current' ? <FiNavigation /> : <span />}
                  </div>
                  <div className="station-info">
                    <div>
                      <strong>{station.name}</strong>
                      <span>{station.code} · {station.state}</span>
                    </div>
                    <div className="station-time">
                      <strong>{station.time}</strong>
                      <span className={station.status === 'current' ? 'delay' : ''}>{station.delay}</span>
                    </div>
                  </div>
                  <div className="station-distance">{station.distance}</div>
                </div>
              ))}
            </GlassCard>
          </div>

          <div className="insights-section">
            <SectionLabel
              eyebrow="AT A GLANCE"
              title="Journey signals"
              action={<FiSliders className="section-icon" />}
            />
            <div className="insight-grid">
              <GlassCard className="insight-card weather">
                <div className="insight-icon sun"><FiSun /></div>
                <span className="eyebrow">AT {train.weather?.place || 'STATION'}</span>
                <strong>{train.weather?.temp || '28°'}</strong>
                <span>{train.weather?.summary || 'Clear skies · 52% humidity'}</span>
                <div className="weather-footer">
                  <FiWind /> {train.weather?.wind || '12 km/h wind'}{' '}
                  <FiCloudRain /> {train.weather?.rain || '5% rain'}
                </div>
              </GlassCard>

              <GlassCard className="insight-card">
                <div className="insight-icon purple"><FiClock /></div>
                <span className="eyebrow">DELAY PROFILE</span>
                <strong>
                  {train.statusTone === 'warn' ? '+18' : train.statusTone === 'alert' ? '+45' : '+00'}{' '}
                  <small>min</small>
                </strong>
                <span>Current delay variance</span>
                <div className="sparkline">
                  <i /><i /><i /><i /><i /><i /><i />
                </div>
              </GlassCard>

              <GlassCard className="insight-card wide">
                <div className="wide-copy">
                  <div className="insight-icon blue"><FiCompass /></div>
                  <span className="eyebrow">ROUTE HIGHLIGHT</span>
                  <strong>{train.highlight}</strong>
                  <span>{train.elevation}</span>
                </div>
                <div className="mountain-art">
                  <span /><span /><span />
                </div>
              </GlassCard>
            </div>
          </div>
        </section>

        <footer>
          <span>RAILPULSE <i>·</i> REAL-TIME JOURNEY INTELLIGENCE</span>
          <span>Data refreshes automatically every 60s <b>●</b></span>
        </footer>
      </main>

      <AnimatePresence>
        {searchOpen && (
          <SearchPanel
            onClose={() => setSearchOpen(false)}
            onSelect={selectTrain}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
