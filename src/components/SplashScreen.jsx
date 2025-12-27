import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../contexts/AppContext';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiDollarSign, FiTrendingUp } = FiIcons;

const SplashScreen = () => {
  const { state, actions } = useApp();
  const { settings } = state;

  useEffect(() => {
    const timer = setTimeout(() => {
      actions.hideSplash();
    }, 1500);

    return () => clearTimeout(timer);
  }, [actions]);

  const handleSkip = () => {
    actions.hideSplash();
  };

  const animationProps = settings.reducedMotion
    ? {}
    : {
        initial: { opacity: 0, scale: 0.9 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.9 },
        transition: { duration: 0.3 },
      };

  return (
    <motion.div
      className="fixed inset-0 bg-white z-50 flex items-center justify-center"
      {...animationProps}
    >
      <div className="text-center max-w-md mx-auto px-6">
        {/* Logo */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-500 rounded-full mb-4">
            <SafeIcon icon={FiDollarSign} className="w-10 h-10 text-white" />
          </div>
          
          {/* App Name */}
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Expense Manager Pro 2.0
          </h1>
          
          {/* Quote */}
          <blockquote className="text-lg text-gray-700 italic mb-2">
            "What can't be tracked will not be measured or improved."
          </blockquote>
          <cite className="text-sm text-gray-500 block mb-4">— Jim Rohn</cite>
          
          {/* Sub-line */}
          <p className="text-gray-600 mb-8">
            Let's build a great financial future.
          </p>
        </div>

        {/* Loading animation */}
        {!settings.reducedMotion && (
          <div className="flex justify-center mb-6">
            <motion.div
              className="flex space-x-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 bg-primary-500 rounded-full"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.7, 1, 0.7],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </motion.div>
          </div>
        )}

        {/* Skip button */}
        <button
          onClick={handleSkip}
          className="text-sm text-primary-600 hover:text-primary-700 underline focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded"
        >
          Skip
        </button>
      </div>
    </motion.div>
  );
};

export default SplashScreen;