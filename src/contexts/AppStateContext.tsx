import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import type {
  EventEntity,
  RideEntity,
  RideRequest as RideRequestEntity,
  UserProfile,
} from '../types/firebase';
import type {
  AdminStats,
  ChatMessage,
  Language,
  Member,
  NotificationItem,
  Ride,
  RidePickupPlan,
  RideRequest,
  VehicleInfo,
} from '../types';
import {
  sampleEvents,
  sampleMembers,
  sampleNotifications,
  sampleRides,
  sampleStats,
} from '../data/sampleData';
import {
  firebaseServices,
  isFirebaseConfigured,
} from '../services/firebase/client';
import { listenForegroundMessages } from '../services/firebase/messaging';
import {
  fetchUserProfile,
  registerWithEmail,
  signInWithEmail,
  signOutCurrentUser,
  updateUserProfile,
} from '../modules/auth/api';
import { optimizeRoute } from '../lib/map/mapboxOptimization';

interface RegisterPayload {
  name: string;
  email?: string;
  phone?: string;
  password?: string;
  avatar?: string;
}

interface LoginPayload {
  identifier: string;
  password?: string;
}

interface CreateRideInput {
  origin: { address: string; lat: number; lng: number };
  destination: { address: string; lat: number; lng: number };
  departureTime: string;
  seatsAvailable: number;
  notes?: string;
  eventId?: string;
}

interface DriverLocationInput {
  lat: number;
  lng: number;
  updatedAt?: Date;
}

interface RequestRideInput {
  rideId: string;
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  passengers?: number;
  notes?: string;
}

interface RideRequestPublic {
  id: string;
  eventId: string;
  passengerName: string;
  pickupAddress: string;
  message?: string;
  createdAt: string;
}

interface AppStateContextValue {
  members: Member[];
  rides: Ride[];
  events: typeof sampleEvents;
  notifications: NotificationItem[];
  rideRequests: RideRequest[];
  publicRequests: RideRequestPublic[];
  chatMessages: Record<string, ChatMessage[]>;
  currentUser?: Member;
  adminStats: AdminStats;
  registerMember: (payload: RegisterPayload) => Promise<Member | undefined>;
  login: (payload: LoginPayload) => Promise<Member | undefined>;
  logout: () => Promise<void>;
  upgradeToDriver: (vehicle: VehicleInfo) => Promise<void>;
  createRide: (input: CreateRideInput) => Promise<void>;
  requestRide: (input: RequestRideInput) => Promise<void>;
  respondToRideRequest: (requestId: string, accepted: boolean) => Promise<void>;
  startRide: (rideId: string) => Promise<void>;
  finishRide: (rideId: string) => Promise<void>;
  addNotification: (notification: NotificationItem) => Promise<void>;
  sendChatMessage: (
    rideId: string,
    message: Omit<ChatMessage, 'id' | 'timestamp' | 'rideId'>,
  ) => void;
  sendAnnouncement: (message: string) => Promise<void>;
  updateDriverLocation: (input: DriverLocationInput) => Promise<void>;
  createEvent: (event: any) => Promise<void>;
  publishRideRequest: (eventId: string, pickupAddress: string, message?: string) => Promise<void>;
}

const AppStateContext = createContext<AppStateContextValue | undefined>(
  undefined,
);

const toIsoString = (value: Timestamp | Date | undefined | null): string | undefined => {
  if (!value) {
    return undefined;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof (value as Timestamp).toDate === 'function') {
    return (value as Timestamp).toDate().toISOString();
  }
  return undefined;
};

const toRadians = (value: number) => (value * Math.PI) / 180;

const haversineDistanceKm = (
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
): number => {
  const earthRadiusKm = 6371;
  const dLat = toRadians(destination.lat - origin.lat);
  const dLng = toRadians(destination.lng - origin.lng);
  const lat1 = toRadians(origin.lat);
  const lat2 = toRadians(destination.lat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round((earthRadiusKm * c + Number.EPSILON) * 100) / 100;
};

const estimateDurationMinutes = (distanceKm?: number): number | undefined => {
  if (!distanceKm || Number.isNaN(distanceKm)) {
    return undefined;
  }
  const cruisingSpeedKmH = 35; // hypothèse réaliste en zone urbaine
  const minutes = (distanceKm / cruisingSpeedKmH) * 60;
  return Math.max(2, Math.round(minutes));
};

const mapProfileToMember = (profile: UserProfile): Member => ({
  id: profile.uid,
  name: profile.fullName,
  email: profile.email,
  phone: profile.phone,
  avatar: profile.photoUrl,
  role: profile.role,
  verified: profile.churchCodeValidated,
  language: profile.language,
  vehicle: profile.vehicle,
  badges: profile.badges ?? [],
  ridesGiven: profile.stats?.ridesGiven ?? 0,
  ridesTaken: profile.stats?.ridesTaken ?? 0,
  emergencyContact: undefined,
  password: undefined,
  locationLat: profile.currentLocation?.lat,
  locationLng: profile.currentLocation?.lng,
  locationUpdatedAt: toIsoString(profile.currentLocation?.updatedAt),
});

const mapRideEntityToRide = (entity: RideEntity): Ride => {
  const status: Ride['status'] =
    entity.status === 'matched'
      ? 'confirmed'
      : entity.status === 'in_progress'
      ? 'in-progress'
      : entity.status === 'completed'
      ? 'completed'
      : 'pending';
  return {
    id: entity.id,
    driverId: entity.driverId,
    driverName: entity.driverName,
    driverAvatar: entity.driverPhotoUrl,
    vehicle: entity.driverVehicle,
    origin: entity.origin.address,
    destination: entity.destination.address,
    originLat: entity.origin.lat,
    originLng: entity.origin.lng,
    destinationLat: entity.destination.lat,
    destinationLng: entity.destination.lng,
    departureTime: toIsoString(entity.departureTime) ?? new Date().toISOString(),
    seatsAvailable: entity.seatsAvailable,
    seatsBooked: entity.seatsBooked,
    status,
    notes: entity.note,
    eventId: entity.eventId,
    passengers: entity.passengers ?? [],
    driverLat: entity.driverLocation?.lat,
    driverLng: entity.driverLocation?.lng,
    driverLocationUpdatedAt: toIsoString(entity.driverLocation?.updatedAt),
  };
};

const mapEventEntityToEvent = (entity: EventEntity) => ({
  id: entity.id,
  title: entity.title,
  description: entity.description,
  startTime:
    entity.startTime instanceof Date
      ? entity.startTime.toISOString()
      : (entity.startTime as any)?.toDate ? (entity.startTime as any).toDate().toISOString() : new Date().toISOString(),
  location: typeof entity.location === 'string' ? entity.location : entity.location.address,
  category: entity.category,
  icon: entity.icon,
});

const mapRideRequestEntity = (entity: RideRequestEntity): RideRequest => {
  const pickup = entity.pickup ?? {
    address: entity.message ?? 'Adresse a confirmer',
    lat: 0,
    lng: 0,
  };
  const distanceKm =
    typeof entity.distanceKm === 'number' && Number.isFinite(entity.distanceKm)
      ? entity.distanceKm
      : undefined;
  const estimatedMinutes =
    typeof entity.estimatedMinutes === 'number' && Number.isFinite(entity.estimatedMinutes)
      ? entity.estimatedMinutes
      : estimateDurationMinutes(distanceKm);

  return {
    id: entity.id,
    rideId: entity.rideId,
    passengerId: entity.passengerId,
    passengerName: entity.passengerName,
    passengerAvatar: entity.passengerPhotoUrl,
    pickupAddress: pickup.address,
    pickupLat: pickup.lat ?? 0,
    pickupLng: pickup.lng ?? 0,
    passengers: entity.passengers ?? 1,
    status:
      entity.status === 'accepted'
        ? 'accepted'
        : entity.status === 'declined'
        ? 'declined'
        : 'pending',
    createdAt:
      entity.createdAt instanceof Date
        ? entity.createdAt.toISOString()
        : (entity.createdAt as any)?.toDate
        ? (entity.createdAt as any).toDate().toISOString()
        : new Date().toISOString(),
    message: entity.message,
    distanceKm,
    estimatedMinutes,
  };
};

type NotificationDocument = {
  id?: string;
  message?: string;
  type?: NotificationItem['type'];
  actionLabel?: string;
  timestamp?: Timestamp | Date | string | null;
};

const mapNotificationDoc = (data: NotificationDocument): NotificationItem => {
  const source = data.timestamp;
  let iso = new Date().toISOString();
  if (source instanceof Date) {
    iso = source.toISOString();
  } else if (typeof source === 'string') {
    iso = source;
  } else if (source && 'toDate' in source && typeof source.toDate === 'function') {
    iso = source.toDate().toISOString();
  }
  return {
    id: data.id ?? `notification-${Date.now()}`,
    message: data.message ?? '',
    type: data.type ?? 'info',
    timestamp: iso,
    actionLabel: data.actionLabel,
  };
};

export function AppStateProvider({ children }: { children: ReactNode }) {
  const firebaseEnabled = isFirebaseConfigured;
  const [members, setMembers] = useState<Member[]>(sampleMembers);
  const [rides, setRides] = useState<Ride[]>(sampleRides);
  const [events, setEvents] = useState<typeof sampleEvents>(sampleEvents);
  const [notifications, setNotifications] =
    useState<NotificationItem[]>(sampleNotifications);
  const [rideRequests, setRideRequests] = useState<RideRequest[]>([]);
  const [publicRequests, setPublicRequests] = useState<RideRequestPublic[]>([]);
  const [chatMessages, setChatMessages] = useState<Record<string, ChatMessage[]>>(
    {},
  );
  const [currentUser, setCurrentUser] = useState<Member | undefined>(undefined);
  const [authUid, setAuthUid] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!firebaseEnabled) {
      setMembers(sampleMembers);
      setRides(sampleRides);
      setEvents(sampleEvents);
      setNotifications(sampleNotifications);
      setCurrentUser(undefined);
      return;
    }

    const db = firebaseServices.db;
    const unsubProfiles = onSnapshot(collection(db, 'profiles'), (snap) => {
      const data = snap.docs.map((docSnap) => {
        const docData = docSnap.data() as UserProfile;
        return mapProfileToMember({
          ...docData,
          uid: docData.uid ?? docSnap.id,
        });
      });
      setMembers(data);
    });
    const unsubRides = onSnapshot(collection(db, 'rides'), (snap) => {
      const data = snap.docs.map((docSnap) => {
        const docData = docSnap.data() as RideEntity;
        return mapRideEntityToRide({
          ...docData,
          id: docData.id ?? docSnap.id,
        });
      });
      setRides(data);
    });
    const unsubEvents = onSnapshot(collection(db, 'events'), (snap) => {
      const data = snap.docs.map((docSnap) => {
        const docData = docSnap.data() as EventEntity;
        return mapEventEntityToEvent({
          ...docData,
          id: docData.id ?? docSnap.id,
        });
      });
      setEvents(data);
    });
    const unsubNotifications = onSnapshot(
      collection(db, 'notifications'),
      (snap) => {
        const data = snap.docs
          .map((docSnap) => mapNotificationDoc({ id: docSnap.id, ...docSnap.data() }))
          .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
        setNotifications(data);
      },
    );
    const unsubRequests = onSnapshot(
      collection(db, 'rideRequests'),
      (snap) => {
        const data = snap.docs
          .map((docSnap) => ({
            ...(docSnap.data() as RideRequestEntity),
            id: docSnap.id,
          }))
          .map(mapRideRequestEntity);
        setRideRequests(data);
      },
    );

    return () => {
      unsubProfiles();
      unsubRides();
      unsubEvents();
      unsubNotifications();
      unsubRequests();
    };
  }, [firebaseEnabled]);

  useEffect(() => {
    if (!firebaseEnabled) {
      return;
    }
    const unsubscribe = onAuthStateChanged(firebaseServices.auth, (user) => {
      setAuthUid(user ? user.uid : undefined);
    });
    return () => unsubscribe();
  }, [firebaseEnabled]);

  useEffect(() => {
    if (!firebaseEnabled) {
      return;
    }
    if (!authUid) {
      setCurrentUser(undefined);
      return;
    }
    const member = members.find((item) => item.id === authUid);
    setCurrentUser(member);
  }, [authUid, members, firebaseEnabled]);

  useEffect(() => {
    if (!firebaseEnabled) {
      return;
    }
    let unsubscribe: (() => void) | undefined;
    let mounted = true;
    try {
      const result = listenForegroundMessages((payload: any) => {
        const messageId = payload?.messageId ?? `fcm-${Date.now()}`;
        const body =
          payload?.notification?.body ??
          payload?.data?.message ??
          'Notification reÃ§ue';
        const actionLabel =
          payload?.notification?.title ?? payload?.data?.actionLabel;
        setNotifications((prev) => [
          {
            id: `fcm-${messageId}`,
            message: body,
            type: 'info',
            timestamp: new Date().toISOString(),
            actionLabel,
          },
          ...prev,
        ]);
      });
      if (result && typeof result === 'object' && 'then' in result) {
        (result as Promise<any>)
          .then((stop: any) => {
            if (mounted) {
              unsubscribe = stop;
            }
          })
          .catch((error: any) => {
            console.warn('[messaging] foreground listener failed', error);
          });
      }
    } catch (error) {
      console.warn('[messaging] setup failed', error);
    }
    return () => {
      mounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [firebaseEnabled]);

  const adminStats = useMemo<AdminStats>(() => {
    const totalMembers = members.length;
    const drivers = members.filter((member) => member.role === 'driver').length;
    const passengers = totalMembers - drivers;
    return {
      totalMembers,
      activeThisWeek: Math.max(
        sampleStats.activeThisWeek,
        Math.floor(totalMembers * 0.45),
      ),
      totalRides: rides.length,
      ridesThisWeek: Math.max(
        sampleStats.ridesThisWeek,
        Math.floor(rides.length * 0.35),
      ),
      drivers,
      passengers,
    };
  }, [members, rides]);

  const registerMember = async (payload: RegisterPayload) => {
    if (firebaseEnabled && payload.email && payload.password) {
      try {
        const profile = await registerWithEmail({
          email: payload.email,
          password: payload.password,
          fullName: payload.name,
          language: 'fr',
        });

        const profileUpdates = {
          churchCodeValidated: true,
          photoUrl: payload.avatar,
          phone: payload.phone,
        };

        try {
          await updateUserProfile(profile.uid, profileUpdates);
        } catch (error) {
          console.warn('[auth] updateUserProfile failed, using merge fallback', error);
          await setDoc(
            doc(firebaseServices.db, 'profiles', profile.uid),
            { ...profileUpdates, updatedAt: serverTimestamp() },
            { merge: true },
          );
        }

        const mapped = mapProfileToMember({
          ...profile,
          ...profileUpdates,
        });
        setMembers((prev) => {
          const exists = prev.some((member) => member.id === mapped.id);
          if (exists) {
            return prev.map((member) =>
              member.id === mapped.id ? { ...member, ...mapped } : member,
            );
          }
          return [mapped, ...prev];
        });
        setCurrentUser(mapped);
        return mapped;
      } catch (error) {
        console.error('[auth] registerMember failed', error);
        throw error;
      }
    }

    const newMember: Member = {
      id: `m-${Math.random().toString(36).slice(2, 8)}`,
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      avatar: payload.avatar,
      role: 'passenger',
      verified: true,
      language: 'fr',
      badges: [],
      ridesGiven: 0,
      ridesTaken: 0,
      emergencyContact: undefined,
      password: payload.password,
    };
    setMembers((prev) => [newMember, ...prev]);
    setCurrentUser(newMember);
    return newMember;
  };

  const login = async ({ identifier, password }: LoginPayload) => {
    if (firebaseEnabled && identifier.includes('@') && password) {
      const credential = await signInWithEmail({
        email: identifier,
        password,
      });
      const uid = credential.user.uid;
      let member = members.find((item) => item.id === uid);
      if (!member) {
        const profile = await fetchUserProfile(uid);
        if (profile) {
          const mapped = mapProfileToMember(profile);
          member = mapped;
          setMembers((prev) => {
            const exists = prev.some((item) => item.id === mapped.id);
            if (exists) {
              return prev.map((item) =>
                item.id === mapped.id ? { ...item, ...mapped } : item,
              );
            }
            return [mapped, ...prev];
          });
        } else {
          const fallback: Member = {
            id: uid,
            name:
              credential.user.displayName ??
              credential.user.email ??
              'Lyft-ICC member',
            email: credential.user.email ?? undefined,
            phone: credential.user.phoneNumber ?? undefined,
            avatar: credential.user.photoURL ?? undefined,
            role: 'passenger',
            verified: true,
            language: 'fr',
            badges: [],
            ridesGiven: 0,
            ridesTaken: 0,
            emergencyContact: undefined,
            password: undefined,
          };
          member = fallback;
          setMembers((prev) => {
            const exists = prev.some((item) => item.id === fallback.id);
            if (exists) {
              return prev;
            }
            return [fallback, ...prev];
          });
        }
      }
      setCurrentUser(member);
      return member;
    }
    const normalized = identifier.trim().toLowerCase();
    const member = members.find((m) => {
      const emailMatch = m.email?.toLowerCase() === normalized;
      const phoneMatch =
        m.phone?.replace(/\s+/g, '') === normalized.replace(/\s+/g, '');
      const nameMatch = m.name.toLowerCase() === normalized;
      return emailMatch || phoneMatch || nameMatch;
    });
    if (!member) {
      return undefined;
    }

    if (!firebaseEnabled) {
      if (member.password) {
        if (!password || member.password !== password) {
          return undefined;
        }
      } else if (password) {
        return undefined;
      }
    }

    setCurrentUser(member);
    return member;
  };

  const logout = async () => {
    if (firebaseEnabled) {
      await signOutCurrentUser();
    }
    setCurrentUser(undefined);
  };

  const upgradeToDriver = async (vehicle: VehicleInfo) => {
    if (!currentUser) return;
    if (firebaseEnabled) {
      await updateUserProfile(currentUser.id, {
        role: 'driver',
        vehicle,
      });
      return;
    }
    setMembers((prev) =>
      prev.map((member) =>
        member.id === currentUser.id ? { ...member, role: 'driver', vehicle } : member,
      ),
    );
    setCurrentUser((prev) =>
      prev ? { ...prev, role: 'driver', vehicle } : prev,
    );
  };

  const createRide = async (input: CreateRideInput) => {
    if (!currentUser) {
      return;
    }
    if (!currentUser.vehicle) {
      throw new Error('Complétez votre véhicule dans votre profil conducteur.');
    }
    const departureDate = new Date(input.departureTime);
    if (Number.isNaN(departureDate.getTime())) {
      throw new Error('Date de depart invalide.');
    }
    const seatCount = Math.max(1, Math.min(8, Number(input.seatsAvailable) || 1));

    if (firebaseEnabled) {
      const rideRef = doc(collection(firebaseServices.db, 'rides'));
      const entity: RideEntity = {
        id: rideRef.id,
        driverId: currentUser.id,
        driverName: currentUser.name,
        driverPhotoUrl: currentUser.avatar,
        driverVehicle: currentUser.vehicle!,
        origin: {
          address: input.origin.address,
          lat: input.origin.lat,
          lng: input.origin.lng,
        },
        destination: {
          address: input.destination.address,
          lat: input.destination.lat,
          lng: input.destination.lng,
        },
        departureTime: Timestamp.fromDate(departureDate),
        seatsAvailable: seatCount,
        seatsBooked: 0,
        status: 'published',
        visibility: 'public',
        note: input.notes,
        eventId: input.eventId,
        passengers: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        driverLocation: currentUser.locationLat && currentUser.locationLng
          ? {
              lat: currentUser.locationLat,
              lng: currentUser.locationLng,
              updatedAt: Timestamp.fromDate(
                currentUser.locationUpdatedAt ? new Date(currentUser.locationUpdatedAt) : new Date(),
              ),
            }
          : undefined,
      };
      await setDoc(rideRef, entity);
      return;
    }

    const newRide: Ride = {
      id: `ride-${Math.random().toString(36).slice(2, 10)}`,
      driverId: currentUser.id,
      driverName: currentUser.name,
      driverAvatar: currentUser.avatar,
      vehicle: currentUser.vehicle!,
      origin: input.origin.address,
      originLat: input.origin.lat,
      originLng: input.origin.lng,
      destination: input.destination.address,
      destinationLat: input.destination.lat,
      destinationLng: input.destination.lng,
      departureTime: departureDate.toISOString(),
      seatsAvailable: seatCount,
      seatsBooked: 0,
      status: 'pending',
      notes: input.notes,
      eventId: input.eventId,
      passengers: [],
      driverLat: currentUser.locationLat,
      driverLng: currentUser.locationLng,
      driverLocationUpdatedAt: currentUser.locationUpdatedAt,
    };
    setRides((prev) => [newRide, ...prev]);
  };

  const updateDriverLocation = async ({ lat, lng, updatedAt = new Date() }: DriverLocationInput) => {
    if (!currentUser) {
      return;
    }

    if (firebaseEnabled) {
      const timestamp = Timestamp.fromDate(updatedAt);
      await updateDoc(doc(firebaseServices.db, 'profiles', currentUser.id), {
        currentLocation: {
          lat,
          lng,
          updatedAt: timestamp,
        },
        updatedAt: serverTimestamp(),
      });

      const activeQuery = query(
        collection(firebaseServices.db, 'rides'),
        where('driverId', '==', currentUser.id),
        where('status', 'in', ['published', 'in_progress']),
      );
      const snapshot = await getDocs(activeQuery);
      await Promise.all(
        snapshot.docs.map((rideDoc) =>
          updateDoc(rideDoc.ref, {
            driverLocation: {
              lat,
              lng,
              updatedAt: timestamp,
            },
            updatedAt: serverTimestamp(),
          }),
        ),
      );
      return;
    }

    setMembers((prev) =>
      prev.map((member) =>
        member.id === currentUser.id
          ? {
              ...member,
              locationLat: lat,
              locationLng: lng,
              locationUpdatedAt: updatedAt.toISOString(),
            }
          : member,
      ),
    );
    setRides((prev) =>
      prev.map((ride) =>
        ride.driverId === currentUser.id
          ? {
              ...ride,
              driverLat: lat,
              driverLng: lng,
              driverLocationUpdatedAt: updatedAt.toISOString(),
            }
          : ride,
      ),
    );
    setCurrentUser((prev) =>
      prev
        ? {
            ...prev,
            locationLat: lat,
            locationLng: lng,
            locationUpdatedAt: updatedAt.toISOString(),
          }
        : prev,
    );
  };

  const requestRide = async (input: RequestRideInput) => {
    if (!currentUser) {
      return;
    }

    const passengers = Math.max(1, Math.min(6, Number(input.passengers ?? 1) || 1));
    const selectedRide = rides.find((item) => item.id === input.rideId);
    const rideOrigin =
      selectedRide && Number.isFinite(selectedRide.originLat) && Number.isFinite(selectedRide.originLng)
        ? { lat: selectedRide.originLat, lng: selectedRide.originLng }
        : selectedRide && Number.isFinite(selectedRide.driverLat ?? NaN) && Number.isFinite(selectedRide.driverLng ?? NaN)
        ? { lat: selectedRide.driverLat!, lng: selectedRide.driverLng! }
        : undefined;
    const distanceKm = rideOrigin
      ? haversineDistanceKm(rideOrigin, { lat: input.pickupLat, lng: input.pickupLng })
      : undefined;
    const estimatedMinutes = estimateDurationMinutes(distanceKm);
    const notes = input.notes?.trim() ? input.notes.trim() : undefined;

    if (firebaseEnabled) {
      const requestId = `request-${Math.random().toString(36).slice(2, 10)}`;
      const entity: RideRequestEntity = {
        id: requestId,
        rideId: input.rideId,
        passengerId: currentUser.id,
        passengerName: currentUser.name,
        passengerPhotoUrl: currentUser.avatar,
        pickup: {
          address: input.pickupAddress,
          lat: input.pickupLat,
          lng: input.pickupLng,
        },
        passengers,
        distanceKm,
        estimatedMinutes,
        message: notes,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(doc(firebaseServices.db, 'rideRequests', requestId), entity);
      return;
    }

    const newRequest: RideRequest = {
      id: `req-${Math.random().toString(36).slice(2, 10)}`,
      rideId: input.rideId,
      passengerId: currentUser.id,
      passengerName: currentUser.name,
      passengerAvatar: currentUser.avatar,
      pickupAddress: input.pickupAddress,
      pickupLat: input.pickupLat,
      pickupLng: input.pickupLng,
      passengers,
      status: 'pending',
      createdAt: new Date().toISOString(),
      message: notes,
      distanceKm,
      estimatedMinutes,
    };
    setRideRequests((prev) => [newRequest, ...prev]);
  };

  const applyRidePlanToState = (
    rideId: string,
    plan: RidePickupPlan[] | undefined,
    totals?: { totalDistanceKm?: number; totalDurationMinutes?: number },
  ) => {
    setRides((prev) =>
      prev.map((ride) =>
        ride.id === rideId
          ? {
              ...ride,
              pickupPlan: plan,
              totalDistanceKm: totals?.totalDistanceKm,
              totalDurationMinutes: totals?.totalDurationMinutes,
            }
          : ride,
      ),
    );
  };

  const recomputeRidePlan = async (
    rideId: string,
    requestsSnapshot?: RideRequest[],
  ) => {
    const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN ?? '';
    const ride = rides.find((item) => item.id === rideId);
    if (!ride) {
      return;
    }

    const requests =
      requestsSnapshot ??
      rideRequests;

    const acceptedRequests = requests.filter(
      (request) => request.rideId === rideId && request.status === 'accepted',
    );

    if (acceptedRequests.length === 0) {
      if (firebaseEnabled) {
        await updateDoc(doc(firebaseServices.db, 'rides', rideId), {
          pickupPlan: [],
          totalDistanceKm: null,
          totalDurationMinutes: null,
          updatedAt: serverTimestamp(),
        });
      }
      applyRidePlanToState(rideId, undefined, {});
      const clearedRequests = requests.map((request) =>
        request.rideId === rideId
          ? { ...request, estimatedMinutes: undefined }
          : request,
      );
      setRideRequests(clearedRequests);
      return;
    }

    if (!mapboxToken) {
      return;
    }

    const driverStartLat = Number.isFinite(ride.driverLat) ? ride.driverLat : ride.originLat;
    const driverStartLng = Number.isFinite(ride.driverLng) ? ride.driverLng : ride.originLng;

    if (
      !Number.isFinite(driverStartLat) ||
      !Number.isFinite(driverStartLng) ||
      !Number.isFinite(ride.destinationLat) ||
      !Number.isFinite(ride.destinationLng)
    ) {
      return;
    }

    const driverStart = {
      id: ride.driverId,
      name: ride.driverName,
      lat: driverStartLat!,
      lng: driverStartLng!,
    };
    const destination = {
      id: 'destination',
      name: ride.destination,
      lat: ride.destinationLat,
      lng: ride.destinationLng,
    };

    const stops = acceptedRequests.slice(0, 10).map((request) => ({
      id: request.passengerId,
      name: request.passengerName,
      lat: request.pickupLat,
      lng: request.pickupLng,
    }));

    try {
      const optimization = await optimizeRoute({
        accessToken: mapboxToken,
        driverStart,
        destination,
        stops,
      });
      if (!optimization) {
        return;
      }

      const plan = optimization.orderedStops
        .map((stop) => {
          const request = acceptedRequests.find(
            (item) => item.passengerId === stop.id,
          );
          if (!request) {
            return undefined;
          }
          const planEntry: RidePickupPlan = {
            passengerId: request.passengerId,
            passengerName: request.passengerName,
            pickupAddress: request.pickupAddress,
            pickupLat: request.pickupLat,
            pickupLng: request.pickupLng,
            order: stop.order,
            etaMinutes: stop.etaMinutes,
          };
          return planEntry;
        })
        .filter(Boolean) as RidePickupPlan[];

      const totals = {
        totalDistanceKm: optimization.totalDistanceKm,
        totalDurationMinutes: optimization.totalDurationMinutes,
      };

      if (firebaseEnabled) {
        await updateDoc(doc(firebaseServices.db, 'rides', rideId), {
          pickupPlan: plan,
          totalDistanceKm: totals.totalDistanceKm ?? null,
          totalDurationMinutes: totals.totalDurationMinutes ?? null,
          updatedAt: serverTimestamp(),
        });
      }
      applyRidePlanToState(rideId, plan, totals);

      const enhancedRequests = requests.map((request) => {
        if (request.rideId !== rideId) {
          return request;
        }
        const match = plan.find(
          (item) => item.passengerId === request.passengerId,
        );
        return {
          ...request,
          estimatedMinutes: match?.etaMinutes,
        };
      });
      setRideRequests(enhancedRequests);
    } catch (error) {
      console.warn('[ride] route optimization failed', error);
    }
  };

  const respondToRideRequest = async (requestId: string, accepted: boolean) => {
    const targetRequest = rideRequests.find((request) => request.id === requestId);
    if (!targetRequest) {
      return;
    }

    const newStatus: RideRequest['status'] = accepted ? 'accepted' : 'declined';
    const updatedRequests = rideRequests.map((request) =>
      request.id === requestId ? { ...request, status: newStatus } : request,
    );

    setRideRequests(updatedRequests);

    if (firebaseEnabled) {
      await updateDoc(doc(firebaseServices.db, 'rideRequests', requestId), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
    }

    await recomputeRidePlan(targetRequest.rideId, updatedRequests);
  };

  const startRide = async (rideId: string) => {
    if (firebaseEnabled) {
      await updateDoc(doc(firebaseServices.db, 'rides', rideId), {
        status: 'in_progress',
        updatedAt: serverTimestamp(),
      });
      return;
    }
    setRides((prev) =>
      prev.map((ride) =>
        ride.id === rideId ? { ...ride, status: 'in-progress' } : ride,
      ),
    );
  };

  const finishRide = async (rideId: string) => {
    if (firebaseEnabled) {
      await updateDoc(doc(firebaseServices.db, 'rides', rideId), {
        status: 'completed',
        updatedAt: serverTimestamp(),
      });
      return;
    }
    setRides((prev) =>
      prev.map((ride) =>
        ride.id === rideId ? { ...ride, status: 'completed' } : ride,
      ),
    );
  };

  const addNotification = async (notification: NotificationItem) => {
    if (firebaseEnabled) {
      await setDoc(doc(firebaseServices.db, 'notifications', notification.id), {
        message: notification.message,
        type: notification.type,
        actionLabel: notification.actionLabel,
        timestamp: serverTimestamp(),
      });
      return;
    }
    setNotifications((prev) => [notification, ...prev]);
  };

  const sendChatMessage = (
    rideId: string,
    message: Omit<ChatMessage, 'id' | 'timestamp' | 'rideId'>,
  ) => {
    const newMessage: ChatMessage = {
      ...message,
      id: `msg-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      rideId,
    };
    setChatMessages((prev) => ({
      ...prev,
      [rideId]: [newMessage, ...(prev[rideId] ?? [])],
    }));
  };

  const sendAnnouncement = async (message: string) => {
    const notification: NotificationItem = {
      id: `announcement-${Date.now()}`,
      message,
      type: 'info',
      timestamp: new Date().toISOString(),
    };
    await addNotification(notification);
  };

  const createEvent = async (eventData: any) => {
    if (firebaseEnabled) {
      const eventRef = doc(collection(firebaseServices.db, 'events'));
      const entity = {
        ...eventData,
        id: eventRef.id,
        startTime: Timestamp.fromDate(new Date(eventData.startTime)),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(eventRef, entity);
      return;
    }

    const newEvent = {
      id: `event-${Math.random().toString(36).slice(2, 10)}`,
      ...eventData,
      startTime: new Date(eventData.startTime).toISOString(),
    };
    setEvents((prev) => [newEvent, ...prev]);
  };

  const publishRideRequest = async (eventId: string, pickupAddress: string, message?: string) => {
    if (!currentUser) return;
    
    const newRequest: RideRequestPublic = {
      id: `pub-req-${Math.random().toString(36).slice(2, 10)}`,
      eventId,
      passengerName: currentUser.name,
      pickupAddress,
      message,
      createdAt: new Date().toISOString(),
    };
    
    setPublicRequests((prev) => [newRequest, ...prev]);
  };

  const value = useMemo<AppStateContextValue>(
    () => ({
      members,
      rides,
      events,
      notifications,
      rideRequests,
      publicRequests,
      chatMessages,
      currentUser,
      adminStats,
      registerMember,
      login,
      logout,
      upgradeToDriver,
      createRide,
      requestRide,
      respondToRideRequest,
      startRide,
      finishRide,
      addNotification,
      sendChatMessage,
      sendAnnouncement,
      updateDriverLocation,
      createEvent,
      publishRideRequest,
    }),
    [
      members,
      rides,
      events,
      notifications,
      rideRequests,
      chatMessages,
      currentUser,
      adminStats,
      registerMember,
      login,
      logout,
      upgradeToDriver,
      createRide,
      requestRide,
      respondToRideRequest,
      startRide,
      finishRide,
      addNotification,
      sendChatMessage,
      sendAnnouncement,
      updateDriverLocation,
      createEvent,
      publishRideRequest,
      publicRequests,
    ],
  );

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
}






