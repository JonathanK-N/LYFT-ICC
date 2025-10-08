import { useEffect, useMemo, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { createMapboxMap } from '../lib/map/mapbox';
import type { MapInstance } from '../lib/map/mapbox';
import { useAppState } from '../contexts/AppStateContext';
import '../pages/styles/MapPage.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN ?? '';
const MAP_CENTER: [number, number] = [2.3522, 48.8566];

function computeMarkerPosition(index: number): [number, number] {
  const offsetLng = (index % 5) * 0.02 - 0.04;
  const offsetLat = Math.floor(index / 5) * 0.015 - 0.02;
  return [MAP_CENTER[0] + offsetLng, MAP_CENTER[1] + offsetLat];
}

export default function MapPage() {
  const { rides, currentUser } = useAppState();
  const [filter, setFilter] = useState<'all' | 'driver'>('all');
  const [mapError, setMapError] = useState<string | null>(MAPBOX_TOKEN ? null : 'Ajoutez un token Mapbox (VITE_MAPBOX_TOKEN) pour afficher la carte.');
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<MapInstance | null>(null);

  useEffect(() => {
    if (!MAPBOX_TOKEN || !mapContainerRef.current || mapInstanceRef.current) {
      return;
    }
    try {
      mapInstanceRef.current = createMapboxMap(mapContainerRef.current, {
        center: MAP_CENTER,
        zoom: 11.5,
        pitch: 45,
      });
      setMapError(null);
    } catch (error) {
      console.warn('[map] initialisation echouee', error);
      setMapError('Carte indisponible. Verifiez votre configuration Mapbox.');
    }

    return () => {
      mapInstanceRef.current?.cleanup();
      mapInstanceRef.current = null;
    };
  }, []);

  const filteredRides = useMemo(() => {
    if (filter === 'driver' && currentUser) {
      return rides.filter((ride) => ride.driverId === currentUser.id);
    }
    return rides;
  }, [filter, rides, currentUser]);

  useEffect(() => {
    const instance = mapInstanceRef.current;
    if (!instance) {
      return;
    }

    instance.markers.forEach((marker) => marker.remove());
    instance.markers.length = 0;

    filteredRides.slice(0, 12).forEach((ride, index) => {
      const markerElement = document.createElement('button');
      markerElement.className = 'map-marker';
      markerElement.type = 'button';
      markerElement.textContent = `${Math.max(ride.seatsAvailable - ride.seatsBooked, 0)}`;
      const marker = new mapboxgl.Marker(markerElement)
        .setLngLat(computeMarkerPosition(index))
        .addTo(instance.map);
      instance.markers.push(marker);
    });
  }, [filteredRides]);

  return (
    <section className="map-page">
      <div className="map-page__header">
        <h1>Carte des trajets</h1>
        <p>Visualisez les trajets disponibles et planifiez rapidement votre prochain deplacement.</p>
        <div className="map-controls">
          <button
            type="button"
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            Tous les trajets
          </button>
          {currentUser?.role === 'driver' ? (
            <button
              type="button"
              className={filter === 'driver' ? 'active' : ''}
              onClick={() => setFilter('driver')}
            >
              Mes trajets conducteur
            </button>
          ) : null}
        </div>
      </div>

      <div className="map-layout">
        <div className="map-panel">
          {mapError ? (
            <div className="map-placeholder">{mapError}</div>
          ) : (
            <div ref={mapContainerRef} className="map-canvas" aria-label="Carte des trajets" />
          )}
        </div>

        <div className="ride-list">
          {filteredRides.length === 0 ? (
            <div className="ride-empty">
              Aucun trajet disponible pour le moment. Revenez plus tard ou proposez votre trajet.
            </div>
          ) : (
            filteredRides.map((ride) => (
              <article key={ride.id} className="ride-card">
                <div className="ride-route">
                  <div>
                    <strong>{ride.origin}</strong>
                    <span>
                      Depart {new Date(ride.departureTime).toLocaleString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div>
                    <strong>{ride.destination}</strong>
                    <span>
                      {ride.seatsAvailable - ride.seatsBooked} place(s) disponible(s)
                    </span>
                  </div>
                </div>
                <div className="ride-meta">
                  <div className="ride-meta__info">
                    <span>{ride.driverName}</span>
                    <span>
                      {ride.vehicle.make} {ride.vehicle.model} · {ride.vehicle.color}
                    </span>
                  </div>
                  <button type="button">Contacter</button>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
