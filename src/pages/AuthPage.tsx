import { useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { useAppState } from '../contexts/AppStateContext';
import { useLanguage } from '../contexts/LanguageContext';
import '../pages/styles/AuthPage.css';

interface RegisterForm {
  name: string;
  email: string;
  phone: string;
  language: 'fr' | 'en';
  password: string;
  confirm: string;
}

const emptyForm: RegisterForm = {
  name: '',
  email: '',
  phone: '',
  language: 'fr',
  password: '',
  confirm: '',
};

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: 'easeOut' as const },
  },
};

export default function AuthPage() {
  const { registerMember, login } = useAppState();
  const { translate } = useLanguage();
  const [form, setForm] = useState<RegisterForm>(emptyForm);
  const [photoPreview, setPhotoPreview] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [identifier, setIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const emailPlaceholder = useMemo(
    () => (form.language === 'fr' ? 'esther@example.com' : 'esther@example.com'),
    [form.language],
  );

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setPhotoPreview(undefined);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPhotoPreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const trimmedName = form.name.trim();
    const trimmedEmail = form.email.trim();
    const trimmedPhone = form.phone.trim();

    if (!trimmedName) {
      setError('Merci de renseigner votre nom complet.');
      return;
    }

    if (!trimmedEmail && !trimmedPhone) {
      setError('Indiquez un email ou un numero de telephone.');
      return;
    }

    if (form.password.length < 6) {
      setError('Mot de passe trop court (6 caracteres minimum).');
      return;
    }

    if (form.password !== form.confirm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    const newMember = await registerMember({
      name: trimmedName,
      email: trimmedEmail || undefined,
      phone: trimmedPhone || undefined,
      password: form.password,
      avatar: photoPreview,
      language: form.language,
    });

    if (!newMember) {
      setError('Inscription impossible pour le moment. Reessayez plus tard.');
      return;
    }

    setForm(emptyForm);
    setPhotoPreview(undefined);
  };

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginError(null);

    if (!identifier.trim()) {
      setLoginError('Veuillez saisir votre email ou telephone.');
      return;
    }

    const member = await login({ identifier: identifier.trim(), password: loginPassword });
    if (!member) {
      setLoginError('Identifiants invalides. Verifiez vos informations.');
      return;
    }

    setIdentifier('');
    setLoginPassword('');
  };

  return (
    <section className="auth-page">
      <div className="auth-layout">
        <motion.article className="auth-card" variants={cardVariants} initial="hidden" animate="visible">
          <header className="auth-card__header">
            <span className="eyebrow">{translate('register')}</span>
            <h2>Creer un compte</h2>
            <p>Rejoignez la communaute Impact Centre Chretien et organisez vos trajets en toute simplicite.</p>
          </header>

          {error ? <p className="form-error">{error}</p> : null}

          <form className="auth-form" onSubmit={handleRegister}>
            <div className="form-grid two-columns">
              <div className="form-field">
                <label htmlFor="name">{translate('name')}</label>
                <input
                  id="name"
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="Esther Ilunga"
                  required
                />
              </div>
              <div className="form-field">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                  placeholder={emailPlaceholder}
                />
              </div>
              <div className="form-field">
                <label htmlFor="phone">Telephone</label>
                <input
                  id="phone"
                  value={form.phone}
                  onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                  placeholder="+33 6 12 34 56 78"
                />
              </div>
              <div className="form-field">
                <label htmlFor="language">Langue</label>
                <select
                  id="language"
                  value={form.language}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, language: event.target.value as 'fr' | 'en' }))
                  }
                >
                  <option value="fr">FR</option>
                  <option value="en">EN</option>
                </select>
              </div>
            </div>

            <div className="form-grid two-columns">
              <div className="form-field">
                <label htmlFor="password">Mot de passe</label>
                <input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                  placeholder="********"
                  required
                />
              </div>
              <div className="form-field">
                <label htmlFor="confirm">Confirmer</label>
                <input
                  id="confirm"
                  type="password"
                  value={form.confirm}
                  onChange={(event) => setForm((prev) => ({ ...prev, confirm: event.target.value }))}
                  placeholder="********"
                  required
                />
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="photo">Photo de profil (optionnelle)</label>
              <input id="photo" type="file" accept="image/*" onChange={handlePhotoChange} />
              {photoPreview ? (
                <div className="photo-preview">
                  <img src={photoPreview} alt="Apercu du profil" />
                  <small>Apercu</small>
                </div>
              ) : null}
            </div>

            <div className="form-actions">
              <button type="submit">{translate('register')}</button>
              <p className="divider-text">ou</p>
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  setForm(emptyForm);
                  setPhotoPreview(undefined);
                }}
              >
                Reinitialiser le formulaire
              </button>
            </div>
          </form>
        </motion.article>

        <motion.article className="auth-card" variants={cardVariants} initial="hidden" animate="visible">
          <header className="auth-card__header">
            <span className="eyebrow">{translate('login')}</span>
            <h2>Se connecter</h2>
            <p>Retrouvez vos trajets et notifications en toute simplicite.</p>
          </header>

          {loginError ? <p className="form-error">{loginError}</p> : null}

          <form className="auth-form" onSubmit={handleLogin}>
            <div className="form-field">
              <label htmlFor="identifier">{translate('email_or_phone')}</label>
              <input
                id="identifier"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                placeholder="esther@example.com / +33 6 00 00 00 00"
                required
              />
            </div>
            <div className="form-field">
              <label htmlFor="login-password">Mot de passe</label>
              <input
                id="login-password"
                type="password"
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.target.value)}
                placeholder="********"
              />
            </div>
            <button type="submit" className="secondary">
              {translate('login')}
            </button>
          </form>
        </motion.article>
      </div>
    </section>
  );
}
