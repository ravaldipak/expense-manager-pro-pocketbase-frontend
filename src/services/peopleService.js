import { pb } from '../contexts/PocketBase';

class PeopleService {
  constructor() {
    this.collectionName = 'people';
  }

  /**
   * Get all people for the current user
   * @param {Object} options - Query options (filter, sort, etc.)
   * @returns {Promise<Array>} Array of people
   */
  async getPeople(options = {}) {
    try {
      const user = pb.authStore.model;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const filter = `user = "${user.id}"`;
      const sort = options.sort || 'name';
      const expand = options.expand || '';

      const records = await pb.collection(this.collectionName).getFullList({
        filter,
        sort,
        expand
      });

      return records.map(this.formatPerson);
    } catch (error) {
      console.error('Error fetching people:', error);
      throw error;
    }
  }

  /**
   * Get a single person by ID
   * @param {string} id - Person ID
   * @returns {Promise<Object>} Person object
   */
  async getPerson(id) {
    try {
      const user = pb.authStore.model;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const record = await pb.collection(this.collectionName).getOne(id, {
        filter: `user = "${user.id}"`
      });

      return this.formatPerson(record);
    } catch (error) {
      console.error('Error fetching person:', error);
      throw error;
    }
  }

  /**
   * Create a new person
   * @param {Object} personData - Person data
   * @returns {Promise<Object>} Created person object
   */
  async createPerson(personData) {
    try {
      const user = pb.authStore.model;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const data = {
        ...personData,
        user: user.id,
        created: new Date().toISOString(),
        updated: new Date().toISOString()
      };

      const record = await pb.collection(this.collectionName).create(data);
      return this.formatPerson(record);
    } catch (error) {
      console.error('Error creating person:', error);
      throw error;
    }
  }

  /**
   * Update an existing person
   * @param {string} id - Person ID
   * @param {Object} personData - Updated person data
   * @returns {Promise<Object>} Updated person object
   */
  async updatePerson(id, personData) {
    try {
      const user = pb.authStore.model;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const data = {
        ...personData,
        updated: new Date().toISOString()
      };

      const record = await pb.collection(this.collectionName).update(id, data, {
        filter: `user = "${user.id}"`
      });

      return this.formatPerson(record);
    } catch (error) {
      console.error('Error updating person:', error);
      throw error;
    }
  }

  /**
   * Delete a person
   * @param {string} id - Person ID
   * @returns {Promise<boolean>} Success status
   */
  async deletePerson(id) {
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
      console.error('Error deleting person:', error);
      throw error;
    }
  }

  /**
   * Delete multiple people
   * @param {Array<string>} ids - Array of person IDs
   * @returns {Promise<boolean>} Success status
   */
  async deletePeople(ids) {
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
      console.error('Error deleting people:', error);
      throw error;
    }
  }

  /**
   * Search people by name
   * @param {string} query - Search query
   * @returns {Promise<Array>} Array of matching people
   */
  async searchPeople(query) {
    try {
      const user = pb.authStore.model;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const filter = `user = "${user.id}" && (name ~ "${query}" || shortName ~ "${query}")`;
      
      const records = await pb.collection(this.collectionName).getFullList({
        filter,
        sort: 'name'
      });

      return records.map(this.formatPerson);
    } catch (error) {
      console.error('Error searching people:', error);
      throw error;
    }
  }

  /**
   * Format person record from PocketBase
   * @param {Object} record - Raw PocketBase record
   * @returns {Object} Formatted person object
   */
  formatPerson(record) {
    return {
      id: record.id,
      name: record.name,
      shortName: record.shortName || '',
      contact: record.contact || '',
      notes: record.notes || '',
      balance: record.balance || 0,
      createdAt: record.created ? new Date(record.created) : new Date(),
      updatedAt: record.updated ? new Date(record.updated) : new Date()
    };
  }

  /**
   * Get people statistics
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Statistics object
   */
  async getPeopleStats(options = {}) {
    try {
      const people = await this.getPeople(options);
      
      const stats = {
        totalPeople: people.length,
        totalOwed: 0,
        totalOwing: 0,
        settledCount: 0
      };

      people.forEach(person => {
        if (person.balance > 0) {
          stats.totalOwed += person.balance;
        } else if (person.balance < 0) {
          stats.totalOwing += Math.abs(person.balance);
        } else {
          stats.settledCount++;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error getting people stats:', error);
      throw error;
    }
  }
}

export default new PeopleService();