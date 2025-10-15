import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../contexts/AppStateContext';
import '../pages/styles/HomePage.css';

export default function HomePage() {
  const { events, currentUser } = useAppState();
  const navigate = useNavigate();
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);

  const upcomingEvents = events
    .filter(event => new Date(event.startTime) > new Date())
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  const handleEventClick = (eventId: string) => {
    setSelectedEvent(eventId);
  };

  const handleRequestRide = () => {
    if (selectedEvent) {
      navigate(`/ride-request/${selectedEvent}`);
    }
  };

  const handleOfferRide = () => {
    if (selectedEvent) {
      navigate(`/ride-offer/${selectedEvent}`);
    }
  };

  return (
    <div className="home-page">
      <div className="home-header">
        <div className="welcome-section">
          <img src="/icons/icon-192.png" alt="ICC" className="home-logo" />
          <div>
            <h1>Bonjour {currentUser?.name?.split(' ')[0]} 👋</h1>
            <p>Événements ICC à venir</p>
          </div>
        </div>
      </div>

      <div className="events-container">
        {upcomingEvents.length === 0 ? (
          <div className="no-events">
            <p>Aucun événement à venir pour le moment</p>
          </div>
        ) : (
          <div className="events-grid">
            {upcomingEvents.map((event) => (
              <div
                key={event.id}
                className={`event-card ${selectedEvent === event.id ? 'selected' : ''}`}
                onClick={() => handleEventClick(event.id)}
              >
                <div className="event-icon">{event.icon}</div>
                <div className="event-info">
                  <h3>{event.title}</h3>
                  <p className="event-date">
                    {new Date(event.startTime).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                  <p className="event-location">📍 {event.location}</p>
                  {event.description && (
                    <p className="event-description">{event.description}</p>
                  )}
                </div>
                <div className="event-category">
                  <span className={`category-badge ${event.category}`}>
                    {event.category === 'service' ? 'Service' : 
                     event.category === 'conference' ? 'Conférence' : 
                     event.category === 'social' ? 'Social' : 
                     event.category === 'jeunesse' ? 'Jeunesse' : 'Spécial'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedEvent && (
        <div className="ride-actions">
          <div className="actions-header">
            <h2>Choisissez votre option</h2>
            <p>Pour l'événement sélectionné</p>
          </div>
          <div className="actions-buttons">
            <button 
              className="action-btn request-btn"
              onClick={handleRequestRide}
            >
              <span className="btn-icon">🚗</span>
              <div>
                <strong>Demander un trajet</strong>
                <small>Trouvez un conducteur</small>
              </div>
            </button>
            <button 
              className="action-btn offer-btn"
              onClick={handleOfferRide}
            >
              <span className="btn-icon">🚙</span>
              <div>
                <strong>Offrir un trajet</strong>
                <small>Aidez d'autres membres</small>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}