import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../contexts/AppContext';
import { pb } from '../contexts/PocketBase';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiX, FiPlus, FiEdit2, FiTrash2, FiSave, FiCheck } = FiIcons;

const CategoryManager = ({ onClose }) => {
  const { state, actions } = useApp();
  const { categories, settings } = state;
  const [editingCategory, setEditingCategory] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'expense',
    color: '#ef4444',
    icon: 'shopping-cart',
  });

  const colors = [
    '#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981',
    '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7',
    '#ec4899', '#f43f5e', '#64748b', '#6b7280', '#374151'
  ];

  const icons = [
    'shopping-cart', 'coffee', 'car', 'home', 'heart', 'music',
    'book', 'briefcase', 'shield', 'zap', 'wifi', 'truck',
    'activity', 'tv', 'shopping-bag', 'credit-card', 'dollar-sign'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim() || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingCategory) {
        // Update existing category
        const updatedCategory = {
          ...editingCategory,
          ...formData,
          updatedAt: new Date(),
        };
        
        await pb.collection('categories').update(editingCategory.id, formData);
        actions.updateCategory(updatedCategory);
      } else {
        // Add new category
        const category = {
          ...formData,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const newCategory = await pb.collection('categories').create(category);
        
        actions.addCategory(newCategory);
      }

      // Reset form
      setFormData({
        name: '',
        type: 'expense',
        color: '#ef4444',
        icon: 'shopping-cart',
      });
      setEditingCategory(null);
    } catch (error) {
      console.error('Failed to save category:', error);
      alert('Failed to save category. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      type: category.type,
      color: category.color,
      icon: category.icon,
    });
  };

  const handleDelete = async (categoryId) => {
    if (confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      try {
        await pb.collection('categories').delete(categoryId);
        actions.deleteCategory(categoryId);
      } catch (error) {
        console.error('Failed to delete category:', error);
        alert('Failed to delete category. Please try again.');
      }
    }
  };

  const handleCancel = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      type: 'expense',
      color: '#ef4444',
      icon: 'shopping-cart',
    });
  };

  const incomeCategories = categories.filter(c => c.type === 'income');
  const expenseCategories = categories.filter(c => c.type === 'expense');

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
        className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        layout={!settings.reducedMotion}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Manage Categories</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors duration-200"
            type="button"
          >
            <SafeIcon icon={FiX} className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row max-h-[calc(90vh-80px)]">
          {/* Form Section */}
          <div className="lg:w-1/3 p-6 border-r border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter category name"
                  required
                  disabled={isSubmitting}
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, type: 'expense' }))}
                    disabled={isSubmitting}
                    className={`flex-1 px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                      formData.type === 'expense'
                        ? 'bg-danger-500 text-white'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, type: 'income' }))}
                    disabled={isSubmitting}
                    className={`flex-1 px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                      formData.type === 'income'
                        ? 'bg-success-500 text-white'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Income
                  </button>
                </div>
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {colors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, color }))}
                      disabled={isSubmitting}
                      className={`h-8 w-8 rounded-full border-2 transition-all duration-200 ${
                        formData.color === color
                          ? 'border-gray-900 scale-110'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Icon */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Icon
                </label>
                <div className="grid grid-cols-6 gap-2 max-h-32 overflow-y-auto">
                  {icons.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, icon }))}
                      disabled={isSubmitting}
                      className={`h-8 w-8 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
                        formData.icon === icon
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <span className="text-xs">{icon.split('-')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3 pt-4">
                {editingCategory && (
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg font-medium transition-colors duration-200"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={!formData.name.trim() || isSubmitting}
                  className="flex-1 px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors duration-200"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Saving...
                    </div>
                  ) : (
                    <>
                      <SafeIcon icon={editingCategory ? FiSave : FiPlus} className="w-4 h-4 mr-2" />
                      {editingCategory ? 'Update' : 'Add'} Category
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Categories List */}
          <div className="lg:w-2/3 p-6 overflow-y-auto">
            <div className="space-y-6">
              {/* Income Categories */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                  <div className="w-3 h-3 bg-success-500 rounded-full mr-2"></div>
                  Income Categories ({incomeCategories.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {incomeCategories.map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    >
                      <div className="flex items-center">
                        <div
                          className="w-4 h-4 rounded-full mr-3"
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="font-medium text-gray-900">{category.name}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleEdit(category)}
                          className="p-1 text-gray-400 hover:text-primary-600 rounded transition-colors duration-200"
                          title="Edit category"
                        >
                          <SafeIcon icon={FiEdit2} className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(category.id)}
                          className="p-1 text-gray-400 hover:text-danger-600 rounded transition-colors duration-200"
                          title="Delete category"
                        >
                          <SafeIcon icon={FiTrash2} className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {incomeCategories.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No income categories yet</p>
                )}
              </div>

              {/* Expense Categories */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                  <div className="w-3 h-3 bg-danger-500 rounded-full mr-2"></div>
                  Expense Categories ({expenseCategories.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {expenseCategories.map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    >
                      <div className="flex items-center">
                        <div
                          className="w-4 h-4 rounded-full mr-3"
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="font-medium text-gray-900">{category.name}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleEdit(category)}
                          className="p-1 text-gray-400 hover:text-primary-600 rounded transition-colors duration-200"
                          title="Edit category"
                        >
                          <SafeIcon icon={FiEdit2} className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(category.id)}
                          className="p-1 text-gray-400 hover:text-danger-600 rounded transition-colors duration-200"
                          title="Delete category"
                        >
                          <SafeIcon icon={FiTrash2} className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {expenseCategories.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No expense categories yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CategoryManager;