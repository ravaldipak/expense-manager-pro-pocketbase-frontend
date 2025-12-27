import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../contexts/AppContext';
import { pb } from '../contexts/PocketBase';
import { startOfMonth, endOfMonth, format, startOfYear, endOfYear, subMonths, addMonths } from 'date-fns';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiPlus, FiTarget, FiTrendingUp, FiTrendingDown, FiEdit2, FiTrash2, FiCalendar } = FiIcons;

const Budgets = () => {
  const { state, actions } = useApp();
  const { settings } = state;
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [budgetPerformance, setBudgetPerformance] = useState([]);
  const [performanceLoading, setPerformanceLoading] = useState(true);
  
  // Date filter state
  const [dateFilter, setDateFilter] = useState('current-month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Calculate date range based on filter
  const getDateRange = () => {
    const now = new Date();
    
    switch (dateFilter) {
      case 'current-month':
        return {
          start: startOfMonth(now),
          end: endOfMonth(now)
        };
      case 'last-month':
        const lastMonth = subMonths(now, 1);
        return {
          start: startOfMonth(lastMonth),
          end: endOfMonth(lastMonth)
        };
      case 'current-year':
        return {
          start: startOfYear(now),
          end: endOfYear(now)
        };
      case 'custom':
        return {
          start: customStartDate ? new Date(customStartDate) : startOfMonth(now),
          end: customEndDate ? new Date(customEndDate) : endOfMonth(now)
        };
      default:
        return {
          start: startOfMonth(now),
          end: endOfMonth(now)
        };
    }
  };

  // Fetch and calculate budget performance dynamically from PocketBase
  useEffect(() => {
    let isMounted = true; // Flag to prevent state updates if component unmounts

    const fetchBudgetPerformance = async () => {
      try {
        if (!isMounted) return; // Exit early if component unmounted
        setPerformanceLoading(true);
        const user = pb.authStore.model;
        if (!user) {
          if (isMounted) setBudgetPerformance([]);
          return;
        }

        const { start: monthStart, end: monthEnd } = getDateRange();

        // Fetch budgets, transactions, and categories from PocketBase
        const [budgets, transactions, categories] = await Promise.all([
          pb.collection('budget').getFullList({
            filter: `user_id = "${user.id}"`,
            sort: '-created',
          }),
          pb.collection('transactions').getFullList({
            filter: `user = "${user.id}" && type = "expense" && status = "posted" && date >= "${monthStart.toISOString().split('T')[0]}" && date <= "${monthEnd.toISOString().split('T')[0]}"`,
            sort: '-date',
          }),
          pb.collection('categories').getFullList({
            sort: 'name'
          })
        ]);

        if (!isMounted) return; // Exit early if component unmounted

        const performance = budgets.map(budget => {
          // Get category name from id budget.category and add in budget
          const category = categories.find(cat => cat.id === budget.category);
          const categoryName = category ? category.name : budget.category;

          const spent = transactions
            .filter(t => {
              // Handle both cases: transaction.category could be name or ID
              if (t.category === budget.category) {
                return true; // Direct ID match
              }
              // Check if transaction category name matches budget category name
              if (t.category === categoryName) {
                return true; // Name match
              }
              // Also check if transaction category is an ID that matches our category ID
              const transactionCategory = categories.find(cat => cat.id === t.category);
              if (transactionCategory && transactionCategory.id === budget.category) {
                return true; // Transaction category ID matches budget category ID
              }
              return false;
            })
            .reduce((sum, t) => sum + t.amount, 0);

          console.log("budgets", budgets);
          console.log("transactions", transactions);
          console.log(`Budget: ${categoryName} (${budget.category}), Spent: ${spent}`);

          const monthlyBudget = budget.period === 'monthly' 
            ? budget.amount
            : budget.period === 'yearly'
            ? budget.amount / 12
            : budget.period === 'quarterly'
            ? budget.amount / 3
            : budget.amount;

          const percentage = monthlyBudget > 0 ? (spent / monthlyBudget) * 100 : 0;
          const remaining = Math.max(0, monthlyBudget - spent);

          return {
            ...budget,
            categoryName,
            spent,
            monthlyBudget,
            percentage,
            remaining,
            isOverBudget: spent > monthlyBudget,
          };
        });

        if (isMounted) {
          setBudgetPerformance(performance);
        }
      } catch (error) {
        console.error('Error fetching budget performance:', error);
        if (isMounted) {
          setBudgetPerformance([]);
        }
      } finally {
        if (isMounted) {
          setPerformanceLoading(false);
        }
      }
    };

    fetchBudgetPerformance();

    // Cleanup function to prevent memory leaks
    return () => {
      isMounted = false;
    };
  }, [dateFilter, customStartDate, customEndDate]); // Add dependencies to re-run when date filter changes

  const totalBudget = budgetPerformance.reduce((sum, b) => sum + b.monthlyBudget, 0);
  const totalSpent = budgetPerformance.reduce((sum, b) => sum + b.spent, 0);
  const totalRemaining = Math.max(0, totalBudget - totalSpent);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: settings.currency,
    }).format(amount);
  };

  const animationProps = settings.reducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.3 },
      };

  const handleEditBudget = (budget) => {
    setEditingBudget(budget);
    setShowAddForm(false);
  };

  const handleDeleteBudget = async (budgetId) => {
    if (window.confirm('Are you sure you want to delete this budget?')) {
      setIsLoading(true);
      try {
        await actions.deleteBudget(budgetId);
        
        // Refresh budget performance after deletion
        await refreshBudgetPerformance();
      } catch (error) {
        console.error('Failed to delete budget:', error);
        alert('Failed to delete budget. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSaveBudget = async (budgetData) => {
    setIsLoading(true);
    try {
      if (editingBudget) {
        // Update existing budget
        await actions.updateBudget(editingBudget.id, budgetData);
      } else {
        // Create new budget
        await actions.addBudget(budgetData);
      }
      setShowAddForm(false);
      setEditingBudget(null);
      
      // Refresh budget performance after saving
      await refreshBudgetPerformance();
    } catch (error) {
      console.error('Failed to save budget:', error);
      alert('Failed to save budget. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to refresh budget performance
  const refreshBudgetPerformance = async () => {
    try {
      setPerformanceLoading(true);
      const user = pb.authStore.model;
      if (!user) {
        setBudgetPerformance([]);
        return;
      }

      const { start: monthStart, end: monthEnd } = getDateRange();

      // Fetch budgets, transactions, and categories from PocketBase
       const [budgets, transactions, categories] = await Promise.all([
         pb.collection('budget').getFullList({
           filter: `user_id = "${user.id}"`,
           sort: '-created',
         }),
         pb.collection('transactions').getFullList({
           filter: `user = "${user.id}" && type = "expense" && status = "posted" && date >= "${monthStart.toISOString().split('T')[0]}" && date <= "${monthEnd.toISOString().split('T')[0]}"`,
           sort: '-date',
         }),
         pb.collection('categories').getFullList({
           sort: 'name'
         })
       ]);

       const performance = budgets.map(budget => {
         // Get category name from id budget.category and add in budget
         const category = categories.find(cat => cat.id === budget.category);
         const categoryName = category ? category.name : budget.category;

         const spent = transactions
           .filter(t => {
             // Handle both cases: transaction.category could be name or ID
             if (t.category === budget.category) {
               return true; // Direct ID match
             }
             // Check if transaction category name matches budget category name
             if (t.category === categoryName) {
               return true; // Name match
             }
             // Also check if transaction category is an ID that matches our category ID
             const transactionCategory = categories.find(cat => cat.id === t.category);
             if (transactionCategory && transactionCategory.id === budget.category) {
               return true; // Transaction category ID matches budget category ID
             }
             return false;
           })
           .reduce((sum, t) => sum + t.amount, 0);

        console.log("budgets", budgets);
        console.log("transactions", transactions);
        console.log(`Budget: ${categoryName} (${budget.category}), Spent: ${spent}`);

         const monthlyBudget = budget.period === 'monthly' 
           ? budget.amount
           : budget.period === 'yearly'
           ? budget.amount / 12
           : budget.period === 'quarterly'
           ? budget.amount / 3
           : budget.amount;

         const percentage = monthlyBudget > 0 ? (spent / monthlyBudget) * 100 : 0;
         const remaining = Math.max(0, monthlyBudget - spent);

         return {
           ...budget,
           categoryName,
           spent,
           monthlyBudget,
           percentage,
           remaining,
           isOverBudget: spent > monthlyBudget,
         };
       });

      setBudgetPerformance(performance);
    } catch (error) {
      console.error('Error refreshing budget performance:', error);
      setBudgetPerformance([]);
    } finally {
      setPerformanceLoading(false);
    }
  };

  return (
    <motion.div className="space-y-6" {...animationProps}>
      {/* Header */}
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Budgets</h1>
            <p className="text-gray-600 mt-1">
              Track your spending against your budget goals
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            disabled={isLoading}
            className="flex items-center px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors duration-200 mt-4 sm:mt-0"
          >
            <SafeIcon icon={FiPlus} className="w-4 h-4 mr-2" />
            Add Budget
          </button>
        </div>

        {/* Date Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-2">
            <SafeIcon icon={FiCalendar} className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Date Range:</span>
          </div>
          
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
          >
            <option value="current-month">Current Month</option>
            <option value="last-month">Last Month</option>
            <option value="custom">Custom Range</option>
          </select>

          {dateFilter === 'custom' && (
            <div className="flex items-center space-x-2">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                placeholder="Start Date"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                placeholder="End Date"
              />
            </div>
          )}

          <div className="text-sm text-gray-600">
            {(() => {
              const { start, end } = getDateRange();
              return `${format(start, 'MMM dd, yyyy')} - ${format(end, 'MMM dd, yyyy')}`;
            })()}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          {...animationProps}
        >
          <div className="flex items-center">
            <div className="flex items-center justify-center w-12 h-12 bg-primary-100 rounded-lg">
              <SafeIcon icon={FiTarget} className="w-6 h-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Budget</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(totalBudget)}
              </p>
              <p className="text-xs text-gray-500">
                {(() => {
                  const { start, end } = getDateRange();
                  return `${format(start, 'MMM yyyy')} - ${format(end, 'MMM yyyy')}`;
                })()}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          {...animationProps}
        >
          <div className="flex items-center">
            <div className="flex items-center justify-center w-12 h-12 bg-danger-100 rounded-lg">
              <SafeIcon icon={FiTrendingDown} className="w-6 h-6 text-danger-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Spent</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(totalSpent)}
              </p>
              <p className="text-xs text-gray-500">
                {totalBudget > 0 ? `${((totalSpent / totalBudget) * 100).toFixed(1)}% of budget` : '0% of budget'}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          {...animationProps}
        >
          <div className="flex items-center">
            <div className="flex items-center justify-center w-12 h-12 bg-success-100 rounded-lg">
              <SafeIcon icon={FiTrendingUp} className="w-6 h-6 text-success-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Remaining</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(totalRemaining)}
              </p>
              <p className="text-xs text-gray-500">
                Available to spend
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Budget List */}
      <div className="space-y-4">
        {performanceLoading ? (
          // Loading skeleton
          Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
              <div className="h-2 bg-gray-200 rounded w-full"></div>
            </div>
          ))
        ) : (
          budgetPerformance.map((budget) => (
            <motion.div
              key={budget.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              {...animationProps}
            >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {budget.categoryName}
                    </h3>
                    <p className="text-sm text-gray-600 capitalize">
                      {budget.period} budget
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(budget.spent)} / {formatCurrency(budget.monthlyBudget)}
                    </p>
                    <p className={`text-sm font-medium ${
                      budget.isOverBudget ? 'text-danger-600' : 'text-gray-600'
                    }`}>
                      {budget.isOverBudget 
                        ? `Over by ${formatCurrency(budget.spent - budget.monthlyBudget)}`
                        : `${formatCurrency(budget.remaining)} remaining`
                      }
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>{budget.percentage.toFixed(1)}% used</span>
                    <span>
                      {budget.isOverBudget ? 'Over budget' : `${(100 - budget.percentage).toFixed(1)}% remaining`}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-300 ${
                        budget.percentage > 100
                          ? 'bg-danger-500'
                          : budget.percentage > 80
                          ? 'bg-warning-500'
                          : 'bg-success-500'
                      }`}
                      style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                    />
                  </div>
                </div>

                {budget.notes && (
                  <p className="text-sm text-gray-600">{budget.notes}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2 mt-4 lg:mt-0 lg:ml-6">
                <button 
                  onClick={() => handleEditBudget(budget)}
                  disabled={isLoading}
                  className="p-2 text-gray-600 hover:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors duration-200"
                  title="Edit budget"
                >
                  <SafeIcon icon={FiEdit2} className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDeleteBudget(budget.id)}
                  disabled={isLoading}
                  className="p-2 text-danger-600 hover:bg-danger-100 disabled:text-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors duration-200"
                  title="Delete budget"
                >
                  <SafeIcon icon={FiTrash2} className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))
        )}

        {budgetPerformance.length === 0 && !performanceLoading && (
          <motion.div
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center"
            {...animationProps}
          >
            <SafeIcon icon={FiTarget} className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No budgets yet</h3>
            <p className="text-gray-600 mb-6">
              Create budgets to track your spending and stay on top of your finances.
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors duration-200"
            >
              <SafeIcon icon={FiPlus} className="w-4 h-4 mr-2" />
              Create Your First Budget
            </button>
          </motion.div>
        )}
      </div>

      {/* Add/Edit Budget Form */}
      {(showAddForm || editingBudget) && (
        <AddBudgetForm
          budget={editingBudget}
          onClose={() => {
            setShowAddForm(false);
            setEditingBudget(null);
          }}
          onSave={handleSaveBudget}
          isLoading={isLoading}
        />
      )}
    </motion.div>
  );
};

// Add Budget Form Component
const AddBudgetForm = ({ budget, onClose, onSave, isLoading }) => {
  const { state } = useApp();
  const { settings } = state;
  const [formData, setFormData] = useState({
    category: budget?.category || '',
    amount: budget?.amount?.toString() || '',
    period: budget?.period || 'monthly',
    notes: budget?.notes || '',
  });
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const isEditing = !!budget;

  // Fetch expense categories from PocketBase
  useEffect(() => {
    const fetchExpenseCategories = async () => {
      try {
        setCategoriesLoading(true);
        const categories = await pb.collection('categories').getFullList({
          filter: 'type = "expense"',
          sort: 'name'
        });
        setExpenseCategories(categories);
      } catch (error) {
        console.error('Error fetching expense categories:', error);
        setExpenseCategories([]);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchExpenseCategories();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.category || !formData.amount) {
      return;
    }

    const budgetData = {
      category: formData.category,
      amount: parseFloat(formData.amount),
      period: formData.period,
      notes: formData.notes,
    };

    await onSave(budgetData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const animationProps = settings.reducedMotion
    ? {}
    : {
        initial: { opacity: 0, scale: 0.9 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.9 },
        transition: { duration: 0.3 },
      };

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
      {...animationProps}
    >
      <motion.div
        className="bg-white rounded-lg shadow-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Edit Budget' : 'Add Budget'}
          </h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
              disabled={categoriesLoading}
            >
              <option value="">
                {categoriesLoading ? 'Loading categories...' : 'Select category'}
              </option>
              {expenseCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => handleChange('amount', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Period *
              </label>
              <select
                value={formData.period}
                onChange={(e) => handleChange('period', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
                <option value="custom">Custom</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Optional notes about this budget..."
            />
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!formData.category || !formData.amount || isLoading}
            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors duration-200 flex items-center"
          >
            {isLoading && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            )}
            {isLoading ? 'Saving...' : (isEditing ? 'Update Budget' : 'Add Budget')}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Budgets;