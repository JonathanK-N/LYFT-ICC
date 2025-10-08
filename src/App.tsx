import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import WelcomePage from './pages/WelcomePage';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import MapPage from './pages/MapPage';
import EventsPage from './pages/EventsPage';
import ProfilePage from './pages/ProfilePage';
import AdminDashboard from './pages/AdminDashboard';
import BottomNav from './components/BottomNav';
import NotificationsTray from './components/NotificationsTray';
import ToastStack from './components/ToastStack';
import AppHeader from './components/AppHeader';
import { AppLayout } from './layouts/AppLayout';
import { useAppState } from './contexts/AppStateContext';
import './App.css';
import { requestMessagingToken } from './services/firebase/messaging';
import { isFirebaseConfigured } from './services/firebase/client';

function AppContainer() {
  const location = useLocation();
  const { currentUser } = useAppState();

  const showNavigation = !['/', '/auth'].includes(location.pathname);
  const showHeader = location.pathname !== '/';

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      return;
    }
    if (!currentUser) {
      return;
    }
    requestMessagingToken().then((token) => {
      if (token) {
        console.info('[messaging] FCM token obtained');
      }
    });
  }, [currentUser]);

  return (
    <AppLayout
      header={showHeader ? <AppHeader /> : undefined}
      footer={showNavigation ? <BottomNav /> : undefined}
    >
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route
          path="/home"
          element={currentUser ? <HomePage /> : <Navigate to="/auth" replace />}
        />
        <Route
          path="/map"
          element={currentUser ? <MapPage /> : <Navigate to="/auth" replace />}
        />
        <Route
          path="/events"
          element={currentUser ? <EventsPage /> : <Navigate to="/auth" replace />}
        />
        <Route
          path="/profile"
          element={currentUser ? <ProfilePage /> : <Navigate to="/auth" replace />}
        />
        <Route
          path="/admin"
          element={
            currentUser?.role === 'admin' ? (
              <AdminDashboard />
            ) : (
              <Navigate to={currentUser ? '/map' : '/auth'} replace />
            )
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <NotificationsTray />
      <ToastStack />
    </AppLayout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContainer />
    </BrowserRouter>
  );
}
