import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppState } from '../contexts/AppStateContext';
import type { Language } from '../types';
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
      setError("Une erreur est survenue pendant l'inscription.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-wrapper">
      <div className="register-header">
        <img src="/icons/icon-192.png" alt="Lyft-ICC" className="register-logo" />
        <h1>Créer un compte</h1>
        <p className="register-subtitle">
          Rejoignez la communauté Lyft-ICC et accédez à votre portail.
        </p>
      </div>
      <section className="register-card">
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

          {error ? <p className="register-error">{error}</p> : null}
          <div className="register-actions">
            <button type="submit" disabled={loading}>
              {loading ? 'Création...' : "S'inscrire"}
            </button>
          </div>
        </form>
        <div className="register-links">
          <span>Déjà inscrit ?</span>
          <Link to="/login">Se connecter</Link>
        </div>
      </section>
    </div>
  );
}
