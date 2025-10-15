import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAppState } from '../contexts/AppStateContext';
import { useLanguage } from '../contexts/LanguageContext';
import { branding } from '../assets/branding';
import './AppHeader.css';

interface NavItem {
  label: string;
  path: string;
  anchor?: string;
  adminOnly?: boolean;
}

export default function AppHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAppState();
  const { translate } = useLanguage();

  const logoSrc = branding.iccLogo || '/icons/icon-192.png';

  const navItems = useMemo<NavItem[]>(() => {
    const base: NavItem[] = [
      { label: translate('home'), path: '/home' },
      { label: translate('events'), path: '/home', anchor: 'events-section' },
      { label: translate('profile'), path: '/profile' },
    ];
    if (currentUser?.role === 'admin') {
      base.push({ label: translate('admin_portal'), path: '/admin', adminOnly: true });
    }
    return base;
  }, [currentUser?.role, translate]);

  const handleNav = (item: NavItem) => {
    if (item.anchor && location.pathname === item.path) {
      const target = document.getElementById(item.anchor);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return;
    }

    navigate(item.path, item.anchor ? { state: { scrollTo: item.anchor } } : undefined);
  };

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
            <motion.button
              key={item.path}
              type="button"
              className={`nav-link${active ? ' active' : ''}`}
              onClick={() => handleNav(item)}
              aria-current={active ? 'page' : undefined}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {item.label}
            </motion.button>
          );
        })}
      </nav>
    </header>
  );
}
