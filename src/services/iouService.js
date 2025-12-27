import { pb } from '../contexts/PocketBase';

/**
 * IOUService handles all IOU (I Owe You) operations with PocketBase
 */
class IOUService {
  constructor() {
    this.collectionName = 'ious';
  }

  /**
   * Get all IOUs for the current user
   * @param {Object} options - Query options (filter, sort, expand, etc.)
   * @returns {Promise<Array>} Array of IOU records
   */
  async getIOUs(options = {}) {
    try {
      const user = pb.authStore.model;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const filter = options.filter 
        ? `user = "${user.id}" && (${options.filter})`
        : `user = "${user.id}"`;
      
      const sort = options.sort || '-created';
      const expand = options.expand || 'person';

      const records = await pb.collection(this.collectionName).getFullList({
        filter,
        sort,
        expand
      });

      return records.map(this.formatIOU);
    } catch (error) {
      console.error('Error fetching IOUs:', error);
      throw error;
    }
  }

  /**
   * Get IOUs for a specific person
   * @param {string} personId - Person ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of IOU records for the person
   */
  async getIOUsForPerson(personId, options = {}) {
    try {
      const user = pb.authStore.model;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const filter = `user = "${user.id}"`;
      const sort = options.sort || '-created';
      const expand = options.expand || 'person';
      
      const records = await pb.collection(this.collectionName).getFullList({
        filter,
        sort,
        expand
      });

      console.log("dipak records ", records)

      return records.map(this.formatIOU);
    } catch (error) {
      console.error('Error fetching IOUs for person:', error);
      throw error;
    }
  }

  /**
   * Calculate balance for a specific person
   * @param {string} personId - Person ID
   * @returns {Promise<number>} Current balance (positive = person owes you, negative = you owe person)
   */
  async calculatePersonBalance(personId) {
    try {
      const ious = await this.getIOUsForPerson(personId, { 
        filter: 'status = "active"' 
      });

      let balance = 0;
      
      ious.forEach(iou => {
        switch (iou.type) {
          case 'you_lent':
            balance += iou.amount; // Person owes you
            break;
          case 'you_borrowed':
            balance -= iou.amount; // You owe person
            break;
          case 'repayment_received':
            balance -= iou.amount; // Person paid you back
            break;
          case 'repayment_made':
            balance += iou.amount; // You paid person back
            break;
        }
      });

      return balance;
    } catch (error) {
      console.error('Error calculating person balance:', error);
      throw error;
    }
  }

  /**
   * Get ledger entries for a person (chronological list with running balance)
   * @param {string} personId - Person ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Object with currentBalance and ledgerEntries
   */
  async getPersonLedger(personId, options = {}) {
    try {
      const ious = await this.getIOUsForPerson(personId, {
        sort: 'date,created',
        filter: options.filter || 'status = "active"'
      });

      console.log("dipak ious ", ious)

      let runningBalance = 0;
      const ledgerEntries = ious.map(iou => {
        let balanceEffect = 0;
        
        switch (iou.type) {
          case 'you_lent':
            balanceEffect = iou.amount;
            break;
          case 'you_borrowed':
            balanceEffect = -iou.amount;
            break;
          case 'repayment_received':
            balanceEffect = -iou.amount;
            break;
          case 'repayment_made':
            balanceEffect = iou.amount;
            break;
        }

        runningBalance += balanceEffect;

        return {
          id: iou.id,
          date: iou.date,
          type: iou.type,
          amount: iou.amount,
          notes: iou.notes,
          balanceEffect,
          runningBalance,
          collectionName: 'ious',
          status: iou.status
        };
      });

      return {
        currentBalance: runningBalance,
        ledgerEntries
      };
    } catch (error) {
      console.error('Error getting person ledger:', error);
      throw error;
    }
  }

  /**
   * Create a new IOU
   * @param {Object} iouData - IOU data
   * @returns {Promise<Object>} Created IOU object
   */
  async createIOU(iouData) {
    try {
      const user = pb.authStore.model;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const data = {
        ...iouData,
        user: user.id,
        status: iouData.status || 'active',
        created: new Date().toISOString(),
        updated: new Date().toISOString()
      };

      const record = await pb.collection(this.collectionName).create(data, {
        expand: 'person'
      });

      return this.formatIOU(record);
    } catch (error) {
      console.error('Error creating IOU:', error);
      throw error;
    }
  }

  /**
   * Update an existing IOU
   * @param {string} id - IOU ID
   * @param {Object} iouData - Updated IOU data
   * @returns {Promise<Object>} Updated IOU object
   */
  async updateIOU(id, iouData) {
    try {
      const user = pb.authStore.model;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const data = {
        ...iouData,
        updated: new Date().toISOString()
      };

      const record = await pb.collection(this.collectionName).update(id, data, {
        filter: `user = "${user.id}"`,
        expand: 'person'
      });

      return this.formatIOU(record);
    } catch (error) {
      console.error('Error updating IOU:', error);
      throw error;
    }
  }

  /**
   * Delete an IOU
   * @param {string} id - IOU ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteIOU(id) {
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
      console.error('Error deleting IOU:', error);
      throw error;
    }
  }

  /**
   * Settle balance for a person by creating offsetting IOU entries
   * @param {string} personId - Person ID
   * @returns {Promise<Object>} Settlement result
   */
  async settleBalance(personId) {
    try {
      const currentBalance = await this.calculatePersonBalance(personId);
      
      if (currentBalance === 0) {
        return { success: true, message: 'Balance already settled' };
      }

      const settlementAmount = Math.abs(currentBalance);
      const settlementType = currentBalance > 0 ? 'repayment_received' : 'repayment_made';

      const settlementIOU = await this.createIOU({
        person: personId,
        amount: settlementAmount,
        type: settlementType,
        date: new Date().toISOString().split('T')[0],
        notes: 'Balance settlement',
        status: 'active'
      });

      return {
        success: true,
        settlement: settlementIOU,
        settledAmount: settlementAmount
      };
    } catch (error) {
      console.error('Error settling balance:', error);
      throw error;
    }
  }

  /**
   * Get IOU statistics for the current user
   * @returns {Promise<Object>} Statistics object
   */
  async getIOUStats() {
    try {
      const ious = await this.getIOUs({ filter: 'status = "active"' });
      
      const stats = {
        totalIOUs: ious.length,
        totalOwed: 0,
        totalOwing: 0,
        uniquePeople: new Set()
      };

      ious.forEach(iou => {
        stats.uniquePeople.add(iou.person.id);
        
        switch (iou.type) {
          case 'you_lent':
            stats.totalOwed += iou.amount;
            break;
          case 'you_borrowed':
            stats.totalOwing += iou.amount;
            break;
          case 'repayment_received':
            stats.totalOwed -= iou.amount;
            break;
          case 'repayment_made':
            stats.totalOwing -= iou.amount;
            break;
        }
      });

      stats.uniquePeople = stats.uniquePeople.size;

      return stats;
    } catch (error) {
      console.error('Error getting IOU stats:', error);
      throw error;
    }
  }

  /**
   * Format IOU record from PocketBase
   * @param {Object} record - Raw PocketBase record
   * @returns {Object} Formatted IOU object
   */
  formatIOU(record) {
    return {
      id: record.id,
      user: record.user,
      person: record.expand?.person || record.person,
      amount: record.amount,
      type: record.type,
      date: record.date,
      notes: record.notes || '',
      status: record.status,
      createdAt: record.created ? new Date(record.created) : new Date(),
      updatedAt: record.updated ? new Date(record.updated) : new Date()
    };
  }
}

export default new IOUService();