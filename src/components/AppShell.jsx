import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../contexts/AppContext';
import Sidebar from './Sidebar';
import Header from './Header';
import SplashScreen from './SplashScreen';
import QuickAddButton from './QuickAddButton';
import BackupStatus from './BackupStatus';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

const AppShell = ({ children }) => {
  const { state, actions } = useApp();
  const location = useLocation();
  const { isLoading, ui, settings } = state;

  useKeyboardShortcuts();

  const shouldShowSplash = isLoading || ui.showSplash;
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

  useEffect(() => {
    // Close sidebar on route change on mobile
    if (isMobile && ui.sidebarOpen) {
      actions.toggleSidebar();
    }
  }, [location.pathname]);

  const animationProps = settings.reducedMotion
    ? {}
    : {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.3 },
      };

  return (
    <div className="min-h-screen bg-gray-50">
      <AnimatePresence>
        {shouldShowSplash && <SplashScreen />}
      </AnimatePresence>

      {!shouldShowSplash && (
        <motion.div
          className="flex h-screen overflow-hidden"
          {...animationProps}
        >
          {/* Sidebar */}
          <Sidebar />

          {/* Main content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header />
            
            <main className="flex-1 overflow-auto">
              <div className="container mx-auto px-4 py-6 max-w-7xl">
                {children}
              </div>
            </main>
          </div>

          {/* Mobile sidebar overlay */}
          {ui.sidebarOpen && isMobile && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
              onClick={actions.toggleSidebar}
            />
          )}

          {/* Quick Add Button */}
          <QuickAddButton />

          {/* Backup Status */}
          <BackupStatus />
        </motion.div>
      )}
    </div>
  );
};

export default AppShell;