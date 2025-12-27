import React, { useState } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiAlertTriangle, FiX } = FiIcons;

const ConfirmDialog = ({
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmStyle = 'primary', // 'primary', 'danger', 'warning'
  requiresConfirmation = false,
  confirmationText = '',
  onConfirm,
  onCancel,
}) => {
  const [confirmationInput, setConfirmationInput] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirm = async () => {
    if (requiresConfirmation && confirmationInput !== confirmationText) {
      return;
    }

    setIsConfirming(true);
    try {
      await onConfirm();
    } finally {
      setIsConfirming(false);
    }
  };

  const confirmButtonStyles = {
    primary: 'bg-primary-500 hover:bg-primary-600 text-white',
    danger: 'bg-danger-500 hover:bg-danger-600 text-white',
    warning: 'bg-warning-500 hover:bg-warning-600 text-white',
  };

  const isConfirmDisabled = isConfirming || (requiresConfirmation && confirmationInput !== confirmationText);

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white rounded-lg shadow-xl w-full max-w-md"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center">
            <SafeIcon 
              icon={FiAlertTriangle} 
              className={`w-5 h-5 mr-2 ${
                confirmStyle === 'danger' ? 'text-danger-500' : 
                confirmStyle === 'warning' ? 'text-warning-500' : 
                'text-primary-500'
              }`} 
            />
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          </div>
          <button
            onClick={onCancel}
            disabled={isConfirming}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors duration-200 disabled:opacity-50"
          >
            <SafeIcon icon={FiX} className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <p className="text-gray-700">{message}</p>

          {/* Confirmation Input */}
          {requiresConfirmation && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type "{confirmationText}" to confirm:
              </label>
              <input
                type="text"
                value={confirmationInput}
                onChange={(e) => setConfirmationInput(e.target.value)}
                disabled={isConfirming}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
                placeholder={confirmationText}
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex space-x-3 p-4 border-t border-gray-200">
          <button
            onClick={onCancel}
            disabled={isConfirming}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg font-medium transition-colors duration-200"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed ${confirmButtonStyles[confirmStyle]}`}
          >
            {isConfirming ? (
              <div className="flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Processing...
              </div>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ConfirmDialog;