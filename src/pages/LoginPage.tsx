import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppState } from '../contexts/AppStateContext';
import './styles/AuthForms.css';

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
        setLoading(false);
        return;
      }
      navigate('/home', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.');
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <section className="auth-card-simple">
        <div>
          <h1>Sign in</h1>
          <p className="description">Access your Lyft-ICC account.</p>
        </div>
        <form className="auth-form-simple" onSubmit={handleSubmit}>
          <label htmlFor="identifier">Email or phone</label>
          <input
            id="identifier"
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            placeholder="esther@example.com / +33 6 00 00 00 00"
            required
          />

          <label htmlFor="password">Password (optional for demo)</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••"
          />

          {error ? <p className="auth-error">{error}</p> : null}
          <div className="auth-actions">
            <button type="submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </div>
        </form>
        <div className="auth-links">
          <span>Need an account?</span>
          <Link to="/register">Create an account</Link>
        </div>
      </section>
    </div>
  );
}
