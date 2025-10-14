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
    badges: [],
    ridesGiven: 0,
    ridesTaken: 0,
    password: 'admin123',
  },
];

export const sampleRides: Ride[] = [];

export const sampleEvents: Event[] = [];

export const sampleNotifications: NotificationItem[] = [];

export const sampleStats: AdminStats = {
  totalMembers: 0,
  activeThisWeek: 0,
  totalRides: 0,
  ridesThisWeek: 0,
  drivers: 0,
  passengers: 0,
};
