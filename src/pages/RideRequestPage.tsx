import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { geocodeAddress } from '../lib/map/geocoding';
import { useAppState } from '../contexts/AppStateContext';
import '../pages/styles/RidePage.css';

export default function RideRequestPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { events, rides, requestRide, currentUser } = useAppState();

  const [selectedRide, setSelectedRide] = useState<string>('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [passengers, setPassengers] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN ?? '';

  const event = events.find((item) => item.id === eventId);
  const availableRides = rides
    .filter((ride) => ride.eventId === eventId)
    .filter((ride) => ride.driverId !== currentUser?.id && ride.seatsAvailable > ride.seatsBooked);

  useEffect(() => {
    if (!event) {
      navigate('/home');
    }
  }, [event, navigate]);

  const handleSubmit = async (submitEvent: React.FormEvent<HTMLFormElement>) => {
    submitEvent.preventDefault();
    if (!selectedRide || !pickupAddress.trim()) {
      return;
    }
    if (!mapboxToken) {
      setError('Configurez VITE_MAPBOX_TOKEN pour activer la geolocalisation.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const pickup = await geocodeAddress(pickupAddress, mapboxToken);
      await requestRide({
        rideId: selectedRide,
        pickupAddress: pickup.address,
        pickupLat: pickup.lat,
        pickupLng: pickup.lng,
        passengers,
        notes: notes.trim() ? notes.trim() : undefined,
      });
      navigate('/home');
    } catch (err) {
      console.error('[ride-request] failed', err);
      setError(err instanceof Error ? err.message : 'Demande impossible pour le moment.');
    } finally {
      setLoading(false);
    }
  };

  if (!event) {
    return null;
  }

  if (!mapboxToken) {
    return (
      <div className="ride-page">
        <div className="ride-header">
          <button className="back-btn" onClick={() => navigate('/home')}>
            {'<- Retour'}
          </button>
          <div className="event-info">
            <div className="event-icon">i</div>
            <div>
              <h1>Demander un trajet</h1>
              <p>Configuration requise</p>
              <small>Ajoutez VITE_MAPBOX_TOKEN pour activer la localisation des adresses.</small>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ride-page">
      <div className="ride-header">
        <button className="back-btn" onClick={() => navigate('/home')}>
          {'<- Retour'}
        </button>
        <div className="event-info">
          <div className="event-icon">{event.icon}</div>
          <div>
            <h1>Demander un trajet</h1>
            <p>{event.title}</p>
            <small>Lieu : {event.location}</small>
          </div>
        </div>
      </div>

      <div className="ride-content">
        {availableRides.length === 0 ? (
          <div className="no-rides">
            <div className="no-rides-icon">Voiture</div>
            <h2>Aucun trajet disponible</h2>
            <p>Il n y a pas encore de conducteur pour cet evenement.</p>
            <button className="offer-alternative-btn" onClick={() => navigate(`/ride-offer/${eventId}`)}>
              Proposer un trajet a la place
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="ride-form">
            <div className="form-section">
              <h2>Choisir un trajet</h2>
              <div className="rides-list">
                {availableRides.map((ride) => (
                  <label key={ride.id} className="ride-option">
                    <input
                      type="radio"
                      name="ride"
                      value={ride.id}
                      checked={selectedRide === ride.id}
                      onChange={(event) => setSelectedRide(event.target.value)}
                    />
                    <div className="ride-details">
                      <div className="driver-info">
                        <strong>{ride.driverName}</strong>
                        <span className="vehicle-info">
                          {ride.vehicle.make} {ride.vehicle.model} - {ride.vehicle.color}
                        </span>
                      </div>
                      <div className="ride-route">
                        <span>Depart : {ride.origin}</span>
                        <span>
                          Heure :{' '}
                          {new Date(ride.departureTime).toLocaleString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                      </div>
                      <div className="seats-info">
                        {ride.seatsAvailable - ride.seatsBooked} place(s) disponible(s)
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-section">
              <h2>Votre adresse de prise en charge</h2>
              <input
                type="text"
                value={pickupAddress}
                onChange={(event) => setPickupAddress(event.target.value)}
                placeholder="123 rue Exemple, Sherbrooke, QC"
                className="address-input"
                required
              />
              <small className="input-help">Indiquez ou le conducteur doit venir vous chercher</small>
            </div>

            <div className="form-section">
              <h2>Nombre de passagers</h2>
              <select
                className="address-input"
                value={passengers}
                onChange={(event) => setPassengers(Number(event.target.value))}
              >
                {[1, 2, 3, 4, 5, 6].map((count) => (
                  <option key={count} value={count}>
                    {count} passager{count > 1 ? 's' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-section">
              <h2>Message (optionnel)</h2>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Informations supplementaires pour le conducteur..."
                className="notes-input"
                rows={3}
              />
            </div>

            {error ? <p className="form-error">{error}</p> : null}

            <button type="submit" className="submit-btn" disabled={!selectedRide || !pickupAddress.trim() || loading}>
              {loading ? 'Envoi...' : 'Envoyer la demande'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
