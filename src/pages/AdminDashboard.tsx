import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAppState } from '../contexts/AppStateContext';
import '../pages/styles/AdminDashboard.css';

export default function AdminDashboard() {
  const { currentUser, members, rides, events, adminStats, sendAnnouncement, createEvent } = useAppState();
  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'members' | 'rides'>('overview');
  const [message, setMessage] = useState('');
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    location: '',
    startTime: '',
    category: 'service' as 'service' | 'conference' | 'social',
  });

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="admin-access-denied">
        <h1>Accès refusé</h1>
        <p>Vous devez être administrateur pour accéder à cette page.</p>
      </div>
    );
  }

  const handleAnnouncement = async (event: FormEvent) => {
    event.preventDefault();
    if (!message.trim()) return;
    await sendAnnouncement(message);
    setMessage('');
  };

  const handleCreateEvent = async (event: FormEvent) => {
    event.preventDefault();
    if (!eventForm.title || !eventForm.location || !eventForm.startTime) return;
    
    await createEvent({
      title: eventForm.title,
      description: eventForm.description,
      location: eventForm.location,
      startTime: eventForm.startTime,
      category: eventForm.category,
      icon: eventForm.category === 'service' ? '⛪' : eventForm.category === 'conference' ? '🎤' : '🎉',
    });
    
    setEventForm({
      title: '',
      description: '',
      location: '',
      startTime: '',
      category: 'service',
    });
  };

  return (
    <section className="admin-dashboard">
      <div className="admin-header">
        <h1>Administration ICC</h1>
        <p>Gestion des événements, membres et trajets</p>
      </div>

      <div className="admin-tabs">
        <button
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          Vue d'ensemble
        </button>
        <button
          className={activeTab === 'events' ? 'active' : ''}
          onClick={() => setActiveTab('events')}
        >
          Événements
        </button>
        <button
          className={activeTab === 'members' ? 'active' : ''}
          onClick={() => setActiveTab('members')}
        >
          Membres
        </button>
        <button
          className={activeTab === 'rides' ? 'active' : ''}
          onClick={() => setActiveTab('rides')}
        >
          Trajets
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="admin-content">
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Membres</h3>
              <div className="stat-number">{adminStats.totalMembers}</div>
              <p>Actifs cette semaine: {adminStats.activeThisWeek}</p>
            </div>
            <div className="stat-card">
              <h3>Trajets</h3>
              <div className="stat-number">{adminStats.totalRides}</div>
              <p>Cette semaine: {adminStats.ridesThisWeek}</p>
            </div>
            <div className="stat-card">
              <h3>Conducteurs</h3>
              <div className="stat-number">{adminStats.drivers}</div>
            </div>
            <div className="stat-card">
              <h3>Passagers</h3>
              <div className="stat-number">{adminStats.passengers}</div>
            </div>
          </div>

          <div className="announcement-section">
            <h2>Envoyer une annonce</h2>
            <form onSubmit={handleAnnouncement}>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Message à diffuser à tous les membres..."
                rows={4}
                required
              />
              <button type="submit">Envoyer l'annonce</button>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'events' && (
        <div className="admin-content">
          <div className="section-header">
            <h2>Gestion des événements</h2>
            <p>Créez et gérez les événements ICC</p>
          </div>

          <div className="create-event-form">
            <h3>Créer un nouvel événement</h3>
            <form onSubmit={handleCreateEvent}>
              <div className="form-row">
                <div className="form-field">
                  <label>Titre de l'événement</label>
                  <input
                    type="text"
                    value={eventForm.title}
                    onChange={(e) => setEventForm({...eventForm, title: e.target.value})}
                    placeholder="Culte dominical, Conférence..."
                    required
                  />
                </div>
                <div className="form-field">
                  <label>Catégorie</label>
                  <select
                    value={eventForm.category}
                    onChange={(e) => setEventForm({...eventForm, category: e.target.value as any})}
                  >
                    <option value="service">Service religieux</option>
                    <option value="conference">Conférence</option>
                    <option value="social">Événement social</option>
                  </select>
                </div>
              </div>
              
              <div className="form-field">
                <label>Description</label>
                <textarea
                  value={eventForm.description}
                  onChange={(e) => setEventForm({...eventForm, description: e.target.value})}
                  placeholder="Description de l'événement..."
                  rows={3}
                />
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label>Adresse du lieu</label>
                  <input
                    type="text"
                    value={eventForm.location}
                    onChange={(e) => setEventForm({...eventForm, location: e.target.value})}
                    placeholder="219 rue Queen, Sherbrooke, QC"
                    required
                  />
                </div>
                <div className="form-field">
                  <label>Date et heure</label>
                  <input
                    type="datetime-local"
                    value={eventForm.startTime}
                    onChange={(e) => setEventForm({...eventForm, startTime: e.target.value})}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="create-btn">Créer l'événement</button>
            </form>
          </div>

          <div className="events-list">
            <h3>Événements existants</h3>
            {events.length === 0 ? (
              <p>Aucun événement créé pour le moment.</p>
            ) : (
              <div className="events-grid">
                {events.map((event) => (
                  <div key={event.id} className="event-card">
                    <h4>{event.title}</h4>
                    <p>{event.description}</p>
                    <div className="event-details">
                      <span>📍 {event.location}</span>
                      <span>📅 {new Date(event.startTime).toLocaleString()}</span>
                      <span className={`category-${event.category}`}>{event.category}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'members' && (
        <div className="admin-content">
          <h2>Gestion des membres ({members.length})</h2>
          <div className="members-table">
            <div className="table-header">
              <span>Membre</span>
              <span>Rôle</span>
              <span>Contact</span>
              <span>Statut</span>
            </div>
            {members.map((member) => (
              <div key={member.id} className="table-row">
                <div className="member-info">
                  <div className="member-avatar">
                    {member.avatar ? (
                      <img src={member.avatar} alt={member.name} />
                    ) : (
                      member.name[0]
                    )}
                  </div>
                  <span>{member.name}</span>
                </div>
                <span className={`role-${member.role}`}>{member.role}</span>
                <span>{member.email || member.phone}</span>
                <span className={`status ${member.verified ? 'verified' : 'pending'}`}>
                  {member.verified ? 'Vérifié' : 'En attente'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'rides' && (
        <div className="admin-content">
          <h2>Gestion des trajets ({rides.length})</h2>
          <div className="rides-table">
            <div className="table-header">
              <span>Conducteur</span>
              <span>Trajet</span>
              <span>Départ</span>
              <span>Places</span>
              <span>Statut</span>
            </div>
            {rides.map((ride) => (
              <div key={ride.id} className="table-row">
                <span>{ride.driverName}</span>
                <div className="route-info">
                  <div>{ride.origin}</div>
                  <div>→ {ride.destination}</div>
                </div>
                <span>{new Date(ride.departureTime).toLocaleString()}</span>
                <span>{ride.seatsBooked}/{ride.seatsAvailable}</span>
                <span className={`status-${ride.status}`}>{ride.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}