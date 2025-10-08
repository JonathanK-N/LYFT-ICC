import { initializeApp, getApps } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getMessaging, isSupported } from 'firebase/messaging';
import { appConfig } from '../../config/app.config';

export const isFirebaseConfigured = Boolean(
  appConfig.firebase.apiKey &&
    appConfig.firebase.authDomain &&
    appConfig.firebase.projectId,
);

let firebaseApp: FirebaseApp | null = null;

export function initFirebaseClient() {
  if (firebaseApp) {
    return firebaseApp;
  }
  if (!isFirebaseConfigured) {
    console.warn('[firebase] Configuration incomplete. Provide VITE_FIREBASE_* env vars.');
  }
  firebaseApp = getApps()[0] ?? initializeApp(appConfig.firebase);
  return firebaseApp;
}

export const firebaseServices = {
  get auth() {
    return getAuth(initFirebaseClient());
  },
  get db() {
    return getFirestore(initFirebaseClient());
  },
  get storage() {
    return getStorage(initFirebaseClient());
  },
  async messaging() {
    if (!(await isSupported())) {
      return null;
    }
    return getMessaging(initFirebaseClient());
  },
};
