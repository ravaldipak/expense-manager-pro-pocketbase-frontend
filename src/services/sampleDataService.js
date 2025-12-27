import { dbService } from './dbService';
import { generateSampleData } from '../data/sampleDataGenerator';

export const sampleDataService = {
  /**
   * Load sample data into the database
   * @param {number} years - Number of years of data to generate (default: 4)
   * @param {boolean} includeFuture - Whether to include future data (default: true)
   * @returns {Promise<{success: boolean, counts?: object, error?: string}>}
   */
  async loadSampleData(years = 4, includeFuture = true) {
    try {
      // Generate sample data
      const sampleData = generateSampleData(years, includeFuture);
      
      // Add all sample data to database
      const counts = {
        transactions: 0,
        categories: 0,
        budgets: 0,
        people: 0,
        recurringRules: 0,
        ious: 0,
      };

      // Add categories (check if they don't already exist)
      const existingCategories = await dbService.getCategories();
      for (const category of sampleData.categories) {
        const exists = existingCategories.find(c => c.name === category.name && c.type === category.type);
        if (!exists) {
          await dbService.addCategory({ ...category, isSample: true });
          counts.categories++;
        }
      }

      // Add people first (so we can reference their IDs)
      const addedPeople = [];
      for (const person of sampleData.people) {
        const personId = await dbService.addPerson({ ...person, isSample: true });
        addedPeople.push({ ...person, id: personId });
        counts.people++;
      }

      // Add budgets
      for (const budget of sampleData.budgets) {
        await dbService.addBudget({ ...budget, isSample: true });
        counts.budgets++;
      }

      // Add recurring rules
      for (const rule of sampleData.recurringRules) {
        await dbService.addRecurringRule({ ...rule, isSample: true });
        counts.recurringRules++;
      }

      // Add transactions
      for (const transaction of sampleData.transactions) {
        await dbService.addTransaction({ ...transaction, isSample: true });
        counts.transactions++;
      }

      // Add IOUs (update personId references)
      for (const iou of sampleData.ious) {
        // Find the correct personId from addedPeople
        const personIndex = iou.personId - 1; // Original index
        if (addedPeople[personIndex]) {
          const updatedIOU = {
            ...iou,
            personId: addedPeople[personIndex].id, // Use actual DB ID
            isSample: true,
          };
          await dbService.addIOU(updatedIOU);
          counts.ious++;
        }
      }

      return {
        success: true,
        counts,
      };
    } catch (error) {
      console.error('Failed to load sample data:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Delete all sample data from the database
   * @returns {Promise<{success: boolean, deletedCounts?: object, error?: string}>}
   */
  async deleteSampleData() {
    try {
      const deletedCounts = {
        transactions: 0,
        categories: 0,
        budgets: 0,
        people: 0,
        recurringRules: 0,
        ious: 0,
      };

      // Get all data
      const [transactions, categories, budgets, people, recurringRules, ious] = await Promise.all([
        dbService.getTransactions(),
        dbService.getCategories(),
        dbService.getBudgets(),
        dbService.getPeople(),
        dbService.getRecurringRules(),
        dbService.getIOUs(),
      ]);

      // Delete sample transactions
      for (const transaction of transactions) {
        if (transaction.isSample) {
          await dbService.deleteTransaction(transaction.id);
          deletedCounts.transactions++;
        }
      }

      // Delete sample categories (but keep defaults)
      for (const category of categories) {
        if (category.isSample) {
          await dbService.deleteCategory(category.id);
          deletedCounts.categories++;
        }
      }

      // Delete sample budgets
      for (const budget of budgets) {
        if (budget.isSample) {
          await dbService.deleteBudget(budget.id);
          deletedCounts.budgets++;
        }
      }

      // Delete sample people
      for (const person of people) {
        if (person.isSample) {
          await dbService.deletePerson(person.id);
          deletedCounts.people++;
        }
      }

      // Delete sample recurring rules
      for (const rule of recurringRules) {
        if (rule.isSample) {
          await dbService.deleteRecurringRule(rule.id);
          deletedCounts.recurringRules++;
        }
      }

      // Delete sample IOUs
      for (const iou of ious) {
        if (iou.isSample) {
          await dbService.deleteIOU(iou.id);
          deletedCounts.ious++;
        }
      }

      return {
        success: true,
        deletedCounts,
      };
    } catch (error) {
      console.error('Failed to delete sample data:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Reset all data in the database (keeps only default categories)
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async resetAllData() {
    try {
      // Clear all tables
      await dbService.clearAllData();
      
      // Re-initialize with default categories
      await dbService.initializeDefaults();

      return {
        success: true,
      };
    } catch (error) {
      console.error('Failed to reset all data:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Get counts of sample data items
   * @returns {Promise<{transactions: number, categories: number, budgets: number, people: number, recurringRules: number, ious: number}>}
   */
  async getSampleDataCounts() {
    try {
      const [transactions, categories, budgets, people, recurringRules, ious] = await Promise.all([
        dbService.getTransactions(),
        dbService.getCategories(),
        dbService.getBudgets(),
        dbService.getPeople(),
        dbService.getRecurringRules(),
        dbService.getIOUs(),
      ]);

      return {
        transactions: transactions.filter(t => t.isSample).length,
        categories: categories.filter(c => c.isSample).length,
        budgets: budgets.filter(b => b.isSample).length,
        people: people.filter(p => p.isSample).length,
        recurringRules: recurringRules.filter(r => r.isSample).length,
        ious: ious.filter(i => i.isSample).length,
      };
    } catch (error) {
      console.error('Failed to get sample data counts:', error);
      return {
        transactions: 0,
        categories: 0,
        budgets: 0,
        people: 0,
        recurringRules: 0,
        ious: 0,
      };
    }
  },

  /**
   * Check if sample data exists
   * @returns {Promise<boolean>}
   */
  async hasSampleData() {
    try {
      const counts = await this.getSampleDataCounts();
      return Object.values(counts).some(count => count > 0);
    } catch (error) {
      console.error('Failed to check for sample data:', error);
      return false;
    }
  },
};