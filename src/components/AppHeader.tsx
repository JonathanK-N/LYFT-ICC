import { FiBell, FiGlobe, FiMoon, FiSun, FiVolume2, FiVolumeX } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../contexts/AppStateContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { branding } from '../assets/branding';
import './AppHeader.css';

export default function AppHeader() {
  const { currentUser } = useAppState();
  const { isDark, toggleDarkMode, voiceEnabled, toggleVoice } = useTheme();
  const { language, toggleLanguage, translate } = useLanguage();
  const navigate = useNavigate();

  return (
    <header className="app-header">
      <div className="header-brand" onClick={() => navigate('/home')}>
        <div className="logo-badge">
          <img src={branding.iccLogo} alt="Impact Centre Chrétien" className="icc-logo" />
        </div>
        <div className="brand-copy">
          <strong>Lyft-ICC</strong>
          <span>Impact Centre Chrétien</span>
        </div>
      </div>
      <div className="header-actions">
        <button
          type="button"
          className="icon-btn"
          aria-label={isDark ? translate('light_mode') : translate('dark_mode')}
          onClick={toggleDarkMode}
        >
          {isDark ? <FiSun /> : <FiMoon />}
        </button>
        <button
          type="button"
          className={`icon-btn ${language === 'fr' ? 'primary' : ''}`}
          aria-label={translate('language_toggle')}
          onClick={toggleLanguage}
        >
          <FiGlobe />
          <span className="icon-label">{language === 'fr' ? 'FR' : 'EN'}</span>
        </button>
        <button
          type="button"
          className={`icon-btn ${voiceEnabled ? 'primary' : ''}`}
          aria-label={
            voiceEnabled ? translate('disable_voice') : translate('enable_voice')
          }
          onClick={toggleVoice}
        >
          {voiceEnabled ? <FiVolumeX /> : <FiVolume2 />}
        </button>
        <button
          type="button"
          className="icon-btn"
          aria-label={translate('notifications')}
          onClick={() => navigate('/profile')}
        >
          <FiBell />
        </button>
        {currentUser && (
          <button
            type="button"
            className="avatar-btn"
            onClick={() => navigate('/profile')}
          >
            <img
              src={
                currentUser.avatar ??
                `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=66a7ff&color=fff`
              }
              alt={currentUser.name}
            />
          </button>
        )}
      </div>
    </header>
  );
}
