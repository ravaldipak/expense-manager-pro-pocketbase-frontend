import { pb } from '../contexts/PocketBase';

class TransactionService {
  constructor() {
    this.collectionName = 'transactions';
  }

  /**
   * Get all transactions for the current user
   * @param {Object} options - Query options (filter, sort, etc.)
   * @returns {Promise<Array>} Array of transactions
   */
  async getTransactions(options = {}) {
    try {
      const user = pb.authStore.model;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const filter = `user = "${user.id}"`;
      const sort = options.sort || '-created';
      const expand = options.expand || '';

      // Add a small delay to prevent rapid successive calls
      await new Promise(resolve => setTimeout(resolve, 100));

      const records = await pb.collection(this.collectionName).getFullList({
        filter,
        sort,
        expand,
        // Disable auto-cancellation for this request
        requestKey: null
      });

      return records.map(this.formatTransaction);
    } catch (error) {
      // Don't log auto-cancellation errors as they are expected
      if (error.isAbort) {
        console.debug('Transaction request was cancelled (auto-cancellation)');
      } else {
        console.error('Error fetching transactions:', error);
      }
      throw error;
    }
  }

  /**
   * Get a single transaction by ID
   * @param {string} id - Transaction ID
   * @returns {Promise<Object>} Transaction object
   */
  async getTransaction(id) {
    try {
      const user = pb.authStore.model;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const record = await pb.collection(this.collectionName).getOne(id, {
        filter: `user = "${user.id}"`
      });

      return this.formatTransaction(record);
    } catch (error) {
      console.error('Error fetching transaction:', error);
      throw error;
    }
  }

  /**
   * Create a new transaction
   * @param {Object} transactionData - Transaction data
   * @returns {Promise<Object>} Created transaction
   */
  async createTransaction(transactionData) {
    try {
      const user = pb.authStore.model;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const data = {
        user: user.id,
        date: transactionData.date,
        type: transactionData.type,
        amount: parseFloat(transactionData.amount),
        category: transactionData.category,
        payee: transactionData.payee || '',
        notes: transactionData.notes || '',
        tags: Array.isArray(transactionData.tags) 
          ? transactionData.tags.join(', ') 
          : transactionData.tags || '',
        person: transactionData.person || '',
        status: transactionData.status || 'posted'
      };

      const record = await pb.collection(this.collectionName).create(data);
      return this.formatTransaction(record);
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  }

  /**
   * Update an existing transaction
   * @param {string} id - Transaction ID
   * @param {Object} transactionData - Updated transaction data
   * @returns {Promise<Object>} Updated transaction
   */
  async updateTransaction(id, transactionData) {
    try {
      const user = pb.authStore.model;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const data = {
        date: transactionData.date,
        type: transactionData.type,
        amount: parseFloat(transactionData.amount),
        category: transactionData.category,
        payee: transactionData.payee || '',
        notes: transactionData.notes || '',
        tags: Array.isArray(transactionData.tags) 
          ? transactionData.tags.join(', ') 
          : transactionData.tags || '',
        person: transactionData.person || '',
        status: transactionData.status || 'posted'
      };

      const record = await pb.collection(this.collectionName).update(id, data, {
        filter: `user = "${user.id}"`
      });

      return this.formatTransaction(record);
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw error;
    }
  }

  /**
   * Delete a transaction
   * @param {string} id - Transaction ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteTransaction(id) {
    try {
      const user = pb.authStore.model;
      if (!user) {
        throw new Error('User not authenticated');
      }

      await pb.collection(this.collectionName).delete(id, {
        filter: `user = "${user.id}"`
      });

      return true;
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
  }

  /**
   * Delete multiple transactions
   * @param {Array<string>} ids - Array of transaction IDs
   * @returns {Promise<boolean>} Success status
   */
  async deleteTransactions(ids) {
    try {
      const user = pb.authStore.model;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const deletePromises = ids.map(id => 
        pb.collection(this.collectionName).delete(id, {
          filter: `user = "${user.id}"`
        })
      );

      await Promise.all(deletePromises);
      return true;
    } catch (error) {
      console.error('Error deleting transactions:', error);
      throw error;
    }
  }

  /**
   * Get transactions within a date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Array>} Array of transactions
   */
  async getTransactionsByDateRange(startDate, endDate) {
    try {
      const user = pb.authStore.model;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const start = startDate.toISOString().split('T')[0];
      const end = endDate.toISOString().split('T')[0];
      
      const filter = `user = "${user.id}" && date >= "${start}" && date <= "${end}"`;

      const records = await pb.collection(this.collectionName).getFullList({
        filter,
        sort: '-date'
      });

      return records.map(this.formatTransaction);
    } catch (error) {
      console.error('Error fetching transactions by date range:', error);
      throw error;
    }
  }

  /**
   * Get transactions by category
   * @param {string} category - Category name
   * @returns {Promise<Array>} Array of transactions
   */
  async getTransactionsByCategory(category) {
    try {
      const user = pb.authStore.model;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const filter = `user = "${user.id}" && category = "${category}"`;

      const records = await pb.collection(this.collectionName).getFullList({
        filter,
        sort: '-date'
      });

      return records.map(this.formatTransaction);
    } catch (error) {
      console.error('Error fetching transactions by category:', error);
      throw error;
    }
  }

  /**
   * Format transaction record from PocketBase
   * @param {Object} record - PocketBase record
   * @returns {Object} Formatted transaction
   */
  formatTransaction(record) {
    return {
      id: record.id,
      date: record.date,
      type: record.type,
      amount: record.amount,
      category: record.category,
      payee: record.payee || '',
      notes: record.notes || '',
      tags: record.tags ? record.tags.split(', ').filter(tag => tag.trim()) : [],
      person: record.person || '',
      status: record.status || 'posted',
      created: record.created,
      updated: record.updated
    };
  }

  /**
   * Get transaction statistics
   * @param {Object} options - Options for filtering
   * @returns {Promise<Object>} Transaction statistics
   */
  async getTransactionStats(options = {}) {
    try {
      const transactions = await this.getTransactions(options);
      
      const stats = {
        total: transactions.length,
        income: 0,
        expense: 0,
        totalIncome: 0,
        totalExpense: 0,
        categories: {},
        monthlyTotals: {}
      };

      transactions.forEach(transaction => {
        if (transaction.type === 'income') {
          stats.income++;
          stats.totalIncome += transaction.amount;
        } else {
          stats.expense++;
          stats.totalExpense += transaction.amount;
        }

        // Category stats
        if (!stats.categories[transaction.category]) {
          stats.categories[transaction.category] = {
            count: 0,
            total: 0
          };
        }
        stats.categories[transaction.category].count++;
        stats.categories[transaction.category].total += transaction.amount;

        // Monthly stats
        const monthKey = transaction.date.substring(0, 7); // YYYY-MM
        if (!stats.monthlyTotals[monthKey]) {
          stats.monthlyTotals[monthKey] = {
            income: 0,
            expense: 0
          };
        }
        if (transaction.type === 'income') {
          stats.monthlyTotals[monthKey].income += transaction.amount;
        } else {
          stats.monthlyTotals[monthKey].expense += transaction.amount;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error getting transaction stats:', error);
      throw error;
    }
  }
}

export default new TransactionService();