import { getToken, onMessage } from 'firebase/messaging';
import { appConfig } from '../../config/app.config';
import { firebaseServices, isFirebaseConfigured } from './client';

export async function requestMessagingToken() {
  if (!isFirebaseConfigured) {
    return null;
  }
  try {
    const messaging = await firebaseServices.messaging();
    if (!messaging) {
      return null;
    }
    const vapidKey = appConfig.firebase.vapidKey || undefined;
    const token = await getToken(messaging, { vapidKey });
    return token;
  } catch (error) {
    console.warn('[firebase] Unable to retrieve FCM token', error);
    return null;
  }
}

export function listenForegroundMessages(
  callback: Parameters<typeof onMessage>[1],
) {
  if (!isFirebaseConfigured) {
    return () => undefined;
  }
  return firebaseServices.messaging().then((messaging) => {
    if (!messaging) {
      return () => undefined;
    }
    return onMessage(messaging, callback);
  });
}

