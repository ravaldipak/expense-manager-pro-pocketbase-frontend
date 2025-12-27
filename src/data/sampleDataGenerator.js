import { format, subDays, addDays, startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns';

// Sample Australian financial data
const sampleCategories = [
  // Income categories
  { name: 'Salary', type: 'income', color: '#10B981', icon: 'briefcase' },
  { name: 'Freelance', type: 'income', color: '#059669', icon: 'laptop' },
  { name: 'Investment Returns', type: 'income', color: '#047857', icon: 'trending-up' },
  { name: 'Rental Income', type: 'income', color: '#065F46', icon: 'home' },
  { name: 'Side Hustle', type: 'income', color: '#064E3B', icon: 'dollar-sign' },
  
  // Expense categories
  { name: 'Rent/Mortgage', type: 'expense', color: '#EF4444', icon: 'home' },
  { name: 'Utilities', type: 'expense', color: '#DC2626', icon: 'zap' },
  { name: 'Internet/Phone', type: 'expense', color: '#B91C1C', icon: 'wifi' },
  { name: 'Council Rates', type: 'expense', color: '#991B1B', icon: 'file-text' },
  { name: 'Groceries', type: 'expense', color: '#F59E0B', icon: 'shopping-cart' },
  { name: 'Dining Out', type: 'expense', color: '#D97706', icon: 'coffee' },
  { name: 'Transport', type: 'expense', color: '#B45309', icon: 'car' },
  { name: 'Fuel', type: 'expense', color: '#92400E', icon: 'truck' },
  { name: 'Healthcare', type: 'expense', color: '#7C2D12', icon: 'heart' },
  { name: 'Insurance', type: 'expense', color: '#8B5CF6', icon: 'shield' },
  { name: 'Entertainment', type: 'expense', color: '#7C3AED', icon: 'music' },
  { name: 'Clothing', type: 'expense', color: '#6D28D9', icon: 'shopping-bag' },
  { name: 'Education', type: 'expense', color: '#5B21B6', icon: 'book' },
  { name: 'Gym/Fitness', type: 'expense', color: '#4C1D95', icon: 'activity' },
  { name: 'Subscriptions', type: 'expense', color: '#3730A3', icon: 'tv' },
];

const samplePeople = [
  { name: 'Sarah Johnson', shortName: 'Sarah', contact: 'sarah.j@email.com', notes: 'Flatmate' },
  { name: 'Mike Chen', shortName: 'Mike', contact: '+61 400 123 456', notes: 'Friend from work' },
  { name: 'Emma Wilson', shortName: 'Emma', contact: 'emma.wilson@email.com', notes: 'Sister' },
  { name: 'David Brown', shortName: 'Dave', contact: '+61 400 789 012', notes: 'Gym buddy' },
  { name: 'Lisa Taylor', shortName: 'Lisa', contact: 'lisa.t@email.com', notes: 'University friend' },
];

const samplePayees = [
  // Groceries
  'Woolworths', 'Coles', 'IGA', 'Aldi', 'Harris Farm Markets',
  
  // Dining
  'McDonald\'s', 'Subway', 'Guzman y Gomez', 'Domino\'s Pizza', 'KFC',
  'Local Cafe', 'Thai Garden', 'Pizza Palace', 'Burger Joint', 'Sushi Train',
  
  // Transport
  'Opal Card', 'Shell', 'BP', '7-Eleven', 'Caltex', 'Uber', 'Taxi',
  
  // Utilities
  'Origin Energy', 'AGL', 'Energy Australia', 'Telstra', 'Optus', 'TPG',
  'Sydney Water', 'Melbourne Water',
  
  // Entertainment
  'Netflix', 'Spotify', 'Stan', 'Disney+', 'Event Cinemas', 'JB Hi-Fi',
  
  // Healthcare
  'Chemist Warehouse', 'Priceline Pharmacy', 'Local GP', 'Dental Care',
  
  // Other
  'Target', 'Kmart', 'Big W', 'Bunnings', 'Harvey Norman', 'Officeworks',
];

// Generate realistic amounts based on category
const getRandomAmount = (category, type) => {
  const ranges = {
    income: {
      'Salary': [4000, 8000],
      'Freelance': [500, 3000],
      'Investment Returns': [100, 1500],
      'Rental Income': [400, 1200],
      'Side Hustle': [200, 800],
    },
    expense: {
      'Rent/Mortgage': [1200, 3000],
      'Utilities': [80, 300],
      'Internet/Phone': [60, 150],
      'Council Rates': [300, 800],
      'Groceries': [80, 250],
      'Dining Out': [15, 120],
      'Transport': [10, 50],
      'Fuel': [40, 120],
      'Healthcare': [30, 200],
      'Insurance': [100, 400],
      'Entertainment': [15, 80],
      'Clothing': [30, 200],
      'Education': [50, 500],
      'Gym/Fitness': [20, 80],
      'Subscriptions': [10, 30],
    }
  };

  const range = ranges[type]?.[category] || [10, 100];
  const min = range[0];
  const max = range[1];
  
  const amount = Math.random() * (max - min) + min;
  return Math.round(amount * 100) / 100; // Round to 2 decimal places
};

// Generate realistic transaction patterns
const getTransactionFrequency = (category) => {
  const frequencies = {
    // Monthly
    'Rent/Mortgage': 30,
    'Utilities': 30,
    'Internet/Phone': 30,
    'Council Rates': 90,
    'Insurance': 30,
    'Gym/Fitness': 30,
    'Salary': 30,
    'Rental Income': 30,
    
    // Weekly
    'Groceries': 7,
    'Fuel': 14,
    
    // Irregular
    'Dining Out': 3,
    'Transport': 2,
    'Healthcare': 45,
    'Entertainment': 10,
    'Clothing': 60,
    'Education': 180,
    'Subscriptions': 30,
    'Freelance': 45,
    'Investment Returns': 90,
    'Side Hustle': 21,
  };
  
  return frequencies[category] || 14;
};

// Generate sample data
export const generateSampleData = (years = 4, includeFuture = true) => {
  const now = new Date();
  const startDate = subDays(now, years * 365 - 365); // 3 years past + 1 year future
  const endDate = includeFuture ? addDays(now, 365) : now;
  
  const data = {
    categories: [...sampleCategories],
    people: [...samplePeople],
    transactions: [],
    budgets: [],
    recurringRules: [],
    ious: [],
  };

  // Generate transactions
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    // Generate transactions for this day
    sampleCategories.forEach((category, categoryIndex) => {
      const frequency = getTransactionFrequency(category.name);
      
      // Check if we should generate a transaction for this category today
      if (Math.random() < (1 / frequency)) {
        const amount = getRandomAmount(category.name, category.type);
        const payee = samplePayees[Math.floor(Math.random() * samplePayees.length)];
        
        // Sometimes add a person (for shared expenses)
        const person = Math.random() < 0.15 ? samplePeople[Math.floor(Math.random() * samplePeople.length)].name : null;
        
        // Generate notes occasionally
        const notes = Math.random() < 0.3 ? generateNotes(category.name) : '';
        
        // Future transactions are marked as pending
        const status = currentDate > now ? 'pending' : 'posted';
        
        data.transactions.push({
          date: format(currentDate, 'yyyy-MM-dd'),
          type: category.type,
          amount,
          category: category.name,
          payee,
          notes,
          tags: [],
          account: 'Everyday Account',
          person,
          status,
          isSample: true,
        });
      }
    });
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Generate budgets
  const expenseCategories = sampleCategories.filter(c => c.type === 'expense');
  expenseCategories.forEach((category) => {
    // Create budgets for major expense categories
    if (['Groceries', 'Dining Out', 'Transport', 'Entertainment', 'Clothing'].includes(category.name)) {
      const monthlyAmount = getRandomAmount(category.name, 'expense') * 4; // Weekly amount * 4
      
      data.budgets.push({
        category: category.name,
        amount: monthlyAmount,
        period: 'monthly',
        notes: `Monthly budget for ${category.name}`,
        isSample: true,
      });
    }
  });

  // Generate recurring rules
  const recurringCategories = [
    { name: 'Salary', frequency: 'monthly', amount: 5500 },
    { name: 'Rent/Mortgage', frequency: 'monthly', amount: 1800 },
    { name: 'Internet/Phone', frequency: 'monthly', amount: 89 },
    { name: 'Gym/Fitness', frequency: 'monthly', amount: 65 },
    { name: 'Netflix Subscription', frequency: 'monthly', amount: 16.99, category: 'Subscriptions' },
    { name: 'Spotify Premium', frequency: 'monthly', amount: 11.99, category: 'Subscriptions' },
  ];

  recurringCategories.forEach((rule, index) => {
    data.recurringRules.push({
      name: rule.name,
      type: rule.name === 'Salary' ? 'income' : 'expense',
      amount: rule.amount,
      category: rule.category || rule.name,
      frequency: rule.frequency,
      startDate: format(subMonths(now, 6), 'yyyy-MM-dd'),
      endDate: null,
      coverage: getFrequencyDays(rule.frequency),
      notes: `Recurring ${rule.name}`,
      person: null,
      isSample: true,
    });
  });

  // Generate some IOUs
  samplePeople.forEach((person, index) => {
    if (Math.random() < 0.6) { // 60% chance of having IOUs
      const numIOUs = Math.floor(Math.random() * 3) + 1;
      
      for (let i = 0; i < numIOUs; i++) {
        const amount = Math.random() * 200 + 20; // $20-$220
        const typeOptions = ['you_lent', 'you_borrowed', 'repayment_received', 'repayment_made'];
        const type = typeOptions[Math.floor(Math.random() * typeOptions.length)];
        const daysAgo = Math.floor(Math.random() * 60) + 1;
        
        data.ious.push({
          personId: index + 1, // This will be updated after people are added
          date: format(subDays(now, daysAgo), 'yyyy-MM-dd'),
          type,
          amount: Math.round(amount * 100) / 100,
          notes: generateIOUNotes(type),
          linkedTransactionId: null,
          isSample: true,
        });
      }
    }
  });

  return data;
};

// Helper functions
const generateNotes = (category) => {
  const noteTemplates = {
    'Groceries': ['Weekly shopping', 'Quick grocery run', 'Stocking up', 'Fresh produce'],
    'Dining Out': ['Lunch with colleagues', 'Date night', 'Quick bite', 'Birthday dinner'],
    'Transport': ['Daily commute', 'Weekend trip', 'Airport transfer', 'Taxi home'],
    'Entertainment': ['Movie night', 'Concert tickets', 'Weekend fun', 'New game'],
    'Healthcare': ['Regular checkup', 'Prescription refill', 'Dental cleaning', 'Eye test'],
    'Clothing': ['Work clothes', 'Winter gear', 'New shoes', 'Casual wear'],
  };
  
  const templates = noteTemplates[category] || ['Miscellaneous expense'];
  return templates[Math.floor(Math.random() * templates.length)];
};

const generateIOUNotes = (type) => {
  const templates = {
    you_lent: ['Lent for coffee', 'Helped with rent', 'Concert tickets', 'Lunch money'],
    you_borrowed: ['Borrowed for groceries', 'Emergency cash', 'Dinner split', 'Uber fare'],
    repayment_received: ['Received payment for dinner', 'Got money back', 'Repayment for loan'],
    repayment_made: ['Paid back for groceries', 'Settled debt', 'Returned borrowed money'],
  };
  
  const options = templates[type] || ['Money exchange'];
  return options[Math.floor(Math.random() * options.length)];
};

const getFrequencyDays = (frequency) => {
  const days = {
    daily: 1,
    weekly: 7,
    fortnightly: 14,
    monthly: 30,
    quarterly: 90,
    yearly: 365,
  };
  
  return days[frequency] || 30;
};

export default generateSampleData;