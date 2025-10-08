import type { AdminStats, Event, Member, NotificationItem, Ride } from '../types';

export const verificationCodes = [
  { code: 'ICC-2025', label: 'Membre Impact Centre Chretien' },
  { code: 'ICC-SERV', label: 'Equipe de service' },
  { code: 'ICC-ADMIN', label: 'Administration eglise' },
];

export const acceptedQrTokens = ['QR-ICC-001', 'QR-ICC-DRIVE', 'QR-ICC-ADMIN'];

export const sampleMembers: Member[] = [
  {
    id: 'm-001',
    name: 'Esther Ilunga',
    email: 'esther.ilunga@example.com',
    role: 'admin',
    verified: true,
    language: 'fr',
    avatar: 'https://i.pravatar.cc/150?img=48',
    badges: ['Gardienne du temple'],
    ridesGiven: 12,
    ridesTaken: 3,
    emergencyContact: '+33 6 12 34 56 78',
  },
  {
    id: 'm-002',
    name: "Samuel N'Diaye",
    phone: '+33 7 45 12 78 90',
    role: 'driver',
    verified: true,
    language: 'fr',
    avatar: 'https://i.pravatar.cc/150?img=35',
    vehicle: {
      make: 'Toyota',
      model: 'Prius',
      color: 'Bleu nuit',
      plate: 'LYFT-ICC-75',
      seats: 4,
    },
    badges: ['Ange du covoiturage', 'Passeur de benedictions'],
    ridesGiven: 28,
    ridesTaken: 1,
    emergencyContact: '+33 6 98 54 32 10',
  },
  {
    id: 'm-003',
    name: 'Grace Makanza',
    email: 'grace.makanza@example.com',
    role: 'passenger',
    verified: true,
    language: 'en',
    avatar: 'https://i.pravatar.cc/150?img=12',
    badges: ['Louangeuse fidele'],
    ridesGiven: 0,
    ridesTaken: 9,
    emergencyContact: '+33 7 11 22 33 44',
  },
];

export const sampleRides: Ride[] = [
  {
    id: 'r-001',
    driverId: 'm-002',
    driverName: "Samuel N'Diaye",
    driverAvatar: 'https://i.pravatar.cc/150?img=35',
    vehicle: {
      make: 'Toyota',
      model: 'Prius',
      color: 'Bleu nuit',
      plate: 'LYFT-ICC-75',
      seats: 4,
    },
    origin: 'Montreuil',
    destination: 'Impact Centre Chretien - Paris',
    departureTime: new Date().toISOString(),
    seatsAvailable: 4,
    seatsBooked: 2,
    status: 'confirmed',
    passengers: ['m-003'],
    notes: 'Depart apres la louange, priere en groupe pendant le trajet.',
    eventId: 'e-001',
  },
  {
    id: 'r-002',
    driverId: 'm-002',
    driverName: "Samuel N'Diaye",
    driverAvatar: 'https://i.pravatar.cc/150?img=35',
    vehicle: {
      make: 'Toyota',
      model: 'Prius',
      color: 'Bleu nuit',
      plate: 'LYFT-ICC-75',
      seats: 4,
    },
    origin: 'Creteil',
    destination: 'Impact Centre Chretien - Paris',
    departureTime: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    seatsAvailable: 4,
    seatsBooked: 1,
    status: 'pending',
    passengers: [],
    notes: 'Partage dun verset du jour avant la messe.',
    eventId: 'e-002',
  },
];

export const sampleEvents: Event[] = [
  {
    id: 'e-001',
    title: 'Messe dominicale 10h',
    description: 'Louange, message du pasteur Yvan, communion fraternelle.',
    startTime: new Date().toISOString(),
    location: 'Impact Centre Chretien - Paris',
    category: 'messe',
    icon: '\u26EA',
  },
  {
    id: 'e-002',
    title: 'Soiree Jeunesse Impact',
    description: 'Louanges modernes, temoignages, temps de priere.',
    startTime: new Date(Date.now() + 1000 * 60 * 60 * 26).toISOString(),
    location: 'Impact Centre Chretien - Grigny',
    category: 'jeunesse',
    icon: '\u2728',
  },
  {
    id: 'e-003',
    title: 'Veillee de priere',
    description: 'Temps de priere fervente pour la communaute.',
    startTime: new Date(Date.now() + 1000 * 60 * 60 * 72).toISOString(),
    location: 'Impact Centre Chretien - Online',
    category: 'priere',
    icon: '\u{1F64F}',
  },
];

export const sampleNotifications: NotificationItem[] = [
  {
    id: 'n-001',
    message: 'Trajet disponible pour la messe de 10h. Cliquez pour reserver.',
    type: 'info',
    timestamp: new Date().toISOString(),
    actionLabel: 'Reserver',
  },
  {
    id: 'n-002',
    message: "Samuel N'Diaye a accepte votre demande de covoiturage.",
    type: 'success',
    timestamp: new Date().toISOString(),
  },
];

export const sampleStats: AdminStats = {
  totalMembers: 243,
  activeThisWeek: 121,
  totalRides: 938,
  ridesThisWeek: 42,
  drivers: 63,
  passengers: 180,
};
