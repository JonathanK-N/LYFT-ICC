import type { ReactNode } from 'react';
import { FiCalendar, FiHome, FiMapPin, FiSettings, FiUser } from 'react-icons/fi';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppState } from '../contexts/AppStateContext';
import { useLanguage } from '../contexts/LanguageContext';
import './BottomNav.css';

interface NavItem {
  label: string;
  route: string;
  icon: ReactNode;
  adminOnly?: boolean;
}

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAppState();
  const { translate } = useLanguage();

  const items: NavItem[] = [
    {
      label: translate('dashboard'),
      route: '/home',
      icon: <FiHome />,
    },
    {
      label: translate('map'),
      route: '/map',
      icon: <FiMapPin />,
    },
    {
      label: translate('events'),
      route: '/events',
      icon: <FiCalendar />,
    },
    {
      label: translate('profile'),
      route: '/profile',
      icon: <FiUser />,
    },
  ];

  if (currentUser?.role === 'admin') {
    items.push({
      label: translate('admin_portal'),
      route: '/admin',
      icon: <FiSettings />,
      adminOnly: true,
    });
  }

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
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
