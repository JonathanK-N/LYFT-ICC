export interface OptimizationPoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export interface OptimizationResult {
  orderedStops: Array<{
    id: string;
    order: number;
    etaMinutes?: number;
    distanceKm?: number;
  }>;
  totalDistanceKm?: number;
  totalDurationMinutes?: number;
}

interface OptimizeRouteParams {
  accessToken: string;
  driverStart: OptimizationPoint;
  destination: OptimizationPoint;
  stops: OptimizationPoint[];
}

const round = (value: number | undefined) =>
  typeof value === 'number' && Number.isFinite(value)
    ? Math.round((value + Number.EPSILON) * 100) / 100
    : undefined;

export async function optimizeRoute({
  accessToken,
  driverStart,
  destination,
  stops,
}: OptimizeRouteParams): Promise<OptimizationResult | undefined> {
  if (!accessToken || stops.length === 0) {
    return undefined;
  }

  const coordinates: OptimizationPoint[] = [
    driverStart,
    ...stops,
    destination,
  ];

  const coordsParam = coordinates
    .map((point) => `${point.lng},${point.lat}`)
    .join(';');

  const url = new URL(
    `https://api.mapbox.com/optimized-trips/v1/mapbox/driving/${coordsParam}`,
  );
  url.searchParams.set('access_token', accessToken);
  url.searchParams.set('roundtrip', 'false');
  url.searchParams.set('source', 'first');
  url.searchParams.set('destination', 'last');
  url.searchParams.set('overview', 'false');
  url.searchParams.set('annotations', 'duration,distance');

  const response = await fetch(url.toString());
  if (!response.ok) {
    console.warn('[mapbox] optimization request failed', response.status);
    return undefined;
  }

  const data = (await response.json()) as any;
  const trip = data?.trips?.[0];
  const waypoints: Array<any> = data?.waypoints ?? [];

  if (!trip || !Array.isArray(waypoints) || waypoints.length !== coordinates.length) {
    return undefined;
  }

  const legs: Array<any> = Array.isArray(trip.legs) ? trip.legs : [];

  const startIndex = 0;
  const endIndex = coordinates.length - 1;
  const stopWaypoints = waypoints.filter(
    (wp: any) => wp.waypoint_index !== startIndex && wp.waypoint_index !== endIndex,
  );

  const cumulativeDurations: number[] = [];
  let accumulatedSeconds = 0;
  legs.forEach((leg: any) => {
    accumulatedSeconds += typeof leg.duration === 'number' ? leg.duration : 0;
    cumulativeDurations.push(accumulatedSeconds);
  });

  const orderedStops = stopWaypoints
    .map((wp: any) => {
      const originalIndex = wp.waypoint_index;
      const coordinatesIndex = wp.trips_index ?? originalIndex;
      const order = originalIndex - 1;
      const legsIndex = Math.max(0, originalIndex - 1);
      const etaMinutes = cumulativeDurations[legsIndex]
        ? Math.round(cumulativeDurations[legsIndex] / 60)
        : undefined;
      const stop = coordinates[coordinatesIndex];
      if (!stop) {
        return undefined;
      }
      return {
        id: stop.id,
        order,
        etaMinutes,
        distanceKm: wp.distance ? round(wp.distance / 1000) : undefined,
      };
    })
    .filter(Boolean)
    .sort((a, b) => (a!.order ?? 0) - (b!.order ?? 0)) as OptimizationResult['orderedStops'];

  return {
    orderedStops,
    totalDistanceKm: round(typeof trip.distance === 'number' ? trip.distance / 1000 : undefined),
    totalDurationMinutes:
      typeof trip.duration === 'number' ? Math.round(trip.duration / 60) : undefined,
  };
}
