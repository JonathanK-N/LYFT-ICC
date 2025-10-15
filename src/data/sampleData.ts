import type { AdminStats, Event, Member, NotificationItem, Ride } from '../types';

export const verificationCodes: { code: string; label: string }[] = [];

export const acceptedQrTokens: string[] = [];

export const sampleMembers: Member[] = [
  {
    id: 'admin-1',
    name: 'Administrateur ICC',
    email: 'admin@impactcentrechretien.org',
    role: 'admin',
    verified: true,
    language: 'fr',
    badges: ['Super Admin', 'Fondateur'],
    ridesGiven: 0,
    ridesTaken: 0,
    password: 'admin123',
  },
];

export const sampleRides: Ride[] = [];

export const sampleEvents: Event[] = [
  {
    id: 'event-1',
    title: 'Culte Dominical',
    description: 'Service religieux hebdomadaire avec louange et prédication',
    location: '219 rue Queen, Sherbrooke, QC, Canada',
    startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // Dans 2 jours
    category: 'service',
    icon: '⛪',
  },
  {
    id: 'event-2',
    title: 'Conférence Jeunesse',
    description: 'Rencontre spéciale pour les jeunes de 16-30 ans',
    location: '219 rue Queen, Sherbrooke, QC, Canada',
    startTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // Dans 5 jours
    category: 'conference',
    icon: '🎤',
  },
  {
    id: 'event-3',
    title: 'Repas Communautaire',
    description: 'Moment de partage et de communion fraternelle',
    location: '219 rue Queen, Sherbrooke, QC, Canada',
    startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Dans 7 jours
    category: 'social',
    icon: '🍽️',
  },
];

export const sampleNotifications: NotificationItem[] = [];

export const sampleStats: AdminStats = {
  totalMembers: 0,
  activeThisWeek: 0,
  totalRides: 0,
  ridesThisWeek: 0,
  drivers: 0,
  passengers: 0,
};
