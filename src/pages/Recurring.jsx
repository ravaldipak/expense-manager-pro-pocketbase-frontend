import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../contexts/AppContext';
import { format, addDays, addWeeks, addMonths, addQuarters, addYears } from 'date-fns';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiPlus, FiRepeat, FiCalendar, FiDollarSign, FiEdit2, FiTrash2, FiPlay } = FiIcons;

const Recurring = () => {
  const { state, actions } = useApp();
  const { recurringRules, settings } = state;
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [selectedRule, setSelectedRule] = useState(null);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: settings.currency,
    }).format(amount);
  };

  const calculateNextOccurrence = (rule) => {
    const startDate = new Date(rule.startDate);
    const now = new Date();
    
    let nextDate = new Date(startDate);
    
    while (nextDate <= now) {
      switch (rule.frequency) {
        case 'daily':
          nextDate = addDays(nextDate, 1);
          break;
        case 'weekly':
          nextDate = addWeeks(nextDate, 1);
          break;
        case 'fortnightly':
          nextDate = addWeeks(nextDate, 2);
          break;
        case 'monthly':
          nextDate = addMonths(nextDate, 1);
          break;
        case 'quarterly':
          nextDate = addQuarters(nextDate, 1);
          break;
        case 'yearly':
          nextDate = addYears(nextDate, 1);
          break;
        default:
          nextDate = addMonths(nextDate, 1);
      }
    }
    
    return nextDate;
  };

  const getCoverageDays = (frequency) => {
    switch (frequency) {
      case 'daily':
        return 1;
      case 'weekly':
        return 7;
      case 'fortnightly':
        return 14;
      case 'monthly':
        return 30;
      case 'quarterly':
        return 90;
      case 'yearly':
        return 365;
      default:
        return 30;
    }
  };

  const calculateDailyAmount = (rule) => {
    const coverageDays = getCoverageDays(rule.frequency);
    return rule.amount / coverageDays;
  };

  const handleEditRule = (rule) => {
    setEditingRule(rule);
    setShowEditForm(true);
  };

  const handleDeleteRule = async (ruleId) => {
    if (!window.confirm('Are you sure you want to delete this recurring rule?')) {
      return;
    }

    try {
      await actions.deleteRecurringRule(ruleId);
    } catch (error) {
      console.error('Failed to delete recurring rule:', error);
      alert('Failed to delete recurring rule. Please try again.');
    }
  };

  const animationProps = settings.reducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.3 },
      };

  return (
    <motion.div className="space-y-6" {...animationProps}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recurring Transactions</h1>
          <p className="text-gray-600 mt-1">
            Manage your recurring income and expenses
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors duration-200 mt-4 sm:mt-0"
        >
          <SafeIcon icon={FiPlus} className="w-4 h-4 mr-2" />
          Add Recurring Rule
        </button>
      </div>

      {/* Recurring Rules List */}
      <div className="space-y-4">
        {recurringRules.map((rule) => {
          const nextOccurrence = calculateNextOccurrence(rule);
          const dailyAmount = calculateDailyAmount(rule);
          
          return (
            <motion.div
              key={rule.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              {...animationProps}
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${
                      rule.type === 'income' ? 'bg-success-100' : 'bg-danger-100'
                    }`}>
                      <SafeIcon 
                        icon={FiRepeat} 
                        className={`w-5 h-5 ${
                          rule.type === 'income' ? 'text-success-600' : 'text-danger-600'
                        }`} 
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{rule.name}</h3>
                      <p className="text-sm text-gray-600">{rule.category}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Amount</p>
                      <p className={`text-lg font-bold ${
                        rule.type === 'income' ? 'text-success-600' : 'text-danger-600'
                      }`}>
                        {formatCurrency(rule.amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Frequency</p>
                      <p className="text-sm font-medium text-gray-900 capitalize">
                        {rule.frequency}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Daily Rate</p>
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(dailyAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Next Occurrence</p>
                      <p className="text-sm font-medium text-gray-900">
                        {format(nextOccurrence, 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>

                  {rule.notes && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-600">{rule.notes}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 mt-4 lg:mt-0 lg:ml-6">
                  <button
                    onClick={() => setSelectedRule(rule)}
                    className="flex items-center px-3 py-2 bg-primary-100 hover:bg-primary-200 text-primary-700 rounded-lg text-sm font-medium transition-colors duration-200"
                  >
                    <SafeIcon icon={FiPlay} className="w-4 h-4 mr-1" />
                    Generate
                  </button>
                  <button
                    onClick={() => handleEditRule(rule)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                  >
                    <SafeIcon icon={FiEdit2} className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteRule(rule.id)}
                    className="p-2 text-danger-600 hover:bg-danger-100 rounded-lg transition-colors duration-200"
                  >
                    <SafeIcon icon={FiTrash2} className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}

        {recurringRules.length === 0 && (
          <motion.div
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center"
            {...animationProps}
          >
            <SafeIcon icon={FiRepeat} className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No recurring rules yet</h3>
            <p className="text-gray-600 mb-6">
              Set up recurring transactions to automate your income and expense tracking.
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors duration-200"
            >
              <SafeIcon icon={FiPlus} className="w-4 h-4 mr-2" />
              Add Your First Recurring Rule
            </button>
          </motion.div>
        )}
      </div>

      {/* Schedule Preview Modal */}
      {selectedRule && (
        <SchedulePreview
          rule={selectedRule}
          onClose={() => setSelectedRule(null)}
          formatCurrency={formatCurrency}
        />
      )}

      {/* Add Form Modal */}
      {showAddForm && (
        <AddRecurringForm
          onClose={() => setShowAddForm(false)}
          onSave={async (rule) => {
            try {
              await actions.addRecurringRule(rule);
              setShowAddForm(false);
            } catch (error) {
              console.error('Failed to add recurring rule:', error);
              alert('Failed to add recurring rule. Please try again.');
            }
          }}
        />
      )}

      {/* Edit Form Modal */}
      {showEditForm && editingRule && (
        <EditRecurringForm
          rule={editingRule}
          onClose={() => {
            setShowEditForm(false);
            setEditingRule(null);
          }}
          onSave={async (rule) => {
            try {
              await actions.updateRecurringRule(editingRule.id, rule);
              setShowEditForm(false);
              setEditingRule(null);
            } catch (error) {
              console.error('Failed to update recurring rule:', error);
              alert('Failed to update recurring rule. Please try again.');
            }
          }}
        />
      )}
    </motion.div>
  );
};

// Schedule Preview Component
const SchedulePreview = ({ rule, onClose, formatCurrency }) => {
  const { state, actions } = useApp();
  const { settings } = state;
  const [selectedOccurrences, setSelectedOccurrences] = useState([]);
  const [previewCount, setPreviewCount] = useState(5);
  const [startFromToday, setStartFromToday] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [amountFilter, setAmountFilter] = useState({ min: '', max: '' });
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
  // Success popup state
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  // Generate occurrences based on user preferences
  const generateOccurrences = () => {
    const occurrences = [];
    let currentDate = new Date(rule.startDate);
    const now = new Date();
    const ruleEndDate = rule.endDate ? new Date(rule.endDate) : null;
    
    // Find occurrence that covers today if startFromToday is true
    if (startFromToday) {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      while (currentDate < now) {
        const coverageDays = getCoverageDays(rule.frequency);
        const coverageEndDate = addDays(currentDate, coverageDays - 1);
        
        // Check if today falls within this occurrence's coverage period
        if (coverageEndDate >= todayStart) {
          // Today is covered by this occurrence, include it
          break;
        }
        
        // Move to next occurrence
        switch (rule.frequency) {
          case 'daily':
            currentDate = addDays(currentDate, 1);
            break;
          case 'weekly':
            currentDate = addWeeks(currentDate, 1);
            break;
          case 'fortnightly':
            currentDate = addWeeks(currentDate, 2);
            break;
          case 'monthly':
            currentDate = addMonths(currentDate, 1);
            break;
          case 'quarterly':
            currentDate = addQuarters(currentDate, 1);
            break;
          case 'yearly':
            currentDate = addYears(currentDate, 1);
            break;
        }
      }
    }

    // Generate occurrences based on previewCount
    for (let i = 0; i < previewCount; i++) {
      // Stop if we've passed the rule's end date
      if (ruleEndDate && currentDate > ruleEndDate) {
        break;
      }

      const coverageDays = getCoverageDays(rule.frequency);
      let endDate = addDays(currentDate, coverageDays - 1);
      let actualAmount = rule.amount;
      let actualDays = coverageDays;
      let isProrated = false;

      // Check if this occurrence extends beyond the rule's end date
      if (ruleEndDate && endDate > ruleEndDate) {
        endDate = ruleEndDate;
        // Calculate actual days in this period
        actualDays = Math.ceil((endDate - currentDate) / (1000 * 60 * 60 * 24)) + 1;
        // Prorate the amount based on actual days
        const dailyRate = rule.amount / coverageDays;
        actualAmount = dailyRate * actualDays;
        isProrated = true;
      }
      
      occurrences.push({
        id: i,
        date: new Date(currentDate),
        endDate,
        amount: actualAmount,
        fullAmount: rule.amount,
        dailyRate: rule.amount / coverageDays,
        actualDays,
        coverageDays,
        isProrated,
        status: 'pending',
      });

      switch (rule.frequency) {
        case 'daily':
          currentDate = addDays(currentDate, 1);
          break;
        case 'weekly':
          currentDate = addWeeks(currentDate, 1);
          break;
        case 'fortnightly':
          currentDate = addWeeks(currentDate, 2);
          break;
        case 'monthly':
          currentDate = addMonths(currentDate, 1);
          break;
        case 'quarterly':
          currentDate = addQuarters(currentDate, 1);
          break;
        case 'yearly':
          currentDate = addYears(currentDate, 1);
          break;
      }
    }

    return occurrences;
  };

  const getCoverageDays = (frequency) => {
    switch (frequency) {
      case 'daily':
        return 1;
      case 'weekly':
        return 7;
      case 'fortnightly':
        return 14;
      case 'monthly':
        return 30;
      case 'quarterly':
        return 90;
      case 'yearly':
        return 365;
      default:
        return 30;
    }
  };

  const handleGenerateTransactions = async () => {
    if (selectedOccurrences.length === 0) return;
    
    setIsGenerating(true);
    try {
      const selectedOccurrenceData = filteredOccurrences.filter(occ => 
        selectedOccurrences.includes(occ.id)
      );
      
      for (const occurrence of selectedOccurrenceData) {
        const transactionData = {
          amount: occurrence.amount,
          description: `${rule.name} - ${format(occurrence.date, 'MMM d, yyyy')}`,
          date: occurrence.date.toISOString().split('T')[0],
          category: rule.category,
          person: rule.person,
          type: rule.type,
          recurring_rule: rule.id,
          coverage_start: occurrence.date.toISOString().split('T')[0],
          coverage_end: occurrence.endDate.toISOString().split('T')[0],
        };
        
        await actions.addTransaction(transactionData);
      }
      
      // Show success message and close
      setShowSuccessPopup(true);
      setTimeout(() => {
        setShowSuccessPopup(false);
        onClose();
      }, 1800);
    } catch (error) {
      console.error('Error generating transactions:', error);
      alert('Failed to generate transactions. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Regenerate occurrences when parameters change (real-time updates)
  const occurrences = React.useMemo(() => generateOccurrences(), [
    rule.startDate, 
    rule.frequency, 
    rule.amount, 
    previewCount, 
    startFromToday
  ]);

  // Apply filters to occurrences
  const filteredOccurrences = occurrences.filter(occurrence => {
    // Amount filter
    if (amountFilter.min && occurrence.amount < parseFloat(amountFilter.min)) return false;
    if (amountFilter.max && occurrence.amount > parseFloat(amountFilter.max)) return false;
    
    // Date filter
    if (dateFilter.start && occurrence.date < new Date(dateFilter.start)) return false;
    if (dateFilter.end && occurrence.date > new Date(dateFilter.end)) return false;
    
    return true;
  });

  // Calculate summary statistics based on filtered occurrences
  const totalAmount = filteredOccurrences.reduce((sum, occ) => Number(sum) + Number(occ.amount), 0);
  const selectedAmount = filteredOccurrences
    .filter(occ => selectedOccurrences.includes(occ.id))
    .reduce((sum, occ) => Number(sum) + Number(occ.amount), 0);
  const averageAmount = filteredOccurrences.length > 0 ? totalAmount / filteredOccurrences.length : 0;
  const dateRange = filteredOccurrences.length > 0 ? {
    start: filteredOccurrences[0].date,
    end: filteredOccurrences[filteredOccurrences.length - 1].endDate
  } : null;

  

  const handleSelectOccurrence = (id) => {
    setSelectedOccurrences(prev => {
      if (prev.includes(id)) {
        return prev.filter(occId => occId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedOccurrences.length === filteredOccurrences.length) {
      setSelectedOccurrences([]);
    } else {
      setSelectedOccurrences(filteredOccurrences.map(occ => occ.id));
    }
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
        className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        
        {isGenerating && (
          <div className="absolute inset-0 bg-white bg-opacity-80 flex flex-col items-center justify-center z-50">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-500 mb-4"></div>
            <p className="text-lg font-semibold text-primary-700">Generating transactions...</p>
          </div>
        )}
        {showSuccessPopup && (
          <div className="absolute inset-0 flex items-center justify-center z-50">
            <div className="bg-white border border-success-300 rounded-lg shadow-lg px-8 py-6 flex flex-col items-center">
              <div className="mb-2">
                <svg className="w-12 h-12 text-success-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2l4-4"/></svg>
              </div>
              <p className="text-success-700 text-lg font-semibold mb-1">Success!</p>
              <p className="text-gray-700">Successfully generated {selectedOccurrences.length} transactions.</p>
            </div>
          </div>
        )}
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Schedule Preview: {rule.name}
              </h2>
              <p className="text-gray-600 mt-1">
                Select occurrences to generate transactions
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-600">Show:</label>
                <select
                  value={previewCount}
                  onChange={(e) => setPreviewCount(parseInt(e.target.value))}
                  className="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value={3}>3 occurrences</option>
                  <option value={5}>5 occurrences</option>
                  <option value={10}>10 occurrences</option>
                  <option value={20}>20 occurrences</option>
                </select>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="startFromToday"
                  checked={startFromToday}
                  onChange={(e) => setStartFromToday(e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="startFromToday" className="ml-2 text-sm text-gray-600">
                  Start from today
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 max-h-96 overflow-y-auto">
          {/* Summary Statistics */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Total Amount</p>
                <p className={`font-semibold ${rule.type === 'income' ? 'text-success-600' : 'text-danger-600'}`}>
                  {formatCurrency(totalAmount)}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Selected Amount</p>
                <p className={`font-semibold ${rule.type === 'income' ? 'text-success-600' : 'text-danger-600'}`}>
                  {formatCurrency(selectedAmount)}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Average per Occurrence</p>
                <p className={`font-semibold ${rule.type === 'income' ? 'text-success-600' : 'text-danger-600'}`}>
                  {formatCurrency(averageAmount)}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Date Range</p>
                <p className="font-semibold text-gray-900">
                  {dateRange ? `${format(dateRange.start, 'MMM d')} - ${format(dateRange.end, 'MMM d')}` : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          
           <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={selectedOccurrences.length === filteredOccurrences.length && filteredOccurrences.length > 0}
                onChange={handleSelectAll}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-600">
                Select all ({filteredOccurrences.length})
              </span>
            </label>
          </div>

          <div className="space-y-3">
            {filteredOccurrences.map((occurrence) => (
              <div
                key={occurrence.id}
                className={`border rounded-lg p-4 ${
                  selectedOccurrences.includes(occurrence.id)
                    ? 'border-primary-300 bg-primary-50'
                    : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedOccurrences.includes(occurrence.id)}
                      onChange={() => handleSelectOccurrence(occurrence.id)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 mr-3"
                    />
                    <div>
                      <p className="font-medium text-gray-900">
                        {format(occurrence.date, 'MMM d, yyyy')}
                        {occurrence.isProrated && (
                          <span className="ml-2 text-xs bg-warning-100 text-warning-700 px-2 py-1 rounded">
                            Prorated
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-gray-600">
                        Coverage: {format(occurrence.date, 'MMM d')} - {format(occurrence.endDate, 'MMM d')}
                        {occurrence.isProrated && (
                          <span className="ml-1 text-warning-600">
                            ({occurrence.actualDays} of {occurrence.coverageDays} days)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${
                      rule.type === 'income' ? 'text-success-600' : 'text-danger-600'
                    }`}>
                      {formatCurrency(occurrence.amount)}
                    </p>
                    {occurrence.isProrated && (
                      <p className="text-xs text-gray-500 line-through">
                        {formatCurrency(occurrence.fullAmount)}
                      </p>
                    )}
                    <p className="text-sm text-gray-600">
                      {formatCurrency(occurrence.dailyRate)}/day
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors duration-200"
            disabled={isGenerating}
          >
            Cancel
          </button>
          <button
            onClick={handleGenerateTransactions}
            disabled={selectedOccurrences.length === 0 || isGenerating}
            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors duration-200"
          >
            {isGenerating ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></span>
                Generating...
              </span>
            ) : `Generate ${selectedOccurrences.length} Transactions`}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Add Recurring Form Component
const AddRecurringForm = ({ onClose, onSave }) => {
  const { state } = useApp();
  const { categories, people, settings } = state;
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'expense',
    amount: '',
    category: '',
    frequency: 'monthly',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    notes: '',
    person: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.amount || !formData.category) {
      return;
    }

    const rule = {
      ...formData,
      amount: parseFloat(formData.amount),
    };

    setIsLoading(true);
    try {
      await onSave(rule);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const expenseCategories = categories.filter(c => c.type === 'expense');
  const incomeCategories = categories.filter(c => c.type === 'income');
  const currentCategories = formData.type === 'expense' ? expenseCategories : incomeCategories;

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
        className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Add Recurring Rule</h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="e.g., Monthly Rent"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleChange('type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>

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
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            >
              <option value="">Select category</option>
              {currentCategories.map((category) => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Frequency *
            </label>
            <select
              value={formData.frequency}
              onChange={(e) => handleChange('frequency', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="fortnightly">Fortnightly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date *
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => handleChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Person
            </label>
            <select
              value={formData.person}
              onChange={(e) => handleChange('person', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">None</option>
              {people.map((person) => (
                <option key={person.id} value={person.name}>
                  {person.name}
                </option>
              ))}
            </select>
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
              placeholder="Optional notes..."
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
            disabled={!formData.name || !formData.amount || !formData.category || isLoading}
            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
          >
            {isLoading && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            {isLoading ? 'Saving...' : 'Save Rule'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Edit Recurring Form Component
const EditRecurringForm = ({ rule, onClose, onSave }) => {
  const { state } = useApp();
  const { categories, people, settings } = state;
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: rule.name || '',
    type: rule.type || 'expense',
    amount: rule.amount?.toString() || '',
    category: rule.category || '',
    frequency: rule.frequency || 'monthly',
    startDate: rule.startDate ? new Date(rule.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    endDate: rule.endDate ? new Date(rule.endDate).toISOString().split('T')[0] : '',
    notes: rule.notes || '',
    person: rule.person || '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.amount || !formData.category) {
      return;
    }

    const updatedRule = {
      ...formData,
      amount: parseFloat(formData.amount),
    };

    setIsLoading(true);
    try {
      await onSave(updatedRule);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const expenseCategories = categories.filter(c => c.type === 'expense');
  const incomeCategories = categories.filter(c => c.type === 'income');
  const currentCategories = formData.type === 'expense' ? expenseCategories : incomeCategories;

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
        className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Edit Recurring Rule</h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="e.g., Monthly Rent"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleChange('type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>

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
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            >
              <option value="">Select category</option>
              {currentCategories.map((category) => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Frequency *
            </label>
            <select
              value={formData.frequency}
              onChange={(e) => handleChange('frequency', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="fortnightly">Fortnightly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date *
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => handleChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {people.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Person
              </label>
              <select
                value={formData.person}
                onChange={(e) => handleChange('person', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Select person (optional)</option>
                {people.map((person) => (
                  <option key={person.id} value={person.name}>
                    {person.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows="3"
              placeholder="Optional notes..."
            />
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!formData.name || !formData.amount || !formData.category || isLoading}
            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
          >
            {isLoading && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            {isLoading ? 'Updating...' : 'Update Rule'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Recurring;