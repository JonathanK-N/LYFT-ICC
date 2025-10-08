import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import type { UserProfile } from '../../types/firebase';
import { firebaseServices } from '../../services/firebase/client';

const profilesCollection = collection(firebaseServices.db, 'profiles');

export async function registerWithEmail({
  email,
  password,
  fullName,
  language,
}: {
  email: string;
  password: string;
  fullName: string;
  language: 'fr' | 'en';
}) {
  const userCredential = await createUserWithEmailAndPassword(
    firebaseServices.auth,
    email,
    password,
  );
  await updateProfile(userCredential.user, { displayName: fullName });

  const profile: UserProfile = {
    uid: userCredential.user.uid,
    fullName,
    email,
    role: 'passenger',
    churchCodeValidated: false,
    language,
    stats: {
      ridesTaken: 0,
      ridesGiven: 0,
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(doc(profilesCollection, profile.uid), profile);
  return profile;
}

export async function signInWithEmail({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  return signInWithEmailAndPassword(firebaseServices.auth, email, password);
}

export async function signOutCurrentUser() {
  await signOut(firebaseServices.auth);
}

export async function fetchUserProfile(uid: string) {
  const snapshot = await getDoc(doc(profilesCollection, uid));
  return snapshot.exists() ? (snapshot.data() as UserProfile) : null;
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>) {
  await updateDoc(doc(profilesCollection, uid), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}
