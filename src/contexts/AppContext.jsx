import React, { createContext, useContext, useEffect, useReducer, useRef } from 'react';
import { settingsService } from '../services/settingsService';
import budgetService from '../services/budgetService';
import { recurringService } from '../services/recurringService';
import transactionService from '../services/transactionService';
import peopleService from '../services/peopleService';
import { pb } from './PocketBase';

const AppContext = createContext();

const initialState = {
  isLoading: true,
  settings: {
    currency: 'AUD',
    financialYearStart: '07-01',
    importantCategories: [],
    dateFormat: 'system',
    reducedMotion: false,
    autoBackup: false,
    lastBackup: null,
    backupFolder: null,
  },
  transactions: [],
  categories: [],
  budgets: [],
  people: [],
  recurringRules: [],
  ious: [],
  filters: {
    dateRange: null,
    categories: [],
    accounts: [],
    people: [],
    searchText: '',
  },
  ui: {
    showSplash: true,
    sidebarOpen: false,
    currentView: 'current',
    selectedTransactions: [],
    editingTransaction: null,
    showCategoryManager: false,
  },
};

function appReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };
    case 'SET_TRANSACTIONS':
      return { ...state, transactions: action.payload };
    case 'ADD_TRANSACTION':
      return { ...state, transactions: [...state.transactions, action.payload] };
    case 'UPDATE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.map(t =>
          t.id === action.payload.id ? action.payload : t
        ),
      };
    case 'DELETE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.filter(t => t.id !== action.payload),
      };
    case 'SET_CATEGORIES':
      return { ...state, categories: action.payload };
    case 'ADD_CATEGORY':
      return { ...state, categories: [...state.categories, action.payload] };
    case 'UPDATE_CATEGORY':
      return {
        ...state,
        categories: state.categories.map(c =>
          c.id === action.payload.id ? action.payload : c
        ),
      };
    case 'DELETE_CATEGORY':
      return {
        ...state,
        categories: state.categories.filter(c => c.id !== action.payload),
      };
    case 'SET_BUDGETS':
      return { ...state, budgets: action.payload };
    case 'ADD_BUDGET':
      return { ...state, budgets: [...state.budgets, action.payload] };
    case 'UPDATE_BUDGET':
      return {
        ...state,
        budgets: state.budgets.map(b =>
          b.id === action.payload.id ? action.payload : b
        ),
      };
    case 'DELETE_BUDGET':
      return {
        ...state,
        budgets: state.budgets.filter(b => b.id !== action.payload),
      };
    case 'SET_PEOPLE':
      return { ...state, people: action.payload };
    case 'ADD_PERSON':
      return { ...state, people: [...state.people, action.payload] };
    case 'UPDATE_PERSON':
      return {
        ...state,
        people: state.people.map(p =>
          p.id === action.payload.id ? action.payload : p
        ),
      };
    case 'DELETE_PERSON':
      return {
        ...state,
        people: state.people.filter(p => p.id !== action.payload),
      };
    case 'SET_RECURRING_RULES':
      return { ...state, recurringRules: action.payload };
    case 'ADD_RECURRING_RULE':
      return { ...state, recurringRules: [...state.recurringRules, action.payload] };
    case 'UPDATE_RECURRING_RULE':
      return {
        ...state,
        recurringRules: state.recurringRules.map(r =>
          r.id === action.payload.id ? action.payload : r
        ),
      };
    case 'DELETE_RECURRING_RULE':
      return {
        ...state,
        recurringRules: state.recurringRules.filter(r => r.id !== action.payload),
      };
    case 'SET_IOUS':
      return { ...state, ious: action.payload };
    case 'ADD_IOU':
      return { ...state, ious: [...state.ious, action.payload] };
    case 'SET_FILTERS':
      return { ...state, filters: { ...state.filters, ...action.payload } };
    case 'SET_UI':
      return { ...state, ui: { ...state.ui, ...action.payload } };
    case 'SET_EDITING_TRANSACTION':
      return { ...state, ui: { ...state.ui, editingTransaction: action.payload } };
    case 'TOGGLE_CATEGORY_MANAGER':
      return { ...state, ui: { ...state.ui, showCategoryManager: !state.ui.showCategoryManager } };
    case 'HIDE_SPLASH':
      return { ...state, ui: { ...state.ui, showSplash: false } };
    case 'TOGGLE_SIDEBAR':
      return { ...state, ui: { ...state.ui, sidebarOpen: !state.ui.sidebarOpen } };
    case 'TOGGLE_VIEW':
      return {
        ...state,
        ui: {
          ...state.ui,
          currentView: state.ui.currentView === 'current' ? 'future' : 'current',
        },
      };
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const isInitializingRef = useRef(false);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    // Prevent multiple concurrent initializations
    if (isInitializingRef.current) {
      return;
    }
    
    isInitializingRef.current = true;
    
    try {
      // Check for reduced motion preference
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      
      dispatch({
        type: 'SET_SETTINGS',
        payload: { reducedMotion: prefersReducedMotion },
      });

      // Initialize PocketBase connection
      if (!pb.authStore.isValid) {
        console.warn('User not authenticated, some features may be limited');
      }
      
      // Load settings
      // const settings = await settingsService.getSettings();
      // dispatch({ type: 'SET_SETTINGS', payload: settings });

      // Load all data
      await loadData();

      // Hide splash after data is loaded
      setTimeout(() => {
        dispatch({ type: 'HIDE_SPLASH' });
        dispatch({ type: 'SET_LOADING', payload: false });
      }, 1500);
    } catch (error) {
      console.error('Failed to initialize app:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
      dispatch({ type: 'HIDE_SPLASH' });
    } finally {
      isInitializingRef.current = false;
    }
  };

  const loadData = async () => {
    try {
      // Load data from PocketBase services
      const [categories, people, transactions, budgets, recurringRules] = await Promise.all([
        pb.collection('categories').getFullList().catch(() => []),
        peopleService.getPeople().catch(() => []),
        transactionService.getTransactions().catch(() => []),
        budgetService.getBudgets().catch(() => []),
        recurringService.getRecurringRules().catch(() => [])
      ]);

      dispatch({ type: 'SET_TRANSACTIONS', payload: transactions });
      dispatch({ type: 'SET_CATEGORIES', payload: categories });
      dispatch({ type: 'SET_BUDGETS', payload: budgets });
      dispatch({ type: 'SET_PEOPLE', payload: people });
      dispatch({ type: 'SET_RECURRING_RULES', payload: recurringRules });
      dispatch({ type: 'SET_IOUS', payload: [] }); // IOUs will be handled by PocketBase in future
    } catch (error) {
      console.error('Failed to load data:', error);
      throw error;
    }
  };

  const value = {
    state,
    dispatch,
    actions: {
      loadData,
      hideSplash: () => dispatch({ type: 'HIDE_SPLASH' }),
      toggleSidebar: () => dispatch({ type: 'TOGGLE_SIDEBAR' }),
      toggleView: () => dispatch({ type: 'TOGGLE_VIEW' }),
      setFilters: (filters) => dispatch({ type: 'SET_FILTERS', payload: filters }),
      addTransaction: async (transactionData) => {
        const transaction = await transactionService.createTransaction(transactionData);
        dispatch({ type: 'ADD_TRANSACTION', payload: transaction });
        return transaction;
      },
      updateTransaction: async (transactionId, updates) => {
        const transaction = await transactionService.updateTransaction(transactionId, updates);
        dispatch({ type: 'UPDATE_TRANSACTION', payload: transaction });
        return transaction;
      },
      deleteTransaction: async (transactionId) => {
        await transactionService.deleteTransaction(transactionId);
        dispatch({ type: 'DELETE_TRANSACTION', payload: transactionId });
        return true;
      },
      setEditingTransaction: (transaction) => dispatch({ type: 'SET_EDITING_TRANSACTION', payload: transaction }),
      addCategory: (category) => dispatch({ type: 'ADD_CATEGORY', payload: category }),
      updateCategory: (category) => dispatch({ type: 'UPDATE_CATEGORY', payload: category }),
      deleteCategory: (id) => dispatch({ type: 'DELETE_CATEGORY', payload: id }),
      toggleCategoryManager: () => dispatch({ type: 'TOGGLE_CATEGORY_MANAGER' }),
      addBudget: async (budgetData) => {
        const budget = await budgetService.createBudget(budgetData);
        dispatch({ type: 'ADD_BUDGET', payload: budget });
        return budget;
      },
      updateBudget: async (budgetId, updates) => {
        const budget = await budgetService.updateBudget(budgetId, updates);
        dispatch({ type: 'UPDATE_BUDGET', payload: budget });
        return budget;
      },
      deleteBudget: async (budgetId) => {
        await budgetService.deleteBudget(budgetId);
        dispatch({ type: 'DELETE_BUDGET', payload: budgetId });
        return true;
      },
      addPerson: async (person) => {
        const newPerson = await peopleService.createPerson(person);
        dispatch({ type: 'ADD_PERSON', payload: newPerson });
        return newPerson;
      },
      updatePerson: async (personId, updates) => {
        const updatedPerson = await peopleService.updatePerson(personId, updates);
        dispatch({ type: 'UPDATE_PERSON', payload: updatedPerson });
        return updatedPerson;
      },
      deletePerson: async (personId) => {
        await peopleService.deletePerson(personId);
        dispatch({ type: 'DELETE_PERSON', payload: personId });
        return true;
      },
      addRecurringRule: async (rule) => {
        const newRule = await recurringService.addRecurringRule(rule);
        dispatch({ type: 'ADD_RECURRING_RULE', payload: newRule });
        return newRule;
      },
      updateRecurringRule: async (id, updates) => {
        const updatedRule = await recurringService.updateRecurringRule(id, updates);
        dispatch({ type: 'UPDATE_RECURRING_RULE', payload: updatedRule });
        return updatedRule;
      },
      deleteRecurringRule: async (id) => {
        await recurringService.deleteRecurringRule(id);
        dispatch({ type: 'DELETE_RECURRING_RULE', payload: id });
        return true;
      },
      addIOU: (iou) => dispatch({ type: 'ADD_IOU', payload: iou }),
    },
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};