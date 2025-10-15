import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Language } from '../types';

type TranslationMap = Record<string, string>;

const translations: Record<Language, TranslationMap> = {
  fr: {
    app_name: 'Lyft-ICC',
    welcome_title: 'Bienvenue sur Lyft-ICC !',
    welcome_subtitle:
      'Organisez facilement votre covoiturage pour les messes et evenements Impact Centre Chretien.',
    get_started: 'Commencer',
    create_account: 'Creer un compte',
    already_member: 'Deja membre ?',
    login: 'Se connecter',
    register: 'Inscription',
    logout: 'Deconnexion',
    name: 'Nom complet',
    email_or_phone: 'Email ou telephone',
    photo_url: 'Lien photo (facultatif)',
    membership_code: 'Code eglise',
    qr_token: 'Code QR scanne',
    verify_membership: 'Verifier l adhesion',
    verification_success: 'Adhesion confirmee !',
    verification_failed: 'Code invalide. Merci de contacter l eglise.',
    default_role_label: 'Role passager attribue par defaut.',
    upgrade_driver: 'Devenir conducteur',
    vehicle_make: 'Marque',
    vehicle_model: 'Modele',
    vehicle_color: 'Couleur',
    vehicle_plate: 'Plaque',
    available_seats: 'Places disponibles',
    save: 'Enregistrer',
    cancel: 'Annuler',
    home: 'Accueil',
    dashboard: 'Tableau de bord',
    map: 'Carte',
    events: 'Evenements',
    profile: 'Profil',
    search_rides: 'Chercher un trajet',
    offer_ride: 'Offrir un trajet',
    destination: 'Destination',
    upcoming_events: 'Evenements a venir',
    suggestions_from_calendar: 'Suggestions depuis le calendrier de l eglise',
    no_rides_found: 'Aucun trajet disponible pour le moment.',
    reserve: 'Reserver',
    request_sent: 'Demande envoyee au conducteur.',
    chat_with_driver: 'Chat avec le conducteur',
    send_blessing: 'Envoyer une benediction',
    emergency_contact: 'Contact d urgence',
    call_priest: 'Appeler le pretre',
    start_ride: 'Trajet commence',
    finish_ride: 'Trajet termine',
    accept: 'Accepter',
    decline: 'Refuser',
    pending_requests: 'Demandes en attente',
    driver_rewards: 'Recompenses',
    admin_portal: 'Espace admin',
    members: 'Membres',
    rides: 'Trajets',
    stats: 'Statistiques',
    announcements: 'Annonces',
    send_announcement: 'Envoyer une annonce',
    message_placeholder: 'Votre message pour la communaute...',
    donation_link: 'Faire un don',
    light_mode: 'Mode clair',
    dark_mode: 'Mode sombre',
    language_toggle: 'Francais',
    accessibility: 'Accessibilite',
    font_size: 'Taille du texte',
    voice_support: 'Support vocal',
    enable_voice: 'Activer la lecture vocale simulee',
    disable_voice: 'Desactiver la lecture vocale',
    notifications: 'Notifications',
    see_all: 'Tout voir',
    today: "Aujourd'hui",
    driver_badge: 'Ange du covoiturage',
    passenger_badge: 'Voyageur de lumiere',
    rating_invitation: 'Evaluez votre trajet',
    donate_prompt: 'Soutenez Impact Centre Chretien',
    open_map: 'Ouvrir la carte',
    placeholder_map: 'Carte Google Maps (placeholder)',
  },
};

interface LanguageContextValue {
  language: Language;
  toggleLanguage: () => void;
  translate: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(
  undefined,
);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('fr');

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      toggleLanguage: () => setLanguage('fr'),
      translate: (key) =>
        translations[language]?.[key] ?? key.replace(/_/g, ' '),
    }),
    [language],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
