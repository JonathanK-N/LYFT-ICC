import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppState } from '../contexts/AppStateContext';
import '../pages/styles/RidePage.css';

export default function RideRequestPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { events, rides, requestRide, currentUser } = useAppState();
  const [selectedRide, setSelectedRide] = useState<string>('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const event = events.find(e => e.id === eventId);
  const availableRides = rides.filter(ride => 
    ride.eventId === eventId && 
    ride.driverId !== currentUser?.id &&
    ride.seatsAvailable > ride.seatsBooked
  );

  useEffect(() => {
    if (!event) {
      navigate('/home');
    }
  }, [event, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRide || !pickupAddress.trim()) return;

    setLoading(true);
    try {
      await requestRide(selectedRide, `📍 Adresse: ${pickupAddress}${notes ? `\n💬 ${notes}` : ''}`);
      navigate('/home');
    } catch (error) {
      console.error('Erreur lors de la demande:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!event) return null;

  return (
    <div className="ride-page">
      <div className="ride-header">
        <button className="back-btn" onClick={() => navigate('/home')}>
          ← Retour
        </button>
        <div className="event-info">
          <div className="event-icon">{event.icon}</div>
          <div>
            <h1>Demander un trajet</h1>
            <p>{event.title}</p>
            <small>📍 {event.location}</small>
          </div>
        </div>
      </div>

      <div className="ride-content">
        {availableRides.length === 0 ? (
          <div className="no-rides">
            <div className="no-rides-icon">🚗</div>
            <h2>Aucun trajet disponible</h2>
            <p>Il n'y a pas encore de conducteur pour cet événement.</p>
            <button 
              className="offer-alternative-btn"
              onClick={() => navigate(`/ride-offer/${eventId}`)}
            >
              Proposer un trajet à la place
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
                      onChange={(e) => setSelectedRide(e.target.value)}
                    />
                    <div className="ride-details">
                      <div className="driver-info">
                        <strong>{ride.driverName}</strong>
                        <span className="vehicle-info">
                          {ride.vehicle.make} {ride.vehicle.model} • {ride.vehicle.color}
                        </span>
                      </div>
                      <div className="ride-route">
                        <span>📍 Départ: {ride.origin}</span>
                        <span>🕐 {new Date(ride.departureTime).toLocaleString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                          day: 'numeric',
                          month: 'short'
                        })}</span>
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
                onChange={(e) => setPickupAddress(e.target.value)}
                placeholder="123 rue Example, Sherbrooke, QC"
                className="address-input"
                required
              />
              <small className="input-help">
                Indiquez où le conducteur doit venir vous chercher
              </small>
            </div>

            <div className="form-section">
              <h2>Message (optionnel)</h2>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Informations supplémentaires pour le conducteur..."
                className="notes-input"
                rows={3}
              />
            </div>

            <button 
              type="submit" 
              className="submit-btn"
              disabled={!selectedRide || !pickupAddress.trim() || loading}
            >
              {loading ? 'Envoi...' : 'Envoyer la demande'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}