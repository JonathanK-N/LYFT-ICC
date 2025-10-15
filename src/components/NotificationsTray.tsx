import { useLocation, useNavigate } from 'react-router-dom';
import { useAppState } from '../contexts/AppStateContext';
import { useLanguage } from '../contexts/LanguageContext';
import './NotificationsTray.css';

export default function NotificationsTray() {
  const { notifications } = useAppState();
  const { translate } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  const hidden = ['/', '/login', '/register'].includes(location.pathname);
  if (hidden || notifications.length === 0) {
    return null;
  }

  const highlighted = notifications.slice(0, 2);

  return (
    <aside className="notifications-tray">
      <div className="tray-header">
        <span className="tray-icon" aria-hidden="true">
          ●
        </span>
        <span className="tray-title">{translate('notifications')}</span>
        <button
          type="button"
          className="tray-action"
          onClick={() => navigate('/profile')}
        >
          {translate('see_all')}
        </button>
      </div>
      <ul>
        {highlighted.map((item) => (
          <li key={item.id} className={`tray-item tray-${item.type}`}>
            <p>{item.message}</p>
            <small>{new Date(item.timestamp).toLocaleTimeString()}</small>
          </li>
        ))}
      </ul>
    </aside>
  );
}
