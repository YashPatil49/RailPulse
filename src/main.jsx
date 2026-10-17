import React from 'react';
import { createRoot } from 'react-dom/client';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FiActivity, FiArrowUpRight, FiBell, FiBookmark, FiCalendar, FiChevronRight,
  FiClock, FiCloudRain, FiCompass, FiHeart, FiMapPin, FiMenu, FiNavigation,
  FiRefreshCw, FiSearch, FiShare2, FiSliders, FiSun, FiWind, FiX
} from 'react-icons/fi';
import './styles.css';

const mockSearch = [
  { number: '12951', name: 'Mumbai Rajdhani', route: 'Mumbai Central → New Delhi', meta: 'Daily · 16h 15m' },
  { number: '12952', name: 'New Delhi Rajdhani', route: 'New Delhi → Mumbai Central', meta: 'Daily · 16h 15m' },
  { number: '12953', name: 'August Kranti Rajdhani', route: 'Mumbai Central → Hazrat Nizamuddin', meta: 'Daily · 16h 10m' }
];

// Demo records keep the experience interactive before the RailRadar key is added.
// The same shape is used by the future /api/trains/:trainNumber/status response.
const trainData = {
  '12951': {
    number: '12951', name: 'Mumbai Rajdhani', source: 'Mumbai Central', destination: 'New Delhi',
    corridor: 'Western corridor', current: 'Surat', next: 'Vadodara Jn', status: 'On schedule', statusTone: 'good',
    lastUpdated: '42 SEC AGO', time: '06:20', period: 'AM', delayMessage: 'Arrived 6 min late', nextTime: '10:37 AM · +8 min', destinationTime: '20:35 PM · 14h 15m',
    progress: 19, covered: 263, remaining: 1121, total: 1384, weather: { place: 'SURAT', temp: '28°', summary: 'Clear skies · 62% humidity', wind: '14 km/h wind', rain: '8% rain' },
    highlight: 'Crossing the Western Ghats', elevation: 'Highest elevation ahead · 1,247 m',
    stations: [
      { code: 'BCT', name: 'Mumbai Central', state: 'Maharashtra', time: '06:20', delay: 'Departed', status: 'passed', distance: '0 km' },
      { code: 'ST', name: 'Surat', state: 'Gujarat', time: '09:08', delay: '+6 min', status: 'current', distance: '263 km' },
      { code: 'BRC', name: 'Vadodara Jn', state: 'Gujarat', time: '10:37', delay: '+8 min', status: 'upcoming', distance: '392 km' },
      { code: 'ADI', name: 'Ahmedabad Jn', state: 'Gujarat', time: '12:10', delay: 'Expected', status: 'upcoming', distance: '491 km' },
      { code: 'NDLS', name: 'New Delhi', state: 'Delhi', time: '20:35', delay: 'Expected', status: 'destination', distance: '1384 km' }
    ]
  },
  '12952': {
    number: '12952', name: 'New Delhi Rajdhani', source: 'New Delhi', destination: 'Mumbai Central',
    corridor: 'North-western corridor', current: 'Kota Jn', next: 'Ratlam Jn', status: 'Delayed 18 min', statusTone: 'warn',
    lastUpdated: '1 MIN AGO', time: '11:42', period: 'AM', delayMessage: 'Held outside Kota Jn', nextTime: '14:16 PM · +18 min', destinationTime: '07:55 AM · Tomorrow',
    progress: 57, covered: 790, remaining: 594, total: 1384, weather: { place: 'KOTA', temp: '31°', summary: 'Sunny · 38% humidity', wind: '11 km/h wind', rain: '2% rain' },
    highlight: 'Across the Chambal basin', elevation: 'Highest elevation behind · 412 m',
    stations: [
      { code: 'NDLS', name: 'New Delhi', state: 'Delhi', time: '16:55', delay: 'Departed', status: 'passed', distance: '0 km' },
      { code: 'KOTA', name: 'Kota Jn', state: 'Rajasthan', time: '11:42', delay: '+18 min', status: 'current', distance: '790 km' },
      { code: 'RTM', name: 'Ratlam Jn', state: 'Madhya Pradesh', time: '14:16', delay: '+18 min', status: 'upcoming', distance: '936 km' },
      { code: 'BRC', name: 'Vadodara Jn', state: 'Gujarat', time: '17:25', delay: 'Expected', status: 'upcoming', distance: '1,195 km' },
      { code: 'BCT', name: 'Mumbai Central', state: 'Maharashtra', time: '07:55', delay: 'Tomorrow', status: 'destination', distance: '1,384 km' }
    ]
  },
  '12953': {
    number: '12953', name: 'August Kranti Rajdhani', source: 'Mumbai Central', destination: 'Hazrat Nizamuddin',
    corridor: 'Central-western corridor', current: 'Vapi', next: 'Surat', status: 'On schedule', statusTone: 'good',
    lastUpdated: '28 SEC AGO', time: '07:05', period: 'AM', delayMessage: 'Departed on time', nextTime: '08:24 AM · On time', destinationTime: '09:40 PM · 13h 35m',
    progress: 11, covered: 157, remaining: 1227, total: 1384, weather: { place: 'VAPI', temp: '27°', summary: 'Light cloud · 71% humidity', wind: '9 km/h wind', rain: '14% rain' },
    highlight: 'Following the Konkan edge', elevation: 'Highest elevation ahead · 683 m',
    stations: [
      { code: 'BCT', name: 'Mumbai Central', state: 'Maharashtra', time: '06:30', delay: 'Departed', status: 'passed', distance: '0 km' },
      { code: 'VAPI', name: 'Vapi', state: 'Gujarat', time: '07:05', delay: 'On time', status: 'current', distance: '157 km' },
      { code: 'ST', name: 'Surat', state: 'Gujarat', time: '08:24', delay: 'On time', status: 'upcoming', distance: '263 km' },
      { code: 'KOTA', name: 'Kota Jn', state: 'Rajasthan', time: '15:50', delay: 'Expected', status: 'upcoming', distance: '982 km' },
      { code: 'NZM', name: 'Hazrat Nizamuddin', state: 'Delhi', time: '21:40', delay: 'Expected', status: 'destination', distance: '1384 km' }
    ]
  }
};

function GlassCard({ children, className = '', ...props }) { return <div className={`glass-card ${className}`} {...props}>{children}</div>; }
function Pill({ children, tone = 'neutral' }) { return <span className={`pill pill-${tone}`}><span className="pill-dot" />{children}</span>; }
function SectionLabel({ eyebrow, title, action }) { return <div className="section-heading"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2></div>{action}</div>; }

function RouteCanvas({ train }) {
  const currentPosition = `${Math.max(14, Math.min(82, train.progress + 20))}%`;
  return <div className="route-canvas">
    <div className="map-topbar"><span><FiMapPin /> {train.corridor}</span><button className="map-mode"><FiCompass /> Follow train</button></div>
    <div className="map-grid" />
    <div className="map-river" />
    <div className="map-route route-muted" />
    <div className="map-route route-live" style={{ width: `${Math.max(20, train.progress + 2)}%` }} />
    <div className="route-station station-start"><span>{train.source.split(' ')[0]}</span><i /></div>
    <div className="route-station station-current"><span>{train.current}</span><i /></div>
    <div className="route-station station-mid"><i /></div>
    <div className="route-station station-end"><span>{train.destination.split(' ')[0]}</span><i /></div>
    <motion.div className="train-marker" style={{ left: currentPosition }} animate={{ y: [0, -5, 0], rotate: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}><FiNavigation /></motion.div>
    <div className="map-tooltip"><div className="tooltip-kicker">LIVE POSITION</div><strong>{train.number} · {train.name}</strong><span>Near {train.current} · {train.time} {train.period}</span></div>
    <div className="map-controls"><button><span>+</span></button><button><span>−</span></button><button><FiNavigation /></button></div>
    <div className="map-scale">100 km</div>
  </div>;
}

function Header({ onMenu }) {
  return <header className="topbar"><div className="brand"><div className="brand-mark"><FiActivity /></div><div><strong>RAIL<span>PULSE</span></strong><small>JOURNEY INTELLIGENCE</small></div></div><nav><a className="active">Live journeys</a><a>Insights</a><a>Saved trains</a></nav><div className="header-actions"><button className="icon-button notification"><FiBell /><i /></button><button className="avatar">YP</button><button className="mobile-menu icon-button" onClick={onMenu}><FiMenu /></button></div></header>;
}

function SearchPanel({ onClose, onSelect }) {
  const [query, setQuery] = React.useState('');
  const filtered = query ? mockSearch.filter(item => `${item.number} ${item.name}`.toLowerCase().includes(query.toLowerCase())) : mockSearch;
  return <motion.div className="search-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}><motion.div className="search-panel glass-card" initial={{ y: -18, opacity: 0 }} animate={{ y: 0, opacity: 1 }} onClick={e => e.stopPropagation()}><div className="search-panel-head"><div><span className="eyebrow">TRACK A JOURNEY</span><h2>Find your train</h2></div><button className="icon-button" onClick={onClose}><FiX /></button></div><div className="search-input large"><FiSearch /><input autoFocus placeholder="Train number or name" value={query} onChange={e => setQuery(e.target.value)} /><kbd>⌘ K</kbd></div><div className="search-results">{filtered.map(item => <button className="result-row" key={item.number} onClick={() => onSelect(item.number)}><span className="train-number">{item.number}</span><span className="result-main"><strong>{item.name}</strong><small>{item.route} · {item.meta}</small></span><FiChevronRight /></button>)}{filtered.length === 0 && <div className="empty-state"><FiSearch /><strong>No trains found</strong><span>Try a train number like 12951.</span></div>}</div></motion.div></motion.div>;
}

function App() {
  const [selectedNumber, setSelectedNumber] = React.useState('12951');
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const train = trainData[selectedNumber];
  const selectTrain = number => { setSelectedNumber(number); setSaved(false); setSearchOpen(false); };
  const refresh = () => { setRefreshing(true); setTimeout(() => setRefreshing(false), 1000); };
  React.useEffect(() => { const onKey = e => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setSearchOpen(true); } }; window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey); }, []);
  return <div className="app-shell"><div className="ambient ambient-one" /><div className="ambient ambient-two" />
    <Header onMenu={() => setMenuOpen(!menuOpen)} />
    <AnimatePresence>{menuOpen && <motion.div className="mobile-nav" initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}><a>Live journeys</a><a>Insights</a><a>Saved trains</a></motion.div>}</AnimatePresence>
    <main className="page-wrap">
      <section className="hero-row"><div><div className="breadcrumb"><span>JOURNEYS</span><FiChevronRight /><span>LIVE TRACKING</span></div><h1>Move with<br /><em>confidence.</em></h1><p className="hero-copy">A clearer way to follow every mile.<br />Live rail intelligence for the journeys that matter.</p></div><button className="search-trigger glass-card" onClick={() => setSearchOpen(true)}><span className="search-icon"><FiSearch /></span><span className="search-copy"><strong>Search a train</strong><small>Number or name</small></span><kbd>⌘ K</kbd></button></section>

      <motion.section className="journey-head" key={train.number} initial={{ opacity: .3, y: 5 }} animate={{ opacity: 1, y: 0 }}><div className="journey-title"><div className="train-badge"><FiNavigation /></div><div><div className="overline"><span>LIVE NOW</span><i /> UPDATED {train.lastUpdated}</div><h2>{train.number} <span>·</span> {train.name}</h2><p>{train.source} <FiArrowUpRight /> {train.destination}</p></div></div><div className="journey-actions"><Pill tone={train.statusTone}>{train.status}</Pill><button className={`action-button ${saved ? 'saved' : ''}`} onClick={() => setSaved(!saved)}>{saved ? <FiHeart fill="currentColor" /> : <FiBookmark />} {saved ? 'Saved' : 'Save journey'}</button><button className="action-button primary" onClick={() => navigator.clipboard?.writeText(`${window.location.origin}/journey/${train.number}`)}><FiShare2 /> Share</button></div></motion.section>

      <section className="hero-grid"><GlassCard className="map-card"><RouteCanvas train={train} /></GlassCard><div className="side-stack"><GlassCard className="status-card"><div className="card-topline"><span className="eyebrow">CURRENT STATUS</span><button className={`refresh-button ${refreshing ? 'spinning' : ''}`} onClick={refresh}><FiRefreshCw /> Refresh</button></div><div className="status-main"><div><span className="status-label">Near {train.current}</span><strong>{train.time}<span> {train.period}</span></strong><small>{train.delayMessage}</small></div><div className="status-orb"><FiNavigation /></div></div><div className="status-divider" /><div className="status-grid"><div><span>Next stop</span><strong>{train.next}</strong><small>{train.nextTime}</small></div><div><span>Destination</span><strong>{train.destination}</strong><small>{train.destinationTime}</small></div></div></GlassCard><GlassCard className="progress-card"><div className="card-topline"><span className="eyebrow">JOURNEY PROGRESS</span><span className="muted">{train.total.toLocaleString()} km total</span></div><div className="progress-number"><strong>{train.progress}<span>%</span></strong><div><span>{train.covered} km completed</span><small>{train.remaining} km remaining</small></div></div><div className="progress-line"><motion.i key={train.number} initial={{ width: 0 }} animate={{ width: `${train.progress}%` }} transition={{ duration: 1.4, ease: 'easeOut' }} /></div><div className="progress-cities"><span>{train.source.split(' ')[0].toUpperCase()}</span><span>{train.destination.split(' ')[0].toUpperCase()}</span></div></GlassCard></div></section>

      <section className="lower-grid"><div className="stations-section"><SectionLabel eyebrow="ROUTE TIMELINE" title="The road ahead" action={<button className="text-button">View all stations <FiArrowUpRight /></button>} /><GlassCard className="timeline-card"><div className="timeline-line" />{train.stations.map(station => <div className={`station-row ${station.status}`} key={station.code}><div className="station-node">{station.status === 'current' ? <FiNavigation /> : <span />}</div><div className="station-info"><div><strong>{station.name}</strong><span>{station.code} · {station.state}</span></div><div className="station-time"><strong>{station.time}</strong><span className={station.status === 'current' ? 'delay' : ''}>{station.delay}</span></div></div><div className="station-distance">{station.distance}</div></div>)}</GlassCard></div><div className="insights-section"><SectionLabel eyebrow="AT A GLANCE" title="Journey signals" action={<FiSliders className="section-icon" />} /><div className="insight-grid"><GlassCard className="insight-card weather"><div className="insight-icon sun"><FiSun /></div><span className="eyebrow">AT {train.weather.place}</span><strong>{train.weather.temp}</strong><span>{train.weather.summary}</span><div className="weather-footer"><FiWind /> {train.weather.wind} <FiCloudRain /> {train.weather.rain}</div></GlassCard><GlassCard className="insight-card"><div className="insight-icon purple"><FiClock /></div><span className="eyebrow">DELAY PROFILE</span><strong>{train.statusTone === 'warn' ? '+18' : '+06'} <small>min</small></strong><span>Average on this journey</span><div className="sparkline"><i /><i /><i /><i /><i /><i /><i /></div></GlassCard><GlassCard className="insight-card wide"><div className="wide-copy"><div className="insight-icon blue"><FiCompass /></div><span className="eyebrow">ROUTE HIGHLIGHT</span><strong>{train.highlight}</strong><span>{train.elevation}</span></div><div className="mountain-art"><span /><span /><span /></div></GlassCard></div></div></section>
      <footer><span>RAILPULSE <i>·</i> LIVE JOURNEY INTELLIGENCE</span><span>Data refreshes automatically <b>●</b></span></footer>
    </main><AnimatePresence>{searchOpen && <SearchPanel onClose={() => setSearchOpen(false)} onSelect={selectTrain} />}</AnimatePresence>
  </div>;
}

createRoot(document.getElementById('root')).render(<App />);
