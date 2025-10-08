import type { FieldValue, Timestamp } from 'firebase/firestore';

export type FirestoreTimestamp = Timestamp | FieldValue;

export type UserRole = 'passenger' | 'driver' | 'admin';

export interface VehicleInfo {
  make: string;
  model: string;
  color: string;
  plate: string;
  seats: number;
}

export interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  phone?: string;
  role: UserRole;
  photoUrl?: string;
  language: 'fr' | 'en';
  churchCodeValidated: boolean;
  vehicle?: VehicleInfo;
  badges?: string[];
  stats: {
    ridesTaken: number;
    ridesGiven: number;
    rating?: number;
  };
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

export type RideStatus = 'draft' | 'published' | 'matched' | 'in_progress' | 'completed' | 'cancelled';
export type RideVisibility = 'public' | 'friends' | 'private';

export interface RideEntity {
  id: string;
  driverId: string;
  driverName: string;
  driverPhotoUrl?: string;
  driverVehicle: VehicleInfo;
  origin: {
    address: string;
    lat: number;
    lng: number;
  };
  destination: {
    address: string;
    lat: number;
    lng: number;
  };
  departureTime: Timestamp;
  seatsAvailable: number;
  seatsBooked: number;
  status: RideStatus;
  visibility: RideVisibility;
  note?: string;
  eventId?: string;
  passengers?: string[];
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

export interface RideRequest {
  id: string;
  rideId: string;
  passengerId: string;
  passengerName: string;
  passengerPhotoUrl?: string;
  message?: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

export interface EventEntity {
  id: string;
  title: string;
  description: string;
  location: {
    address: string;
    lat: number;
    lng: number;
  };
  startTime: Timestamp;
  endTime: Timestamp;
  category: 'messe' | 'priere' | 'conference' | 'jeunesse' | 'special';
  icon: string;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}
