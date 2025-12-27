import { pb } from '../contexts/PocketBase';

class SettingsService {
  async getSettings() {
    const defaults = {
      currency: 'AUD',
      financialYearStart: '07-01',
      importantCategories: [],
      dateFormat: 'system',
      backupFolder: null,
      lastBackup: null,
      autoBackup: true,
      autoBackupInterval: 15, // minutes
    };

    try {
      const settings = {};
      for (const [key, defaultValue] of Object.entries(defaults)) {
        try {
          const setting = await pb.collection('settings').getFirstListItem(`key="${key}"`);
          settings[key] = setting ? setting.value : defaultValue;
        } catch (error) {
          // Setting doesn't exist, use default
          settings[key] = defaultValue;
        }
      }
      return settings;
    } catch (error) {
      console.error('Failed to load settings:', error);
      return defaults;
    }
  }

  async setSetting(key, value) {
    try {
      // Try to find existing setting
      try {
        const existingSetting = await pb.collection('settings').getFirstListItem(`key="${key}"`);
        await pb.collection('settings').update(existingSetting.id, { value });
      } catch (error) {
        // Setting doesn't exist, create new one
        await pb.collection('settings').create({ key, value });
      }
      return true;
    } catch (error) {
      console.error('Failed to save setting:', error);
      return false;
    }
  }

  async updateSettings(updates) {
    try {
      for (const [key, value] of Object.entries(updates)) {
        await this.setSetting(key, value);
      }
      return true;
    } catch (error) {
      console.error('Failed to update settings:', error);
      return false;
    }
  }
}

export const settingsService = new SettingsService();