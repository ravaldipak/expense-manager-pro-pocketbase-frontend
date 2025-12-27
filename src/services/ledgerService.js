import { pb } from '../contexts/PocketBase';

/**
 * LedgerService handles dynamic ledger entries from multiple PocketBase collections
 */
class LedgerService {
  constructor() {
    // Define available collections and their relevant fields for ledger entries
    this.availableCollections = {
      transactions: {
        name: 'Transactions',
        fields: {
          id: 'ID',
          date: 'Date',
          type: 'Type',
          amount: 'Amount',
          category: 'Category',
          payee: 'Payee',
          notes: 'Notes',
          person: 'Person',
          status: 'Status',
          created: 'Created At',
          updated: 'Updated At'
        },
        dateField: 'date',
        amountField: 'amount',
        descriptionFields: ['payee', 'notes', 'category']
      },
      ious: {
        name: 'IOUs',
        fields: {
          id: 'ID',
          person_id: 'Person ID',
          amount: 'Amount',
          type: 'Type',
          description: 'Description',
          date: 'Date',
          status: 'Status',
          created: 'Created At',
          updated: 'Updated At'
        },
        dateField: 'date',
        amountField: 'amount',
        descriptionFields: ['description', 'type']
      },
      people: {
        name: 'People',
        fields: {
          id: 'ID',
          name: 'Name',
          shortName: 'Short Name',
          contact: 'Contact',
          notes: 'Notes',
          balance: 'Balance',
          created: 'Created At',
          updated: 'Updated At'
        },
        dateField: 'created',
        amountField: 'balance',
        descriptionFields: ['name', 'notes']
      },
      budget: {
        name: 'Budgets',
        fields: {
          id: 'ID',
          category: 'Category',
          amount: 'Amount',
          period: 'Period',
          notes: 'Notes',
          created: 'Created At',
          updated: 'Updated At'
        },
        dateField: 'created',
        amountField: 'amount',
        descriptionFields: ['category', 'notes']
      },
      recurring_transactions: {
        name: 'Recurring Transactions',
        fields: {
          id: 'ID',
          name: 'Name',
          type: 'Type',
          amount: 'Amount',
          category: 'Category',
          frequency: 'Frequency',
          start_date: 'Start Date',
          end_date: 'End Date',
          notes: 'Notes',
          person: 'Person',
          is_active: 'Is Active',
          next_occurrence: 'Next Occurrence',
          created: 'Created At',
          updated: 'Updated At'
        },
        dateField: 'start_date',
        amountField: 'amount',
        descriptionFields: ['name', 'notes', 'category']
      },
      stripe_payments: {
        name: 'Stripe Payments',
        fields: {
          id: 'ID',
          payment_id: 'Payment ID',
          payment_date: 'Payment Date',
          price: 'Price',
          currency: 'Currency',
          status: 'Status',
          description: 'Description',
          created: 'Created At',
          updated: 'Updated At'
        },
        dateField: 'payment_date',
        amountField: 'price',
        descriptionFields: ['description', 'payment_id']
      }
    };
  }

  /**
   * Get available collections for ledger entries
   * @returns {Object} Available collections with their metadata
   */
  getAvailableCollections() {
    return this.availableCollections;
  }

  /**
   * Get ledger entries from multiple collections
   * @param {Array} collectionNames - Collections to fetch from
   * @param {Object} filters - Filters to apply
   * @param {AbortSignal} signal - Optional abort signal for request cancellation
   * @returns {Promise<Array>} Array of ledger entries
   */
  async getLedgerEntries(collectionNames = ['transactions'], filters = {}, signal = null) {
    try {
      const user = pb.authStore.model;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const allEntries = [];

      for (const collectionName of collectionNames) {
        if (!this.availableCollections[collectionName]) {
          console.warn(`Unknown collection: ${collectionName}`);
          continue;
        }

        const collectionConfig = this.availableCollections[collectionName];
        
        try {
          // Build filter for this collection
          let filter = `user = "${user.id}"`;
          
          // Add person filter if applicable and collection has person field
          if (filters.person && collectionConfig.fields.person) {
            filter += ` && person = "${filters.person}"`;
          }

          // Add person_id filter for IOUs collection
          if (filters.person && collectionName === 'ious' && collectionConfig.fields.person_id) {
            // For IOUs, we need to match by person_id instead of person name
            // We'll need to get the person ID from the person name
            const personRecord = await pb.collection('people').getFirstListItem(`name = "${filters.person}"`);
            if (personRecord) {
              filter += ` && person_id = "${personRecord.id}"`;
            }
          }

          // Add date range filter if applicable
          if (filters.dateRange && collectionConfig.dateField) {
            const { start, end } = filters.dateRange;
            filter += ` && ${collectionConfig.dateField} >= "${start.toISOString().split('T')[0]}"`;
            filter += ` && ${collectionConfig.dateField} <= "${end.toISOString().split('T')[0]}"`;
          }

          const requestOptions = {
            filter,
            sort: `-${collectionConfig.dateField}`,
          };

          // Add abort signal if provided
          if (signal) {
            requestOptions.requestKey = `ledger-${collectionName}-${Date.now()}`;
          }

          const records = await pb.collection(collectionName).getFullList(requestOptions);

          // Transform records to ledger entry format
          const entries = records.map(record => this.transformToLedgerEntry(record, collectionName, collectionConfig));
          allEntries.push(...entries);

        } catch (error) {
          // Don't log auto-cancellation errors as they are expected
          if (!error.isAbort) {
            console.error(`Error fetching from collection ${collectionName}:`, error);
          }
          // Continue with other collections even if one fails
        }
      }

      // Sort all entries by date (newest first)
      allEntries.sort((a, b) => new Date(b.date) - new Date(a.date));

      // Calculate running balance for person-related entries
      if (filters.person) {
        return this.calculateRunningBalance(allEntries);
      }

      return allEntries;

    } catch (error) {
      console.error('Error fetching ledger entries:', error);
      throw error;
    }
  }

  /**
   * Transform a PocketBase record to ledger entry format
   * @param {Object} record - PocketBase record
   * @param {string} collectionName - Name of the collection
   * @param {Object} collectionConfig - Collection configuration
   * @returns {Object} Transformed ledger entry
   */
  transformToLedgerEntry(record, collectionName, collectionConfig) {
    const date = record[collectionConfig.dateField] || record.created;
    const amount = record[collectionConfig.amountField] || 0;
    
    // Build description from multiple fields
    const description = collectionConfig.descriptionFields
      .map(field => record[field])
      .filter(value => value && value.toString().trim())
      .join(' - ');

    // Calculate balance effect for transactions
    let balanceEffect = 0;
    if (collectionName === 'transactions') {
      balanceEffect = record.type === 'expense' ? amount : -amount;
    } else if (collectionName === 'stripe_payments') {
      balanceEffect = -amount; // Payments are outgoing
    } else if (collectionName === 'ious') {
      // Handle IOU balance effects
      switch (record.type) {
        case 'you_lent':
          balanceEffect = amount; // Person owes you
          break;
        case 'you_borrowed':
          balanceEffect = -amount; // You owe person
          break;
        case 'repayment_received':
          balanceEffect = -amount; // Reduces what person owes you
          break;
        case 'repayment_made':
          balanceEffect = amount; // Reduces what you owe person
          break;
        default:
          balanceEffect = amount;
      }
    } else {
      balanceEffect = amount; // Default to positive for other collections
    }

    return {
      id: `${collectionName}_${record.id}`,
      originalId: record.id,
      date: date,
      amount: amount,
      balanceEffect: balanceEffect,
      description: description || 'No description',
      type: record.type || 'entry',
      status: record.status || 'active',
      notes: record.notes || '',
      category: record.category || '',
      person: record.person || '',
      entryType: 'ledger_entry',
      collectionName: collectionName,
      collectionDisplayName: collectionConfig.name,
      sourceRecord: record,
      runningBalance: 0 // Will be calculated later if needed
    };
  }

  /**
   * Calculate running balance for ledger entries
   * @param {Array} entries - Array of ledger entries
   * @returns {Array} Entries with running balance calculated
   */
  calculateRunningBalance(entries) {
    // Sort by date (oldest first) for balance calculation
    const sortedEntries = [...entries].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    let runningBalance = 0;
    const entriesWithBalance = sortedEntries.map(entry => {
      runningBalance += entry.balanceEffect;
      return {
        ...entry,
        runningBalance: runningBalance
      };
    });

    // Return in newest first order
    return entriesWithBalance.reverse();
  }

  /**
   * Get ledger entries for a specific person from multiple collections
   * @param {string} personName - Name of the person
   * @param {Array} collectionNames - Collections to search in
   * @param {Object} filters - Additional filters
   * @param {AbortSignal} signal - Optional abort signal for request cancellation
   * @returns {Promise<Object>} Object with currentBalance and ledgerEntries
   */
  async getPersonLedgerEntries(personName, collectionNames = ['transactions'], filters = {}, signal = null) {
    try {
      const personFilters = {
        ...filters,
        person: personName
      };

      const ledgerEntries = await this.getLedgerEntries(collectionNames, personFilters, signal);
      
      const currentBalance = ledgerEntries.length > 0 
        ? ledgerEntries[0].runningBalance 
        : 0;

      return {
        currentBalance,
        ledgerEntries
      };

    } catch (error) {
      // Don't log auto-cancellation errors as they are expected
      if (!error.isAbort) {
        console.error('Error fetching person ledger entries:', error);
      }
      throw error;
    }
  }

  /**
   * Get collection statistics
   * @param {string} collectionName - Name of the collection
   * @returns {Promise<Object>} Collection statistics
   */
  async getCollectionStats(collectionName) {
    try {
      const user = pb.authStore.model;
      if (!user) {
        throw new Error('User not authenticated');
      }

      if (!this.availableCollections[collectionName]) {
        throw new Error(`Unknown collection: ${collectionName}`);
      }

      const records = await pb.collection(collectionName).getFullList({
        filter: `user = "${user.id}"`,
      });

      const collectionConfig = this.availableCollections[collectionName];
      const totalAmount = records.reduce((sum, record) => {
        return sum + (record[collectionConfig.amountField] || 0);
      }, 0);

      return {
        collectionName,
        displayName: collectionConfig.name,
        totalRecords: records.length,
        totalAmount,
        fields: Object.keys(collectionConfig.fields),
        fieldLabels: collectionConfig.fields
      };

    } catch (error) {
      console.error(`Error getting stats for collection ${collectionName}:`, error);
      throw error;
    }
  }
}

export default new LedgerService();
export { LedgerService };