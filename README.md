# Lyft-ICC

Lyft-ICC est une Progressive Web App mobile-first concue pour faciliter le covoiturage fraternel des membres d'Impact Centre Chretien (ICC). Elle adopte une experience visuelle premium proche d'Uber/Lyft, avec une carte temps reel, des animations fluides et un theme nuit/or propre a la charte ICC.

## Fonctionnalites actuelles

- Shell applicatif pro : design system tokens, layout glassmorphique, toasts, navigation inferieure animee.
- Ecran Home "hub" (actions rapides, rides proches, alertes conducteur, agenda ICC, feed communautaire).
- Ecran Carte map-first avec Mapbox, barre de recherche, bottom sheet dynamique pour les trajets, et transition detail ride.
- Modules prets pour Firebase : auth/email, profils roles, Firestore (rides / requests / events), storage, messaging (FCM) via `src/modules`.
- Architecture React Query + Zustand pour les flux data/UX, PWA pre-configuree (service worker, manifest, icons).

## Prerequis

- Node.js >= 22.12.0 (ou 20.19.x LTS) : `node -v`
- npm >= 10
- Compte Mapbox (token public) et projet Firebase si tu actives le backend.

## Variables d'environnement

Copie `.env.example` vers `.env` et renseigne :

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
VITE_FIREBASE_VAPID_KEY=

VITE_MAPBOX_TOKEN=

# Optionnel pour Stripe / dons
VITE_STRIPE_PUBLIC_KEY=
VITE_STRIPE_PRICE_ID=
VITE_STRIPE_SUCCESS_URL=
VITE_STRIPE_CANCEL_URL=
VITE_STRIPE_PAYMENT_LINK=
```

## Lancer l'application

```bash
npm install
npm run dev
```

Ouvre http://localhost:5173 (mobile viewport recommande) et ajoute la PWA a l'ecran d'accueil pour tester l'app comme une app native.

### Scripts utiles

- `npm run dev` : serveur de developpement Vite (HMR).
- `npm run build` : build production + generation du service worker.
- `npm run preview` : previsualisation du build.

## Structure

```
src/
  assets/branding.ts      # chemins logos ICC
  theme/                  # tokens et provider design system
  layouts/                # AppLayout (shell)
  components/             # Header, nav, notifications, toasts...
  modules/                # auth, rides, events, app state (Firebase-ready)
  services/firebase/      # client Firebase
  lib/                    # Query client, utils mapbox
  pages/                  # Home, Map, Events, Auth, Profile, Admin
public/
  branding/               # place ici icc-logo.png & icc-logo-alt.png
  icons/                  # assets PWA
```

## Integrations & services

- Map : Mapbox GL (style sombre). Sans token, un placeholder est affiche.
- Backend : Firebase Auth/Firestore/Storage relies. Si la configuration `.env` est absente, l'application bascule automatiquement sur les jeux de données de démonstration (`src/data/sampleData.ts`).
- Notifications push : FCM avec recuperation du token (utilise `VITE_FIREBASE_VAPID_KEY`). Les messages reçus en premier plan sont affichés dans la tray notifications.
- Dons Stripe : si `VITE_STRIPE_PAYMENT_LINK` est défini, le bouton ouvre directement ce lien. Sinon, `redirectToDonation` déclenche `stripe.redirectToCheckout` avec `VITE_STRIPE_PRICE_ID` et retombe sur la page ICC par défaut.

### Configuration Firebase (Phase 3)

1. **Activer les produits nécessaires** dans la console Firebase : Authentication (Email/Password), Cloud Firestore, Storage et Cloud Messaging.
2. **Renseigner les variables d’environnement** listées ci-dessus puis relancer Vite.
3. **Collections attendues** dans Firestore (toutes en mode `withConverter` côté app) :
   - `profiles` : documents `UserProfile` (voir `src/types/firebase.ts`). Les nouveaux inscrits sont créés via `registerWithEmail`.
   - `rides` : trajets proposés. La création depuis l’app écrit un document complet (statut `published`, horodatages serveur).
   - `events` : agenda ICC, utilisé pour la carte et la page Événements.
   - `rideRequests` : demandes passagers → conducteurs.
   - `notifications` : flux communautaire + messages FCM réinjectés côté client.
4. **Storage** : créer un dossier `avatars/` si vous souhaitez stocker des photos (l’application accepte toujours une URL directe).
5. **Messaging (FCM)** : ajouter une clé VAPID, télécharger le fichier `firebase-messaging-sw.js` (Vite > `public/`) si vous souhaitez gérer les notifications background.
6. **Règles Firestore/Storage** (à adapter à votre projet) : prévoyez au minimum que seules les personnes authentifiées puissent lire/écrire leurs propres profils et trajets.

### Onboarding vocal (Phase 4)

- Activez le support vocal via l’icône casque dans l’entête pour déclencher l’assistant audio.
- Le guide présente les étapes clés (profil, carte, dons). Il repose sur `speechSynthesis` et s’exécute automatiquement à la première activation (stocké dans `localStorage`).
- Pour rejouer, laissez le support vocal activé et cliquez sur « Écouter » ou « Relancer » dans le panneau d’accueil.

## Accessibilite & UX

- Mode nuit par defaut, contrastes eleves, typographie Inter/Poppins.
- Navigation au clavier, focus visibles, toasts accessibles.
- Bottom sheets et cartes animees via Framer Motion.

## Etapes suivantes

1. **Sécurité Firebase** : finaliser les règles Firestore/Storage et l’indexation (comprise dans la phase 3).
2. **Phase 4** : dons Stripe, onboarding vocal, tests unitaires/E2E, QA PWA (Audit Lighthouse), packaging.



## QA & packaging

- `npm run build && npm run preview` puis audit Lighthouse (PWA + Performance >= 90 recommande).
- `npm run lint` pour verifier la qualite du code (actuellement quelques avertissements subsistent sur les providers React à découper en modules dédiés).
- Le build genere un service worker (voir `dist/`).
