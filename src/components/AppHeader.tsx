import { useNavigate } from 'react-router-dom';
import { useAppState } from '../contexts/AppStateContext';
import { useLanguage } from '../contexts/LanguageContext';
import { branding } from '../assets/branding';
import './AppHeader.css';

export default function AppHeader() {
  const { currentUser } = useAppState();
  const { toggleLanguage, language, translate } = useLanguage();
  const navigate = useNavigate();
  const logoSrc = branding.iccLogo || '/icons/icon-192.png';

  return (
    <header className="app-header">
      <button type="button" className="header-brand" onClick={() => navigate('/home')}>
        <img src={logoSrc} alt="Impact Centre Chretien" className="logo-img" />
        <div className="brand-copy">
          <strong>Lyft-ICC</strong>
          <span>Impact Centre Chretien</span>
        </div>
      </button>
      <nav className="header-nav" aria-label="Navigation principale">
        <button type="button" onClick={() => navigate('/home')}>
          {translate('dashboard')}
        </button>
        <button type="button" onClick={() => navigate('/map')}>
          {translate('map')}
        </button>
        <button type="button" onClick={() => navigate('/profile')}>
          {translate('profile')}
        </button>
        <button type="button" onClick={toggleLanguage} className="language-btn">
          {language === 'fr' ? 'FR' : 'EN'}
        </button>
        {currentUser ? (
          <button type="button" className="profile-btn" onClick={() => navigate('/profile')}>
            {currentUser.name.split(' ')[0]}
          </button>
        ) : null}
      </nav>
    </header>
  );
}
