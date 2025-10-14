import { useEffect, useMemo, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import OfferRideForm from '../components/OfferRideForm';
import type { RideFilterValue } from '../components/RideFilters';
import RideFilters from '../components/RideFilters';
import { useDriverLocation } from '../hooks/useDriverLocation';
import { useAppState } from '../contexts/AppStateContext';
import '../pages/styles/MapPage.css';

// Impact Centre Chrétien - 219 rue Queen, Sherbrooke, QC, Canada
const MAP_CENTER: [number, number] = [-71.8998, 45.4042];

export default function MapPage() {
  const { rides, currentUser } = useAppState();
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mode, setMode] = useState<'all' | 'driver'>('all');
  const [filters, setFilters] = useState<RideFilterValue>({ query: '', date: '' });
  const [shareLocation, setShareLocation] = useState(false);

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
      setMapError('Impossible de charger la carte. VÃ©rifiez le token Mapbox.');
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
      if (mode === 'driver' && ride.driverId !== currentUser?.id) {
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
  }, [rides, mode, filters, currentUser?.id]);

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
        <h1>Carte des trajets</h1>
        <p>Filtrez les trajets disponibles et suivez lÂ’activitÃ© des conducteurs en direct.</p>
        <div className="map-controls">
          <button
            type="button"
            className={mode === 'all' ? 'active' : ''}
            onClick={() => setMode('all')}
          >
            Tous les trajets
          </button>
          {isDriver ? (
            <button
              type="button"
              className={mode === 'driver' ? 'active' : ''}
              onClick={() => setMode('driver')}
            >
              Mes trajets conducteurs
            </button>
          ) : null}
          {isDriver ? (
            <button
              type="button"
              className={`share-location ${shareLocation ? 'active' : ''}`}
              onClick={() => setShareLocation((prev) => !prev)}
            >
              {shareLocation ? 'ArrÃªter le partage' : 'Partager ma position'}
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

          <RideFilters value={filters} onChange={setFilters} />

          <div className="ride-list">
            {filteredRides.length === 0 ? (
              <div className="ride-empty">
                Aucun trajet ne correspond Ã  vos critÃ¨res pour le moment.
              </div>
            ) : (
              filteredRides.map((ride) => (
                <article key={ride.id} className="ride-card">
                  <div className="ride-route">
                    <div>
                      <strong>{ride.origin}</strong>
                      <span>
                        DÃ©part {new Date(ride.departureTime).toLocaleString([], { hour: '2-digit', minute: '2-digit' })}
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
                        {ride.vehicle.make} {ride.vehicle.model} Â· {ride.vehicle.color}
                      </span>
                    </div>
                    <button type="button">Contacter</button>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>

        <div className="form-column">
          <OfferRideForm />
        </div>
      </div>
    </section>
  );
}
