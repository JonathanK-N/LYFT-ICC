import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import VoiceOnboarding from '../components/VoiceOnboarding';
import '../pages/styles/WelcomePage.css';

export default function WelcomePage() {
  const navigate = useNavigate();
  const { translate } = useLanguage();

  return (
    <section className="welcome-screen screen">
      <VoiceOnboarding />
      <div className="welcome-hero surface-card">
        <p className="tag">Impact Centre Chretien</p>
        <h1>{translate('welcome_title')}</h1>
        <p className="intro">{translate('welcome_subtitle')}</p>
        <div className="hero-art" aria-hidden="true">
          <div className="halo-circle" />
          <div className="car-card">
            <span>LYFT</span>
            <p>{translate('placeholder_map')}</p>
          </div>
        </div>
        <div className="welcome-actions">
          <button type="button" onClick={() => navigate('/auth')}>
            {translate('get_started')}
          </button>
          <button
            type="button"
            className="secondary"
            onClick={() => navigate('/auth')}
          >
            {translate('login')}
          </button>
        </div>
      </div>

      <div className="surface-card welcome-footer">
        <p>
          Application web progressive (PWA) optimisee mobile. Ajoutez-la sur
          votre ecran d accueil pour un acces rapide.
        </p>
        <p>Mode sombre, textes larges et support vocal pour nos seniors.</p>
      </div>
    </section>
  );
}
