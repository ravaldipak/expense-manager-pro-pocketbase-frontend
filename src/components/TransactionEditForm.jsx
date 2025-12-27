import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../contexts/AppContext';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiX, FiSave, FiPlus, FiMinus } = FiIcons;

const TransactionEditForm = ({ transaction, onClose }) => {
  const { state, actions } = useApp();
  const { categories, people, settings } = state;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    date: transaction.date 
      ? (typeof transaction.date === 'string'
          ? new Date(transaction.date).toISOString().slice(0, 10)
          : new Date(transaction.date).toISOString().slice(0, 10))
      : new Date().toISOString().slice(0, 10),
    type: transaction.type,
    amount: transaction.amount.toString(),
    category: transaction.category,
    payee: transaction.payee || '',
    notes: transaction.notes || '',
    tags: transaction.tags ? transaction.tags.join(', ') : '',
    account: transaction.account || 'Main Account',
    person: transaction.person || '',
    status: transaction.status || 'posted',
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
      const updatedData = {
        ...formData,
        amount: parseFloat(formData.amount),
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
        updatedAt: new Date(),
      };

      // Use AppContext actions which now handle PocketBase
      await actions.updateTransaction(transaction.id, updatedData);
      
      onClose();
    } catch (error) {
      console.error('Failed to update transaction:', error);
      alert('Failed to update transaction. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-select first category when type changes
    if (field === 'type' && formData.category) {
      const newCategories = value === 'expense' ? expenseCategories : incomeCategories;
      if (newCategories.length > 0 && !newCategories.find(c => c.name === formData.category)) {
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
        className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        layout={!settings.reducedMotion}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Edit Transaction</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors duration-200"
            type="button"
          >
            <SafeIcon icon={FiX} className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => handleChange('date', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                !formData.date ? 'border-red-500' : 'border-gray-300'
              }`}
              required
              disabled={isSubmitting}
            />
            {!formData.date && (
              <p className="mt-1 text-sm text-red-500">Please select a date</p>
            )}
          </div>

          {/* Type and Amount */}
          <div className="flex space-x-2">
            <div className="flex rounded-lg border border-gray-300 overflow-hidden">
              <button
                type="button"
                onClick={() => handleChange('type', 'expense')}
                disabled={isSubmitting}
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
                disabled={isSubmitting}
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
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
          </div>

          {/* Payee */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payee
            </label>
            <input
              type="text"
              placeholder="Payee (optional)"
              value={formData.payee}
              onChange={(e) => handleChange('payee', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={isSubmitting}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              placeholder="Notes (optional)"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              disabled={isSubmitting}
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags
            </label>
            <input
              type="text"
              placeholder="Tags (comma separated)"
              value={formData.tags}
              onChange={(e) => handleChange('tags', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={isSubmitting}
            />
          </div>

          {/* Account */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account
            </label>
            <input
              type="text"
              placeholder="Account"
              value={formData.account}
              onChange={(e) => handleChange('account', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={isSubmitting}
            />
          </div>

          {/* Person */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Person
            </label>
            <select
              value={formData.person}
              onChange={(e) => handleChange('person', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={isSubmitting}
            >
              <option value="">No person</option>
              {people.map((person) => (
                <option key={person.id} value={person.name}>
                  {person.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={isSubmitting}
            >
              <option value="posted">Posted</option>
              <option value="pending">Pending</option>
            </select>
          </div>

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
                  Updating...
                </div>
              ) : (
                <>
                  <SafeIcon icon={FiSave} className="w-4 h-4 mr-2" />
                  Update Transaction
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default TransactionEditForm;