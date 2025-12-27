import { openDB } from 'idb';
import { defaultCategories } from '../data/defaultData';

const DB_NAME = 'ExpenseManagerPro';
const DB_VERSION = 1;

class DatabaseService {
  constructor() {
    this.db = null;
  }

  async init() {
    if (this.db) return this.db;

    this.db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Categories store
        if (!db.objectStoreNames.contains('categories')) {
          const categoriesStore = db.createObjectStore('categories', {
            keyPath: 'id',
            autoIncrement: true,
          });
          categoriesStore.createIndex('name', 'name');
          categoriesStore.createIndex('type', 'type');
        }

        // Transactions store
        if (!db.objectStoreNames.contains('transactions')) {
          const transactionsStore = db.createObjectStore('transactions', {
            keyPath: 'id',
            autoIncrement: true,
          });
          transactionsStore.createIndex('date', 'date');
          transactionsStore.createIndex('category', 'category');
          transactionsStore.createIndex('type', 'type');
          transactionsStore.createIndex('person', 'person');
        }

        // Budgets store
        if (!db.objectStoreNames.contains('budgets')) {
          const budgetsStore = db.createObjectStore('budgets', {
            keyPath: 'id',
            autoIncrement: true,
          });
          budgetsStore.createIndex('category', 'category');
        }

        // People store
        if (!db.objectStoreNames.contains('people')) {
          const peopleStore = db.createObjectStore('people', {
            keyPath: 'id',
            autoIncrement: true,
          });
          peopleStore.createIndex('name', 'name');
        }

        // IOUs store
        if (!db.objectStoreNames.contains('ious')) {
          const iousStore = db.createObjectStore('ious', {
            keyPath: 'id',
            autoIncrement: true,
          });
          iousStore.createIndex('personId', 'personId');
          iousStore.createIndex('date', 'date');
        }

        // Recurring Rules store
        if (!db.objectStoreNames.contains('recurringRules')) {
          const recurringStore = db.createObjectStore('recurringRules', {
            keyPath: 'id',
            autoIncrement: true,
          });
          recurringStore.createIndex('name', 'name');
          recurringStore.createIndex('category', 'category');
        }

        // Settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', {
            keyPath: 'key',
          });
        }
      },
    });

    // Initialize with default data if empty
    await this.initializeDefaults();

    return this.db;
  }

  async initializeDefaults() {
    const categories = await this.getCategories();
    if (categories.length === 0) {
      for (const category of defaultCategories) {
        await this.addCategory(category);
      }
    }
  }

  // Categories
  async getCategories() {
    const db = await this.init();
    return db.getAll('categories');
  }

  async addCategory(category) {
    const db = await this.init();
    // Remove id field if it exists (IndexedDB will auto-generate)
    const { id, ...categoryData } = category;
    const categoryWithTimestamp = {
      ...categoryData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return db.add('categories', categoryWithTimestamp);
  }

  async updateCategory(id, updates) {
    const db = await this.init();
    const category = await db.get('categories', id);
    if (category) {
      const updatedCategory = {
        ...category,
        ...updates,
        updatedAt: new Date(),
      };
      await db.put('categories', updatedCategory);
      return updatedCategory;
    }
    return null;
  }

  async deleteCategory(id) {
    const db = await this.init();
    return db.delete('categories', id);
  }

  // Transactions
  async getTransactions() {
    const db = await this.init();
    return db.getAll('transactions');
  }

  async addTransaction(transaction) {
    const db = await this.init();
    console.log('Adding transaction:', transaction);
    
    // Remove id field if it exists (IndexedDB will auto-generate)
    const { id, ...transactionData } = transaction;
    const transactionWithTimestamp = {
      ...transactionData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    console.log('Transaction data to add:', transactionWithTimestamp);
    const result = await db.add('transactions', transactionWithTimestamp);
    console.log('Transaction added with ID:', result);
    return result;
  }

  async updateTransaction(id, updates) {
    const db = await this.init();
    console.log('Updating transaction:', id, updates);
    
    const transaction = await db.get('transactions', id);
    if (transaction) {
      const updatedTransaction = {
        ...transaction,
        ...updates,
        updatedAt: new Date(),
      };
      await db.put('transactions', updatedTransaction);
      console.log('Transaction updated:', updatedTransaction);
      return updatedTransaction;
    }
    return null;
  }

  async deleteTransaction(id) {
    const db = await this.init();
    console.log('Deleting transaction:', id);
    return db.delete('transactions', id);
  }

  // Budgets
  async getBudgets() {
    const db = await this.init();
    return db.getAll('budgets');
  }

  async addBudget(budget) {
    const db = await this.init();
    // Remove id field if it exists (IndexedDB will auto-generate)
    const { id, ...budgetData } = budget;
    const budgetWithTimestamp = {
      ...budgetData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return db.add('budgets', budgetWithTimestamp);
  }

  async updateBudget(id, updates) {
    const db = await this.init();
    const budget = await db.get('budgets', id);
    if (budget) {
      const updatedBudget = {
        ...budget,
        ...updates,
        updatedAt: new Date(),
      };
      await db.put('budgets', updatedBudget);
      return updatedBudget;
    }
    return null;
  }

  async deleteBudget(id) {
    const db = await this.init();
    return db.delete('budgets', id);
  }

  // People
  async getPeople() {
    const db = await this.init();
    return db.getAll('people');
  }

  async addPerson(person) {
    const db = await this.init();
    // Remove id field if it exists (IndexedDB will auto-generate)
    const { id, ...personData } = person;
    const personWithTimestamp = {
      ...personData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return db.add('people', personWithTimestamp);
  }

  async updatePerson(id, updates) {
    const db = await this.init();
    const person = await db.get('people', id);
    if (person) {
      const updatedPerson = {
        ...person,
        ...updates,
        updatedAt: new Date(),
      };
      await db.put('people', updatedPerson);
      return updatedPerson;
    }
    return null;
  }

  async deletePerson(id) {
    const db = await this.init();
    return db.delete('people', id);
  }

  // IOUs
  async getIOUs() {
    const db = await this.init();
    return db.getAll('ious');
  }

  async addIOU(iou) {
    const db = await this.init();
    // Remove id field if it exists (IndexedDB will auto-generate)
    const { id, ...iouData } = iou;
    const iouWithTimestamp = {
      ...iouData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return db.add('ious', iouWithTimestamp);
  }

  async updateIOU(id, updates) {
    const db = await this.init();
    const iou = await db.get('ious', id);
    if (iou) {
      const updatedIOU = {
        ...iou,
        ...updates,
        updatedAt: new Date(),
      };
      await db.put('ious', updatedIOU);
      return updatedIOU;
    }
    return null;
  }

  async deleteIOU(id) {
    const db = await this.init();
    return db.delete('ious', id);
  }

  // Recurring Rules
  async getRecurringRules() {
    const db = await this.init();
    return db.getAll('recurringRules');
  }

  async addRecurringRule(rule) {
    const db = await this.init();
    // Remove id field if it exists (IndexedDB will auto-generate)
    const { id, ...ruleData } = rule;
    const ruleWithTimestamp = {
      ...ruleData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return db.add('recurringRules', ruleWithTimestamp);
  }

  async updateRecurringRule(id, updates) {
    const db = await this.init();
    const rule = await db.get('recurringRules', id);
    if (rule) {
      const updatedRule = {
        ...rule,
        ...updates,
        updatedAt: new Date(),
      };
      await db.put('recurringRules', updatedRule);
      return updatedRule;
    }
    return null;
  }

  async deleteRecurringRule(id) {
    const db = await this.init();
    return db.delete('recurringRules', id);
  }

  // Settings
  async getSetting(key) {
    const db = await this.init();
    const setting = await db.get('settings', key);
    return setting?.value;
  }

  async setSetting(key, value) {
    const db = await this.init();
    return db.put('settings', { key, value });
  }

  // Data management
  async exportData() {
    const [
      categories,
      transactions,
      budgets,
      people,
      ious,
      recurringRules,
      settings,
    ] = await Promise.all([
      this.getCategories(),
      this.getTransactions(),
      this.getBudgets(),
      this.getPeople(),
      this.getIOUs(),
      this.getRecurringRules(),
      this.getAllSettings(),
    ]);

    return {
      version: '2.0.0',
      exportDate: new Date().toISOString(),
      data: {
        categories,
        transactions,
        budgets,
        people,
        ious,
        recurringRules,
        settings,
      },
    };
  }

  async importData(backupData) {
    const db = await this.init();
    
    if (!backupData.data) {
      throw new Error('Invalid backup format');
    }

    const { data } = backupData;

    // Clear existing data
    await this.clearAllData();

    // Import data
    const tx = db.transaction([
      'categories',
      'transactions',
      'budgets',
      'people',
      'ious',
      'recurringRules',
      'settings',
    ], 'readwrite');

    // Import each data type
    if (data.categories) {
      for (const item of data.categories) {
        const { id, ...itemData } = item; // Remove id field
        await tx.objectStore('categories').add(itemData);
      }
    }

    if (data.transactions) {
      for (const item of data.transactions) {
        const { id, ...itemData } = item; // Remove id field
        await tx.objectStore('transactions').add(itemData);
      }
    }

    if (data.budgets) {
      for (const item of data.budgets) {
        const { id, ...itemData } = item; // Remove id field
        await tx.objectStore('budgets').add(itemData);
      }
    }

    if (data.people) {
      for (const item of data.people) {
        const { id, ...itemData } = item; // Remove id field
        await tx.objectStore('people').add(itemData);
      }
    }

    if (data.ious) {
      for (const item of data.ious) {
        const { id, ...itemData } = item; // Remove id field
        await tx.objectStore('ious').add(itemData);
      }
    }

    if (data.recurringRules) {
      for (const item of data.recurringRules) {
        const { id, ...itemData } = item; // Remove id field
        await tx.objectStore('recurringRules').add(itemData);
      }
    }

    if (data.settings) {
      for (const item of data.settings) {
        await tx.objectStore('settings').add(item);
      }
    }

    await tx.done;
  }

  async clearAllData() {
    const db = await this.init();
    const tx = db.transaction([
      'categories',
      'transactions',
      'budgets',
      'people',
      'ious',
      'recurringRules',
      'settings',
    ], 'readwrite');

    await Promise.all([
      tx.objectStore('categories').clear(),
      tx.objectStore('transactions').clear(),
      tx.objectStore('budgets').clear(),
      tx.objectStore('people').clear(),
      tx.objectStore('ious').clear(),
      tx.objectStore('recurringRules').clear(),
      tx.objectStore('settings').clear(),
    ]);

    await tx.done;
  }

  async getAllSettings() {
    const db = await this.init();
    return db.getAll('settings');
  }

  // Utility methods
  async getStats() {
    const [
      categories,
      transactions,
      budgets,
      people,
      ious,
      recurringRules,
    ] = await Promise.all([
      this.getCategories(),
      this.getTransactions(),
      this.getBudgets(),
      this.getPeople(),
      this.getIOUs(),
      this.getRecurringRules(),
    ]);

    return {
      categories: categories.length,
      transactions: transactions.length,
      budgets: budgets.length,
      people: people.length,
      ious: ious.length,
      recurringRules: recurringRules.length,
    };
  }
}

export const dbService = new DatabaseService();