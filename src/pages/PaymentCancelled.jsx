import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { useAuth } from '../contexts/AuthContext';

const { FiX, FiArrowLeft, FiRefreshCw } = FiIcons;

const PaymentCancelled = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handlePaymentFailure } = useAuth();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState('');
  const [userPreserved, setUserPreserved] = useState(false);

  const userId = searchParams.get('user_id');

  useEffect(() => {
    const cleanupUser = async () => {
      if (!userId) {
        setIsProcessing(false);
        return;
      }

      try {
        // Handle payment failure - may or may not delete user based on trial status
        const result = await handlePaymentFailure(userId, 'Payment cancelled by user');
        setUserPreserved(!result.deleted);
      } catch (err) {
        console.error('Error handling payment cancellation:', err);
        setError('Failed to process payment cancellation');
      } finally {
        setIsProcessing(false);
      }
    };

    cleanupUser();
  }, [userId, handlePaymentFailure]);

  const handleRetry = () => {
    navigate('/signup');
  };

  const handleGoBack = () => {
    navigate('/');
  };

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Processing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <motion.div
        className="w-full max-w-md text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="bg-white rounded-xl shadow-lg p-8">
          <motion.div
            className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <SafeIcon icon={FiX} className="w-8 h-8 text-orange-600" />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Payment Cancelled
            </h1>
            <p className="text-gray-600 mb-6">
              {userPreserved 
                ? "Your payment was cancelled. No charges have been made to your account."
                : "Your payment was cancelled and no charges were made. Your account registration has been cancelled as well."
              }
            </p>
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-800">
                  {error}
                </p>
              </div>
            )}
            
            {userPreserved ? (
              <></>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                  <strong>Want to try again?</strong><br />
                  You can create a new account and complete the payment process at any time.
                </p>
              </div>
            )}
            
            <div className="space-y-3">
              {userPreserved ? (
                <>
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors flex items-center justify-center"
                  >
                    <SafeIcon icon={FiArrowLeft} className="w-4 h-4 mr-2" />
                    Continue with Trial
                  </button>
                  
                  <button
                    onClick={handleRetry}
                    className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors flex items-center justify-center"
                  >
                    <SafeIcon icon={FiRefreshCw} className="w-4 h-4 mr-2" />
                    Try Payment Again
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleRetry}
                    className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors flex items-center justify-center"
                  >
                    <SafeIcon icon={FiRefreshCw} className="w-4 h-4 mr-2" />
                    Try Again
                  </button>
                  
                  <button
                    onClick={handleGoBack}
                    className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors flex items-center justify-center"
                  >
                    <SafeIcon icon={FiArrowLeft} className="w-4 h-4 mr-2" />
                    Go Back Home
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default PaymentCancelled;