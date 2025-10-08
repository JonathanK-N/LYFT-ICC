import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppState } from '../contexts/AppStateContext';
import { useLanguage } from '../contexts/LanguageContext';
import { branding } from '../assets/branding';
import './AppHeader.css';

interface NavItem {
  label: string;
  path: string;
  adminOnly?: boolean;
}

export default function AppHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAppState();
  const { translate, toggleLanguage, language } = useLanguage();

  const logoSrc = branding.iccLogo || '/icons/icon-192.png';

  const navItems = useMemo<NavItem[]>(() => {
    const base: NavItem[] = [
      { label: translate('dashboard'), path: '/home' },
      { label: translate('map'), path: '/map' },
      { label: translate('events'), path: '/events' },
      { label: translate('profile'), path: '/profile' },
    ];
    if (currentUser?.role === 'admin') {
      base.push({ label: translate('admin_portal'), path: '/admin', adminOnly: true });
    }
    return base;
  }, [currentUser?.role, translate]);

  return (
    <header className="app-header">
      <button type="button" className="header-brand" onClick={() => navigate('/home')}>
        <img src={logoSrc} alt="Impact Centre Chretien" className="logo-img" />
        <span className="brand-title">Lyft-ICC</span>
      </button>
      <nav className="header-nav" aria-label="Navigation principale">
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <button
              key={item.path}
              type="button"
              className={`nav-link${active ? ' active' : ''}`}
              onClick={() => navigate(item.path)}
              aria-current={active ? 'page' : undefined}
            >
              {item.label}
            </button>
          );
        })}
        <button type="button" className="nav-link language" onClick={toggleLanguage}>
          {language === 'fr' ? 'FR' : 'EN'}
        </button>
      </nav>
    </header>
  );
}
