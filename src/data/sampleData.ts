import type { AdminStats, Event, Member, NotificationItem, Ride } from '../types';

export const verificationCodes: { code: string; label: string }[] = [];

export const acceptedQrTokens: string[] = [];

export const sampleMembers: Member[] = [];

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
