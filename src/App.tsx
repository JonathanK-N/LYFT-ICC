import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import WelcomePage from './pages/WelcomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
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

  const authPaths = ['/', '/login', '/register'];
  const showNavigation = !authPaths.includes(location.pathname);
  const showHeader = !authPaths.includes(location.pathname);

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
        <Route
          path="/login"
          element={currentUser ? <Navigate to="/home" replace /> : <LoginPage />}
        />
        <Route
          path="/register"
          element={currentUser ? <Navigate to="/home" replace /> : <RegisterPage />}
        />
        <Route
          path="/home"
          element={currentUser ? <HomePage /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/map"
          element={currentUser ? <MapPage /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/events"
          element={currentUser ? <EventsPage /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/profile"
          element={currentUser ? <ProfilePage /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/admin"
          element={
            currentUser?.role === 'admin' ? (
              <AdminDashboard />
            ) : (
              <Navigate to={currentUser ? '/map' : '/login'} replace />
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
