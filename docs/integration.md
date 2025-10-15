# Intégration Temps Réel Lyft-ICC

Cette note résume la configuration minimale nécessaire pour brancher l'application sur Firebase et Mapbox.

## 1. Firebase

### 1.1 Création du projet
- Rendez-vous sur [console.firebase.google.com](https://console.firebase.google.com), créez un projet.
- Activez Authentication (Email/Password), Cloud Firestore, Cloud Functions (optionnel) et Cloud Storage si vous gérez les avatars.

### 1.2 Collections Firestore
```
profiles/{uid}
  fullName, email, phone, role ('driver'|'passenger'|'admin'),
  language, vehicle { make, model, color, plate, seats },
  badges[], stats { ridesGiven, ridesTaken },
  currentLocation { lat, lng, updatedAt },
  photoUrl, createdAt, updatedAt

rides/{rideId}
  driverId, driverName, driverPhotoUrl,
  driverVehicle, driverLocation { lat, lng, updatedAt },
  origin { address, lat, lng }, destination { address, lat, lng },
  departureTime, seatsAvailable, seatsBooked,
  status ('published'|'in_progress'|'completed'...),
  visibility ('public'), passengers[], note, eventId,
  createdAt, updatedAt

rideRequests/{requestId}
  rideId, passengerId, passengerName, message,
  status ('pending'|'accepted'|'declined'), createdAt, updatedAt

notifications/{notificationId}
  message, type, actionLabel, timestamp
```

### 1.3 Règles de sécurité
- Autorisez la lecture/écriture aux utilisateurs authentifiés.
- Un conducteur ne peut modifier que ses trajets (`driverId == request.auth.uid`).
- Un passager ne peut réserver que pour ses propres `rideRequests`.
- Les mises à jour de localisation peuvent passer par une Function HTTP pour valider les données.

### 1.4 Variables d'environnement
Ajoutez dans `.env` (et sur Railway) :
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...
VITE_FIREBASE_VAPID_KEY=...
```

## 2. Mapbox
- Créez un compte Mapbox, générer un token restreint.
- Définir `VITE_MAPBOX_TOKEN` dans `.env` / Railway.
- Optionnel : utilisez l'API Geocoding (adresse -> lat/lng) et Directions (tracé itinéraire).

## 3. Node & Build
- Vite 7 nécessite Node >= 20.19 (22.12 conseillé). Sur Railway : `RAILWAY_BUILD_NODE_VERSION=22.12.0` ou Docker `FROM node:22-alpine`.
- Pour la PWA, la limite de pré-cache est portée à 5 Mo (`vite.config.ts`).

## 4. Géolocalisation conducteur
- Sur le client conducteur, appelez `navigator.geolocation.watchPosition` et envoyez les coordonnées via `updateDriverLocation`.
- Firestore diffusera les changements et la carte Mapbox mettra à jour les marqueurs.

## 5. Formulaires
- **Offrir un trajet** : le formulaire effectue un geocoding Mapbox puis enregistre le document `rides`.
- **Chercher un trajet** : la page carte écoute les trajets en temps réel, applique les filtres et affiche la liste + les marqueurs.

Une fois ce socle en place, il ne reste plus qu'à adapter les règles métier (validation, paiement, notifications) selon vos besoins.
