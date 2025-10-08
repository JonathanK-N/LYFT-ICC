import { loadStripe } from '@stripe/stripe-js';
import type { Stripe } from '@stripe/stripe-js';
import { appConfig } from '../../config/app.config';

let stripePromise: Promise<Stripe | null> | null = null;

async function getStripe(): Promise<Stripe | null> {
  if (!appConfig.donations.stripePublicKey) {
    return null;
  }
  if (!stripePromise) {
    stripePromise = loadStripe(appConfig.donations.stripePublicKey);
  }
  return stripePromise;
}

export async function redirectToDonation() {
  const { paymentLink, stripePriceId, successUrl, cancelUrl, url } =
    appConfig.donations;

  if (paymentLink) {
    window.open(paymentLink, '_blank', 'noopener');
    return;
  }

  const stripe = await getStripe();
  if (stripe && stripePriceId) {
    const resolvedSuccess =
      successUrl && successUrl.trim().length > 0
        ? successUrl
        : `${window.location.origin}/?donation=success`;
    const resolvedCancel =
      cancelUrl && cancelUrl.trim().length > 0
        ? cancelUrl
        : `${window.location.origin}/?donation=cancelled`;

    try {
      await (stripe as any).redirectToCheckout({
      lineItems: [{ price: stripePriceId, quantity: 1 }],
      mode: 'payment',
      successUrl: resolvedSuccess,
      cancelUrl: resolvedCancel,
      });
      return;
    } catch (error) {
      console.warn('[stripe] redirectToCheckout failed', error);
    }
  }

  window.open(url, '_blank', 'noopener');
}
