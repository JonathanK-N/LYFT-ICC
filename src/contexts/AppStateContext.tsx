import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  Timestamp,
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
  RideRequest,
  VehicleInfo,
} from '../types';
import {
  acceptedQrTokens,
  sampleEvents,
  sampleMembers,
  sampleNotifications,
  sampleRides,
  sampleStats,
  verificationCodes,
} from '../data/sampleData';
import {
  firebaseServices,
  isFirebaseConfigured,
} from '../services/firebase/client';
import { listenForegroundMessages } from '../services/firebase/messaging';
import {
  registerWithEmail,
  signInWithEmail,
  signOutCurrentUser,
  updateUserProfile,
} from '../modules/auth/api';

interface RegisterPayload {
  name: string;
  email?: string;
  phone?: string;
  password?: string;
  avatar?: string;
  code?: string;
  qrToken?: string;
  language?: Language;
}

interface LoginPayload {
  identifier: string;
  password?: string;
}

interface AppStateContextValue {
  members: Member[];
  rides: Ride[];
  events: typeof sampleEvents;
  notifications: NotificationItem[];
  rideRequests: RideRequest[];
  chatMessages: Record<string, ChatMessage[]>;
  currentUser?: Member;
  adminStats: AdminStats;
  verifyMembership: (code?: string, qrToken?: string) => boolean;
  registerMember: (payload: RegisterPayload) => Promise<Member | undefined>;
  login: (payload: LoginPayload) => Promise<Member | undefined>;
  logout: () => Promise<void>;
  upgradeToDriver: (vehicle: VehicleInfo) => Promise<void>;
  createRide: (
    ride: Omit<Ride, 'id' | 'driverName' | 'driverAvatar' | 'seatsBooked' | 'passengers'>,
  ) => Promise<void>;
  requestRide: (rideId: string, message?: string) => Promise<void>;
  respondToRideRequest: (requestId: string, accepted: boolean) => Promise<void>;
  startRide: (rideId: string) => Promise<void>;
  finishRide: (rideId: string) => Promise<void>;
  addNotification: (notification: NotificationItem) => Promise<void>;
  sendChatMessage: (
    rideId: string,
    message: Omit<ChatMessage, 'id' | 'timestamp' | 'rideId'>,
  ) => void;
  sendAnnouncement: (message: string) => Promise<void>;
}

const AppStateContext = createContext<AppStateContextValue | undefined>(
  undefined,
);

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
    departureTime: entity.departureTime instanceof Date
      ? entity.departureTime.toISOString()
      : (entity.departureTime as any)?.toDate ? (entity.departureTime as any).toDate().toISOString() : new Date().toISOString(),
    seatsAvailable: entity.seatsAvailable,
    seatsBooked: entity.seatsBooked,
    status,
    notes: entity.note,
    eventId: entity.eventId,
    passengers: entity.passengers ?? [],
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
  location: entity.location.address,
  category: entity.category,
  icon: entity.icon,
});

const mapRideRequestEntity = (entity: RideRequestEntity): RideRequest => ({
  id: entity.id,
  rideId: entity.rideId,
  passengerId: entity.passengerId,
  passengerName: entity.passengerName,
  passengerAvatar: entity.passengerPhotoUrl,
  status:
    entity.status === 'accepted'
      ? 'accepted'
      : entity.status === 'declined'
      ? 'declined'
      : 'pending',
  createdAt:
    entity.createdAt instanceof Date
      ? entity.createdAt.toISOString()
      : (entity.createdAt as any)?.toDate ? (entity.createdAt as any).toDate().toISOString() : new Date().toISOString(),
  message: entity.message,
});

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
  const [chatMessages, setChatMessages] = useState<Record<string, ChatMessage[]>>(
    {},
  );
  const [currentUser, setCurrentUser] = useState<Member | undefined>(
    sampleMembers[0],
  );
  const [authUid, setAuthUid] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!firebaseEnabled) {
      setMembers(sampleMembers);
      setRides(sampleRides);
      setEvents(sampleEvents);
      setNotifications(sampleNotifications);
      setCurrentUser(sampleMembers[0]);
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
          'Notification reçue';
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

  const verifyMembership = (code?: string, qrToken?: string) => {
    // Inscription libre - plus de vérification de code requis
    return true;
  };

  const registerMember = async (payload: RegisterPayload) => {
    // Inscription libre - pas de vérification de code nécessaire

    if (firebaseEnabled && payload.email && payload.password) {
      const language = payload.language ?? 'fr';
      const profile = await registerWithEmail({
        email: payload.email,
        password: payload.password,
        fullName: payload.name,
        language,
      });
      await updateUserProfile(profile.uid, {
        churchCodeValidated: true,
        photoUrl: payload.avatar,
        phone: payload.phone,
      });
      const mapped = mapProfileToMember({
        ...profile,
        churchCodeValidated: true,
        photoUrl: payload.avatar,
        phone: payload.phone,
      });
      setCurrentUser(mapped);
      return mapped;
    }

    const newMember: Member = {
      id: `m-${Math.random().toString(36).slice(2, 8)}`,
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      avatar: payload.avatar,
      role: 'passenger',
      verified: true,
      language: payload.language ?? 'fr',
      badges: ['Voyageur de lumiere'],
      ridesGiven: 0,
      ridesTaken: 0,
      emergencyContact: undefined,
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
      const member = members.find((item) => item.id === uid);
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
    if (member) {
      setCurrentUser(member);
    }
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

  const createRide = async (
    ride: Omit<
      Ride,
      'id' | 'driverName' | 'driverAvatar' | 'seatsBooked' | 'passengers'
    >,
  ) => {
    if (!currentUser) return;
    if (firebaseEnabled) {
      const rideId = `ride-${Math.random().toString(36).slice(2, 10)}`;
      const entity: RideEntity = {
        id: rideId,
        driverId: currentUser.id,
        driverName: currentUser.name,
        driverPhotoUrl: currentUser.avatar,
        driverVehicle: ride.vehicle,
        origin: { address: ride.origin, lat: 0, lng: 0 },
        destination: { address: ride.destination, lat: 0, lng: 0 },
        departureTime: Timestamp.fromDate(new Date(ride.departureTime)),
        seatsAvailable: ride.seatsAvailable,
        seatsBooked: 0,
        status: 'published',
        visibility: 'public',
        note: ride.notes,
        eventId: ride.eventId,
        passengers: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(doc(firebaseServices.db, 'rides', rideId), entity);
      return;
    }
    const newRide: Ride = {
      ...ride,
      id: `ride-${Math.random().toString(36).slice(2, 10)}`,
      driverId: currentUser.id,
      driverName: currentUser.name,
      driverAvatar: currentUser.avatar,
      seatsBooked: 0,
      passengers: [],
      status: 'pending',
    };
    setRides((prev) => [newRide, ...prev]);
  };

  const requestRide = async (rideId: string, message?: string) => {
    if (!currentUser) return;
    if (firebaseEnabled) {
      const requestId = `request-${Math.random().toString(36).slice(2, 10)}`;
      const entity: RideRequestEntity = {
        id: requestId,
        rideId,
        passengerId: currentUser.id,
        passengerName: currentUser.name,
        passengerPhotoUrl: currentUser.avatar,
        message,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(doc(firebaseServices.db, 'rideRequests', requestId), entity);
      return;
    }
    const newRequest: RideRequest = {
      id: `req-${Math.random().toString(36).slice(2, 10)}`,
      rideId,
      passengerId: currentUser.id,
      passengerName: currentUser.name,
      passengerAvatar: currentUser.avatar,
      status: 'pending',
      createdAt: new Date().toISOString(),
      message,
    };
    setRideRequests((prev) => [newRequest, ...prev]);
  };

  const respondToRideRequest = async (requestId: string, accepted: boolean) => {
    if (firebaseEnabled) {
      await updateDoc(doc(firebaseServices.db, 'rideRequests', requestId), {
        status: accepted ? 'accepted' : 'declined',
        updatedAt: serverTimestamp(),
      });
      return;
    }
    setRideRequests((prev) =>
      prev.map((request) =>
        request.id === requestId
          ? { ...request, status: accepted ? 'accepted' : 'declined' }
          : request,
      ),
    );
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

  const value = useMemo<AppStateContextValue>(
    () => ({
      members,
      rides,
      events,
      notifications,
      rideRequests,
      chatMessages,
      currentUser,
      adminStats,
      verifyMembership,
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


