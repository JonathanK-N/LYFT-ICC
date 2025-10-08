import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FiCalendar,
  FiClock,
  FiFilter,
  FiMapPin,
  FiNavigation,
  FiSearch,
  FiUsers,
} from 'react-icons/fi';
import { useLocation } from 'react-router-dom';
import 'mapbox-gl/dist/mapbox-gl.css';
import { createMapboxMap } from '../lib/map/mapbox';
import { useAppState } from '../contexts/AppStateContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useUIStore } from '../modules/app/ui.store';
import '../pages/styles/MapPage.css';

const sheetVariants = {
  hidden: { translateY: 320 },
  visible: {
    translateY: 0,
    transition: { type: 'spring', stiffness: 160, damping: 22 },
  },
  exit: { translateY: 360, transition: { duration: 0.2, ease: 'easeIn' } },
};

export default function MapPage() {
  const { rides, events, rideRequests, currentUser } = useAppState();
  const { translate } = useLanguage();
  const locationState = useLocation().state as
    | { rideId?: string; mode?: 'driver' | 'passenger' }
    | undefined;

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mode, setMode] = useState<'driver' | 'passenger'>(
    locationState?.mode ?? 'passenger',
  );
  const [query, setQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedRideId, setSelectedRideId] = useState<string | undefined>(
    locationState?.rideId,
  );

  const { setRideSheet } = useUIStore((state) => ({
    setRideSheet: state.setRideSheet,
  }));

  useEffect(() => {
    if (!mapContainerRef.current) {
      return;
    }
    try {
      const instance = createMapboxMap(mapContainerRef.current, {
        zoom: 12.5,
        center: [2.3452, 48.8534],
        pitch: 55,
      });
      setMapReady(true);
      return () => instance.cleanup();
    } catch (error) {
      console.warn('[map] fallback placeholder', error);
      setMapError('Carte indisponible pour le moment.');
    }
  }, []);

useEffect(() => {
  if (selectedRideId) {
    setRideSheet(true, selectedRideId);
  } else {
    setRideSheet(false);
  }
}, [selectedRideId, setRideSheet]);

useEffect(() => () => setRideSheet(false), [setRideSheet]);

  const filteredRides = useMemo(() => {
    return rides.filter((ride) => {
      const matchesQuery = query
        ? `${ride.origin} ${ride.destination}`
            .toLowerCase()
            .includes(query.toLowerCase())
        : true;
      const matchesDate = dateFilter
        ? ride.departureTime.slice(0, 10) === dateFilter
        : true;
      if (mode === 'driver' && currentUser) {
        return matchesQuery && matchesDate && ride.driverId === currentUser.id;
      }
      return matchesQuery && matchesDate;
    });
  }, [rides, query, dateFilter, mode, currentUser]);

  const selectedRide = selectedRideId
    ? rides.find((ride) => ride.id === selectedRideId)
    : undefined;

  const eventSuggestions = events.slice(0, 4);
  const pendingForDriver =
    currentUser && mode === 'driver'
      ? rideRequests.filter(
          (request) =>
            request.status === 'pending' &&
            rides.some(
              (ride) =>
                ride.id === request.rideId && ride.driverId === currentUser.id,
            ),
        )
      : [];

  return (
    <section className="map-screen">
      <div className="map-overlay">
        <header className="map-toolbar">
          <div className="map-toolbar__title">
            <span className="eyebrow">Lyft-ICC</span>
            <h1>Carte communautaire</h1>
          </div>
          <div className="mode-toggle">
            <button
              type="button"
              className={mode === 'passenger' ? 'active' : ''}
              onClick={() => setMode('passenger')}
            >
              Passager
            </button>
            <button
              type="button"
              className={mode === 'driver' ? 'active' : ''}
              onClick={() => setMode('driver')}
            >
              Conducteur
              {pendingForDriver.length > 0 ? (
                <span className="badge">{pendingForDriver.length}</span>
              ) : null}
            </button>
          </div>
        </header>

        <div className="map-search">
          <div className="input-group">
            <FiSearch />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={translate('destination') ?? 'Destination'}
            />
          </div>
          <div className="input-group">
            <FiCalendar />
            <input
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value)}
              type="date"
            />
          </div>
          <button type="button" className="filter-btn">
            <FiFilter />
          </button>
        </div>

        <div className="map-badges">
          {eventSuggestions.map((event) => (
            <span key={event.id} className="map-badge">
              {event.icon} {event.title}
            </span>
          ))}
        </div>
      </div>

      <div className="map-canvas" ref={mapContainerRef}>
        {!mapReady && !mapError && (
          <div className="map-placeholder">Chargement de la carte...</div>
        )}
        {mapError ? <div className="map-error">{mapError}</div> : null}
      </div>

      <AnimatePresence>
        <motion.div
          className="map-sheet"
          variants={sheetVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <div className="map-sheet__handle" />
          <div className="map-sheet__header">
            <div>
              <p className="title">
                {mode === 'driver' ? 'Vos trajets' : 'Rides disponibles'}
              </p>
              <p className="subtitle">
                {mode === 'driver'
                  ? 'Visualisez et suivez les passagers en attentes.'
                  : 'Choisissez un conducteur pour votre prochain trajet.'}
              </p>
            </div>
            <span className="count">{filteredRides.length}</span>
          </div>

          <div className="map-sheet__list">
            {filteredRides.map((ride) => (
              <button
                type="button"
                key={ride.id}
                className={`map-ride ${
                  selectedRideId === ride.id ? 'active' : ''
                }`}
                onClick={() => setSelectedRideId(ride.id)}
              >
                <div className="map-ride__main">
                  <div className="map-ride__route">
                    <span>
                      <FiNavigation /> {ride.origin}
                    </span>
                    <span className="arrow">-&gt;</span>
                    <span>{ride.destination}</span>
                  </div>
                  <div className="map-ride__meta">
                    <span>
                      <FiClock />{' '}
                      {new Date(ride.departureTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span className="status">
                      {ride.seatsAvailable - ride.seatsBooked}/
                      {ride.seatsAvailable}
                    </span>
                  </div>
                </div>
                <div className="map-ride__driver">
                  <span className="avatar">
                    {ride.driverAvatar ? (
                      <img src={ride.driverAvatar} alt={ride.driverName} />
                    ) : (
                      <FiUsers />
                    )}
                  </span>
                  <div>
                    <strong>{ride.driverName}</strong>
                    <small>
                      {ride.vehicle.make} {ride.vehicle.model}
                    </small>
                  </div>
                </div>
              </button>
            ))}
            {filteredRides.length === 0 && (
              <div className="empty-state">Aucun trajet pour le moment.</div>
            )}
          </div>

          <AnimatePresence>
            {selectedRide && (
              <motion.div
                key={selectedRide.id}
                className="map-sheet__detail"
                initial={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                exit={{ opacity: 0, translateY: 20 }}
              >
                <div className="detail-header">
                  <strong>{selectedRide.driverName}</strong>
                  <span className={`badge status-${selectedRide.status}`}>
                    {selectedRide.status}
                  </span>
                </div>
                <p>
                  <FiMapPin /> {selectedRide.origin} -&gt; {selectedRide.destination}
                </p>
                <p>
                  <FiClock />{' '}
                  {new Date(selectedRide.departureTime).toLocaleString()}
                </p>
                {selectedRide.note ? (
                  <p className="note">“{selectedRide.note}”</p>
                ) : null}
                <div className="detail-actions">
                  <button type="button" className="secondary">
                    {mode === 'driver'
                      ? 'Ouvrir la mission'
                      : translate('reserve')}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
