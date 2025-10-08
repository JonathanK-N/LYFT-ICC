export const appConfig = {
  companyName: 'Lyft-ICC',
  supportEmail: 'support@impactcentrechretien.org',
  map: {
    provider: 'mapbox', // mapbox | google
    mapbox: {
      styleUrl: 'mapbox://styles/mapbox/dark-v11',
    },
  },
  firebase: {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? '',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '',
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ?? '',
    vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY ?? '',
  },
  donations: (() => {
    const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY ?? '';
    const stripePriceId = import.meta.env.VITE_STRIPE_PRICE_ID ?? '';
    const paymentLink = import.meta.env.VITE_STRIPE_PAYMENT_LINK ?? '';
    const enabled = Boolean(paymentLink || (stripePublicKey && stripePriceId));

    return {
      enabled,
      url: 'https://www.impactcentrechretien.com/donner',
      stripePublicKey,
      stripePriceId,
      successUrl: import.meta.env.VITE_STRIPE_SUCCESS_URL ?? '',
      cancelUrl: import.meta.env.VITE_STRIPE_CANCEL_URL ?? '',
      paymentLink,
    };
  })(),
};
