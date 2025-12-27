import React from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import stripeService from '../services/stripeService';

const { FiClock, FiCreditCard, FiX } = FiIcons;

const TrialExpiredModal = () => {
  const { user, showTrialExpiredModal, setShowTrialExpiredModal } = useAuth();
  const [isProcessing, setIsProcessing] = React.useState(false);
  const location = useLocation();

  // Don't show modal on payment-success or payment-cancelled pages
  if (!showTrialExpiredModal || !user || location.pathname === '/payment-success' || location.pathname === '/payment-cancelled') return null;

  const handleUpgrade = async () => {
    setIsProcessing(true);
    try {
      // Create Stripe checkout session for upgrade
      const paymentUrl = await stripeService.createCheckoutSession({
        userId: user.id,
        email: user.email,
        name: user.fullName,
        licenseKey: user.licenseKey || 'UPGRADE',
        amount: 1000 // $10 USD in cents
      });
      
      // Redirect to Stripe payment
      window.location.href = paymentUrl;
    } catch (error) {
      console.error('Error creating payment session:', error);
      alert('Failed to create payment session. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setShowTrialExpiredModal(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative"
      >


        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
            <SafeIcon icon={FiClock} className="w-8 h-8 text-orange-600" />
          </div>
        </div>

        {/* Content */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Free Trial Expired
          </h2>
          <p className="text-gray-600 mb-4">
            Your 15-day free trial has ended. Upgrade to continue using Expense Manager Pro with all premium features.
          </p>
          
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleUpgrade}
            disabled={isProcessing}
            className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {isProcessing ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </div>
            ) : (
              <>
                <SafeIcon icon={FiCreditCard} className="w-4 h-4 mr-2" />
                Upgrade Now - $10
              </>
            )}
          </button>
        </div>

        {/* Footer */}
        <p className="text-xs text-gray-500 text-center mt-4">
          Upgrade required to continue using the application.
        </p>
      </motion.div>
    </div>
  );
};

export default TrialExpiredModal;