import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiMapPin,
  FiSearch,
  FiClock,
  FiStar,
  FiPhone,
  FiMessageCircle,
  FiX,
  FiMenu,
} from 'react-icons/fi';
import { useAppState } from '../contexts/AppStateContext';
import '../pages/styles/MapPage.css';

export default function MapPage() {
  const { rides, currentUser } = useAppState();
  const [mode, setMode] = useState<'passenger' | 'driver'>('passenger');
  const [selectedRide, setSelectedRide] = useState<string | null>(null);
  const [showRideDetails, setShowRideDetails] = useState(false);
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const mapRef = useRef<HTMLDivElement>(null);

  // Simuler une carte interactive
  useEffect(() => {
    if (mapRef.current) {
      // Créer des marqueurs simulés
      const markers = document.querySelectorAll('.map-marker');
      markers.forEach(marker => marker.remove());
      
      // Ajouter des marqueurs pour les trajets
      rides.slice(0, 5).forEach((ride, index) => {
        const marker = document.createElement('div');
        marker.className = 'map-marker';
        marker.style.left = `${20 + index * 15}%`;
        marker.style.top = `${30 + index * 10}%`;
        marker.innerHTML = '🚗';
        marker.onclick = () => {
          setSelectedRide(ride.id);
          setShowRideDetails(true);
        };
        mapRef.current?.appendChild(marker);
      });
    }
  }, [rides]);

  const currentRide = selectedRide ? rides.find(r => r.id === selectedRide) : null;

  return (
    <div className="uber-map-container">
      {/* Header */}
      <div className="uber-header">
        <button className="menu-btn">
          <FiMenu />
        </button>
        <div className="location-info">
          <div className="current-location">
            <FiMapPin />
            <span>Paris, France</span>
          </div>
        </div>
        <div className="user-avatar">
          <img 
            src={currentUser?.avatar || `https://ui-avatars.com/api/?name=${currentUser?.name}&background=000&color=fff`} 
            alt="Profile" 
          />
        </div>
      </div>

      {/* Search Bar */}
      <div className="uber-search-container">
        <div className="search-inputs">
          <div className="search-input-group">
            <div className="location-dot pickup-dot"></div>
            <input
              type="text"
              placeholder="Lieu de départ"
              value={pickup}
              onChange={(e) => setPickup(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="search-input-group">
            <div className="location-dot destination-dot"></div>
            <input
              type="text"
              placeholder="Où allez-vous ?"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
        <button className="search-btn">
          <FiSearch />
        </button>
      </div>

      {/* Mode Toggle */}
      <div className="mode-selector">
        <button 
          className={`mode-btn ${mode === 'passenger' ? 'active' : ''}`}
          onClick={() => setMode('passenger')}
        >
          Passager
        </button>
        <button 
          className={`mode-btn ${mode === 'driver' ? 'active' : ''}`}
          onClick={() => setMode('driver')}
        >
          Conducteur
        </button>
      </div>

      {/* Map */}
      <div className="uber-map" ref={mapRef}>
        <div className="map-overlay-pattern"></div>
        <div className="church-marker">
          <div className="church-icon">⛪</div>
          <span>Impact Centre Chrétien</span>
        </div>
      </div>

      {/* Bottom Sheet */}
      <motion.div 
        className="uber-bottom-sheet"
        initial={{ y: 300 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
      >
        <div className="sheet-handle"></div>
        
        <div className="sheet-header">
          <h3>{mode === 'passenger' ? 'Trajets disponibles' : 'Vos trajets'}</h3>
          <span className="ride-count">{rides.length}</span>
        </div>

        <div className="rides-list">
          {rides.length === 0 ? (
            <div className="empty-rides">
              <div className="empty-icon">🚗</div>
              <h4>Aucun trajet disponible</h4>
              <p>Soyez le premier à proposer un trajet vers l'église !</p>
              <button className="create-ride-btn">
                Créer un trajet
              </button>
            </div>
          ) : (
            rides.map((ride) => (
              <motion.div
                key={ride.id}
                className="ride-card"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setSelectedRide(ride.id);
                  setShowRideDetails(true);
                }}
              >
                <div className="ride-info">
                  <div className="route">
                    <div className="route-point">
                      <div className="route-dot start"></div>
                      <span>{ride.origin}</span>
                    </div>
                    <div className="route-line"></div>
                    <div className="route-point">
                      <div className="route-dot end"></div>
                      <span>{ride.destination}</span>
                    </div>
                  </div>
                  <div className="ride-meta">
                    <span className="time">
                      <FiClock />
                      {new Date(ride.departureTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    <span className="seats">
                      {ride.seatsAvailable - ride.seatsBooked} places
                    </span>
                  </div>
                </div>
                
                <div className="driver-info">
                  <img 
                    src={ride.driverAvatar || `https://ui-avatars.com/api/?name=${ride.driverName}&background=000&color=fff`}
                    alt={ride.driverName}
                    className="driver-avatar"
                  />
                  <div className="driver-details">
                    <span className="driver-name">{ride.driverName}</span>
                    <div className="driver-rating">
                      <FiStar />
                      <span>4.9</span>
                    </div>
                    <span className="vehicle">{ride.vehicle.make} {ride.vehicle.model}</span>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>

      {/* Ride Details Modal */}
      <AnimatePresence>
        {showRideDetails && currentRide && (
          <motion.div
            className="ride-details-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="modal-content"
              initial={{ y: 300, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 300, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
              <div className="modal-header">
                <h3>Détails du trajet</h3>
                <button 
                  className="close-btn"
                  onClick={() => setShowRideDetails(false)}
                >
                  <FiX />
                </button>
              </div>

              <div className="trip-route">
                <div className="route-visual">
                  <div className="route-point">
                    <div className="route-dot start"></div>
                    <div className="route-info">
                      <span className="location">{currentRide.origin}</span>
                      <span className="time">Départ à {new Date(currentRide.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                  <div className="route-line-vertical"></div>
                  <div className="route-point">
                    <div className="route-dot end"></div>
                    <div className="route-info">
                      <span className="location">{currentRide.destination}</span>
                      <span className="time">Arrivée estimée</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="driver-section">
                <div className="driver-card">
                  <img 
                    src={currentRide.driverAvatar || `https://ui-avatars.com/api/?name=${currentRide.driverName}&background=000&color=fff`}
                    alt={currentRide.driverName}
                    className="driver-photo"
                  />
                  <div className="driver-info-detailed">
                    <h4>{currentRide.driverName}</h4>
                    <div className="rating">
                      <FiStar />
                      <span>4.9 (127 trajets)</span>
                    </div>
                    <p className="vehicle-info">
                      {currentRide.vehicle.make} {currentRide.vehicle.model} • {currentRide.vehicle.color}
                    </p>
                  </div>
                  <div className="contact-actions">
                    <button className="contact-btn">
                      <FiPhone />
                    </button>
                    <button className="contact-btn">
                      <FiMessageCircle />
                    </button>
                  </div>
                </div>
              </div>

              {currentRide.notes && (
                <div className="trip-notes">
                  <h4>Message du conducteur</h4>
                  <p>"{currentRide.notes}"</p>
                </div>
              )}

              <div className="modal-actions">
                <button className="secondary-btn">
                  Partager
                </button>
                <button className="primary-btn">
                  Réserver ce trajet
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
