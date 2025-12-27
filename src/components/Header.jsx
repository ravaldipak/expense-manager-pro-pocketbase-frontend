import React from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiMenu, FiEye, FiClock, FiLogOut, FiUser } = FiIcons;

const Header = () => {
  const { state, actions } = useApp();
  const { user, logout } = useAuth();
  const { ui } = state;
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname;
    switch (path) {
      case '/':
        return 'Dashboard';
      case '/transactions':
        return 'Transactions';
      case '/recurring':
        return 'Recurring';
      case '/budgets':
        return 'Budgets';
      case '/people':
        return 'People';
      case '/reports':
        return 'Reports';
      case '/settings':
        return 'Settings';
      default:
        if (path.startsWith('/people/')) {
          return 'Person Profile';
        }
        return 'Expense Manager Pro';
    }
  };

  const showViewToggle = location.pathname === '/' || location.pathname === '/reports';

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-4">
      <div className="flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          {/* Mobile menu button */}
          <button
            onClick={actions.toggleSidebar}
            className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <SafeIcon icon={FiMenu} className="w-5 h-5" />
          </button>

          {/* Page title */}
          <h1 className="text-xl font-semibold text-gray-900">
            {getPageTitle()}
          </h1>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Current time */}
          <div className="hidden sm:flex items-center text-sm text-gray-500">
            <SafeIcon icon={FiClock} className="w-4 h-4 mr-1" />
            <span>
              {new Date().toLocaleString('en-AU', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <div className="hidden sm:flex items-center text-sm text-gray-700">
              <SafeIcon icon={FiUser} className="w-4 h-4 mr-1" />
              <span>{user?.fullName || user?.email || 'User'}</span>
            </div>
            
            <button
              onClick={logout}
              className="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
              title="Sign Out"
            >
              <SafeIcon icon={FiLogOut} className="w-4 h-4" />
            </button>
          </div>

          {/* Future View Toggle */}
          {showViewToggle && (
            <button
              onClick={actions.toggleView}
              className={`
                flex items-center px-3 py-2 rounded-lg text-sm font-medium
                transition-colors duration-200 focus:outline-none focus:ring-2 
                focus:ring-primary-500 focus:ring-offset-2
                ${
                  ui.currentView === 'future'
                    ? 'bg-primary-100 text-primary-700 border border-primary-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
              title={
                ui.currentView === 'current'
                  ? 'Switch to Future View'
                  : 'Switch to Current View'
              }
            >
              <SafeIcon icon={FiEye} className="w-4 h-4 mr-2" />
              {ui.currentView === 'current' ? 'Future View' : 'Current View'}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;