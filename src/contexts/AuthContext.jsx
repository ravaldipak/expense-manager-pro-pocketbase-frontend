import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePocketBase } from './PocketBase';
import stripeService from '../services/stripeService';
import { generateLicenseKey } from '../utils/licenseUtils';
import EmailService from '../services/emailService';


const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const { 
    pb, 
    isAuthenticated: pbIsAuthenticated, 
    getCurrentUser,
    requestEmailVerification,
    confirmEmailVerification
  } = usePocketBase();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);
  const [showTrialExpiredModal, setShowTrialExpiredModal] = useState(false);

  useEffect(() => {
    // Check if user is authenticated on app load
    const checkAuthStatus = () => {
      if (pbIsAuthenticated()) {
        const currentUser = getCurrentUser();
        const userData = {
          id: currentUser.id,
          email: currentUser.email,
          fullName: currentUser.name || currentUser.email,
          mobile: currentUser.mobile,
          licenceVerify: currentUser.licence_verify,
          freeTrial: currentUser.free_trial,
          createdAt: currentUser.created
        };
        
        setIsAuthenticated(true);
        setUser(userData);
        
        // Check if free trial has expired
        if (checkTrialExpiration(userData)) {
          setShowTrialExpiredModal(true);
        }
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
      setIsLoading(false);
    };

    checkAuthStatus();
  }, [pbIsAuthenticated, getCurrentUser]);

  const login = async (email, password) => {
    try {
      const authData = await pb.collection('users').authWithPassword(email, password);
      const currentUser = getCurrentUser();
      
      console.log(currentUser);

      // Check if user is verified
      if (!currentUser.verified) {
        // Clear auth store since user is not verified
        pb.authStore.clear();
        throw new Error('Please verify your email address before signing in. Check your inbox for a verification link.');
      }
      
      const userData = {
        id: currentUser.id,
        email: currentUser.email,
        fullName: currentUser.name || currentUser.email,
        mobile: currentUser.mobile,
        licenceVerify: currentUser.licence_verify,
        freeTrial: currentUser.free_trial,
        createdAt: currentUser.created
      };
      
      setIsAuthenticated(true);
      setUser(userData);
      
      // Check if free trial has expired
      if (checkTrialExpiration(userData)) {
        setShowTrialExpiredModal(true);
      }
      
      return authData;
    } catch (err) {
      throw err;
    }
  };

  const signup = async (userData) => {
    try {
      // Generate license key
      const licenseKey = generateLicenseKey();
      
      // Create user in PocketBase
      const record = await pb.collection('users').create({
        email: userData.email,
        password: userData.password,
        passwordConfirm: userData.password,
        name: userData.fullName,
        mobile: userData.mobileNumber,
        licence_key: licenseKey,
        licence_verify: false,
        free_trial: userData.freeTrial || false,
      });
      
      // If free trial, send verification email and return user record
      if (userData.freeTrial) {
        await EmailService.sendWelcomeEmail({
          email: userData.email,
          name: userData.fullName,
          password: userData.password,
          licenseKey: null
        });
        await requestEmailVerification(userData.email);
        setEmailVerificationSent(true);
        return {
          user: record,
          freeTrial: true
        };
      }
      
      // Generate Stripe payment link for paid users
      const paymentUrl = await stripeService.createCheckoutSession({
        userId: record.id,
        email: userData.email,
        name: userData.fullName,
        passwordConfirm: userData.password,
        licenseKey: licenseKey,
        amount: 1000 // $10 USD in cents
      });
      
      // Return both user record and payment URL
      return {
        user: record,
        paymentUrl: paymentUrl
      };
    } catch (err) {
      throw err;
    }
  };

  const verifyEmail = async (token) => {
    try {
      await confirmEmailVerification(token);
      setEmailVerificationSent(false);
      return true;
    } catch (err) {
      throw err;
    }
  };

  const resendVerificationEmail = async (email) => {
    try {
      await requestEmailVerification(email);
      return true;
    } catch (err) {
      throw err;
    }
  };

  // Payment success handling is now done directly in PaymentSuccess component
  // to prevent duplicate payment record creation

  const handlePaymentFailure = async (userId, reason = 'Payment failed') => {
    try {
      // Get user details to check if they're a trial user
      const user = await pb.collection('users').getOne(userId);
      
      if (user.free_trial === true) {
        // Don't delete trial users, just log the cancellation
        console.log(`Payment cancelled for trial user ${userId}: ${reason}. User preserved.`);
        return { deleted: false, reason: 'Trial user preserved' };
      } else {
        // Delete non-trial users
        await pb.collection('users').delete(userId);
        console.log(`User ${userId} deleted due to payment failure: ${reason}`);
        return { deleted: true, reason: 'Non-trial user deleted' };
      }
    } catch (err) {
      console.error('Error handling payment failure:', err);
      throw err;
    }
  };

  const verifyPaymentStatus = async (sessionId) => {
    try {
      const paymentStatus = await stripeService.verifyPayment(sessionId);
      return paymentStatus;
    } catch (err) {
      console.error('Error verifying payment:', err);
      throw err;
    }
  };

  const verifyLicenseKey = async (inputLicenseKey) => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // Check if the input license key matches the stored license key
      if (inputLicenseKey === currentUser.licence_key) {
        // Update licence_verify to true in PocketBase
        await pb.collection('users').update(currentUser.id, {
          licence_verify: true
        });

        // Update local user state
        setUser(prev => ({
          ...prev,
          licenceVerify: true
        }));

        return { success: true };
      } else {
        throw new Error('Invalid license key. Please check your license key and try again.');
      }
    } catch (err) {
      console.error('License verification error:', err);
      throw err;
    }
  };

  const checkTrialExpiration = (user) => {
    if (!user || !user.freeTrial) {
      return false; // Not a free trial user or already verified
    }

    const createdDate = new Date(user.createdAt);
    const currentDate = new Date();
    const daysDifference = Math.floor((currentDate - createdDate) / (1000 * 60 * 60 * 24));
    const TRIAL_DAYS = 15;
    return daysDifference >= TRIAL_DAYS;
  };

  const logout = () => {
    pb.authStore.clear();
    setIsAuthenticated(false);
    setUser(null);
    setShowTrialExpiredModal(false);
  };

  const value = {
    isAuthenticated,
    user,
    isLoading,
    emailVerificationSent,
    showTrialExpiredModal,
    setShowTrialExpiredModal,
    checkTrialExpiration,
    login,
    signup,
    verifyEmail,
    resendVerificationEmail,
    handlePaymentFailure,
    verifyPaymentStatus,
    verifyLicenseKey,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
