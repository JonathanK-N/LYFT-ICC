import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppState } from '../contexts/AppStateContext';
import '../pages/styles/HomePage.css';

export default function HomePage() {
  const { events, currentUser } = useAppState();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);

  type LocationState = { scrollTo?: string } | null;

  useEffect(() => {
    const scrollState = (location.state as LocationState) ?? null;
    if (!scrollState?.scrollTo) {
      return;
    }
    const timeout = window.setTimeout(() => {
      const target = document.getElementById(scrollState.scrollTo ?? '');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 120);

    navigate(location.pathname, { replace: true, state: undefined });
    return () => window.clearTimeout(timeout);
  }, [location, navigate]);

  const upcomingEvents = useMemo(
    () =>
      events
        .filter((event) => new Date(event.startTime) > new Date())
        .sort(
          (a, b) =>
            new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
        ),
    [events],
  );

  const handleEventClick = (eventId: string) => {
    setSelectedEvent((prev) => (prev === eventId ? null : eventId));
  };

  const handleRequestRide = () => {
    if (selectedEvent) {
      navigate(`/ride-map/${selectedEvent}/request`);
    }
  };

  const handleOfferRide = () => {
    if (selectedEvent) {
      navigate(`/ride-map/${selectedEvent}/offer`);
    }
  };

  return (
    <div className="home-page">
      <div className="home-header">
        <div className="welcome-section fade-up">
          <img src="/icons/icon-192.png" alt="ICC" className="home-logo" />
          <div>
            <h1>
              Bonjour {currentUser?.name?.split(' ')[0] ?? 'famille ICC'} !
            </h1>
            <p>Evenements ICC a venir</p>
          </div>
        </div>
      </div>

      <div className="events-container" id="events-section">
        {upcomingEvents.length === 0 ? (
          <div className="no-events fade-up">
            <p>Aucun evenement a venir pour le moment</p>
          </div>
        ) : (
          <div className="events-grid">
            {upcomingEvents.map((event, index) => (
              <motion.button
                key={event.id}
                type="button"
                className={`event-card ${selectedEvent === event.id ? 'selected' : ''}`}
                onClick={() => handleEventClick(event.id)}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.35,
                  ease: 'easeOut',
                  delay: index * 0.05,
                }}
                whileHover={{ y: -6 }}
                whileTap={{ scale: 0.98 }}
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
                      minute: '2-digit',
                    })}
                  </p>
                  <p className="event-location">Lieu : {event.location}</p>
                  {event.description ? (
                    <p className="event-description">{event.description}</p>
                  ) : null}
                </div>
                <div className="event-category">
                  <span className={`category-badge ${event.category}`}>
                    {event.category === 'service'
                      ? 'Service'
                      : event.category === 'conference'
                      ? 'Conference'
                      : event.category === 'social'
                      ? 'Social'
                      : event.category === 'jeunesse'
                      ? 'Jeunesse'
                      : 'Special'}
                  </span>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedEvent ? (
          <motion.div
            key="ride-actions"
            className="ride-actions"
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            <div className="actions-header">
              <h2>Choisissez votre prochain trajet</h2>
              <p>Pour l evenement selectionne</p>
            </div>
            <div className="actions-buttons">
              <motion.button
                className="action-btn request-btn"
                onClick={handleRequestRide}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
              >
                <span className="btn-icon" aria-hidden="true">
                  {'>>'}
                </span>
                <div>
                  <strong>Demander un trajet</strong>
                  <small>Trouvez un conducteur benevole</small>
                </div>
              </motion.button>
              <motion.button
                className="action-btn offer-btn"
                onClick={handleOfferRide}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
              >
                <span className="btn-icon" aria-hidden="true">
                  CAR
                </span>
                <div>
                  <strong>Offrir un trajet</strong>
                  <small>Aidez un membre de la famille ICC</small>
                </div>
              </motion.button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
