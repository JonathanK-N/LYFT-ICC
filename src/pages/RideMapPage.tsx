import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useAppState } from '../contexts/AppStateContext';
import { geocodeAddress } from '../lib/map/geocoding';
import '../pages/styles/RideMapPage.css';

const MAP_CENTER: [number, number] = [-71.8998, 45.4042];

export default function RideMapPage() {
  const { eventId, mode } = useParams<{ eventId: string; mode: 'request' | 'offer' }>();
  const navigate = useNavigate();
  const { events, rides, rideRequests, currentUser, createRide, requestRide, respondToRideRequest } = useAppState();
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  
  // États pour demander un trajet
  const [pickupAddress, setPickupAddress] = useState('');
  const [selectedRide, setSelectedRide] = useState<string>('');
  
  // États pour offrir un trajet
  const [origin, setOrigin] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [seats, setSeats] = useState(3);
  
  const [loading, setLoading] = useState(false);

  const event = events.find(e => e.id === eventId);
  const availableRides = rides.filter(ride => 
    ride.eventId === eventId && 
    ride.driverId !== currentUser?.id &&
    ride.seatsAvailable > ride.seatsBooked
  );
  const pendingRequests = rideRequests.filter(req => 
    req.status === 'pending' && 
    rides.find(r => r.id === req.rideId && r.driverId === currentUser?.id)
  );

  useEffect(() => {
    if (!event) {
      navigate('/home');
      return;
    }

    const token = import.meta.env.VITE_MAPBOX_TOKEN ?? '';
    if (!token || !mapContainerRef.current) return;

    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: MAP_CENTER,
      zoom: 12,
    });
    mapRef.current = map;

    // Géolocalisation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          map.flyTo({ center: [position.coords.longitude, position.coords.latitude], zoom: 13 });
        },
        () => console.warn('Géolocalisation refusée')
      );
    }

    return () => {
      map.remove();
    };
  }, [event, navigate]);

  const handleRequestRide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRide || !pickupAddress.trim()) return;

    setLoading(true);
    try {
      await requestRide(selectedRide, `📍 ${pickupAddress}`);
      navigate('/home');
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOfferRide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin.trim() || !departureTime) return;

    const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN ?? '';
    if (!mapboxToken) return;

    setLoading(true);
    try {
      const originCoords = await geocodeAddress(origin, mapboxToken);
      const destinationCoords = await geocodeAddress(event!.location, mapboxToken);

      await createRide({
        origin: originCoords,
        destination: destinationCoords,
        departureTime: new Date(departureTime).toISOString(),
        seatsAvailable: seats,
        eventId: eventId,
      });

      navigate('/home');
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    await respondToRideRequest(requestId, true);
  };

  if (!event) return null;

  return (
    <div className="ride-map-page">
      <div className="map-header">
        <button onClick={() => navigate('/home')}>← Retour</button>
        <div>
          <h1>{event.title}</h1>
          <p>{mode === 'request' ? 'Demander un trajet' : 'Offrir un trajet'}</p>
        </div>
      </div>

      <div className="map-container">
        <div ref={mapContainerRef} className="map" />
      </div>

      <div className="ride-panel">
        {mode === 'request' ? (
          <div className="request-panel">
            <h2>Trajets disponibles</h2>
            {availableRides.length === 0 ? (
              <p>Aucun trajet disponible</p>
            ) : (
              <form onSubmit={handleRequestRide}>
                <div className="rides-list">
                  {availableRides.map((ride) => (
                    <label key={ride.id} className="ride-option">
                      <input
                        type="radio"
                        name="ride"
                        value={ride.id}
                        checked={selectedRide === ride.id}
                        onChange={(e) => setSelectedRide(e.target.value)}
                      />
                      <div>
                        <strong>{ride.driverName}</strong>
                        <p>Départ: {ride.origin}</p>
                        <p>{new Date(ride.departureTime).toLocaleString()}</p>
                        <p>{ride.seatsAvailable - ride.seatsBooked} places</p>
                      </div>
                    </label>
                  ))}
                </div>
                
                <div className="pickup-section">
                  <h3>Votre adresse de ramassage</h3>
                  <input
                    type="text"
                    value={pickupAddress}
                    onChange={(e) => setPickupAddress(e.target.value)}
                    placeholder="123 rue Example, Sherbrooke, QC"
                    required
                  />
                </div>

                <button type="submit" disabled={!selectedRide || !pickupAddress.trim() || loading}>
                  {loading ? 'Envoi...' : 'Demander le trajet'}
                </button>
              </form>
            )}
          </div>
        ) : (
          <div className="offer-panel">
            {currentUser?.role !== 'driver' ? (
              <div>
                <h2>Profil conducteur requis</h2>
                <p>Complétez votre profil pour offrir des trajets</p>
                <button onClick={() => navigate('/profile')}>Devenir conducteur</button>
              </div>
            ) : (
              <>
                <h2>Offrir un trajet</h2>
                <form onSubmit={handleOfferRide}>
                  <div>
                    <label>Point de départ</label>
                    <input
                      type="text"
                      value={origin}
                      onChange={(e) => setOrigin(e.target.value)}
                      placeholder="Votre adresse"
                      required
                    />
                  </div>

                  <div>
                    <label>Heure de départ</label>
                    <input
                      type="datetime-local"
                      value={departureTime}
                      onChange={(e) => setDepartureTime(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label>Places disponibles</label>
                    <select value={seats} onChange={(e) => setSeats(Number(e.target.value))}>
                      {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>

                  <button type="submit" disabled={!origin.trim() || !departureTime || loading}>
                    {loading ? 'Création...' : 'Publier le trajet'}
                  </button>
                </form>

                {pendingRequests.length > 0 && (
                  <div className="requests-section">
                    <h3>Demandes reçues</h3>
                    {pendingRequests.map((request) => (
                      <div key={request.id} className="request-item">
                        <strong>{request.passengerName}</strong>
                        <p>{request.message}</p>
                        <button onClick={() => handleAcceptRequest(request.id)}>
                          Accepter
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}