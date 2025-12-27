import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import LicenseVerificationModal from './LicenseVerificationModal';
import Toast from './Toast';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading, user, verifyLicenseKey } = useAuth();
  const [isVerifyingLicense, setIsVerifyingLicense] = useState(false);
  const [licenseError, setLicenseError] = useState('');
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const handleLicenseVerify = async (licenseKey) => {
    setIsVerifyingLicense(true);
    setLicenseError('');
    
    try {
      await verifyLicenseKey(licenseKey);
      // Show success toast after successful verification
      setShowSuccessToast(true);
      // Modal will automatically close when user.licenceVerify becomes true
    } catch (error) {
      setLicenseError(error.message);
    } finally {
      setIsVerifyingLicense(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const showLicenseModal = user && user.licenceVerify === false && user.freeTrial !== true;

  return (
    <>
      {children}
      <LicenseVerificationModal
        isOpen={showLicenseModal}
        onVerify={handleLicenseVerify}
        isVerifying={isVerifyingLicense}
        error={licenseError}
      />
      <Toast
        message="License verified successfully! Welcome to Expense Manager Pro."
        type="success"
        isVisible={showSuccessToast}
        onClose={() => setShowSuccessToast(false)}
        duration={4000}
      />
    </>
  );
};

export default ProtectedRoute;
