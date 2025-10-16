import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useAppState } from '../contexts/AppStateContext';
import OfferRideForm from '../components/OfferRideForm';
import RequestRideForm from '../components/RequestRideForm';
import '../pages/styles/RideMapPage.css';

const MAP_CENTER: [number, number] = [-71.8998, 45.4042];

export default function RideMapPage() {
  const { eventId, mode } = useParams<{ eventId: string; mode: 'request' | 'offer' }>();
  const navigate = useNavigate();
  const {
    events,
    rides,
    rideRequests,
    publicRequests,
    currentUser,
    respondToRideRequest,
    publishRideRequest,
    updateDriverLocation,
  } = useAppState();

  const event = events.find((item) => item.id === eventId);
  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN ?? '';
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  const [publicPickup, setPublicPickup] = useState('');
  const [publicNotes, setPublicNotes] = useState('');
  const [publicFeedback, setPublicFeedback] = useState<string | null>(null);
  const [publicError, setPublicError] = useState<string | null>(null);

  useEffect(() => {
    if (!event || !mapboxToken || !mapContainerRef.current) {
      return;
    }

    mapboxgl.accessToken = mapboxToken;
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: MAP_CENTER,
      zoom: 12,
    });
    mapRef.current = map;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          map.flyTo({
            center: [position.coords.longitude, position.coords.latitude],
            zoom: 13,
          });
        },
        () => console.warn('[map] geolocalisation refusee'),
      );
    }

    return () => {
      map.remove();
    };
  }, [event, mapboxToken]);

  useEffect(() => {
    if (!event) {
      navigate('/home');
    }
  }, [event, navigate]);

  useEffect(() => {
    if (mode !== 'offer' || currentUser?.role !== 'driver') {
      return;
    }
    if (!navigator.geolocation) {
      console.warn('[ride-map] geolocation not supported');
      return;
    }
    let lastSent = 0;
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const timestamp = Date.now();
        if (timestamp - lastSent < 15000) {
          return;
        }
        lastSent = timestamp;
        updateDriverLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          updatedAt: new Date(),
        }).catch((error) => {
          console.warn('[ride-map] update driver location failed', error);
        });
      },
      (error) => {
        console.warn('[ride-map] geolocation watch error', error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 10000,
      },
    );
    return () => {
      if (typeof watchId === 'number') {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [mode, currentUser?.role, currentUser?.id, updateDriverLocation]);

  const driverRideIds = useMemo(
    () => rides.filter((ride) => ride.driverId === currentUser?.id).map((ride) => ride.id),
    [rides, currentUser?.id],
  );

  const driverRequests = useMemo(
    () =>
      rideRequests
        .filter((request) => request.status === 'pending' && driverRideIds.includes(request.rideId))
        .sort(
          (a, b) =>
            (a.distanceKm ?? Number.POSITIVE_INFINITY) -
            (b.distanceKm ?? Number.POSITIVE_INFINITY),
        ),
    [rideRequests, driverRideIds],
  );

  const eventPublicRequests = useMemo(
    () =>
      publicRequests
        .filter((request) => request.eventId === eventId)
        .sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
    [publicRequests, eventId],
  );

  if (!event) {
    return null;
  }

  const handleAcceptRequest = async (requestId: string) => {
    await respondToRideRequest(requestId, true);
  };

  const handlePublishRequest = async (submitEvent: React.FormEvent<HTMLFormElement>) => {
    submitEvent.preventDefault();
    if (!eventId || !publicPickup.trim()) {
      setPublicError('Indiquez une adresse de prise en charge.');
      return;
    }

    setPublicError(null);
    setPublicFeedback(null);
    try {
      await publishRideRequest(eventId, publicPickup.trim(), publicNotes.trim() || undefined);
      setPublicFeedback('Demande publique publiee.');
      setPublicPickup('');
      setPublicNotes('');
    } catch (err) {
      setPublicError('Impossible de publier la demande pour le moment.');
      console.error('[ride-map] publish request failed', err);
    }
  };

  return (
    <div className="ride-map-page">
      <div className="map-header">
        <button className="back-btn" onClick={() => navigate('/home')}>
          {'<- Retour'}
        </button>
        <div>
          <h1>{mode === 'offer' ? 'Offrir un trajet' : 'Demander un trajet'}</h1>
          <p>{event.title}</p>
          <small>Lieu : {event.location}</small>
        </div>
      </div>

      <div className="map-container">
        {mapboxToken ? (
          <div ref={mapContainerRef} className="map" />
        ) : (
          <div className="map-placeholder">
            Ajoutez VITE_MAPBOX_TOKEN pour afficher la carte interactive.
          </div>
        )}
      </div>

      <div className="ride-panel">
        {mode === 'request' ? (
          <div className="request-panel">
            <RequestRideForm selectedEvent={eventId} />

            <div className="publish-request">
              <h3>Publier une demande publique</h3>
              <p>
                Partagez votre adresse pour que les conducteurs a proximite puissent vous proposer un
                trajet.
              </p>
              <form onSubmit={handlePublishRequest}>
                <label htmlFor="publicPickup">Adresse de prise en charge</label>
                <input
                  id="publicPickup"
                  value={publicPickup}
                  onChange={(event) => setPublicPickup(event.target.value)}
                  placeholder="123 rue Exemple, Sherbrooke"
                  required
                />
                <label htmlFor="publicNotes">Message (optionnel)</label>
                <textarea
                  id="publicNotes"
                  value={publicNotes}
                  onChange={(event) => setPublicNotes(event.target.value)}
                  rows={3}
                  placeholder="Indiquez une heure souhaitee ou un detail utile"
                />
                {publicError ? <p className="publish-request__error">{publicError}</p> : null}
                {publicFeedback ? <p className="publish-request__success">{publicFeedback}</p> : null}
                <button type="submit">Publier ma demande</button>
              </form>
            </div>

            {eventPublicRequests.length > 0 ? (
              <div className="requests-section">
                <h3>Demandes publiques recentes</h3>
                {eventPublicRequests.map((request) => (
                  <div key={request.id} className="request-item">
                    <strong>{request.passengerName}</strong>
                    <p>Adresse : {request.pickupAddress}</p>
                    {request.message ? <p>Note : {request.message}</p> : null}
                    <small>
                      {new Date(request.createdAt).toLocaleString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                        day: 'numeric',
                        month: 'short',
                      })}
                    </small>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="offer-panel">
            <OfferRideForm selectedEvent={eventId} />

            <div className="requests-section">
              <h3>Demandes pour vos trajets</h3>
              {driverRequests.length === 0 ? (
                <p className="empty-note">Pas encore de demandes.</p>
              ) : (
                driverRequests.map((request) => (
                  <div key={request.id} className="request-item">
                    <strong>{request.passengerName}</strong>
                    <p>
                      Adresse : {request.pickupAddress} - {request.passengers} passager
                      {request.passengers > 1 ? 's' : ''}
                    </p>
                    {typeof request.distanceKm === 'number' ? (
                      <p>
                        Distance estimee : {request.distanceKm.toFixed(1)} km
                        {typeof request.estimatedMinutes === 'number'
                          ? ` - ${request.estimatedMinutes} min`
                          : ''}
                      </p>
                    ) : null}
                    {request.message ? <p>Note : {request.message}</p> : null}
                    <button type="button" onClick={() => handleAcceptRequest(request.id)}>
                      Accepter
                    </button>
                  </div>
                ))
              )}
            </div>

            {eventPublicRequests.length > 0 ? (
              <div className="requests-section">
                <h3>Demandes publiques pour cet evenement</h3>
                {eventPublicRequests.map((request) => (
                  <div key={request.id} className="request-item">
                    <strong>{request.passengerName}</strong>
                    <p>Adresse : {request.pickupAddress}</p>
                    {request.message ? <p>Note : {request.message}</p> : null}
                    <small>
                      {new Date(request.createdAt).toLocaleString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                        day: 'numeric',
                        month: 'short',
                      })}
                    </small>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
