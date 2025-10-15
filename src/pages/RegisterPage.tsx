import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAppState } from '../contexts/AppStateContext';
import './styles/RegisterPage.css';

export default function RegisterPage() {
  const { registerMember } = useAppState();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError('Merci de renseigner votre nom complet.');
      return;
    }
    if (!email.trim() && !phone.trim()) {
      setError('Merci de saisir un email ou un numero de telephone.');
      return;
    }
    if (password && password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caracteres.');
      return;
    }
    if (password && password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    try {
      const member = await registerMember({
        name: fullName.trim(),
        email: email.trim() ? email.trim() : undefined,
        phone: phone.trim() ? phone.trim() : undefined,
        password: password.trim() ? password.trim() : undefined,
      });
      if (!member) {
        setError('Impossible de creer votre compte pour le moment.');
        return;
      }
      navigate('/home', { replace: true });
    } catch (err) {
      console.error('[register] failed', err);
      setError('Une erreur est survenue pendant l inscription.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-wrapper">
      <motion.div
        className="register-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <motion.img
          src="/branding/icc-logo.png"
          alt="Lyft-ICC"
          className="register-logo"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6, ease: 'easeOut' }}
        />
        <h1>Creer un compte</h1>
        <p className="register-subtitle">
          Rejoignez la communaute Lyft-ICC et accedez a votre portail de mobilite.
        </p>
      </motion.div>
      <motion.section
        className="register-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
      >
        <form className="register-form" onSubmit={handleSubmit}>
          <label htmlFor="fullName">Nom complet</label>
          <input
            id="fullName"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Esther Nguema"
            required
          />

          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="esther@example.com"
          />

          <label htmlFor="phone">Telephone</label>
          <input
            id="phone"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="+33 6 00 00 00 00"
          />

          <label htmlFor="password">Mot de passe</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="********"
          />

          <label htmlFor="confirmPassword">Confirmez le mot de passe</label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="********"
          />

          {error ? (
            <motion.p
              className="register-error"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {error}
            </motion.p>
          ) : null}
          <div className="register-actions">
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.01 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
            >
              {loading ? 'Creation en cours...' : "S'inscrire"}
            </motion.button>
          </div>
        </form>
        <div className="register-links">
          <span>Deja inscrit ?</span>
          <Link to="/login">Se connecter</Link>
        </div>
      </motion.section>
    </div>
  );
}
