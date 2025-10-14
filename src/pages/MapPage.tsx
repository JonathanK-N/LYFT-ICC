import { useEffect, useMemo, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import OfferRideForm from '../components/OfferRideForm';
import RequestRideForm from '../components/RequestRideForm';
import type { RideFilterValue } from '../components/RideFilters';
import RideFilters from '../components/RideFilters';
import { useDriverLocation } from '../hooks/useDriverLocation';
import { useAppState } from '../contexts/AppStateContext';
import '../pages/styles/MapPage.css';

// Impact Centre Chrétien - 219 rue Queen, Sherbrooke, QC, Canada
const MAP_CENTER: [number, number] = [-71.8998, 45.4042];

export default function MapPage() {
  const { rides, events, currentUser } = useAppState();
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'search' | 'offer'>('search');
  const [filters, setFilters] = useState<RideFilterValue>({ query: '', date: '' });
  const [shareLocation, setShareLocation] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<string>('');

  useDriverLocation({ enabled: shareLocation, interval: 15000 });

  useEffect(() => {
    const token = import.meta.env.VITE_MAPBOX_TOKEN ?? '';
    if (!token) {
      setMapError('Ajoutez VITE_MAPBOX_TOKEN pour activer la carte interactive.');
      return;
    }
    mapboxgl.accessToken = token;
    if (!mapContainerRef.current || mapRef.current) {
      return;
    }
    try {
      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: MAP_CENTER,
        zoom: 12,
      });
      mapRef.current = map;
      map.addControl(new mapboxgl.NavigationControl(), 'top-right');
      
      // Géolocalisation automatique
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            map.flyTo({ center: [longitude, latitude], zoom: 13 });
          },
          () => console.warn('[map] Géolocalisation refusée, utilisation de l\'église ICC par défaut')
        );
      }
      
      setMapError(null);
    } catch (error) {
      console.warn('[map] init failed', error);
      setMapError('Impossible de charger la carte. Vérifiez le token Mapbox.');
    }

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  const filteredRides = useMemo(() => {
    return rides.filter((ride) => {
      if (viewMode === 'offer' && ride.driverId !== currentUser?.id) {
        return false;
      }
      if (viewMode === 'search' && ride.driverId === currentUser?.id) {
        return false;
      }
      if (selectedEvent && ride.eventId !== selectedEvent) {
        return false;
      }
      if (filters.query) {
        const needle = filters.query.toLowerCase();
        const haystack = `${ride.origin} ${ride.destination} ${ride.driverName}`.toLowerCase();
        if (!haystack.includes(needle)) {
          return false;
        }
      }
      if (filters.date) {
        const rideDate = ride.departureTime.slice(0, 10);
        if (rideDate !== filters.date) {
          return false;
        }
      }
      return true;
    });
  }, [rides, viewMode, selectedEvent, filters, currentUser?.id]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    filteredRides.slice(0, 25).forEach((ride) => {
      const lat = ride.driverLat ?? ride.originLat;
      const lng = ride.driverLng ?? ride.originLng;
      if (typeof lat !== 'number' || typeof lng !== 'number') {
        return;
      }
      const el = document.createElement('button');
      el.className = 'map-marker';
      el.textContent = `${Math.max(ride.seatsAvailable - ride.seatsBooked, 0)}`;
      const marker = new mapboxgl.Marker(el).setLngLat([lng, lat]).addTo(map);
      markersRef.current.push(marker);
    });
  }, [filteredRides]);

  const isDriver = currentUser?.role === 'driver';

  return (
    <section className="map-page">
      <div className="map-page__header">
        <h1>{viewMode === 'search' ? 'Chercher un trajet' : 'Offrir un trajet'}</h1>
        <p>{viewMode === 'search' ? 'Trouvez un trajet pour vous rendre à un événement ICC' : 'Proposez un trajet pour un événement ICC'}</p>
        <div className="map-controls">
          <button
            type="button"
            className={viewMode === 'search' ? 'active' : ''}
            onClick={() => setViewMode('search')}
          >
            Chercher un trajet
          </button>
          <button
            type="button"
            className={viewMode === 'offer' ? 'active' : ''}
            onClick={() => setViewMode('offer')}
          >
            Offrir un trajet
          </button>
          {isDriver && viewMode === 'offer' ? (
            <button
              type="button"
              className={`share-location ${shareLocation ? 'active' : ''}`}
              onClick={() => setShareLocation((prev) => !prev)}
            >
              {shareLocation ? 'Arrêter le partage' : 'Partager ma position'}
            </button>
          ) : null}
        </div>
      </div>

      <div className="map-layout">
        <div className="map-column">
          <div className="map-panel">
            {mapError ? (
              <div className="map-placeholder">{mapError}</div>
            ) : (
              <div ref={mapContainerRef} className="map-canvas" aria-label="Carte des trajets" />
            )}
          </div>

          <div className="event-filter">
            <label htmlFor="event-select">Événement ICC</label>
            <select
              id="event-select"
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
            >
              <option value="">Tous les événements</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title} - {new Date(event.startTime).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>
          <RideFilters value={filters} onChange={setFilters} />

          <div className="ride-list">
            {filteredRides.length === 0 ? (
              <div className="ride-empty">
                {viewMode === 'search' 
                  ? 'Aucun trajet disponible pour vos critères.'
                  : 'Vous n\'avez pas encore proposé de trajet.'
                }
              </div>
            ) : (
              filteredRides.map((ride) => (
                <article key={ride.id} className="ride-card">
                  <div className="ride-route">
                    <div>
                      <strong>{ride.origin}</strong>
                      <span>
                        Départ {new Date(ride.departureTime).toLocaleString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div>
                      <strong>{ride.destination}</strong>
                      <span>{ride.seatsAvailable - ride.seatsBooked} place(s) disponible(s)</span>
                    </div>
                  </div>
                  <div className="ride-meta">
                    <div className="ride-meta__info">
                      <span>{ride.driverName}</span>
                      <span>
                        {ride.vehicle.make} {ride.vehicle.model} · {ride.vehicle.color}
                      </span>
                    </div>
                    {viewMode === 'search' && (
                      <button 
                        type="button"
                        onClick={() => {
                          const form = document.querySelector('#ride-select') as HTMLSelectElement;
                          if (form) form.value = ride.id;
                        }}
                      >
                        Sélectionner
                      </button>
                    )}
                    {viewMode === 'offer' && (
                      <button type="button">Gérer</button>
                    )}
                  </div>
                </article>
              ))
            )}
          </div>
        </div>

        <div className="form-column">
          {viewMode === 'offer' ? (
            <OfferRideForm selectedEvent={selectedEvent} />
          ) : (
            <RequestRideForm selectedEvent={selectedEvent} />
          )}
        </div>
      </div>
    </section>
  );
}