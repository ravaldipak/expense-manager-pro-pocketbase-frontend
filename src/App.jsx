import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { AppProvider } from './contexts/AppContext';
import { AuthProvider } from './contexts/AuthContext';
import { PocketBaseProvider } from './contexts/PocketBase';
import AppShell from './components/AppShell';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import EmailVerification from './pages/EmailVerification';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentCancelled from './pages/PaymentCancelled';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Recurring from './pages/Recurring';
import Budgets from './pages/Budgets';
import People from './pages/People';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import PersonProfile from './pages/PersonProfile';
import TrialExpiredModal from './components/TrialExpiredModal';

const RouteChangeHandler = () => {
  const location = useLocation();
  const { user, checkTrialExpiration, setShowTrialExpiredModal } = useAuth();

  useEffect(() => {
    // Check trial expiration on route change
    if (user && user.freeTrial && !user.licenceVerify) {
      const isExpired = checkTrialExpiration();
      if (isExpired) {
        setShowTrialExpiredModal(true);
      }
    }
  }, [location.pathname, user, checkTrialExpiration, setShowTrialExpiredModal]);

  return null;
};

const AppContent = () => {
  return (
    <AppProvider>
      <Router>
        <RouteChangeHandler />
        <TrialExpiredModal />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/verify-email" element={<EmailVerification />} />
              <Route path="/payment-success" element={<PaymentSuccess />} />
              <Route path="/payment-cancelled" element={<PaymentCancelled />} />

              <Route path="/" element={
                <ProtectedRoute>
                  <AppShell>
                    <Dashboard />
                  </AppShell>
                </ProtectedRoute>
              } />
              <Route path="/transactions" element={
                <ProtectedRoute>
                  <AppShell>
                    <Transactions />
                  </AppShell>
                </ProtectedRoute>
              } />
              <Route path="/recurring" element={
                <ProtectedRoute>
                  <AppShell>
                    <Recurring />
                  </AppShell>
                </ProtectedRoute>
              } />
              <Route path="/budgets" element={
                <ProtectedRoute>
                  <AppShell>
                    <Budgets />
                  </AppShell>
                </ProtectedRoute>
              } />
              <Route path="/people" element={
                <ProtectedRoute>
                  <AppShell>
                    <People />
                  </AppShell>
                </ProtectedRoute>
              } />
              <Route path="/people/:id" element={
                <ProtectedRoute>
                  <AppShell>
                    <PersonProfile />
                  </AppShell>
                </ProtectedRoute>
              } />
              <Route path="/reports" element={
                <ProtectedRoute>
                  <AppShell>
                    <Reports />
                  </AppShell>
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute>
                  <AppShell>
                    <Settings />
                  </AppShell>
                </ProtectedRoute>
              } />
            </Routes>
          </Router>
        </AppProvider>
  );
};

function App() {
  return (
    <PocketBaseProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </PocketBaseProvider>
  );
}

export default App;