export type UserRole = 'passenger' | 'driver' | 'admin';

export type Language = 'fr';

export interface VehicleInfo {
  make: string;
  model: string;
  color: string;
  plate: string;
  seats: number;
}

export interface Member {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  verified: boolean;
  language: 'fr';
  vehicle?: VehicleInfo;
  badges: string[];
  ridesGiven: number;
  ridesTaken: number;
  emergencyContact?: string;
  password?: string;
  locationLat?: number;
  locationLng?: number;
  locationUpdatedAt?: string;
}

export type RideStatus = 'pending' | 'confirmed' | 'in-progress' | 'completed';

export interface Ride {
  id: string;
  driverId: string;
  driverName: string;
  driverAvatar?: string;
  vehicle: VehicleInfo;
  origin: string;
  destination: string;
  originLat: number;
  originLng: number;
  destinationLat: number;
  destinationLng: number;
  departureTime: string;
  seatsAvailable: number;
  seatsBooked: number;
  status: RideStatus;
  notes?: string;
  eventId?: string;
  passengers: string[];
  driverLat?: number;
  driverLng?: number;
  driverLocationUpdatedAt?: string;
}

export type RideRequestStatus = 'pending' | 'accepted' | 'declined';

export interface RideRequest {
  id: string;
  rideId: string;
  passengerId: string;
  passengerName: string;
  passengerAvatar?: string;
  status: RideRequestStatus;
  createdAt: string;
  message?: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  startTime: string;
  location: string;
  category: 'service' | 'conference' | 'social' | 'jeunesse' | 'special';
  icon: string;
}

export type NotificationType = 'info' | 'success' | 'alert';

export interface NotificationItem {
  id: string;
  message: string;
  type: NotificationType;
  timestamp: string;
  actionLabel?: string;
}

export interface ChatMessage {
  id: string;
  rideId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  isSpiritual?: boolean;
}

export interface AdminStats {
  totalMembers: number;
  activeThisWeek: number;
  totalRides: number;
  ridesThisWeek: number;
  drivers: number;
  passengers: number;
}
