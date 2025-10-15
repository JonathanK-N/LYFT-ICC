interface GeocodeResult {
  address: string;
  lat: number;
  lng: number;
}

const MAPBOX_BASE_URL = 'https://api.mapbox.com/geocoding/v5/mapbox.places/';

export async function geocodeAddress(address: string, token: string): Promise<GeocodeResult> {
  if (!token) {
    throw new Error('Mapbox token manquant. Renseignez VITE_MAPBOX_TOKEN.');
  }
  const url = `${MAPBOX_BASE_URL}${encodeURIComponent(address)}.json?access_token=${token}&limit=1&language=fr`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Erreur lors de la requete de geocodage.');
  }
  const data = await response.json();
  const feature = data?.features?.[0];
  if (!feature) {
    throw new Error('Adresse introuvable.');
  }
  const [lng, lat] = feature.center;
  return {
    address: feature.place_name ?? address,
    lat,
    lng,
  };
}
