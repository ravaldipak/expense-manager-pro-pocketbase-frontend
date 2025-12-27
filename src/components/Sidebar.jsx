import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useApp } from '../contexts/AppContext';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const {
  FiHome,
  FiList,
  FiRepeat,
  FiTarget,
  FiUsers,
  FiBarChart3,
  FiSettings,
  FiDollarSign,
} = FiIcons;

const Sidebar = () => {
  const { state } = useApp();
  const { ui, settings } = state;
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: FiHome },
    { name: 'Transactions', href: '/transactions', icon: FiList },
    { name: 'Recurring', href: '/recurring', icon: FiRepeat },
    { name: 'Budgets', href: '/budgets', icon: FiTarget },
    { name: 'People', href: '/people', icon: FiUsers },
    { name: 'Reports', href: '/reports', icon: FiBarChart3 },
    { name: 'Settings', href: '/settings', icon: FiSettings },
  ];

  const sidebarClasses = `
    fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 
    transform transition-transform duration-300 ease-in-out lg:translate-x-0
    ${ui.sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
  `;

  const animationProps = settings.reducedMotion
    ? {}
    : {
        initial: { x: -20, opacity: 0 },
        animate: { x: 0, opacity: 1 },
        transition: { duration: 0.3 },
      };

  return (
    <motion.div className={sidebarClasses} {...animationProps}>
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-8 h-8 bg-primary-500 rounded-lg mr-3">
              <SafeIcon icon={FiDollarSign} className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                Expense Manager Pro
              </h1>
              <p className="text-xs text-gray-500">Version 2.0</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={`
                  group flex items-center px-3 py-2 text-sm font-medium rounded-lg
                  transition-colors duration-200 focus:outline-none focus:ring-2 
                  focus:ring-primary-500 focus:ring-offset-2
                  ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 border-primary-200'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                <SafeIcon
                  icon={item.icon}
                  className={`
                    mr-3 h-5 w-5 transition-colors duration-200
                    ${isActive ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'}
                  `}
                />
                {item.name}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Currency: {state.settings.currency}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default Sidebar;