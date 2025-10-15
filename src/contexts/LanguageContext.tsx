import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Language } from '../types';

type TranslationMap = Record<string, string>;

const translations = {
  fr: {
    app_name: 'Lyft-ICC',
    welcome_title: 'Bienvenue sur Lyft-ICC !',
    welcome_subtitle: 'Organisez facilement votre covoiturage pour les messes et événements Impact Centre Chrétien.',
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
    verify_membership: 'Vérifier l\'adhésion',
    verification_success: 'Adhésion confirmée !',
    verification_failed: 'Code invalide. Merci de contacter l\'église.',
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
    suggestions_from_calendar: 'Suggestions depuis le calendrier de l\'église',
    no_rides_found: 'Aucun trajet disponible pour le moment.',
    reserve: 'Réserver',
    request_sent: 'Demande envoyée au conducteur.',
    chat_with_driver: 'Chat avec le conducteur',
    send_blessing: 'Envoyer une bénédiction',
    emergency_contact: 'Contact d\'urgence',
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
    today: 'Aujourd\'hui',
    driver_badge: 'Ange du covoiturage',
    passenger_badge: 'Voyageur de lumière',
    rating_invitation: 'Évaluez votre trajet',
    donate_prompt: 'Soutenez Impact Centre Chrétien',
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
      toggleLanguage: () => {},
      translate: (key) =>
        translations.fr[key] ?? key.replace(/_/g, ' '),
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