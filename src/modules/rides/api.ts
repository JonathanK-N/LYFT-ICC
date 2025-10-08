import { collection, doc, getDoc, getDocs, orderBy, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import type { RideEntity, RideRequest } from '../../types/firebase';
import { firebaseServices } from '../../services/firebase/client';

const ridesCollection = collection(firebaseServices.db, 'rides');
const rideRequestsCollection = collection(firebaseServices.db, 'rideRequests');

export async function fetchUpcomingRides(limit = 20) {
  const q = query(ridesCollection, orderBy('departureTime', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.slice(0, limit).map((docSnap) => docSnap.data() as RideEntity);
}

export async function fetchRideById(rideId: string) {
  const rideRef = doc(ridesCollection, rideId);
  const snapshot = await getDoc(rideRef);
  return snapshot.exists() ? (snapshot.data() as RideEntity) : null;
}

export async function createRide(ride: RideEntity) {
  const rideRef = doc(ridesCollection, ride.id);
  await setDoc(rideRef, {
    ...ride,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateRide(rideId: string, data: Partial<RideEntity>) {
  const rideRef = doc(ridesCollection, rideId);
  await updateDoc(rideRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function fetchRideRequests(rideId: string) {
  const q = query(rideRequestsCollection, where('rideId', '==', rideId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => docSnap.data() as RideRequest);
}

