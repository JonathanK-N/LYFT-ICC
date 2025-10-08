import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import {
  FiCamera,
  FiChevronRight,
  FiLock,
  FiMail,
  FiUser,
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../contexts/AppStateContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { branding } from '../assets/branding';
import '../pages/styles/AuthPage.css';

interface VehicleForm {
  make: string;
  model: string;
  color: string;
  plate: string;
  seats: number;
}

interface FormState {
  name: string;
  emailOrPhone: string;
  photo: File | null;
  language: 'fr' | 'en';
  password: string;
  confirm: string;
  vehicle: VehicleForm;
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (index = 1) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      delay: 0.08 * index,
      ease: 'easeOut' as const,
    },
  }),
};



const blockFade: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.38,
      ease: 'easeOut' as const,
    },
  },
  exit: {
    opacity: 0,
    y: 18,
    transition: {
      duration: 0.24,
      ease: 'easeIn' as const,
    },
  },
};

export default function AuthPage() {
  const { verifyMembership, registerMember, login, upgradeToDriver } =
    useAppState();
  const { translate } = useLanguage();
  const { voiceEnabled } = useTheme();
  const navigate = useNavigate();

  const [verifStatus, setVerifStatus] = useState<'idle' | 'success' | 'error'>(
    'idle',
  );
  const [error, setError] = useState<string | null>(null);
  const [identifier, setIdentifier] = useState('');
  const [vehicleMode, setVehicleMode] = useState(false);
  const [loginPassword, setLoginPassword] = useState('');
  const [form, setForm] = useState<FormState>({
    name: '',
    emailOrPhone: '',
    photo: null,
    language: 'fr',
    password: '',
    confirm: '',
    vehicle: {
      make: '',
      model: '',
      color: '',
      plate: '',
      seats: 3,
    },
  });

  const speak = (message: string) => {
    if (!voiceEnabled || typeof window === 'undefined') return;
    const synth = window.speechSynthesis;
    if (!synth) return;
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = form.language === 'fr' ? 'fr-FR' : 'en-US';
    synth.speak(utterance);
  };

  const emailOrPhonePlaceholder = useMemo(
    () =>
      form.language === 'fr'
        ? 'esther@example.com / +33...'
        : 'esther@example.com / +1...',
    [form.language],
  );

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setForm(prev => ({ ...prev, photo: file }));
    }
  };

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!form.name.trim()) {
      setError('Merci de renseigner votre nom complet.');
      return;
    }


    if (form.password && form.password.length < 6) {
      setError('Mot de passe trop court (6 caracteres minimum).');
      return;
    }
    if (form.password !== form.confirm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    const { name, emailOrPhone, photo, language, vehicle, password } = form;
    
    let avatarUrl = undefined;
    if (photo) {
      // Créer une URL temporaire pour l'aperçu
      avatarUrl = URL.createObjectURL(photo);
    }
    
    const payload = {
      name,
      language,
      avatar: avatarUrl,
      email: emailOrPhone.includes('@') ? emailOrPhone : undefined,
      phone:
        !emailOrPhone.includes('@') && emailOrPhone.trim()
          ? emailOrPhone
          : undefined,
      password: password || undefined,
    };

    let member;
    try {
      member = await registerMember(payload);
    } catch (err) {
      console.error('[auth] register error', err);
      setError('Inscription impossible. Verifiez vos informations.');
      return;
    }
    if (!member) {
      setError(translate('verification_failed'));
      speak(translate('verification_failed'));
      return;
    }

    if (vehicleMode) {
      await upgradeToDriver({
        ...vehicle,
        seats: Number(vehicle.seats) || 3,
      });
    }

    speak(`${translate('verification_success')} ${translate('dashboard')}`);
    navigate('/home');
  };

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (!identifier.trim()) {
      setError('Merci de saisir votre email, telephone ou nom.');
      return;
    }
    let member;
    try {
      member = await login({ identifier, password: loginPassword });
    } catch (err) {
      console.error('[auth] login error', err);
      setError('Connexion impossible. Verifiez vos identifiants.');
      return;
    }
    if (!member) {
      setError('Aucun membre trouve, merci de verifier vos informations.');
      speak('Aucun compte trouve. Reessayez ou inscrivez-vous.');
      return;
    }
    speak(`Bienvenue ${member.name}`);
    setLoginPassword('');
    navigate('/home');
  };

  return (
    <div className="auth-screen">
      <div className="auth-container">
        <motion.div 
          className="auth-hero"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={1}
        >
          <img src={branding.iccLogo} alt="Impact Centre Chrétien" />
          <h1>Lyft-ICC</h1>
          <p>Plateforme de covoiturage fraternelle pour les membres d'Impact Centre Chrétien</p>
          <ul className="auth-benefits">
            <li>
              <FiShield />
              <span>Trajets sécurisés entre membres vérifiés</span>
            </li>
            <li>
              <FiZap />
              <span>Réservation instantanée</span>
            </li>
            <li>
              <FiUser />
              <span>Communauté de confiance</span>
            </li>
          </ul>
        </motion.div>
        
        <div className="auth-cards">
          <motion.article
            className="auth-card"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={2}
          >
            <header className="auth-card__header">
              <span className="eyebrow">Inscription</span>
              <h2>{translate('register')}</h2>
            </header>

            <form className="auth-form" onSubmit={handleRegister}>
              <div className="form-grid two-columns">
                <div className="form-field">
                  <label htmlFor="name">
                    <FiUser /> {translate('name')}
                  </label>
                  <input
                    id="name"
                    value={form.name}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, name: event.target.value }))
                    }
                    placeholder="Esther Ilunga"
                    required
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="contact">
                    <FiMail /> {translate('email_or_phone')}
                  </label>
                  <input
                    id="contact"
                    value={form.emailOrPhone}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        emailOrPhone: event.target.value,
                      }))
                    }
                    placeholder={emailOrPhonePlaceholder}
                    required
                  />
                </div>
              </div>
              
              <div className="form-field">
                <label htmlFor="photo">
                  <FiCamera /> Photo de profil
                </label>
                <input
                  id="photo"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                />
                {form.photo && (
                  <div className="photo-preview">
                    <img 
                      src={URL.createObjectURL(form.photo)} 
                      alt="Aperçu"
                    />
                  </div>
                )}
              </div>
              
              <div className="form-grid two-columns">
                <div className="form-field">
                  <label htmlFor="password">
                    <FiLock /> Mot de passe
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={form.password}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, password: event.target.value }))
                    }
                    placeholder="Choisissez un mot de passe"
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="confirm">
                    <FiLock /> Confirmer
                  </label>
                  <input
                    id="confirm"
                    type="password"
                    value={form.confirm}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, confirm: event.target.value }))
                    }
                    placeholder="Repetez le mot de passe"
                  />
                </div>
              </div>
              
              <div className="form-field">
                <label htmlFor="language">Langue</label>
                <select
                  id="language"
                  value={form.language}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      language: event.target.value as FormState['language'],
                    }))
                  }
                >
                  <option value="fr">Français</option>
                  <option value="en">English</option>
                </select>
              </div>



              <div className="driver-upgrade">
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={vehicleMode}
                    onChange={(event) => setVehicleMode(event.target.checked)}
                  />
                  <span>{translate('upgrade_driver')}</span>
                </label>
                <AnimatePresence mode="wait">
                  {vehicleMode ? (
                    <motion.div
                      key="vehicle-form"
                      className="form-grid two-columns"
                      variants={blockFade}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                    >
                      <div className="form-field">
                        <label htmlFor="make">{translate('vehicle_make')}</label>
                        <input
                          id="make"
                          value={form.vehicle.make}
                          onChange={(event) =>
                            setForm((prev) => ({
                              ...prev,
                              vehicle: { ...prev.vehicle, make: event.target.value },
                            }))
                          }
                          placeholder="Toyota"
                        />
                      </div>
                      <div className="form-field">
                        <label htmlFor="model">{translate('vehicle_model')}</label>
                        <input
                          id="model"
                          value={form.vehicle.model}
                          onChange={(event) =>
                            setForm((prev) => ({
                              ...prev,
                              vehicle: { ...prev.vehicle, model: event.target.value },
                            }))
                          }
                          placeholder="Prius"
                        />
                      </div>
                      <div className="form-field">
                        <label htmlFor="color">{translate('vehicle_color')}</label>
                        <input
                          id="color"
                          value={form.vehicle.color}
                          onChange={(event) =>
                            setForm((prev) => ({
                              ...prev,
                              vehicle: { ...prev.vehicle, color: event.target.value },
                            }))
                          }
                          placeholder="Bleu"
                        />
                      </div>
                      <div className="form-field">
                        <label htmlFor="plate">{translate('vehicle_plate')}</label>
                        <input
                          id="plate"
                          value={form.vehicle.plate}
                          onChange={(event) =>
                            setForm((prev) => ({
                              ...prev,
                              vehicle: { ...prev.vehicle, plate: event.target.value },
                            }))
                          }
                          placeholder="ICC-123"
                        />
                      </div>
                      <div className="form-field">
                        <label htmlFor="seats">
                          {translate('available_seats')}
                        </label>
                        <input
                          id="seats"
                          type="number"
                          min={1}
                          max={8}
                          value={form.vehicle.seats}
                          onChange={(event) =>
                            setForm((prev) => ({
                              ...prev,
                              vehicle: {
                                ...prev.vehicle,
                                seats: Number(event.target.value),
                              },
                            }))
                          }
                        />
                      </div>
                    </motion.div>
                  ) : (
                    <motion.p
                      key="vehicle-hint"
                      className="driver-hint"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.25, ease: 'easeOut' as const }}
                    >
                      Pré-enregistrez votre véhicule pour proposer des trajets vérifiés plus vite.
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              <AnimatePresence mode="wait">
                {error ? (
                  <motion.p
                    key={error}
                    className="auth-error"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                  >
                    {error}
                  </motion.p>
                ) : null}
              </AnimatePresence>

              <motion.button
                type="submit"
                className="cta"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
              >
                <span>{translate('register')}</span>
                <FiChevronRight />
              </motion.button>
            </form>
          </motion.article>

          <motion.article
            className="auth-card"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={3}
          >
            <header className="auth-card__header">
              <span className="eyebrow">Connexion</span>
              <h2>{translate('login')}</h2>
            </header>
            <form className="auth-form" onSubmit={handleLogin}>
              <div className="form-field">
                <label htmlFor="identifier">
                  <FiUser /> {translate('email_or_phone')}
                </label>
                <input
                  id="identifier"
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  placeholder={emailOrPhonePlaceholder}
                />
              </div>
              <div className="form-field">
                <label htmlFor="login-password">
                  <FiLock /> Mot de passe
                </label>
                <input
                  id="login-password"
                  type="password"
                  value={loginPassword}
                  onChange={(event) => setLoginPassword(event.target.value)}
                  placeholder="Mot de passe"
                />
              </div>
              <motion.button
                type="submit"
                className="cta ghost"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
              >
                <span>{translate('login')}</span>
                <FiChevronRight />
              </motion.button>
            </form>
          </motion.article>
        </div>
      </div>
    </div>
  );
}
