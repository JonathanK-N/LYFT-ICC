import { useLocation, useNavigate } from 'react-router-dom';
import { useAppState } from '../contexts/AppStateContext';
import { useLanguage } from '../contexts/LanguageContext';
import './BottomNav.css';

interface NavItem {
  label: string;
  route: string;
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
    },
    {
      label: translate('map'),
      route: '/map',
    },
    {
      label: translate('events'),
      route: '/events',
    },
    {
      label: translate('profile'),
      route: '/profile',
    },
  ];

  if (currentUser?.role === 'admin') {
    items.push({
      label: translate('admin_portal'),
      route: '/admin',
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
            <span className="nav-label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
