import PocketBase from 'pocketbase';
import { createContext, useContext, useEffect, useState } from 'react';

const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090');

export { pb };

const PocketBaseContext = createContext();

export const usePocketBase = () => {
  const context = useContext(PocketBaseContext);
  if (!context) {
    throw new Error('usePocketBase must be used within a PocketBaseProvider');
  }
  return context;
};

export const PocketBaseProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const authWithEmail = async (email, password) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const authData = await pb.collection('users').authWithPassword(email, password);
      return authData;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const authWithOAuth = async (provider) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const authData = await pb.collection('users').authWithOAuth2({ provider });
      return authData;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const createUser = async (userData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const record = await pb.collection('users').create({
        email: userData.email,
        password: userData.password,
        passwordConfirm: userData.password,
        name: userData.fullName,
        mobile: userData.mobileNumber,
      });
      return record;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const requestEmailVerification = async (email) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await pb.collection('users').requestVerification(email);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const confirmEmailVerification = async (token) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await pb.collection('users').confirmVerification(token);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    pb.authStore.clear();
  };

  const refreshAuth = async () => {
    try {
      await pb.collection('users').authRefresh();
    } catch (err) {
      pb.authStore.clear();
      throw err;
    }
  };

  const isAuthenticated = () => {
    return pb.authStore.isValid;
  };

  const getCurrentUser = () => {
    return pb.authStore.model;
  };

  const clearError = () => {
    setError(null);
  };

  // Payment record utility functions
  const createPaymentRecord = async (paymentData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const record = await pb.collection('stripe_payments').create(paymentData);
      return record;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getUserPayments = async (userId, page = 1, perPage = 20) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const records = await pb.collection('stripe_payments').getList(page, perPage, {
        filter: `user_id = "${userId}"`,
        sort: '-payment_date',
        expand: 'user_id'
      });
      return records;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getPaymentById = async (paymentId) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const record = await pb.collection('stripe_payments').getOne(paymentId, {
        expand: 'user_id'
      });
      return record;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updatePaymentStatus = async (paymentId, status) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const record = await pb.collection('stripe_payments').update(paymentId, {
        status: status
      });
      return record;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (pb.authStore.isValid) {
        refreshAuth().catch(() => {});
      }
    }, 14 * 60 * 1000); 

    return () => clearInterval(interval);
  }, []);

  const value = {
    pb,
    
    isLoading,
    error,
    
    authWithEmail,
    authWithOAuth,
    createUser,
    requestEmailVerification,
    confirmEmailVerification,
    logout,
    refreshAuth,
    isAuthenticated,
    getCurrentUser,

    clearError,
    
    // Payment utility functions
    createPaymentRecord,
    getUserPayments,
    getPaymentById,
    updatePaymentStatus,
  };

  return (
    <PocketBaseContext.Provider value={value}>
      {children}
    </PocketBaseContext.Provider>
  );
};
