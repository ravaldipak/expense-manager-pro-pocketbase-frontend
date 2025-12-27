import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import stripeService from '../services/stripeService';
import { pb } from '../contexts/PocketBase';
import emailService from '../services/emailService';
import { generateLicenseKey } from '../utils/licenseUtils';

const { FiCheckCircle, FiArrowRight } = FiIcons;

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verifyPaymentStatus } = useAuth();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const processedRef = useRef(false);

  const sessionId = searchParams.get('session_id');
  const userId = searchParams.get('user_id');
  const userEmail = searchParams.get('email');
  const userName = searchParams.get('name');
  const licenseKey = searchParams.get('licenseKey');

  // Single payment processing function with duplicate prevention
  const processPayment = async () => {
    // Prevent multiple executions
    if (processedRef.current) {
      return;
    }
    processedRef.current = true;

    const currentSessionId = searchParams.get('session_id');
    const currentUserId = searchParams.get('user_id');
    
    if (!currentSessionId || !currentUserId) {
      setError('Missing payment information');
      setIsProcessing(false);
      return;
    }

    try {
      // Check if payment record already exists to prevent duplicates
      const existingPayments = await pb.collection('stripe_payments').getList(1, 1, {
        filter: `stripe_session_id = "${currentSessionId}"`
      });

      if (existingPayments.items.length > 0) {
        console.log(`Payment record already exists for session ${currentSessionId}`);
        setSuccess(true);
        setIsProcessing(false);
        return;
      }

      const paymentStatus = await verifyPaymentStatus(currentSessionId);
      
      if (paymentStatus.status === 'paid') {
        // Create payment record directly here to avoid multiple calls
        await stripeService.createPaymentRecord({
          payment_id: paymentStatus.payment_intent || currentSessionId,
          user_id: currentUserId,
          price: paymentStatus.amount_total || 1000,
          currency: paymentStatus.currency || 'usd',
          status: 'succeeded',
          stripe_session_id: currentSessionId,
          description: 'Subscription payment'
        });
        
        // Check if user is a trial user and update their status
        try {
          if (currentUserId) {
            // Get user details to check if they're a trial user
            const user = await pb.collection('users').getOne(currentUserId);
            
            if (user.free_trial === true) {
              // Update user to remove trial status
              await pb.collection('users').update(currentUserId, {
                free_trial: false
              });
              console.log(`Updated user ${currentUserId} - removed trial status`);
              
              // Send license key email for trial users who upgraded
              if (userEmail && user.licence_key) {
                await emailService.sendLicenseKeyEmail({
                  email: userEmail,
                  name: userName || userEmail,
                  licenseKey: user.licence_key
                });
                console.log(`License key email sent successfully to ${userEmail}`);
              }
            } else {
              // For non-trial users, send welcome email
              if (userEmail) {
                await emailService.sendWelcomeEmail({
                  email: userEmail,
                  name: userName || userEmail,
                  password: searchParams.get('passwordConfirm'),
                  licenseKey: licenseKey
                });
                console.log(`Welcome email sent successfully to ${userEmail}`);
              }
            }
            
            // Send PocketBase verification email for all users
            if (userEmail) {
              try {
                await pb.collection('users').requestVerification(userEmail);
                console.log(`Verification email sent successfully to ${userEmail}`);
              } catch (verificationError) {
                console.error('Error sending verification email:', verificationError);
                // Don't fail the whole process if verification email fails
              }
            }
          } else {
            console.log('No user ID found, skipping user update and email');
          }
        } catch (emailError) {
          console.error('Error processing user update and email:', emailError);
          // Don't fail the whole process if email fails
        }
        
        setSuccess(true);
      } else {
        setError('Payment was not completed successfully');
      }
    } catch (err) {
      console.error('Payment processing error:', err);
      setError(err.message || 'Failed to process payment');
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    processPayment();
  }, []); 

  const handleContinue = () => {
    navigate('/login');
  };

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Processing your payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <motion.div
          className="w-full max-w-md text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <SafeIcon icon={FiIcons.FiX} className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Payment Error
            </h1>
            <p className="text-gray-600 mb-6">
              {error}
            </p>
            <button
              onClick={() => navigate('/signup')}
              className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
            >
              Try Again
            </button>
          </div>
        </motion.div>
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
            className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <SafeIcon icon={FiCheckCircle} className="w-8 h-8 text-green-600" />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Payment Successful!
            </h1>
            <p className="text-gray-600 mb-6">
              Thank you for subscribing to Expense Manager Pro. Your account has been activated and both welcome and verification emails have been sent to you.
            </p>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-green-800">
                <strong>What's next?</strong><br />
                Please check your email and verify your account, then log in to start managing your expenses with all premium features unlocked.
              </p>
            </div>
            
            <button
              onClick={handleContinue}
              className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors flex items-center justify-center"
            >
              Continue to Login
              <SafeIcon icon={FiArrowRight} className="w-4 h-4 ml-2" />
            </button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default PaymentSuccess;