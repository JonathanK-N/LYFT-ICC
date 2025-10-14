import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
      setError('Please enter your email or phone number.');
      return;
    }

    setLoading(true);
    try {
      const member = await login({
        identifier: identifier.trim(),
        password: password || undefined,
      });
      if (!member) {
        setError('Incorrect credentials. Try again or create an account.');
        return;
      }
      navigate('/home', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-header">
        <img src="/icons/icon-192.png" alt="Lyft-ICC" className="login-logo" />
        <h1>Connexion</h1>
        <p className="login-subtitle">Accédez à votre compte Lyft-ICC</p>
      </div>
      <section className="login-card">
        <form className="login-form" onSubmit={handleSubmit}>
          <label htmlFor="identifier">Email ou téléphone</label>
          <input
            id="identifier"
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            placeholder="esther@example.com / +33 6 00 00 00 00"
            required
          />

          <label htmlFor="password">Mot de passe (optionnel pour la démo)</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="********"
          />

          {error ? <p className="login-error">{error}</p> : null}
          <div className="login-actions">
            <button type="submit" disabled={loading}>
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </div>
        </form>
        <div className="login-links">
          <span>Pas encore de compte ?</span>
          <Link to="/register">Créer un compte</Link>
        </div>
      </section>
    </div>
  );
}
