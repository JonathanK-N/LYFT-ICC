import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAppState } from '../contexts/AppStateContext';
import './styles/LoginPage.css';

export default function LoginPage() {
  const { login } = useAppState();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!identifier.trim()) {
      setError('Merci d indiquer votre email ou numero de telephone.');
      return;
    }

    setLoading(true);
    try {
      const member = await login({
        identifier: identifier.trim(),
        password: password || undefined,
      });
      if (!member) {
        setError('Identifiants incorrects. Reessayez ou creez un compte.');
        return;
      }
      navigate('/home', { replace: true });
    } catch (err) {
      setError('Connexion impossible pour le moment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <motion.div
        className="login-header"
        initial={{ opacity: 0, y: -18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
      >
        <motion.img
          src="/icons/icon-192.png"
          alt="Lyft-ICC"
          className="login-logo"
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.45, ease: 'easeOut', delay: 0.1 }}
        />
        <h1>Connexion</h1>
        <p className="login-subtitle">Accedez a votre compte Lyft-ICC</p>
      </motion.div>
      <motion.section
        className="login-card"
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut', delay: 0.05 }}
      >
        <form className="login-form" onSubmit={handleSubmit}>
          <label htmlFor="identifier">Email ou telephone</label>
          <input
            id="identifier"
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            placeholder="esther@example.com / +33 6 00 00 00 00"
            required
          />

          <label htmlFor="password">Mot de passe (optionnel pour la demo)</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="********"
          />

          {error ? (
            <motion.p
              className="login-error"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {error}
            </motion.p>
          ) : null}
          <div className="login-actions">
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.01 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </motion.button>
          </div>
        </form>
        <div className="login-links">
          <span>Pas encore de compte ?</span>
          <Link to="/register">Creer un compte</Link>
        </div>
      </motion.section>
    </div>
  );
}
