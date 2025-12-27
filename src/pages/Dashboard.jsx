import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../contexts/AppContext';
import { startOfMonth, endOfMonth, subMonths, format, isAfter, isBefore } from 'date-fns';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const {
  FiTrendingUp,
  FiTrendingDown,
  FiDollarSign,
  FiCalendar,
  FiTarget,
  FiPieChart,
} = FiIcons;

const Dashboard = () => {
  const { state } = useApp();
  const { transactions, budgets, ui, settings } = state;

  // Print each budget with its category name for debugging
  if (state.categories && budgets) {
    budgets.forEach(budget => {
      const categoryObj = state.categories.find(c => c.id === budget.category);
      const categoryName = categoryObj ? categoryObj.name : budget.category;
      budget.categoryname = categoryName;
    });
  }
  // Filter transactions based on current view and date range
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const startOfCurrentMonth = startOfMonth(now);
    const endOfCurrentMonth = endOfMonth(now);

    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      if (ui.currentView === 'current') {
        // Show only posted transactions up to today
        return transaction.status === 'posted' && !isAfter(transactionDate, now);
      } else {
        // Future view - show all future transactions (from tomorrow onwards)
        return isAfter(transactionDate, now);
      }
    });
  }, [transactions, ui.currentView]);

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
    };
  }, [filteredTransactions]);

  // Calculate daily analytics
  const dailyAnalytics = useMemo(() => {
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysPassed = now.getDate();
    const daysRemaining = daysInMonth - daysPassed;

    const monthlyExpenses = transactions
      .filter(t => {
        const transactionDate = new Date(t.date);
        return t.type === 'expense' && 
               t.status === 'posted' &&
               transactionDate.getMonth() === now.getMonth() &&
               transactionDate.getFullYear() === now.getFullYear() &&
               !isAfter(transactionDate, now);
      })
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlyIncome = transactions
      .filter(t => {
        const transactionDate = new Date(t.date);
        return t.type === 'income' && 
               t.status === 'posted' &&
               transactionDate.getMonth() === now.getMonth() &&
               transactionDate.getFullYear() === now.getFullYear() &&
               !isAfter(transactionDate, now);
      })
      .reduce((sum, t) => sum + t.amount, 0);

    const dailyLivingCost = daysPassed > 0 ? monthlyExpenses / daysPassed : 0;
    const dailyIncome = daysPassed > 0 ? monthlyIncome / daysPassed : 0;
    const projectedMonthEnd = monthlyExpenses + (dailyLivingCost * daysRemaining);
    
    // Calculate total budget for the month
    const totalBudget = budgets.reduce((sum, budget) => {
      if (budget.period === 'monthly') {
        return sum + budget.amount;
      } else if (budget.period === 'yearly') {
        return sum + (budget.amount / 12);
      } else if (budget.period === 'quarterly') {
        return sum + (budget.amount / 3);
      }
      return sum;
    }, 0);

    const safeToSpend = Math.max(0, totalBudget - monthlyExpenses);

    return {
      dailyLivingCost,
      dailyIncome,
      netPerDay: dailyIncome - dailyLivingCost,
      projectedMonthEnd,
      safeToSpend,
    };
  }, [transactions, budgets]);

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
          <h1 className="text-2xl font-bold text-gray-900">
            {ui.currentView === 'current' ? 'Current Overview' : 'Future Projection'}
          </h1>
          <p className="text-gray-600">
            As of {format(new Date(), 'EEEE, MMMM d, yyyy • h:mm a')}
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          {...animationProps}
        >
          <div className="flex items-center">
            <div className="flex items-center justify-center w-12 h-12 bg-success-100 rounded-lg">
              <SafeIcon icon={FiTrendingUp} className="w-6 h-6 text-success-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                {ui.currentView === 'current' ? 'Total Income' : 'Future Income'}
              </p>
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
              <p className="text-sm font-medium text-gray-600">
                {ui.currentView === 'current' ? 'Total Expenses' : 'Future Expenses'}
              </p>
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
                icon={FiDollarSign} 
                className={`w-6 h-6 ${
                  totals.net >= 0 ? 'text-success-600' : 'text-danger-600'
                }`} 
              />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                {ui.currentView === 'current' ? 'Net Amount' : 'Future Net'}
              </p>
              <p className={`text-2xl font-bold ${
                totals.net >= 0 ? 'text-success-600' : 'text-danger-600'
              }`}>
                {formatCurrency(totals.net)}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Daily Analytics (only in current view) */}
      {ui.currentView === 'current' && (
        <motion.div
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          {...animationProps}
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Daily Analytics</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Daily Living Cost</p>
              <p className="text-xl font-bold text-gray-900">
                {formatCurrency(dailyAnalytics.dailyLivingCost)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Daily Income</p>
              <p className="text-xl font-bold text-gray-900">
                {formatCurrency(dailyAnalytics.dailyIncome)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Net Per Day</p>
              <p className={`text-xl font-bold ${
                dailyAnalytics.netPerDay >= 0 ? 'text-success-600' : 'text-danger-600'
              }`}>
                {formatCurrency(dailyAnalytics.netPerDay)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Projected Month-End</p>
              <p className="text-xl font-bold text-gray-900">
                {formatCurrency(dailyAnalytics.projectedMonthEnd)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Safe to Spend</p>
              <p className="text-xl font-bold text-success-600">
                {formatCurrency(dailyAnalytics.safeToSpend)}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          {...animationProps}
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Mini Insights</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Transactions this month</span>
              <span className="font-medium">{filteredTransactions.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Average transaction</span>
              <span className="font-medium">
                {filteredTransactions.length > 0 
                  ? formatCurrency(totals.expenses / filteredTransactions.filter(t => t.type === 'expense').length || 0)
                  : formatCurrency(0)
                }
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Largest expense</span>
              <span className="font-medium">
                {formatCurrency(Math.max(...filteredTransactions.filter(t => t.type === 'expense').map(t => t.amount), 0))}
              </span>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          {...animationProps}
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Budget Overview</h2>
          <div className="space-y-3">
            {budgets.slice(0, 3).map((budget) => {
              const spent = filteredTransactions
                .filter(t => t.type === 'expense' && t.category === budget.categoryname)
                .reduce((sum, t) => sum + t.amount, 0);
              
              const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
              
              return (
                <div key={budget.id}>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{budget.categoryname}</span>
                    <span className="font-medium">
                      {formatCurrency(spent)} / {formatCurrency(budget.amount)}
                    </span>
                  </div>
                  <div className="mt-1 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        percentage > 100 ? 'bg-danger-500' : 
                        percentage > 80 ? 'bg-warning-500' : 'bg-success-500'
                      }`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Recent Transactions */}
      <motion.div
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        {...animationProps}
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Recent {ui.currentView === 'current' ? 'Transactions' : 'Upcoming Transactions'}
        </h2>
        <div className="space-y-3">
          {filteredTransactions.slice(0, 5).map((transaction) => (
            <div key={transaction.id} className="flex items-center justify-between py-2">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  transaction.type === 'income' ? 'bg-success-100' : 'bg-danger-100'
                }`}>
                  <SafeIcon 
                    icon={transaction.type === 'income' ? FiTrendingUp : FiTrendingDown}
                    className={`w-4 h-4 ${
                      transaction.type === 'income' ? 'text-success-600' : 'text-danger-600'
                    }`}
                  />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{transaction.category}</p>
                  <p className="text-sm text-gray-600">
                    {format(new Date(transaction.date), 'MMM d')} • {transaction.payee || 'No payee'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-semibold ${
                  transaction.type === 'income' ? 'text-success-600' : 'text-danger-600'
                }`}>
                  {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                </p>
                {transaction.status === 'pending' && (
                  <p className="text-xs text-warning-600">Pending</p>
                )}
              </div>
            </div>
          ))}
          
          {filteredTransactions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No {ui.currentView === 'current' ? 'transactions' : 'upcoming transactions'} found
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;