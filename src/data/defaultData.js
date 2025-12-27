export const defaultCategories = [
  // Income categories
  { name: 'Salary', type: 'income', color: '#10b981', icon: 'Briefcase' },
  { name: 'Freelance', type: 'income', color: '#3b82f6', icon: 'User' },
  { name: 'Investment', type: 'income', color: '#8b5cf6', icon: 'TrendingUp' },
  { name: 'Other Income', type: 'income', color: '#06b6d4', icon: 'Plus' },

  // Expense categories
  { name: 'Groceries', type: 'expense', color: '#ef4444', icon: 'ShoppingCart' },
  { name: 'Dining Out', type: 'expense', color: '#f97316', icon: 'Coffee' },
  { name: 'Transport', type: 'expense', color: '#eab308', icon: 'Car' },
  { name: 'Utilities', type: 'expense', color: '#22c55e', icon: 'Zap' },
  { name: 'Entertainment', type: 'expense', color: '#a855f7', icon: 'Music' },
  { name: 'Healthcare', type: 'expense', color: '#ec4899', icon: 'Heart' },
  { name: 'Shopping', type: 'expense', color: '#14b8a6', icon: 'ShoppingBag' },
  { name: 'Education', type: 'expense', color: '#3b82f6', icon: 'BookOpen' },
  { name: 'Insurance', type: 'expense', color: '#6366f1', icon: 'Shield' },
  { name: 'Other Expense', type: 'expense', color: '#64748b', icon: 'Minus' },
];

export const sampleTransactions = [
  {
    date: '2024-01-15',
    type: 'income',
    amount: 5000,
    category: 'Salary',
    payee: 'Company Ltd',
    notes: 'Monthly salary',
    status: 'posted',
    isSample: true,
  },
  {
    date: '2024-01-16',
    type: 'expense',
    amount: 150,
    category: 'Groceries',
    payee: 'Supermarket',
    notes: 'Weekly shopping',
    status: 'posted',
    isSample: true,
  },
  {
    date: '2024-01-17',
    type: 'expense',
    amount: 45,
    category: 'Dining Out',
    payee: 'Restaurant',
    notes: 'Lunch with colleagues',
    status: 'posted',
    isSample: true,
  },
];

export const sampleBudgets = [
  {
    category: 'Groceries',
    amount: 600,
    period: 'monthly',
    notes: 'Monthly grocery budget',
    isSample: true,
  },
  {
    category: 'Dining Out',
    amount: 200,
    period: 'monthly',
    notes: 'Eating out budget',
    isSample: true,
  },
  {
    category: 'Transport',
    amount: 300,
    period: 'monthly',
    notes: 'Transportation costs',
    isSample: true,
  },
];

export const samplePeople = [
  {
    name: 'John Smith',
    shortName: 'John',
    contact: 'john@example.com',
    notes: 'Colleague',
    balance: 0,
    isSample: true,
  },
  {
    name: 'Sarah Johnson',
    shortName: 'Sarah',
    contact: '+61 400 000 000',
    notes: 'Friend',
    balance: 0,
    isSample: true,
  },
];