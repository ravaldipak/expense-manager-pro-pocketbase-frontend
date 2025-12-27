import { pb } from '../contexts/PocketBase';

/**
 * BudgetService handles all budget-related operations with PocketBase
 */
class BudgetService {
  constructor() {
    this.collectionName = 'budget';
  }

  /**
   * Get all budgets for the current user
   * @returns {Promise<Array>} Array of budget records
   */
  async getBudgets() {
    try {
      const user = pb.authStore.model;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const records = await pb.collection(this.collectionName).getFullList({
        filter: `user_id = "${user.id}"`,
        sort: '-created',
      });

      return records;
    } catch (error) {
      console.error('Error fetching budgets:', error);
      throw error;
    }
  }

  /**
   * Create a new budget
   * @param {Object} budgetData - Budget data
   * @param {string} budgetData.category - Budget category
   * @param {number} budgetData.amount - Budget amount
   * @param {string} budgetData.period - Budget period (monthly, quarterly, yearly, custom)
   * @param {string} budgetData.notes - Optional notes
   * @returns {Promise<Object>} Created budget record
   */
  async createBudget(budgetData) {
    try {
      const user = pb.authStore.model;
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Check if budget already exists for this category
      const existingBudget = await this.getBudgetByCategory(budgetData.category);
      if (existingBudget) {
        throw new Error(`Budget already exists for category: ${budgetData.category}`);
      }

      const budget = {
        user_id: user.id,
        category: budgetData.category,
        amount: budgetData.amount,
        period: budgetData.period,
        notes: budgetData.notes || '',
      };

      const record = await pb.collection(this.collectionName).create(budget);
      return record;
    } catch (error) {
      console.error('Error creating budget:', error);
      throw error;
    }
  }

  /**
   * Update an existing budget
   * @param {string} budgetId - Budget ID
   * @param {Object} updates - Budget updates
   * @returns {Promise<Object>} Updated budget record
   */
  async updateBudget(budgetId, updates) {
    try {
      const user = pb.authStore.model;
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Verify budget belongs to user
      const existingBudget = await pb.collection(this.collectionName).getOne(budgetId);
      if (existingBudget.user_id !== user.id) {
        throw new Error('Unauthorized: Budget does not belong to user');
      }

      const updatedData = {
        ...updates,
        updated: new Date().toISOString(),
      };

      const record = await pb.collection(this.collectionName).update(budgetId, updatedData);
      return record;
    } catch (error) {
      console.error('Error updating budget:', error);
      throw error;
    }
  }

  /**
   * Delete a budget
   * @param {string} budgetId - Budget ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteBudget(budgetId) {
    try {
      const user = pb.authStore.model;
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Verify budget belongs to user
      const existingBudget = await pb.collection(this.collectionName).getOne(budgetId);
      if (existingBudget.user_id !== user.id) {
        throw new Error('Unauthorized: Budget does not belong to user');
      }

      await pb.collection(this.collectionName).delete(budgetId);
      return true;
    } catch (error) {
      console.error('Error deleting budget:', error);
      throw error;
    }
  }

  /**
   * Get a budget by category
   * @param {string} category - Budget category
   * @returns {Promise<Object|null>} Budget record or null if not found
   */
  async getBudgetByCategory(category) {
    try {
      const user = pb.authStore.model;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const records = await pb.collection(this.collectionName).getFullList({
        filter: `user_id = "${user.id}" && category = "${category}"`,
      });

      return records.length > 0 ? records[0] : null;
    } catch (error) {
      console.error('Error fetching budget by category:', error);
      return null;
    }
  }

  /**
   * Get budget by ID
   * @param {string} budgetId - Budget ID
   * @returns {Promise<Object>} Budget record
   */
  async getBudgetById(budgetId) {
    try {
      const user = pb.authStore.model;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const record = await pb.collection(this.collectionName).getOne(budgetId);
      
      // Verify budget belongs to user
      if (record.user_id !== user.id) {
        throw new Error('Unauthorized: Budget does not belong to user');
      }

      return record;
    } catch (error) {
      console.error('Error fetching budget by ID:', error);
      throw error;
    }
  }

  /**
   * Get budgets by period
   * @param {string} period - Budget period (monthly, quarterly, yearly, custom)
   * @returns {Promise<Array>} Array of budget records
   */
  async getBudgetsByPeriod(period) {
    try {
      const user = pb.authStore.model;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const records = await pb.collection(this.collectionName).getFullList({
        filter: `user_id = "${user.id}" && period = "${period}"`,
        sort: '-created',
      });

      return records;
    } catch (error) {
      console.error('Error fetching budgets by period:', error);
      throw error;
    }
  }

  /**
   * Bulk create budgets
   * @param {Array} budgetsData - Array of budget data objects
   * @returns {Promise<Array>} Array of created budget records
   */
  async createBudgets(budgetsData) {
    try {
      const user = pb.authStore.model;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const createdBudgets = [];
      
      for (const budgetData of budgetsData) {
        try {
          const budget = await this.createBudget(budgetData);
          createdBudgets.push(budget);
        } catch (error) {
          console.warn(`Failed to create budget for category ${budgetData.category}:`, error.message);
          // Continue with other budgets even if one fails
        }
      }

      return createdBudgets;
    } catch (error) {
      console.error('Error bulk creating budgets:', error);
      throw error;
    }
  }

  /**
   * Search budgets by category name
   * @param {string} searchTerm - Search term
   * @returns {Promise<Array>} Array of matching budget records
   */
  async searchBudgets(searchTerm) {
    try {
      const user = pb.authStore.model;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const records = await pb.collection(this.collectionName).getFullList({
        filter: `user_id = "${user.id}" && category ~ "${searchTerm}"`,
        sort: '-created',
      });

      return records;
    } catch (error) {
      console.error('Error searching budgets:', error);
      throw error;
    }
  }
}

export default new BudgetService();
export { BudgetService };