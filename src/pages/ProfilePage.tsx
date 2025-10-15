import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import {
  FiAward,
  FiEdit2,
  FiExternalLink,
  FiHeart,
  FiHome,
  FiLogOut,
  FiMail,
  FiPhone,
  FiShield,
  FiStar,
  FiUser,
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../contexts/AppStateContext';
import { useLanguage } from '../contexts/LanguageContext';
import { appConfig } from '../config/app.config';
import { redirectToDonation } from '../services/payments/stripe';
import '../pages/styles/ProfilePage.css';

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

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.12,
      staggerChildren: 0.1,
    },
  },
};

const staggerItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.32,
      ease: 'easeOut' as const,
    },
  },
  exit: {
    opacity: 0,
    y: 10,
    transition: {
      duration: 0.24,
      ease: 'easeIn' as const,
    },
  },
};

export default function ProfilePage() {
  const { currentUser, upgradeToDriver, logout } = useAppState();
  const { translate } = useLanguage();
  const navigate = useNavigate();
  const [driverMode, setDriverMode] = useState(false);
  const [vehicle, setVehicle] = useState({
    make: '',
    model: '',
    color: '',
    plate: '',
    seats: 4,
  });

  const stats = useMemo(
    () =>
      currentUser
        ? [
            { label: 'Rides taken', value: currentUser.ridesTaken },
            { label: 'Rides given', value: currentUser.ridesGiven },
            { label: 'Badges', value: currentUser.badges.length },
          ]
        : [],
    [currentUser],
  );

  if (!currentUser) {
    return null;
  }

  const handleBecomeDriver = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await upgradeToDriver({
      make: vehicle.make,
      model: vehicle.model,
      color: vehicle.color,
      plate: vehicle.plate,
      seats: Number(vehicle.seats) || 4,
    });
    setDriverMode(false);
  };

  return (
    <section className="profile-screen">
      <motion.article
        className="panel profile-hero"
        variants={fadeUp}
        initial="hidden"
        animate="visible"
      >
        <div className="profile-hero__top">
          <div className="profile-avatar">
            <img
              src={
                currentUser.avatar ??
                `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=03152C&color=ffffff`
              }
              alt={currentUser.name}
            />
          </div>
          <div className="profile-identity">
            <span className="tag">Compte ICC</span>
            <h1>{currentUser.name}</h1>
            <p>
              <FiShield /> {currentUser.role.toUpperCase()}
            </p>
            <div className="profile-tags">
              {currentUser.email ? (
                <span className="chip">
                  <FiMail /> {currentUser.email}
                </span>
              ) : null}
              {currentUser.phone ? (
                <span className="chip">
                  <FiPhone /> {currentUser.phone}
                </span>
              ) : null}
              <span className="chip">
                <FiUser /> {currentUser.language.toUpperCase()}
              </span>
            </div>
          </div>
          <motion.button
            type="button"
            className="secondary"
            onClick={() => navigate('/home')}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
          >
            <FiHome /> {translate('dashboard')}
          </motion.button>
        </div>
        <motion.div
          className="profile-stats"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {stats.map((stat) => (
            <motion.div key={stat.label} variants={staggerItem}>
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
            </motion.div>
          ))}
        </motion.div>
      </motion.article>

      <motion.article
        className="panel"
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={2}
      >
        <header className="panel-header">
          <div>
            <p className="title">
              <FiAward /> {translate('driver_rewards')}
            </p>
            <p className="subtitle">
              Engagez-vous dans le covoiturage fraternel et recevez badges et
              encouragements.
            </p>
          </div>
        </header>
        <motion.div
          className="profile-badges"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {currentUser.badges.length === 0 ? (
            <motion.div className="empty-state" variants={staggerItem}>
              Aucun badge pour l'instant. Partagez un trajet pour obtenir la
              premiere recompense.
            </motion.div>
          ) : (
            currentUser.badges.map((badge) => (
              <motion.span key={badge} className="badge-pill" variants={staggerItem}>
                <FiStar /> {badge}
              </motion.span>
            ))
          )}
        </motion.div>
      </motion.article>

      {currentUser.role !== 'driver' && (
        <motion.article
          className="panel"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={3}
        >
          <header className="panel-header">
            <div>
              <p className="title">
                <FiStar /> {translate('upgrade_driver')}
              </p>
              <p className="subtitle">
                Beneficiez d'un badge special et aidez les membres a rejoindre la
                maison de Dieu.
              </p>
            </div>
          </header>
          <AnimatePresence mode="wait">
            {!driverMode ? (
              <motion.button
                key="driver-cta"
                type="button"
                className="cta ghost"
                onClick={() => setDriverMode(true)}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
              >
                <FiEdit2 /> Completer mon vehicule
              </motion.button>
            ) : (
              <motion.form
                key="driver-form"
                className="form-grid two-columns"
                onSubmit={handleBecomeDriver}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                <div className="form-field">
                  <label htmlFor="make">{translate('vehicle_make')}</label>
                  <input
                    id="make"
                    value={vehicle.make}
                    onChange={(event) =>
                      setVehicle((prev) => ({ ...prev, make: event.target.value }))
                    }
                    required
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="model">{translate('vehicle_model')}</label>
                  <input
                    id="model"
                    value={vehicle.model}
                    onChange={(event) =>
                      setVehicle((prev) => ({ ...prev, model: event.target.value }))
                    }
                    required
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="color">{translate('vehicle_color')}</label>
                  <input
                    id="color"
                    value={vehicle.color}
                    onChange={(event) =>
                      setVehicle((prev) => ({ ...prev, color: event.target.value }))
                    }
                    required
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="plate">{translate('vehicle_plate')}</label>
                  <input
                    id="plate"
                    value={vehicle.plate}
                    onChange={(event) =>
                      setVehicle((prev) => ({ ...prev, plate: event.target.value }))
                    }
                    required
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="seats">{translate('available_seats')}</label>
                  <input
                    id="seats"
                    type="number"
                    min={1}
                    max={8}
                    value={vehicle.seats}
                    onChange={(event) =>
                      setVehicle((prev) => ({
                        ...prev,
                        seats: Number(event.target.value),
                      }))
                    }
                    required
                  />
                </div>
                <motion.button
                  type="submit"
                  className="cta"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <FiStar /> Valider
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.article>
      )}

      <motion.article
        className="panel"
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={4}
      >
        <header className="panel-header">
          <div>
            <p className="title">
              <FiHeart /> {translate('donation_link')}
            </p>
            <p className="subtitle">
              Soutenez Impact Centre Chretien et participez aux projets
              communautaires.
            </p>
          </div>
        </header>
        <motion.button
          type="button"
          className="cta ghost"
          onClick={() => {
            redirectToDonation();
          }}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.97 }}
        >
          <FiExternalLink /> {appConfig.donations.enabled ? 'Faire un don sécurisé' : 'Accéder à la page dons'}
        </motion.button>
      </motion.article>

      <motion.article
        className="panel profile-actions"
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={5}
      >
        <motion.button
          type="button"
          onClick={() => navigate('/admin')}
          disabled={currentUser.role !== 'admin'}
          whileHover={{ y: currentUser.role === 'admin' ? -2 : 0 }}
          whileTap={currentUser.role === 'admin' ? { scale: 0.97 } : undefined}
        >
          <FiShield /> {translate('admin_portal')}
        </motion.button>
        <motion.button
          type="button"
          onClick={async () => {
            await logout();
            navigate('/login');
          }}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.97 }}
        >
          <FiLogOut /> {translate('logout')}
        </motion.button>
      </motion.article>
    </section>
  );
}
