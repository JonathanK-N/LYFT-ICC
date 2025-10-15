import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppState } from '../contexts/AppStateContext';
import { useLanguage } from '../contexts/LanguageContext';
import './BottomNav.css';

interface NavItem {
  label: string;
  route: string;
}

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAppState();
  const { translate } = useLanguage();

  const items = useMemo<NavItem[]>(() => {
    const base: NavItem[] = [
      { label: 'Accueil', route: '/home' },
      { label: 'Profil', route: '/profile' },
    ];
    if (currentUser?.role === 'admin') {
      base.push({ label: 'Admin', route: '/admin' });
    }
    return base;
  }, [currentUser?.role]);

  return (
    <nav className="bottom-nav" aria-label="Navigation principale">
      {items.map((item) => {
        const isActive = location.pathname === item.route;
        return (
          <button
            key={item.route}
            className={`nav-btn ${isActive ? 'active' : ''}`}
            onClick={() => navigate(item.route)}
            aria-pressed={isActive}
          >
            <span className="nav-label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
