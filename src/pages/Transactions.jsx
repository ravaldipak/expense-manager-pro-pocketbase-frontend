import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../contexts/AppContext';
import { format, startOfMonth, endOfMonth, subMonths, isWithinInterval } from 'date-fns';
import SafeIcon from '../common/SafeIcon';
import QuickAddForm from '../components/QuickAddForm';
import TransactionEditForm from '../components/TransactionEditForm';
import CategoryManager from '../components/CategoryManager';
import ExportDialog from '../components/ExportDialog';
import * as FiIcons from 'react-icons/fi';

const {
  FiPlus,
  FiFilter,
  FiDownload,
  FiEdit2,
  FiTrash2,
  FiCheck,
  FiClock,
  FiSearch,
  FiSettings,
} = FiIcons;

const Transactions = () => {
  const { state, actions } = useApp();
  const { transactions, categories, people, settings } = state;
  
  const [filters, setFilters] = useState({
    dateRange: null,
    category: '',
    person: '',
    searchText: '',
    type: '',
  });
  
  const [selectedTransactions, setSelectedTransactions] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);

  // Quick filter presets
  const quickFilters = [
    {
      label: 'This Month',
      getValue: () => ({
        start: startOfMonth(new Date()),
        end: endOfMonth(new Date()),
      }),
    },
    {
      label: 'Last Month',
      getValue: () => ({
        start: startOfMonth(subMonths(new Date(), 1)),
        end: endOfMonth(subMonths(new Date(), 1)),
      }),
    },
    {
      label: 'Last 12 Months',
      getValue: () => ({
        start: subMonths(new Date(), 12),
        end: new Date(),
      }),
    },
  ];

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      // Date range filter
      if (filters.dateRange) {
        const transactionDate = new Date(transaction.date);
        if (!isWithinInterval(transactionDate, filters.dateRange)) {
          return false;
        }
      }

      // Category filter
      if (filters.category && transaction.category !== filters.category) {
        return false;
      }

      // Person filter
      if (filters.person && transaction.person !== filters.person) {
        return false;
      }

      // Type filter
      if (filters.type && transaction.type !== filters.type) {
        return false;
      }

      // Search text filter
      if (filters.searchText) {
        const searchLower = filters.searchText.toLowerCase();
        const searchableText = [
          transaction.payee,
          transaction.notes,
          transaction.category,
          transaction.tags,
        ].join(' ').toLowerCase();
        
        if (!searchableText.includes(searchLower)) {
          return false;
        }
      }

      return true;
    });
  }, [transactions, filters]);

  // Sort transactions by date (newest first)
  const sortedTransactions = useMemo(() => {
    return [...filteredTransactions].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [filteredTransactions]);

  // Calculate totals
  const totals = useMemo(() => {
    const targetTransactions = selectedTransactions.length > 0 
      ? transactions.filter(t => selectedTransactions.includes(t.id))
      : filteredTransactions;

    console.log('targetTransactions:', targetTransactions);

    const income = targetTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => Number(sum) + Number(t.amount), 0);
    
    const expenses = Number(
      targetTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => Number(sum) + Number(t.amount), 0)
    );

    return {
      count: targetTransactions.length,
      income,
      expenses,
      net: income - expenses,
      average: targetTransactions.length > 0 ? (income + expenses) / targetTransactions.length : 0,
    };
  }, [filteredTransactions, selectedTransactions, transactions]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: settings.currency,
    }).format(amount);
  };

  const handleQuickFilter = (filterFn) => {
    const dateRange = filterFn();
    setFilters(prev => ({ ...prev, dateRange }));
  };

  const handleSelectTransaction = (transactionId) => {
    setSelectedTransactions(prev => {
      if (prev.includes(transactionId)) {
        return prev.filter(id => id !== transactionId);
      } else {
        return [...prev, transactionId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedTransactions.length === sortedTransactions.length) {
      setSelectedTransactions([]);
    } else {
      setSelectedTransactions(sortedTransactions.map(t => t.id));
    }
  };

  const handleEditTransaction = (transaction) => {
    actions.setEditingTransaction(transaction);
  };

  const handleDeleteTransaction = async (transactionId) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      try {
        await actions.deleteTransaction(transactionId);
        
        // Remove from selected transactions if it was selected
        setSelectedTransactions(prev => prev.filter(id => id !== transactionId));
      } catch (error) {
        console.error('Failed to delete transaction:', error);
        alert('Failed to delete transaction. Please try again.');
      }
    }
  };

  const handleExport = () => {
    if (transactions.length === 0) {
      alert('No transactions to export');
      return;
    }
    setShowExportDialog(true);
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
        <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <button
            onClick={actions.toggleCategoryManager}
            className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors duration-200"
          >
            <SafeIcon icon={FiSettings} className="w-4 h-4 mr-2" />
            Categories
          </button>
          <button
            onClick={() => setShowQuickAdd(true)}
            className="flex items-center px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors duration-200"
          >
            <SafeIcon icon={FiPlus} className="w-4 h-4 mr-2" />
            Add Transaction
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
              showFilters
                ? 'bg-primary-100 text-primary-700 border border-primary-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <SafeIcon icon={FiFilter} className="w-4 h-4 mr-2" />
            Filters
          </button>
          <button 
            onClick={handleExport}
            className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors duration-200"
          >
            <SafeIcon icon={FiDownload} className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2">
        {quickFilters.map((filter, index) => (
          <button
            key={index}
            onClick={() => handleQuickFilter(filter.getValue)}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors duration-200"
          >
            {filter.label}
          </button>
        ))}
        {filters.dateRange && (
          <button
            onClick={() => setFilters(prev => ({ ...prev, dateRange: null }))}
            className="px-3 py-1 text-sm bg-primary-100 text-primary-700 rounded-full"
          >
            Clear Date Filter
          </button>
        )}
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <motion.div
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
          {...animationProps}
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <div className="relative">
                <SafeIcon icon={FiSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={filters.searchText}
                  onChange={(e) => setFilters(prev => ({ ...prev, searchText: e.target.value }))}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">All categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">All types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Person
              </label>
              <select
                value={filters.person}
                onChange={(e) => setFilters(prev => ({ ...prev, person: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">All people</option>
                {people.map((person) => (
                  <option key={person.id} value={person.name}>
                    {person.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </motion.div>
      )}

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Table Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedTransactions.length === sortedTransactions.length && sortedTransactions.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-600">
                  Select all ({sortedTransactions.length})
                </span>
              </label>
              {selectedTransactions.length > 0 && (
                <span className="text-sm text-gray-600">
                  {selectedTransactions.length} selected
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          {/* Desktop Table */}
          <div className="hidden lg:block">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedTransactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className={`hover:bg-gray-50 ${
                      selectedTransactions.includes(transaction.id) ? 'bg-primary-50' : ''
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedTransactions.includes(transaction.id)}
                          onChange={() => handleSelectTransaction(transaction.id)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 mr-3"
                        />
                        <span className="text-sm text-gray-900">
                          {format(new Date(transaction.date), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        transaction.type === 'income'
                          ? 'bg-success-100 text-success-800'
                          : 'bg-danger-100 text-danger-800'
                      }`}>
                        {transaction.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${
                        transaction.type === 'income' ? 'text-success-600' : 'text-danger-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.payee || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {transaction.notes || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <SafeIcon 
                          icon={transaction.status === 'posted' ? FiCheck : FiClock}
                          className={`w-4 h-4 mr-2 ${
                            transaction.status === 'posted' ? 'text-success-500' : 'text-warning-500'
                          }`}
                        />
                        <span className={`text-xs ${
                          transaction.status === 'posted' ? 'text-success-600' : 'text-warning-600'
                        }`}>
                          {transaction.status === 'posted' ? 'Posted' : 'Pending'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => handleEditTransaction(transaction)}
                          className="text-primary-600 hover:text-primary-900 p-1 rounded"
                          title="Edit transaction"
                        >
                          <SafeIcon icon={FiEdit2} className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteTransaction(transaction.id)}
                          className="text-danger-600 hover:text-danger-900 p-1 rounded"
                          title="Delete transaction"
                        >
                          <SafeIcon icon={FiTrash2} className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List */}
          <div className="lg:hidden space-y-4 p-4">
            {sortedTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className={`bg-white border border-gray-200 rounded-lg p-4 ${
                  selectedTransactions.includes(transaction.id) ? 'border-primary-300 bg-primary-50' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedTransactions.includes(transaction.id)}
                      onChange={() => handleSelectTransaction(transaction.id)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 mr-3"
                    />
                    <span className="text-sm font-medium text-gray-900">
                      {format(new Date(transaction.date), 'MMM d, yyyy')}
                    </span>
                  </div>
                  <span className={`text-lg font-bold ${
                    transaction.type === 'income' ? 'text-success-600' : 'text-danger-600'
                  }`}>
                    {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                  </span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Category:</span>
                    <span className="text-sm font-medium">{transaction.category}</span>
                  </div>
                  {transaction.payee && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Payee:</span>
                      <span className="text-sm font-medium">{transaction.payee}</span>
                    </div>
                  )}
                  {transaction.notes && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Notes:</span>
                      <span className="text-sm font-medium truncate ml-2">{transaction.notes}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Status:</span>
                    <div className="flex items-center">
                      <SafeIcon 
                        icon={transaction.status === 'posted' ? FiCheck : FiClock}
                        className={`w-4 h-4 mr-1 ${
                          transaction.status === 'posted' ? 'text-success-500' : 'text-warning-500'
                        }`}
                      />
                      <span className={`text-xs ${
                        transaction.status === 'posted' ? 'text-success-600' : 'text-warning-600'
                      }`}>
                        {transaction.status === 'posted' ? 'Posted' : 'Pending'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 mt-3 pt-3 border-t border-gray-200">
                  <button 
                    onClick={() => handleEditTransaction(transaction)}
                    className="p-2 text-primary-600 hover:bg-primary-100 rounded-lg"
                  >
                    <SafeIcon icon={FiEdit2} className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDeleteTransaction(transaction.id)}
                    className="p-2 text-danger-600 hover:bg-danger-100 rounded-lg"
                  >
                    <SafeIcon icon={FiTrash2} className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Empty State */}
        {sortedTransactions.length === 0 && (
          <div className="text-center py-12">
            <SafeIcon icon={FiPlus} className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
            <p className="text-gray-600 mb-4">
              {Object.values(filters).some(f => f) 
                ? 'Try adjusting your filters or add a new transaction.'
                : 'Get started by adding your first transaction.'
              }
            </p>
            <button
              onClick={() => setShowQuickAdd(true)}
              className="inline-flex items-center px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors duration-200"
            >
              <SafeIcon icon={FiPlus} className="w-4 h-4 mr-2" />
              Add Your First Transaction
            </button>
          </div>
        )}
      </div>

      {/* Sticky Totals Footer */}
      {sortedTransactions.length > 0 && (
        <motion.div
          className="sticky bottom-0 bg-white border-t border-gray-200 shadow-lg rounded-t-lg p-4"
          {...animationProps}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="text-sm text-gray-600">
              {selectedTransactions.length > 0 
                ? `${selectedTransactions.length} selected`
                : `${totals.count} transactions`
              }
            </div>
            <div className="flex flex-wrap items-center gap-6 text-sm">
              <div>
                <span className="text-gray-600">Income: </span>
                <span className="font-semibold text-success-600">
                  {formatCurrency(totals.income)}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Expenses: </span>
                <span className="font-semibold text-danger-600">
                  {formatCurrency(totals.expenses)}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Net: </span>
                <span className={`font-semibold ${
                  totals.net >= 0 ? 'text-success-600' : 'text-danger-600'
                }`}>
                  {formatCurrency(totals.net)}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Average: </span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(totals.average)}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showQuickAdd && (
          <QuickAddForm onClose={() => setShowQuickAdd(false)} />
        )}
        
        {state.ui.editingTransaction && (
          <TransactionEditForm
            transaction={state.ui.editingTransaction}
            onClose={() => actions.setEditingTransaction(null)}
          />
        )}
        
        {state.ui.showCategoryManager && (
          <CategoryManager onClose={actions.toggleCategoryManager} />
        )}

        {showExportDialog && (
          <ExportDialog
            transactions={transactions}
            filters={filters}
            selectedTransactions={selectedTransactions}
            settings={settings}
            onClose={() => setShowExportDialog(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Transactions;