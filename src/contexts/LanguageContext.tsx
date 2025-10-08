import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Language } from '../types';

type TranslationMap = Record<string, string>;

const translations: Record<Language, TranslationMap> = {
  fr: {
    app_name: 'Lyft-ICC',
    welcome_title: 'Que Dieu bénisse votre trajet !',
    welcome_subtitle:
      'Organisez facilement votre covoiturage pour les messes et événements Impact Centre Chrétien.',
    get_started: 'Commencer',
    create_account: 'Créer un compte',
    already_member: 'Déjà membre ?',
    login: 'Se connecter',
    register: 'Inscription',
    logout: 'Déconnexion',
    name: 'Nom complet',
    email_or_phone: 'Email ou téléphone',
    photo_url: 'Lien photo (facultatif)',
    membership_code: 'Code église',
    qr_token: 'Code QR scanné',
    verify_membership: 'Vérifier l’adhésion',
    verification_success: 'Adhésion confirmée !',
    verification_failed: 'Code invalide. Merci de contacter l’église.',
    default_role_label: 'Rôle passager attribué par défaut.',
    upgrade_driver: 'Devenir conducteur',
    vehicle_make: 'Marque',
    vehicle_model: 'Modèle',
    vehicle_color: 'Couleur',
    vehicle_plate: 'Plaque',
    available_seats: 'Places disponibles',
    save: 'Enregistrer',
    cancel: 'Annuler',
    dashboard: 'Tableau de bord',
    map: 'Carte',
    events: 'Événements',
    profile: 'Profil',
    search_rides: 'Chercher un trajet',
    offer_ride: 'Offrir un trajet',
    destination: 'Destination',
    upcoming_events: 'Événements à venir',
    suggestions_from_calendar: 'Suggestions depuis le calendrier de l’église',
    no_rides_found: 'Aucun trajet disponible pour le moment.',
    reserve: 'Réserver',
    request_sent: 'Demande envoyée au conducteur.',
    chat_with_driver: 'Chat avec le conducteur',
    send_blessing: 'Envoyer une bénédiction',
    emergency_contact: 'Contact d’urgence',
    call_priest: 'Appeler le prêtre',
    start_ride: 'Trajet commencé',
    finish_ride: 'Trajet terminé',
    accept: 'Accepter',
    decline: 'Refuser',
    pending_requests: 'Demandes en attente',
    driver_rewards: 'Récompenses',
    admin_portal: 'Espace admin',
    members: 'Membres',
    rides: 'Trajets',
    stats: 'Statistiques',
    announcements: 'Annonces',
    send_announcement: 'Envoyer une annonce',
    message_placeholder: 'Votre message pour la communauté…',
    donation_link: 'Faire un don',
    light_mode: 'Mode clair',
    dark_mode: 'Mode sombre',
    language_toggle: 'English',
    accessibility: 'Accessibilité',
    font_size: 'Taille du texte',
    voice_support: 'Support vocal',
    enable_voice: 'Activer la lecture vocale simulée',
    disable_voice: 'Désactiver la lecture vocale',
    notifications: 'Notifications',
    see_all: 'Tout voir',
    today: 'Aujourd’hui',
    driver_badge: 'Ange du covoiturage',
    passenger_badge: 'Voyageur de lumière',
    rating_invitation: 'Évaluez votre trajet',
    donate_prompt: 'Soutenez Impact Centre Chrétien',
    open_map: 'Ouvrir la carte',
    placeholder_map: 'Carte Google Maps (placeholder)',
  },
  en: {
    app_name: 'Lyft-ICC',
    welcome_title: 'May God bless your ride!',
    welcome_subtitle:
      'Arrange free carpooling for ICC Sunday services and events.',
    get_started: 'Get started',
    create_account: 'Create account',
    already_member: 'Already a member?',
    login: 'Log in',
    register: 'Register',
    logout: 'Log out',
    name: 'Full name',
    email_or_phone: 'Email or phone',
    photo_url: 'Photo link (optional)',
    membership_code: 'Church code',
    qr_token: 'Scanned QR token',
    verify_membership: 'Verify membership',
    verification_success: 'Membership confirmed!',
    verification_failed: 'Invalid code. Please contact the church.',
    default_role_label: 'Passenger role assigned by default.',
    upgrade_driver: 'Become a driver',
    vehicle_make: 'Make',
    vehicle_model: 'Model',
    vehicle_color: 'Color',
    vehicle_plate: 'Plate',
    available_seats: 'Available seats',
    save: 'Save',
    cancel: 'Cancel',
    dashboard: 'Dashboard',
    map: 'Map',
    events: 'Events',
    profile: 'Profile',
    search_rides: 'Find a ride',
    offer_ride: 'Offer a ride',
    destination: 'Destination',
    upcoming_events: 'Upcoming events',
    suggestions_from_calendar: 'Suggestions from church calendar',
    no_rides_found: 'No rides available yet.',
    reserve: 'Reserve',
    request_sent: 'Request sent to the driver.',
    chat_with_driver: 'Chat with driver',
    send_blessing: 'Send blessing',
    emergency_contact: 'Emergency contact',
    call_priest: 'Call priest',
    start_ride: 'Ride started',
    finish_ride: 'Ride finished',
    accept: 'Accept',
    decline: 'Decline',
    pending_requests: 'Pending requests',
    driver_rewards: 'Rewards',
    admin_portal: 'Admin portal',
    members: 'Members',
    rides: 'Rides',
    stats: 'Statistics',
    announcements: 'Announcements',
    send_announcement: 'Send announcement',
    message_placeholder: 'Your message for the community…',
    donation_link: 'Donate',
    light_mode: 'Light mode',
    dark_mode: 'Dark mode',
    language_toggle: 'Français',
    accessibility: 'Accessibility',
    font_size: 'Text size',
    voice_support: 'Voice support',
    enable_voice: 'Enable simulated voice',
    disable_voice: 'Disable voice',
    notifications: 'Notifications',
    see_all: 'See all',
    today: 'Today',
    driver_badge: 'Carpool Angel',
    passenger_badge: 'Traveler of Light',
    rating_invitation: 'Rate your ride',
    donate_prompt: 'Support Impact Centre Chrétien',
    open_map: 'Open map',
    placeholder_map: 'Google Maps placeholder',
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
      toggleLanguage: () =>
        setLanguage((prev) => (prev === 'fr' ? 'en' : 'fr')),
      translate: (key) =>
        translations[language][key] ??
        translations.fr[key] ??
        key.replace(/_/g, ' '),
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
