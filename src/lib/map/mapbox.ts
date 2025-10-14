import mapboxgl from 'mapbox-gl';
import type { Map, Marker, LngLatLike } from 'mapbox-gl';
import { appConfig } from '../../config/app.config';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN ?? '';

export interface MapInstance {
  map: Map;
  markers: Marker[];
  cleanup: () => void;
}

export function createMapboxMap(container: string | HTMLElement, options?: { center?: LngLatLike; zoom?: number; pitch?: number }) {
  if (!mapboxgl.accessToken) {
    throw new Error('Token Mapbox manquant ou invalide. Vérifiez VITE_MAPBOX_TOKEN (doit commencer par pk.)');
  }

  const map = new mapboxgl.Map({
    container,
    style: appConfig.map.mapbox.styleUrl,
    center: options?.center ?? [-71.8998, 45.4042], // ICC Sherbrooke par défaut
    zoom: options?.zoom ?? 12,
    pitch: options?.pitch ?? 45,
    bearing: -15,
    antialias: true,
  });

  // Géolocalisation automatique
  if (!options?.center && navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        map.flyTo({ center: [longitude, latitude], zoom: 13 });
      },
      () => console.warn('[mapbox] Géolocalisation refusée, utilisation de l\'église ICC par défaut')
    );
  }

  const markers: Marker[] = [];

  const cleanup = () => {
    markers.forEach((marker) => marker.remove());
    map.remove();
  };

  return { map, markers, cleanup };
}
