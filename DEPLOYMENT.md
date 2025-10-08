# Déploiement Lyft-ICC sur Railway

## 🚀 Guide de déploiement

### 1. Prérequis
- Compte GitHub avec le code source
- Compte Railway (gratuit)
- Tokens Firebase et Mapbox (optionnels)

### 2. Déploiement automatique

#### Étape 1: Connecter à Railway
1. Allez sur [railway.app](https://railway.app)
2. Connectez-vous avec GitHub
3. Cliquez sur "New Project"
4. Sélectionnez "Deploy from GitHub repo"
5. Choisissez votre repository `LYFT-ICC`

#### Étape 2: Configuration automatique
Railway détectera automatiquement:
- ✅ Node.js application
- ✅ Package.json scripts
- ✅ Build process
- ✅ Port configuration

#### Étape 3: Variables d'environnement (optionnel)
Dans Railway Dashboard > Variables:

**Firebase (pour backend réel):**
```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_FIREBASE_VAPID_KEY=your_vapid_key
```

**Mapbox (pour carte réelle):**
```
VITE_MAPBOX_TOKEN=pk.eyJ1IjoieW91ci11c2VybmFtZSIsImEiOiJjbGV...
```

**Stripe (pour dons):**
```
VITE_STRIPE_PUBLIC_KEY=pk_live_...
VITE_STRIPE_PRICE_ID=price_...
VITE_STRIPE_SUCCESS_URL=https://your-app.railway.app/success
VITE_STRIPE_CANCEL_URL=https://your-app.railway.app/cancel
```

### 3. Déploiement réussi ✅

L'application sera disponible sur:
`https://your-app-name.up.railway.app`

### 4. Fonctionnalités disponibles

**Sans configuration:**
- ✅ Interface complète Uber/Lyft style
- ✅ Authentification locale
- ✅ Navigation entre pages
- ✅ Design responsive
- ✅ PWA (installable)

**Avec Firebase configuré:**
- ✅ Authentification réelle
- ✅ Base de données trajets
- ✅ Notifications push
- ✅ Stockage photos

**Avec Mapbox configuré:**
- ✅ Carte interactive réelle
- ✅ Géolocalisation
- ✅ Calcul d'itinéraires

### 5. Monitoring

Railway fournit automatiquement:
- 📊 Métriques de performance
- 📈 Logs en temps réel
- 🔄 Redémarrages automatiques
- 📱 Notifications de déploiement

### 6. Domaine personnalisé (optionnel)

1. Dans Railway Dashboard > Settings
2. Cliquez sur "Custom Domain"
3. Ajoutez votre domaine (ex: lyft-icc.com)
4. Configurez les DNS selon les instructions

### 7. Mise à jour

Chaque push sur la branche main déclenche automatiquement:
1. 🔄 Build de l'application
2. 🚀 Déploiement automatique
3. ✅ Mise en ligne instantanée

## 🛠️ Commandes utiles

**Build local:**
```bash
npm run build
```

**Test du build:**
```bash
npm run preview
```

**Déploiement manuel (si nécessaire):**
```bash
railway login
railway link
railway up
```

## 📞 Support

En cas de problème:
1. Vérifiez les logs Railway
2. Testez en local avec `npm run build && npm run preview`
3. Vérifiez les variables d'environnement

L'application est maintenant prête pour la production ! 🎉