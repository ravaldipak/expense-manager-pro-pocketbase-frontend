import { pb } from '../contexts/PocketBase';
import transactionService from './transactionService';
import budgetService from './budgetService';
import peopleService from './peopleService';
import { recurringService } from './recurringService';
import { settingsService } from './settingsService';

class BackupService {
  async exportData() {
    try {
      const [
        categories,
        transactions,
        budgets,
        people,
        recurringRules,
        settings,
      ] = await Promise.all([
        pb.collection('categories').getFullList(),
        transactionService.getTransactions(),
        budgetService.getBudgets(),
        peopleService.getPeople(),
        recurringService.getRecurringRules(),
        // settingsService.getSettings(),
      ]);

      return {
        version: '3.0.0',
        exportDate: new Date().toISOString(),
        data: {
          categories,
          transactions,
          budgets,
          people,
          recurringRules,
          settings,
        },
      };
    } catch (error) {
      console.error('Export failed:', error);
      throw new Error('Failed to export data: ' + error.message);
    }
  }

  async importData(backupData) {
    if (!backupData.data) {
      throw new Error('Invalid backup format');
    }

    const { data } = backupData;

    try {
      // Clear existing data first
      await this.clearAllData();

      // Import categories
      if (data.categories && data.categories.length > 0) {
        for (const category of data.categories) {
          const { id, created, updated, ...categoryData } = category;
          await pb.collection('categories').create(categoryData);
        }
      }

      // Import people
      if (data.people && data.people.length > 0) {
        for (const person of data.people) {
          const { id, created, updated, ...personData } = person;
          await peopleService.createPerson(personData);
        }
      }

      // Import budgets
      if (data.budgets && data.budgets.length > 0) {
        for (const budget of data.budgets) {
          const { id, created, updated, ...budgetData } = budget;
          await budgetService.createBudget(budgetData);
        }
      }

      // Import transactions
      if (data.transactions && data.transactions.length > 0) {
        for (const transaction of data.transactions) {
          const { id, created, updated, ...transactionData } = transaction;
          await transactionService.createTransaction(transactionData);
        }
      }

      // Import recurring rules
      if (data.recurringRules && data.recurringRules.length > 0) {
        for (const rule of data.recurringRules) {
          const { id, created, updated, ...ruleData } = rule;
          await recurringService.addRecurringRule(ruleData);
        }
      }

      // Import settings
      if (data.settings) {
        for (const setting of data.settings) {
          if (setting.key && setting.value !== undefined) {
            // await settingsService.setSetting(setting.key, setting.value);
          }
        }
      }

    } catch (error) {
      console.error('Import failed:', error);
      throw new Error('Failed to import data: ' + error.message);
    }
  }

  async clearAllData() {
    try {
      // Get all records from each collection and delete them
      const collections = ['transactions', 'budgets', 'people', 'categories', 'recurring_transactions', 'settings'];
      
      for (const collectionName of collections) {
        try {
          const records = await pb.collection(collectionName).getFullList();
          for (const record of records) {
            await pb.collection(collectionName).delete(record.id);
          }
        } catch (error) {
          console.warn(`Failed to clear ${collectionName}:`, error);
        }
      }
    } catch (error) {
      console.error('Failed to clear all data:', error);
      throw new Error('Failed to clear data: ' + error.message);
    }
  }
}

export const backupService = new BackupService();