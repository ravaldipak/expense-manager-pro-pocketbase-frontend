import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../contexts/AppContext';
import SafeIcon from '../common/SafeIcon';
import QuickAddForm from './QuickAddForm';
import * as FiIcons from 'react-icons/fi';

const { FiPlus } = FiIcons;

const QuickAddButton = () => {
  const { state } = useApp();
  const { settings } = state;
  const [showForm, setShowForm] = useState(false);

  const animationProps = settings.reducedMotion
    ? {}
    : {
        initial: { scale: 0 },
        animate: { scale: 1 },
        exit: { scale: 0 },
        whileHover: { scale: 1.1 },
        whileTap: { scale: 0.95 },
        transition: { duration: 0.2 },
      };

  return (
    <>
      <motion.button
        onClick={() => setShowForm(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary-500 hover:bg-primary-600 text-white rounded-full shadow-lg focus:outline-none focus:ring-4 focus:ring-primary-300 z-30"
        {...animationProps}
      >
        <SafeIcon icon={FiPlus} className="w-6 h-6 mx-auto" />
      </motion.button>

      <AnimatePresence>
        {showForm && (
          <QuickAddForm onClose={() => setShowForm(false)} />
        )}
      </AnimatePresence>
    </>
  );
};

export default QuickAddButton;