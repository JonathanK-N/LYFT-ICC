import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../contexts/AppStateContext';
import '../pages/styles/ProfilePage.css';

export default function ProfilePage() {
  const { currentUser, upgradeToDriver, logout } = useAppState();
  const navigate = useNavigate();
  const [driverMode, setDriverMode] = useState(false);
  const [vehicle, setVehicle] = useState({
    make: '',
    model: '',
    color: '',
    plate: '',
    seats: 4,
  });

  if (!currentUser) {
    return null;
  }

  const handleBecomeDriver = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await upgradeToDriver({
      make: vehicle.make,
      model: vehicle.model,
      color: vehicle.color,
      plate: vehicle.plate,
      seats: Number(vehicle.seats) || 4,
    });
    setDriverMode(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-avatar">
          <img
            src={currentUser.avatar ?? `/icons/icon-192.png`}
            alt={currentUser.name}
          />
        </div>
        <div className="profile-info">
          <h1>{currentUser.name}</h1>
          <p className="profile-role">{currentUser.role === 'admin' ? 'Administrateur' : currentUser.role === 'driver' ? 'Conducteur' : 'Passager'}</p>
          <div className="profile-contact">
            {currentUser.email && <span>📧 {currentUser.email}</span>}
            {currentUser.phone && <span>📱 {currentUser.phone}</span>}
          </div>
        </div>
      </div>

      <div className="profile-content">
        <div className="stats-section">
          <h2>Statistiques</h2>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-number">{currentUser.ridesGiven}</span>
              <span className="stat-label">Trajets offerts</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{currentUser.ridesTaken}</span>
              <span className="stat-label">Trajets pris</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{currentUser.badges.length}</span>
              <span className="stat-label">Badges</span>
            </div>
          </div>
        </div>

        {currentUser.badges.length > 0 && (
          <div className="badges-section">
            <h2>Badges</h2>
            <div className="badges-list">
              {currentUser.badges.map((badge, index) => (
                <span key={index} className="badge">
                  ⭐ {badge}
                </span>
              ))}
            </div>
          </div>
        )}

        {currentUser.role !== 'driver' && (
          <div className="driver-section">
            <h2>Devenir conducteur</h2>
            <p>Aidez les membres à rejoindre les événements ICC</p>
            
            {!driverMode ? (
              <button 
                className="become-driver-btn"
                onClick={() => setDriverMode(true)}
              >
                Compléter mon véhicule
              </button>
            ) : (
              <form onSubmit={handleBecomeDriver} className="vehicle-form">
                <div className="form-row">
                  <div className="form-field">
                    <label>Marque</label>
                    <input
                      value={vehicle.make}
                      onChange={(e) => setVehicle(prev => ({ ...prev, make: e.target.value }))}
                      placeholder="Toyota"
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label>Modèle</label>
                    <input
                      value={vehicle.model}
                      onChange={(e) => setVehicle(prev => ({ ...prev, model: e.target.value }))}
                      placeholder="Corolla"
                      required
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-field">
                    <label>Couleur</label>
                    <input
                      value={vehicle.color}
                      onChange={(e) => setVehicle(prev => ({ ...prev, color: e.target.value }))}
                      placeholder="Blanc"
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label>Plaque</label>
                    <input
                      value={vehicle.plate}
                      onChange={(e) => setVehicle(prev => ({ ...prev, plate: e.target.value }))}
                      placeholder="ABC-123"
                      required
                    />
                  </div>
                </div>
                
                <div className="form-field">
                  <label>Places disponibles</label>
                  <select
                    value={vehicle.seats}
                    onChange={(e) => setVehicle(prev => ({ ...prev, seats: Number(e.target.value) }))}
                  >
                    {[1,2,3,4,5,6,7,8].map(n => (
                      <option key={n} value={n}>{n} place{n > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>

                <div className="form-actions">
                  <button type="button" onClick={() => setDriverMode(false)}>
                    Annuler
                  </button>
                  <button type="submit">
                    Devenir conducteur
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {currentUser.vehicle && (
          <div className="vehicle-section">
            <h2>Mon véhicule</h2>
            <div className="vehicle-info">
              <p><strong>{currentUser.vehicle.make} {currentUser.vehicle.model}</strong></p>
              <p>Couleur: {currentUser.vehicle.color}</p>
              <p>Plaque: {currentUser.vehicle.plate}</p>
              <p>Places: {currentUser.vehicle.seats}</p>
            </div>
          </div>
        )}

        <div className="actions-section">
          {currentUser.role === 'admin' && (
            <button 
              className="admin-btn"
              onClick={() => navigate('/admin')}
            >
              🛠️ Espace administrateur
            </button>
          )}
          
          <button 
            className="logout-btn"
            onClick={handleLogout}
          >
            🚪 Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
}