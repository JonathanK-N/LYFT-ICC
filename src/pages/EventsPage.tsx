import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import {
  FiCalendar,
  FiClock,
  FiFilter,
  FiHeart,
  FiMapPin,
  FiSearch,
  FiShare2,
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../contexts/AppStateContext';
import { useLanguage } from '../contexts/LanguageContext';
import { redirectToDonation } from '../services/payments/stripe';
import type { Event } from '../types';
import '../pages/styles/EventsPage.css';

type EventFilter =
  | 'all'
  | 'messe'
  | 'priere'
  | 'conference'
  | 'jeunesse'
  | 'special';

const categoryFilters: Array<{ key: EventFilter; label: string }> = [
  { key: 'all', label: 'Tout' },
  { key: 'messe', label: 'Messes' },
  { key: 'priere', label: 'Priere' },
  { key: 'jeunesse', label: 'Jeunesse' },
  { key: 'conference', label: 'Conferences' },
  { key: 'special', label: 'Speciaux' },
];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (index = 1) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      delay: 0.08 * index,
      ease: 'easeOut' as const,
    },
  }),
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.12,
      staggerChildren: 0.1,
    },
  },
};

const staggerItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: 'easeOut' as const,
    },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (index = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      delay: 0.06 * index,
      ease: 'easeOut' as const,
    },
  }),
};

export default function EventsPage() {
  const { events, rides } = useAppState();
  const { translate } = useLanguage();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<EventFilter>('all');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    return events
      .filter((event) => (filter === 'all' ? true : event.category === filter))
      .filter((event) =>
        query
          ? event.title.toLowerCase().includes(query.toLowerCase()) ||
            event.location.toLowerCase().includes(query.toLowerCase())
          : true,
      )
      .sort(
        (a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
      );
  }, [events, filter, query]);

  const suggestions = useMemo(
    () =>
      filtered.map((event) => ({
        event,
        rides: rides.filter((ride) => ride.eventId === event.id),
      })),
    [filtered, rides],
  );

  const linkedRideCount = useMemo(
    () => rides.filter((ride) => Boolean(ride.eventId)).length,
    [rides],
  );

  const heroStats = useMemo(
    () => [
      { label: 'Evenements', value: events.length },
      { label: 'Rides lies', value: linkedRideCount },
      { label: 'Categories', value: 5 },
    ],
    [events.length, linkedRideCount],
  );

  const shareEvent = async (calendarEvent: Event) => {
    if (typeof navigator === 'undefined') {
      return;
    }
    const formattedDate = new Date(calendarEvent.startTime).toLocaleString(
      undefined,
      {
        weekday: 'long',
        hour: '2-digit',
        minute: '2-digit',
      },
    );
    const shareText = `${calendarEvent.title} - ${formattedDate} @ ${calendarEvent.location}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: calendarEvent.title,
          text: shareText,
        });
      } else if ('clipboard' in navigator) {
        await navigator.clipboard.writeText(shareText);
        window.alert('Details copies dans le presse-papiers.');
      }
    } catch (error) {
      console.warn('[events] share failed', error);
    }
  };

  return (
    <section className="events-screen">
      <motion.article
        className="panel events-hero"
        variants={fadeUp}
        initial="hidden"
        animate="visible"
      >
        <div className="events-hero__meta">
          <span className="tag">Agenda ICC</span>
          <h1>
            Celebrations, reunions et priere en un seul calendrier inspire de
            Lyft.
          </h1>
          <p>
            Synchronise avec la vision Impact Centre Chretien: retrouvez les
            messes, veilles, conferences et sorties jeunesse. Chaque evenement
            peut proposer un trajet dedie.
          </p>
        </div>
        <motion.div
          className="events-hero__stats"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {heroStats.map((stat) => (
            <motion.div key={stat.label} variants={staggerItem}>
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
            </motion.div>
          ))}
        </motion.div>
      </motion.article>

      <motion.article
        className="panel events-filters"
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={2}
      >
        <header className="panel-header">
          <div>
            <p className="title">Recherche</p>
            <p className="subtitle">
              Filtrez par categorie et trouvez les rides en un clic.
            </p>
          </div>
        </header>
        <div className="events-search">
          <div className="input-group">
            <FiSearch />
            <input
              id="query"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Messe, jeunesse, priere..."
            />
          </div>
          <motion.button
            type="button"
            className="filter-btn"
            onClick={() => setFilter('all')}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
          >
            <FiFilter />
          </motion.button>
        </div>
        <motion.div
          className="filter-chips"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {categoryFilters.map((item) => (
            <motion.button
              key={item.key}
              type="button"
              className={`chip-button ${filter === item.key ? 'active' : ''}`}
              onClick={() => setFilter(item.key)}
              variants={staggerItem}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
            >
              {item.label}
            </motion.button>
          ))}
        </motion.div>
      </motion.article>

      <motion.article
        className="panel events-list"
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={3}
      >
        <header className="panel-header">
          <div>
            <p className="title">
              <FiCalendar /> {translate('events')}
            </p>
            <p className="subtitle">
              {translate('suggestions_from_calendar')}
            </p>
          </div>
        </header>
        <div className="events-grid">
          {suggestions.length === 0 && (
            <div className="empty-state">Aucun evenement pour le moment.</div>
          )}
          {suggestions.map(({ event, rides: eventRides }, index) => (
            <motion.article
              key={event.id}
              className="event-card"
              variants={cardVariants}
              custom={index}
              initial="hidden"
              animate="visible"
              whileHover={{ translateY: -4 }}
              transition={{ type: 'spring', stiffness: 220, damping: 18 }}
            >
              <div className="event-card__header">
                <span className="event-icon">{event.icon}</span>
                <div>
                  <h3>{event.title}</h3>
                  <p>
                    <FiClock />{' '}
                    {new Date(event.startTime).toLocaleString(undefined, {
                      weekday: 'long',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
              <p className="event-desc">{event.description}</p>
              <p className="event-location">
                <FiMapPin /> {event.location}
              </p>
              <div className="event-actions">
                <motion.button
                  type="button"
                  onClick={() =>
                    navigate('/map', { state: { eventId: event.id } })
                  }
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {translate('search_rides')}
                </motion.button>
                <motion.button
                  type="button"
                  className="ghost"
                  onClick={() => shareEvent(event)}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <FiShare2 /> Partager
                </motion.button>
                <motion.button
                  type="button"
                  className="secondary"
                  onClick={() => redirectToDonation()}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <FiHeart /> {translate('donation_link')}
                </motion.button>
              </div>
              <div className="event-rides">
                {eventRides.length === 0 ? (
                  <small>
                    Aucun trajet encore planifie. Soyez le premier conducteur.
                  </small>
                ) : (
                  eventRides.map((ride) => (
                    <motion.div
                      key={ride.id}
                      className="ride-chip"
                      variants={staggerItem}
                      initial="hidden"
                      animate="visible"
                    >
                      <strong>{ride.driverName}</strong>
                      <span>
                        {ride.origin}
                        {' -> '}
                        {ride.destination}
                      </span>
                      <small>
                        {new Date(ride.departureTime).toLocaleTimeString()} -{' '}
                        {ride.seatsAvailable - ride.seatsBooked} places
                      </small>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.article>
          ))}
        </div>
      </motion.article>
    </section>
  );
}
