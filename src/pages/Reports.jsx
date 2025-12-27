import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../contexts/AppContext';
import { 
  startOfMonth, 
  endOfMonth, 
  subMonths, 
  format, 
  eachMonthOfInterval,
  isWithinInterval 
} from 'date-fns';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiBarChart3, FiTrendingUp, FiTrendingDown, FiPieChart, FiDownload } = FiIcons;

const Reports = () => {
  const { state } = useApp();
  const { transactions, categories, ui, settings } = state;
  const [dateRange, setDateRange] = useState('last12months');

  // Calculate date range
  const getDateRange = () => {
    const now = new Date();
    switch (dateRange) {
      case 'thismonth':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'last3months':
        return { start: startOfMonth(subMonths(now, 2)), end: endOfMonth(now) };
      case 'last6months':
        return { start: startOfMonth(subMonths(now, 5)), end: endOfMonth(now) };
      case 'last12months':
        return { start: startOfMonth(subMonths(now, 11)), end: endOfMonth(now) };
      default:
        return { start: startOfMonth(subMonths(now, 11)), end: endOfMonth(now) };
    }
  };

  const { start: startDate, end: endDate } = getDateRange();

  // Filter transactions based on view and date range
  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      
      // Date range filter
      if (!isWithinInterval(transactionDate, { start: startDate, end: endDate })) {
        return false;
      }

      // View filter (current vs future)
      const now = new Date();
      if (ui.currentView === 'current') {
        return transaction.status === 'posted' && transactionDate <= now;
      } else {
        return transactionDate > now;
      }
    });
  }, [transactions, startDate, endDate, ui.currentView]);

  // Calculate monthly trends
  const monthlyTrends = useMemo(() => {
    const months = eachMonthOfInterval({ start: startDate, end: endDate });
    
    return months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      const monthTransactions = filteredTransactions.filter(t => {
        const transactionDate = new Date(t.date);
        return isWithinInterval(transactionDate, { start: monthStart, end: monthEnd });
      });

      const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const expenses = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        month: format(month, 'MMM yyyy'),
        income,
        expenses,
        net: income - expenses,
      };
    });
  }, [filteredTransactions, startDate, endDate]);

  // Calculate category breakdown
  const categoryBreakdown = useMemo(() => {
    const categoryTotals = {};
    
    filteredTransactions
      .filter(t => t.type === 'expense')
      .forEach(transaction => {
        if (!categoryTotals[transaction.category]) {
          categoryTotals[transaction.category] = 0;
        }
        categoryTotals[transaction.category] += transaction.amount;
      });

    return Object.entries(categoryTotals)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredTransactions]);

  // Calculate totals
  const totals = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      income,
      expenses,
      net: income - expenses,
      transactions: filteredTransactions.length,
    };
  }, [filteredTransactions]);

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

  return (
    <motion.div className="space-y-6" {...animationProps}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600 mt-1">
            {ui.currentView === 'current' ? 'Historical' : 'Future'} financial insights and trends
          </p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="thismonth">This Month</option>
            <option value="last3months">Last 3 Months</option>
            <option value="last6months">Last 6 Months</option>
            <option value="last12months">Last 12 Months</option>
          </select>
          <button className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors duration-200">
            <SafeIcon icon={FiDownload} className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          {...animationProps}
        >
          <div className="flex items-center">
            <div className="flex items-center justify-center w-12 h-12 bg-success-100 rounded-lg">
              <SafeIcon icon={FiTrendingUp} className="w-6 h-6 text-success-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Income</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(totals.income)}
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
              <p className="text-sm font-medium text-gray-600">Total Expenses</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(totals.expenses)}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          {...animationProps}
        >
          <div className="flex items-center">
            <div className={`flex items-center justify-center w-12 h-12 rounded-lg ${
              totals.net >= 0 ? 'bg-success-100' : 'bg-danger-100'
            }`}>
              <SafeIcon 
                icon={FiBarChart3} 
                className={`w-6 h-6 ${
                  totals.net >= 0 ? 'text-success-600' : 'text-danger-600'
                }`} 
              />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Net Amount</p>
              <p className={`text-2xl font-bold ${
                totals.net >= 0 ? 'text-success-600' : 'text-danger-600'
              }`}>
                {formatCurrency(totals.net)}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          {...animationProps}
        >
          <div className="flex items-center">
            <div className="flex items-center justify-center w-12 h-12 bg-primary-100 rounded-lg">
              <SafeIcon icon={FiBarChart3} className="w-6 h-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Transactions</p>
              <p className="text-2xl font-bold text-gray-900">
                {totals.transactions}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trends */}
        <motion.div
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          {...animationProps}
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Trends</h2>
          <div className="space-y-4">
            {monthlyTrends.map((month, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">{month.month}</span>
                  <span className={`text-sm font-bold ${
                    month.net >= 0 ? 'text-success-600' : 'text-danger-600'
                  }`}>
                    {formatCurrency(month.net)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Income:</span>
                    <span className="text-success-600">{formatCurrency(month.income)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Expenses:</span>
                    <span className="text-danger-600">{formatCurrency(month.expenses)}</span>
                  </div>
                </div>
                {/* Visual bar */}
                <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                  {month.income > 0 && (
                    <div
                      className="absolute left-0 top-0 h-full bg-success-500"
                      style={{ 
                        width: `${Math.min((month.income / Math.max(month.income, month.expenses)) * 50, 50)}%` 
                      }}
                    />
                  )}
                  {month.expenses > 0 && (
                    <div
                      className="absolute right-0 top-0 h-full bg-danger-500"
                      style={{ 
                        width: `${Math.min((month.expenses / Math.max(month.income, month.expenses)) * 50, 50)}%` 
                      }}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Category Breakdown */}
        <motion.div
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          {...animationProps}
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Expense Categories</h2>
          <div className="space-y-3">
            {categoryBreakdown.slice(0, 8).map((category, index) => {
              const percentage = totals.expenses > 0 ? (category.amount / totals.expenses) * 100 : 0;
              
              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">{category.category}</span>
                    <div className="text-right">
                      <span className="text-sm font-bold text-gray-900">
                        {formatCurrency(category.amount)}
                      </span>
                      <div className="text-xs text-gray-500">
                        {percentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 bg-primary-500 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
            
            {categoryBreakdown.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No expense data for the selected period
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Insights */}
      <motion.div
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        {...animationProps}
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Key Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <p className="text-sm text-gray-600">Average Monthly Income</p>
            <p className="text-xl font-bold text-gray-900">
              {formatCurrency(monthlyTrends.length > 0 
                ? monthlyTrends.reduce((sum, m) => sum + m.income, 0) / monthlyTrends.length 
                : 0
              )}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Average Monthly Expenses</p>
            <p className="text-xl font-bold text-gray-900">
              {formatCurrency(monthlyTrends.length > 0 
                ? monthlyTrends.reduce((sum, m) => sum + m.expenses, 0) / monthlyTrends.length 
                : 0
              )}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Highest Expense Category</p>
            <p className="text-xl font-bold text-gray-900">
              {categoryBreakdown.length > 0 ? categoryBreakdown[0].category : 'None'}
            </p>
            {categoryBreakdown.length > 0 && (
              <p className="text-sm text-gray-600">
                {formatCurrency(categoryBreakdown[0].amount)}
              </p>
            )}
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Average Transaction</p>
            <p className="text-xl font-bold text-gray-900">
              {formatCurrency(totals.transactions > 0 
                ? (totals.income + totals.expenses) / totals.transactions 
                : 0
              )}
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Reports;