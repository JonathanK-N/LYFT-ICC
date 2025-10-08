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
    console.warn('[mapbox] VITE_MAPBOX_TOKEN manquant. La carte utilisera un style par defaut.');
  }

  const map = new mapboxgl.Map({
    container,
    style: appConfig.map.mapbox.styleUrl,
    center: options?.center ?? [2.3522, 48.8566], // Paris
    zoom: options?.zoom ?? 12,
    pitch: options?.pitch ?? 45,
    bearing: -15,
    antialias: true,
  });

  const markers: Marker[] = [];

  const cleanup = () => {
    markers.forEach((marker) => marker.remove());
    map.remove();
  };

  return { map, markers, cleanup };
}
