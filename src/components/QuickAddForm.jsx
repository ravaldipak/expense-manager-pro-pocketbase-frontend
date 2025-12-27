import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../contexts/AppContext';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiX, FiPlus, FiMinus, FiExpand } = FiIcons;

const QuickAddForm = ({ onClose }) => {
  const { state, actions } = useApp();
  const { categories, settings } = state;
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'expense',
    amount: '',
    category: '',
    payee: '',
    notes: '',
    tags: '',
    account: 'Main Account',
    person: '',
  });

  const expenseCategories = categories.filter(c => c.type === 'expense');
  const incomeCategories = categories.filter(c => c.type === 'income');
  const currentCategories = formData.type === 'expense' ? expenseCategories : incomeCategories;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.category || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      const transaction = {
        ...formData,
        amount: parseFloat(formData.amount),
        status: 'posted',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Use AppContext actions which now handle PocketBase
      await actions.addTransaction(transaction);
      onClose();
    } catch (error) {
      console.error('Failed to add transaction:', error);
      alert('Failed to add transaction. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-select first category when type changes
    if (field === 'type' && !formData.category) {
      const newCategories = value === 'expense' ? expenseCategories : incomeCategories;
      if (newCategories.length > 0) {
        setFormData(prev => ({ ...prev, category: newCategories[0].name }));
      }
    }
  };

  const animationProps = settings.reducedMotion
    ? {}
    : {
        initial: { opacity: 0, scale: 0.9 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.9 },
        transition: { duration: 0.2 },
      };

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
      {...animationProps}
    >
      <motion.div
        className={`bg-white rounded-lg shadow-xl w-full max-w-md ${
          isExpanded ? 'max-h-[90vh] overflow-y-auto' : ''
        }`}
        onClick={(e) => e.stopPropagation()}
        layout={!settings.reducedMotion}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Quick Add Transaction</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors duration-200"
              title={isExpanded ? 'Collapse' : 'Expand'}
              type="button"
            >
              <SafeIcon icon={FiExpand} className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors duration-200"
              type="button"
            >
              <SafeIcon icon={FiX} className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Type and Amount */}
          <div className="flex space-x-2">
            <div className="flex rounded-lg border border-gray-300 overflow-hidden">
              <button
                type="button"
                onClick={() => handleChange('type', 'expense')}
                className={`px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                  formData.type === 'expense'
                    ? 'bg-danger-500 text-white'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <SafeIcon icon={FiMinus} className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleChange('type', 'income')}
                className={`px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                  formData.type === 'income'
                    ? 'bg-success-500 text-white'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <SafeIcon icon={FiPlus} className="w-4 h-4" />
              </button>
            </div>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => handleChange('amount', e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Category */}
          <select
            value={formData.category}
            onChange={(e) => handleChange('category', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            required
            disabled={isSubmitting}
          >
            <option value="">Select category</option>
            {currentCategories.map((category) => (
              <option key={category.id} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>

          {/* Notes (always visible) */}
          <input
            type="text"
            placeholder="Notes (optional)"
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            disabled={isSubmitting}
          />

          {/* Expanded fields */}
          {isExpanded && (
            <motion.div
              className="space-y-4"
              initial={settings.reducedMotion ? {} : { opacity: 0, height: 0 }}
              animate={settings.reducedMotion ? {} : { opacity: 1, height: 'auto' }}
              transition={{ duration: 0.3 }}
            >
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleChange('date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={isSubmitting}
              />
              
              <input
                type="text"
                placeholder="Payee (optional)"
                value={formData.payee}
                onChange={(e) => handleChange('payee', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={isSubmitting}
              />

              <input
                type="text"
                placeholder="Tags (optional)"
                value={formData.tags}
                onChange={(e) => handleChange('tags', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={isSubmitting}
              />

              <input
                type="text"
                placeholder="Account (optional)"
                value={formData.account}
                onChange={(e) => handleChange('account', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={isSubmitting}
              />

              <input
                type="text"
                placeholder="Person (optional)"
                value={formData.person}
                onChange={(e) => handleChange('person', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={isSubmitting}
              />
            </motion.div>
          )}

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg font-medium transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!formData.amount || !formData.category || isSubmitting}
              className="flex-1 px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors duration-200"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Adding...
                </div>
              ) : (
                'Add Transaction'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default QuickAddForm;