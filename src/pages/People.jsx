import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useApp } from '../contexts/AppContext';
import { format } from 'date-fns';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiPlus, FiUsers, FiUser, FiMail, FiPhone, FiDollarSign, FiClock, FiEye, FiLoader } = FiIcons;

const People = () => {
  const { state, actions } = useApp();
  const { people, transactions, settings } = state;
  const [showAddForm, setShowAddForm] = useState(false);

  // Calculate running balances and last activity
  const peopleWithBalances = useMemo(() => {
    return people.map(person => {
      // Get all transactions and IOUs for this person
      const personTransactions = transactions.filter(t => t.person === person.name);
      
      // Calculate running balance (positive means person owes you, negative means you owe them)
      let balance = 0;
      
      personTransactions.forEach(transaction => {
        if (transaction.type === 'expense') {
          // You paid for them
          balance += transaction.amount;
        } else if (transaction.type === 'income') {
          // They paid you back
          balance -= transaction.amount;
        }
      });

      // Get last activity
      const lastActivity = personTransactions.length > 0
        ? Math.max(...personTransactions.map(t => new Date(t.date).getTime()))
        : null;

      return {
        ...person,
        balance,
        lastActivity: lastActivity ? new Date(lastActivity) : null,
        transactionCount: personTransactions.length,
      };
    });
  }, [people, transactions]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: settings.currency,
    }).format(Math.abs(amount));
  };

  const getBalanceDisplay = (balance) => {
    if (balance === 0) {
      return { text: 'Settled', color: 'text-gray-500', bgColor: 'bg-gray-100' };
    } else if (balance > 0) {
      return { 
        text: `Owes you ${formatCurrency(balance)}`, 
        color: 'text-success-700', 
        bgColor: 'bg-success-100' 
      };
    } else {
      return { 
        text: `You owe ${formatCurrency(balance)}`, 
        color: 'text-danger-700', 
        bgColor: 'bg-danger-100' 
      };
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
          <h1 className="text-2xl font-bold text-gray-900">People</h1>
          <p className="text-gray-600 mt-1">
            Manage IOUs and shared expenses
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors duration-200 mt-4 sm:mt-0"
        >
          <SafeIcon icon={FiPlus} className="w-4 h-4 mr-2" />
          Add Person
        </button>
      </div>

      {/* People List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {peopleWithBalances.map((person) => {
          const balanceDisplay = getBalanceDisplay(person.balance);
          
          return (
            <motion.div
              key={person.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200"
              {...animationProps}
            >
              {/* Header */}
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex items-center justify-center w-12 h-12 bg-primary-100 rounded-full">
                  <SafeIcon icon={FiUser} className="w-6 h-6 text-primary-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {person.name}
                  </h3>
                  {person.shortName && person.shortName !== person.name && (
                    <p className="text-sm text-gray-600">({person.shortName})</p>
                  )}
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-2 mb-4">
                {person.contact && (
                  <div className="flex items-center text-sm text-gray-600">
                    <SafeIcon 
                      icon={person.contact.includes('@') ? FiMail : FiPhone} 
                      className="w-4 h-4 mr-2" 
                    />
                    <span className="truncate">{person.contact}</span>
                  </div>
                )}
                {person.transactionCount > 0 && (
                  <div className="flex items-center text-sm text-gray-600">
                    <SafeIcon icon={FiClock} className="w-4 h-4 mr-2" />
                    <span>
                      Last activity: {person.lastActivity 
                        ? format(person.lastActivity, 'MMM d, yyyy')
                        : 'Never'
                      }
                    </span>
                  </div>
                )}
              </div>

              {/* Balance */}
              <div className={`rounded-lg p-3 mb-4 ${balanceDisplay.bgColor}`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Balance</span>
                  <SafeIcon icon={FiDollarSign} className={`w-4 h-4 ${balanceDisplay.color}`} />
                </div>
                <p className={`text-lg font-bold ${balanceDisplay.color}`}>
                  {balanceDisplay.text}
                </p>
              </div>

              {/* Notes */}
              {person.notes && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 italic">"{person.notes}"</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-2">
                <button className="flex-1 px-3 py-2 bg-primary-100 hover:bg-primary-200 text-primary-700 rounded-lg text-sm font-medium transition-colors duration-200">
                  Add IOU
                </button>
                <Link
                  to={`/people/${person.id}`}
                  className="flex items-center justify-center px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors duration-200"
                >
                  <SafeIcon icon={FiEye} className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          );
        })}

        {people.length === 0 && (
          <motion.div
            className="col-span-full bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center"
            {...animationProps}
          >
            <SafeIcon icon={FiUsers} className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No people yet</h3>
            <p className="text-gray-600 mb-6">
              Add people to track IOUs and shared expenses.
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors duration-200"
            >
              <SafeIcon icon={FiPlus} className="w-4 h-4 mr-2" />
              Add Your First Person
            </button>
          </motion.div>
        )}
      </div>

      {/* Add Person Form */}
      {showAddForm && (
        <AddPersonForm
          onClose={() => setShowAddForm(false)}
          onSave={async (person) => {
            try {
              await actions.addPerson(person);
              setShowAddForm(false);
            } catch (error) {
              console.error('Failed to add person:', error);
              throw error;
            }
          }}
        />
      )}
    </motion.div>
  );
};

// Add Person Form Component
const AddPersonForm = ({ onClose, onSave }) => {
  const { state } = useApp();
  const { settings } = state;
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    shortName: '',
    contact: '',
    notes: '',
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || isLoading) {
      return;
    }
    setIsLoading(true);
    setError('');
    const person = {
      ...formData,
      balance: 0,
      createdAt: new Date(),
    };
    try {
      await onSave(person);
    } catch (err) {
      // Collect all field errors if available
      let errorMsg = '';
      if (err && err.data) {
        errorMsg = Object.entries(err.data)
          .map(([field, val]) => val.message ? `${field}: ${val.message}` : '')
          .filter(Boolean)
          .join('\n');
      }
      if (!errorMsg && err && err.message) {
        errorMsg = err.message;
      }
      if (!errorMsg) {
        errorMsg = 'Failed to add person.';
      }
      setError(errorMsg);
      console.error('Failed to add person:', err);
    } finally {
      setIsLoading(false);
    }
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
          <h2 className="text-xl font-semibold text-gray-900">Add Person</h2>
        </div>

        {/* Error Message */}
        {error && (
          <div className="px-6 pt-4 text-danger-700">
            <div className="bg-danger-100 border border-danger-200 rounded-lg p-3 mb-2 text-sm">
              {error}
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <fieldset disabled={isLoading} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Full name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Short Name *
              </label>
              <input
                type="text"
                value={formData.shortName}
                onChange={(e) => handleChange('shortName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Nickname or short name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact
              </label>
              <input
                type="text"
                value={formData.contact}
                onChange={(e) => handleChange('contact', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Email or phone number (optional)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Optional notes about this person..."
              />
            </div>
          </fieldset>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed rounded-lg font-medium transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!formData.name || isLoading}
            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <SafeIcon icon={FiLoader} className="w-4 h-4 animate-spin" />
                <span>Adding...</span>
              </>
            ) : (
              <span>Add Person</span>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default People;