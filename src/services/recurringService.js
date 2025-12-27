import { pb } from '../contexts/PocketBase';

class RecurringService {
  constructor() {
    this.collectionName = 'recurring_transactions';
  }

  /**
   * Get all recurring rules for the current user
   */
  async getRecurringRules() {
    try {
      const user = pb.authStore.model;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const records = await pb.collection(this.collectionName).getFullList({
        filter: `user = "${user.id}"`,
        sort: '-created',
      });

      return records.map(record => ({
        id: record.id,
        name: record.name,
        type: record.type,
        amount: record.amount,
        category: record.category,
        frequency: record.frequency,
        startDate: record.start_date,
        endDate: record.end_date,
        notes: record.notes,
        person: record.person,
        isActive: record.is_active,
        lastGenerated: record.last_generated,
        nextOccurrence: record.next_occurrence,
        createdAt: record.created,
        updatedAt: record.updated,
      }));
    } catch (error) {
      console.error('Error fetching recurring rules:', error);
      throw error;
    }
  }

  /**
   * Add a new recurring rule
   */
  async addRecurringRule(rule) {
    try {
      const user = pb.authStore.model;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const data = {
        name: rule.name,
        type: rule.type,
        amount: rule.amount,
        category: rule.category,
        frequency: rule.frequency,
        start_date: rule.startDate,
        end_date: rule.endDate || null,
        notes: rule.notes || '',
        person: rule.person || '',
        is_active: true,
        user: user.id,
      };

      const record = await pb.collection(this.collectionName).create(data);

      return {
        id: record.id,
        name: record.name,
        type: record.type,
        amount: record.amount,
        category: record.category,
        frequency: record.frequency,
        startDate: record.start_date,
        endDate: record.end_date,
        notes: record.notes,
        person: record.person,
        isActive: record.is_active,
        lastGenerated: record.last_generated,
        nextOccurrence: record.next_occurrence,
        createdAt: record.created,
        updatedAt: record.updated,
      };
    } catch (error) {
      console.error('Error adding recurring rule:', error);
      throw error;
    }
  }

  /**
   * Update an existing recurring rule
   */
  async updateRecurringRule(id, updates) {
    try {
      const data = {};
      
      if (updates.name !== undefined) data.name = updates.name;
      if (updates.type !== undefined) data.type = updates.type;
      if (updates.amount !== undefined) data.amount = updates.amount;
      if (updates.category !== undefined) data.category = updates.category;
      if (updates.frequency !== undefined) data.frequency = updates.frequency;
      if (updates.startDate !== undefined) data.start_date = updates.startDate;
      if (updates.endDate !== undefined) data.end_date = updates.endDate;
      if (updates.notes !== undefined) data.notes = updates.notes;
      if (updates.person !== undefined) data.person = updates.person;
      if (updates.isActive !== undefined) data.is_active = updates.isActive;
      if (updates.lastGenerated !== undefined) data.last_generated = updates.lastGenerated;
      if (updates.nextOccurrence !== undefined) data.next_occurrence = updates.nextOccurrence;

      const record = await pb.collection(this.collectionName).update(id, data);

      return {
        id: record.id,
        name: record.name,
        type: record.type,
        amount: record.amount,
        category: record.category,
        frequency: record.frequency,
        startDate: record.start_date,
        endDate: record.end_date,
        notes: record.notes,
        person: record.person,
        isActive: record.is_active,
        lastGenerated: record.last_generated,
        nextOccurrence: record.next_occurrence,
        createdAt: record.created,
        updatedAt: record.updated,
      };
    } catch (error) {
      console.error('Error updating recurring rule:', error);
      throw error;
    }
  }

  /**
   * Delete a recurring rule
   */
  async deleteRecurringRule(id) {
    try {
      await pb.collection(this.collectionName).delete(id);
      return true;
    } catch (error) {
      console.error('Error deleting recurring rule:', error);
      throw error;
    }
  }

  /**
   * Toggle active status of a recurring rule
   */
  async toggleRecurringRule(id, isActive) {
    try {
      return await this.updateRecurringRule(id, { isActive });
    } catch (error) {
      console.error('Error toggling recurring rule:', error);
      throw error;
    }
  }

  /**
   * Generate transactions from recurring rules
   * This would typically be called by a scheduled job or manually
   */
  async generateTransactionsFromRule(ruleId, occurrences = []) {
    try {
      // This would integrate with your transaction service
      // For now, we'll just update the last_generated timestamp
      const now = new Date().toISOString();
      await this.updateRecurringRule(ruleId, { 
        lastGenerated: now 
      });
      
      return true;
    } catch (error) {
      console.error('Error generating transactions from rule:', error);
      throw error;
    }
  }
}

export const recurringService = new RecurringService();