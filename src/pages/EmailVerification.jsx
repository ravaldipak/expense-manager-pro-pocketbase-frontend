import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { useAuth } from '../contexts/AuthContext';

const { FiMail, FiCheckCircle, FiXCircle, FiArrowRight, FiRefreshCw } = FiIcons;

const EmailVerification = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verifyEmail, resendVerificationEmail, emailVerificationSent } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);

  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      handleVerification(token);
    }
  }, [token]);

  const handleVerification = async (verificationToken) => {
    setIsLoading(true);
    setError('');

    try {
      await verifyEmail(verificationToken);
      setIsVerified(true);
    } catch (err) {
      setError(err.message || 'Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setResendLoading(true);
    setError('');

    try {
      await resendVerificationEmail(email);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to resend verification email.');
    } finally {
      setResendLoading(false);
    }
  };

  const animationProps = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <motion.div
        className="w-full max-w-md"
        {...animationProps}
      >
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
            <SafeIcon 
              icon={FiIcons.FiDollarSign} 
              className="w-8 h-8 text-primary-600" 
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Email Verification
          </h1>
          <p className="text-gray-600">
            {token ? 'Verifying your email address...' : 'Check your email to verify your account'}
          </p>
        </div>

        {/* Verification Form */}
        <motion.div
          className="bg-white rounded-xl shadow-lg p-8"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          {token ? (
            // Token verification
            <div className="text-center">
              {isLoading ? (
                <div className="space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="text-gray-600">Verifying your email...</p>
                </div>
              ) : isVerified ? (
                <div className="space-y-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-success-100 rounded-full">
                    <SafeIcon icon={FiCheckCircle} className="w-8 h-8 text-success-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Email Verified!</h2>
                  <p className="text-gray-600">
                    Your email has been successfully verified. You can now sign in to your account.
                  </p>
                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
                  >
                    Sign In
                    <SafeIcon icon={FiArrowRight} className="w-4 h-4 ml-2" />
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-danger-100 rounded-full">
                    <SafeIcon icon={FiXCircle} className="w-8 h-8 text-danger-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Verification Failed</h2>
                  <p className="text-gray-600">
                    {error || 'The verification link is invalid or has expired.'}
                  </p>
                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
                  >
                    Back to Sign In
                  </Link>
                </div>
              )}
            </div>
          ) : (
            // Manual verification request
            <div className="space-y-6">
              {emailVerificationSent ? (
                <div className="text-center space-y-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full">
                    <SafeIcon icon={FiMail} className="w-8 h-8 text-primary-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Check Your Email</h2>
                  <p className="text-gray-600">
                    We've sent a verification link to your email address. Please check your inbox and click the link to verify your account.
                  </p>
                  <div className="text-sm text-gray-500">
                    Didn't receive the email? Check your spam folder or request a new one.
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <SafeIcon icon={FiMail} className="w-5 h-5 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                        placeholder="Enter your email address"
                        required
                      />
                    </div>
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-danger-600 bg-danger-50 border border-danger-200 rounded-lg p-3"
                    >
                      {error}
                    </motion.div>
                  )}

                  <button
                    onClick={handleResendEmail}
                    disabled={resendLoading}
                    className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  >
                    {resendLoading ? (
                      <div className="flex items-center">
                        <SafeIcon icon={FiRefreshCw} className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </div>
                    ) : (
                      <>
                        Resend Verification Email
                        <SafeIcon icon={FiMail} className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Divider */}
              <div className="my-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Already verified?</span>
                  </div>
                </div>
              </div>

              {/* Sign In Link */}
              <Link
                to="/login"
                className="w-full block text-center bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              >
                Sign In
              </Link>
            </div>
          )}
        </motion.div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            © 2024 Expense Manager Pro. All rights reserved.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default EmailVerification;
