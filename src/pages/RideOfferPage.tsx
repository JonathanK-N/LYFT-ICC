import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppState } from '../contexts/AppStateContext';
import { geocodeAddress } from '../lib/map/geocoding';
import '../pages/styles/RidePage.css';

export default function RideOfferPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { events, createRide, currentUser } = useAppState();
  const [origin, setOrigin] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [seats, setSeats] = useState(3);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const event = events.find(e => e.id === eventId);
  const isDriver = currentUser?.role === 'driver';

  useEffect(() => {
    if (!event) {
      navigate('/home');
    }
  }, [event, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin.trim() || !departureTime) return;

    const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN ?? '';
    if (!mapboxToken) {
      alert('Configuration Mapbox manquante');
      return;
    }

    setLoading(true);
    try {
      const originCoords = await geocodeAddress(origin, mapboxToken);
      const destinationCoords = await geocodeAddress(event!.location, mapboxToken);

      await createRide({
        origin: originCoords,
        destination: destinationCoords,
        departureTime: new Date(departureTime).toISOString(),
        seatsAvailable: seats,
        notes: notes || undefined,
        eventId: eventId,
      });

      navigate('/home');
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      alert('Erreur lors de la création du trajet');
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
            <h1>Offrir un trajet</h1>
            <p>{event.title}</p>
            <small>📍 Destination: {event.location}</small>
          </div>
        </div>
      </div>

      <div className="ride-content">
        {!isDriver ? (
          <div className="not-driver">
            <div className="not-driver-icon">🚙</div>
            <h2>Profil conducteur requis</h2>
            <p>Vous devez compléter votre profil conducteur pour offrir des trajets.</p>
            <button 
              className="upgrade-btn"
              onClick={() => navigate('/profile')}
            >
              Devenir conducteur
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="ride-form">
            <div className="form-section">
              <h2>Point de départ</h2>
              <input
                type="text"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="Votre adresse de départ"
                className="address-input"
                required
              />
              <small className="input-help">
                D'où partirez-vous pour aller à l'événement ?
              </small>
            </div>

            <div className="form-section">
              <h2>Heure de départ</h2>
              <input
                type="datetime-local"
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                className="datetime-input"
                required
              />
            </div>

            <div className="form-section">
              <h2>Places disponibles</h2>
              <div className="seats-selector">
                {[1, 2, 3, 4, 5, 6].map(num => (
                  <button
                    key={num}
                    type="button"
                    className={`seat-btn ${seats === num ? 'active' : ''}`}
                    onClick={() => setSeats(num)}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-section">
              <h2>Message pour les passagers (optionnel)</h2>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Point de rendez-vous, instructions spéciales..."
                className="notes-input"
                rows={3}
              />
            </div>

            <div className="destination-info">
              <h3>🎯 Destination automatique</h3>
              <p>{event.location}</p>
              <small>La destination est définie par l'événement</small>
            </div>

            <button 
              type="submit" 
              className="submit-btn"
              disabled={!origin.trim() || !departureTime || loading}
            >
              {loading ? 'Création...' : 'Publier le trajet'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}