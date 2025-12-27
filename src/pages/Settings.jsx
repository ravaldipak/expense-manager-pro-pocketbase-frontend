import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../contexts/AppContext';
import { settingsService } from '../services/settingsService';
import { backupService } from '../services/backupService';
import { sampleDataService } from '../services/sampleDataService';
import ConfirmDialog from '../components/ConfirmDialog';
import LoadingSpinner from '../components/LoadingSpinner';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const {
  FiSettings,
  FiDollarSign,
  FiCalendar,
  FiHardDrive,
  FiDownload,
  FiUpload,
  FiTrash2,
  FiDatabase,
  FiFolder,
  FiCheck,
  FiX,
  FiAlertTriangle,
} = FiIcons;

const Settings = () => {
  const { state, dispatch, actions } = useApp();
  const { settings } = state;
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [sampleDataCounts, setSampleDataCounts] = useState({
    transactions: 0,
    categories: 0,
    budgets: 0,
    people: 0,
    recurringRules: 0,
    ious: 0,
  });

  // Load sample data counts when tab changes to data
  useEffect(() => {
    if (activeTab === 'data') {
      loadSampleDataCounts();
    }
  }, [activeTab]);

  const loadSampleDataCounts = async () => {
    try {
      const counts = await sampleDataService.getSampleDataCounts();
      setSampleDataCounts(counts);
    } catch (error) {
      console.error('Failed to load sample data counts:', error);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSettingChange = async (key, value) => {
    setIsSaving(true);
    try {
      // await settingsService.setSetting(key, value);
      dispatch({ type: 'SET_SETTINGS', payload: { [key]: value } });
      showNotification('Setting updated successfully');
    } catch (error) {
      console.error('Failed to update setting:', error);
      showNotification('Failed to update setting', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadSampleData = () => {
    setConfirmDialog({
      title: 'Load Sample Data',
      message: 'This will add realistic sample data to help you explore the app features. The sample data includes transactions, budgets, people, and recurring rules covering 4 years of data.',
      confirmText: 'Load Sample Data',
      confirmStyle: 'primary',
      onConfirm: async () => {
        setIsLoading(true);
        try {
          const result = await sampleDataService.loadSampleData(4, true);
          
          if (result.success) {
            showNotification(
              `Sample data loaded successfully! Added ${result.counts.transactions} transactions, ${result.counts.categories} categories, ${result.counts.budgets} budgets, ${result.counts.people} people, and ${result.counts.recurringRules} recurring rules.`
            );
            
            // Refresh the app data
            await actions.loadData();
            await loadSampleDataCounts();
          } else {
            showNotification(`Failed to load sample data: ${result.error}`, 'error');
          }
        } catch (error) {
          console.error('Failed to load sample data:', error);
          showNotification('Failed to load sample data', 'error');
        } finally {
          setIsLoading(false);
          setConfirmDialog(null);
        }
      },
      onCancel: () => setConfirmDialog(null),
    });
  };

  const handleDeleteSampleData = () => {
    const totalSampleItems = Object.values(sampleDataCounts).reduce((sum, count) => sum + count, 0);
    
    if (totalSampleItems === 0) {
      showNotification('No sample data found to delete', 'error');
      return;
    }

    setConfirmDialog({
      title: 'Delete Sample Data',
      message: `This will permanently delete all sample data from your app. This includes ${sampleDataCounts.transactions} transactions, ${sampleDataCounts.categories} categories, ${sampleDataCounts.budgets} budgets, ${sampleDataCounts.people} people, and ${sampleDataCounts.recurringRules} recurring rules. This action cannot be undone.`,
      confirmText: 'Delete Sample Data',
      confirmStyle: 'danger',
      onConfirm: async () => {
        setIsLoading(true);
        try {
          const result = await sampleDataService.deleteSampleData();
          
          if (result.success) {
            showNotification(
              `Sample data deleted successfully! Removed ${result.deletedCounts.transactions} transactions, ${result.deletedCounts.categories} categories, ${result.deletedCounts.budgets} budgets, ${result.deletedCounts.people} people, and ${result.deletedCounts.recurringRules} recurring rules.`
            );
            
            // Refresh the app data
            await actions.loadData();
            await loadSampleDataCounts();
          } else {
            showNotification(`Failed to delete sample data: ${result.error}`, 'error');
          }
        } catch (error) {
          console.error('Failed to delete sample data:', error);
          showNotification('Failed to delete sample data', 'error');
        } finally {
          setIsLoading(false);
          setConfirmDialog(null);
        }
      },
      onCancel: () => setConfirmDialog(null),
    });
  };

  const handleResetAllData = () => {
    setConfirmDialog({
      title: 'Reset All Data',
      message: 'This will permanently delete ALL your data and reset the app to its initial state. This includes all transactions, budgets, people, recurring rules, and custom categories. Only the default categories will remain. This action cannot be undone.',
      confirmText: 'Reset Everything',
      confirmStyle: 'danger',
      requiresConfirmation: true,
      confirmationText: 'DELETE ALL DATA',
      onConfirm: async () => {
        setIsLoading(true);
        try {
          const result = await sampleDataService.resetAllData();
          
          if (result.success) {
            showNotification('All data has been reset successfully');
            
            // Refresh the app data
            await actions.loadData();
            await loadSampleDataCounts();
          } else {
            showNotification(`Failed to reset data: ${result.error}`, 'error');
          }
        } catch (error) {
          console.error('Failed to reset data:', error);
          showNotification('Failed to reset data', 'error');
        } finally {
          setIsLoading(false);
          setConfirmDialog(null);
        }
      },
      onCancel: () => setConfirmDialog(null),
    });
  };

  const handleBackup = async () => {
    try {
      const data = await backupService.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });

      const filename = `expense-manager-backup-${new Date().toISOString().split('T')[0]}.json`;
      
      // Check if File System Access API is available
      if ('showSaveFilePicker' in window) {
        try {
          const fileHandle = await window.showSaveFilePicker({
            suggestedName: filename,
            types: [{
              description: 'JSON files',
              accept: { 'application/json': ['.json'] },
            }],
          });
          
          const writable = await fileHandle.createWritable();
          await writable.write(blob);
          await writable.close();
          
          await settingsService.setSetting('lastBackup', new Date().toISOString());
          showNotification('Backup saved successfully');
        } catch (err) {
          if (err.name !== 'AbortError') {
            throw err;
          }
        }
      } else {
        // Fallback for other browsers
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        await settingsService.setSetting('lastBackup', new Date().toISOString());
        showNotification('Backup downloaded successfully');
      }
    } catch (error) {
      console.error('Backup failed:', error);
      showNotification('Backup failed', 'error');
    }
  };

  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (!data.data || !data.version) {
        throw new Error('Invalid backup file format');
      }

      await backupService.importData(data);
      showNotification('Data imported successfully');
      
      // Reload the page to refresh all data
      window.location.reload();
    } catch (error) {
      console.error('Import failed:', error);
      showNotification('Import failed: ' + error.message, 'error');
    }
    
    // Reset file input
    event.target.value = '';
  };

  const animationProps = settings.reducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.3 },
      };

  const tabs = [
    { id: 'general', name: 'General', icon: FiSettings },
    { id: 'backup', name: 'Backup & Import', icon: FiHardDrive },
    { id: 'data', name: 'Data Management', icon: FiDatabase },
  ];

  return (
    <motion.div className="space-y-6" {...animationProps}>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">
          Configure your preferences and manage your data
        </p>
      </div>

      {/* Notification */}
      {notification && (
        <motion.div
          className={`p-4 rounded-lg ${
            notification.type === 'error' 
              ? 'bg-danger-100 text-danger-700 border border-danger-200'
              : 'bg-success-100 text-success-700 border border-success-200'
          }`}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          <div className="flex items-center">
            <SafeIcon 
              icon={notification.type === 'error' ? FiX : FiCheck} 
              className="w-5 h-5 mr-2" 
            />
            {notification.message}
          </div>
        </motion.div>
      )}

      {/* Loading Overlay */}
      {isLoading && <LoadingSpinner message="Processing data..." />}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'bg-primary-100 text-primary-700 border border-primary-200'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <SafeIcon icon={tab.icon} className="w-4 h-4 mr-3" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* General Settings */}
            {activeTab === 'general' && (
              <motion.div className="p-6 space-y-6" {...animationProps}>
                <h2 className="text-lg font-semibold text-gray-900">General Settings</h2>
                
                {/* Currency */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <SafeIcon icon={FiDollarSign} className="w-4 h-4 inline mr-2" />
                    Default Currency
                  </label>
                  <select
                    value={settings.currency}
                    onChange={(e) => handleSettingChange('currency', e.target.value)}
                    disabled={isSaving}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="AUD">Australian Dollar (AUD)</option>
                    <option value="USD">US Dollar (USD)</option>
                    <option value="EUR">Euro (EUR)</option>
                    <option value="GBP">British Pound (GBP)</option>
                    <option value="CAD">Canadian Dollar (CAD)</option>
                    <option value="JPY">Japanese Yen (JPY)</option>
                  </select>
                </div>

                {/* Financial Year Start */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <SafeIcon icon={FiCalendar} className="w-4 h-4 inline mr-2" />
                    Financial Year Start
                  </label>
                  <select
                    value={settings.financialYearStart}
                    onChange={(e) => handleSettingChange('financialYearStart', e.target.value)}
                    disabled={isSaving}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="01-01">January 1</option>
                    <option value="04-01">April 1</option>
                    <option value="07-01">July 1 (Australia)</option>
                    <option value="10-01">October 1</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    This affects financial year calculations in reports
                  </p>
                </div>

                {/* Date Format */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date Format
                  </label>
                  <select
                    value={settings.dateFormat}
                    onChange={(e) => handleSettingChange('dateFormat', e.target.value)}
                    disabled={isSaving}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="system">System Default</option>
                    <option value="dd/mm/yyyy">DD/MM/YYYY</option>
                    <option value="mm/dd/yyyy">MM/DD/YYYY</option>
                    <option value="yyyy-mm-dd">YYYY-MM-DD</option>
                  </select>
                </div>

                {/* Auto Backup */}
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.autoBackup}
                      onChange={(e) => handleSettingChange('autoBackup', e.target.checked)}
                      disabled={isSaving}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Enable automatic backups every 15 minutes
                    </span>
                  </label>
                </div>
              </motion.div>
            )}

            {/* Backup & Import */}
            {activeTab === 'backup' && (
              <motion.div className="p-6 space-y-6" {...animationProps}>
                <h2 className="text-lg font-semibold text-gray-900">Backup & Import</h2>
                
                {/* Backup Section */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-md font-medium text-gray-900 mb-3">Backup Data</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-700">Last backup:</p>
                        <p className="text-xs text-gray-500">
                          {settings.lastBackup 
                            ? new Date(settings.lastBackup).toLocaleString('en-AU')
                            : 'Never'
                          }
                        </p>
                      </div>
                      <button
                        onClick={handleBackup}
                        className="flex items-center px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors duration-200"
                      >
                        <SafeIcon icon={FiDownload} className="w-4 h-4 mr-2" />
                        Backup Now
                      </button>
                    </div>

                    {/* Folder settings for Chromium browsers */}
                    {'showDirectoryPicker' in window && (
                      <div className="pt-3 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-700">Backup folder:</p>
                            <p className="text-xs text-gray-500">
                              {settings.backupFolder || 'Not set'}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={async () => {
                                try {
                                  const dirHandle = await window.showDirectoryPicker();
                                  await handleSettingChange('backupFolder', dirHandle.name);
                                } catch (err) {
                                  if (err.name !== 'AbortError') {
                                    console.error('Failed to set backup folder:', err);
                                  }
                                }
                              }}
                              className="flex items-center px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-sm transition-colors duration-200"
                            >
                              <SafeIcon icon={FiFolder} className="w-3 h-3 mr-1" />
                              Set Folder
                            </button>
                            {settings.backupFolder && (
                              <button
                                onClick={() => handleSettingChange('backupFolder', null)}
                                className="flex items-center px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-sm transition-colors duration-200"
                              >
                                Clear
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Import Section */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-md font-medium text-gray-900 mb-3">Import Data</h3>
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">
                      Import data from a backup file. This will replace all existing data.
                    </p>
                    <div>
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImport}
                        className="hidden"
                        id="import-file"
                      />
                      <label
                        htmlFor="import-file"
                        className="inline-flex items-center px-4 py-2 bg-warning-500 hover:bg-warning-600 text-white rounded-lg font-medium cursor-pointer transition-colors duration-200"
                      >
                        <SafeIcon icon={FiUpload} className="w-4 h-4 mr-2" />
                        Import Backup
                      </label>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Data Management */}
            {activeTab === 'data' && (
              <motion.div className="p-6 space-y-6" {...animationProps}>
                <h2 className="text-lg font-semibold text-gray-900">Data Management</h2>
                
                {/* Sample Data */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-md font-medium text-gray-900 mb-3">Sample Data</h3>
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">
                      Load sample data to explore the app features or delete existing sample data.
                    </p>
                    
                    {/* Current sample data info */}
                    <div className="bg-gray-50 p-3 rounded-lg text-sm">
                      <h4 className="font-medium text-gray-900 mb-2">Current Sample Data:</h4>
                      <div className="grid grid-cols-2 gap-2 text-gray-600">
                        <div>Transactions: {sampleDataCounts.transactions}</div>
                        <div>Categories: {sampleDataCounts.categories}</div>
                        <div>Budgets: {sampleDataCounts.budgets}</div>
                        <div>People: {sampleDataCounts.people}</div>
                        <div>Recurring Rules: {sampleDataCounts.recurringRules}</div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <button 
                        onClick={handleLoadSampleData}
                        disabled={isLoading}
                        className="flex items-center px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors duration-200"
                      >
                        <SafeIcon icon={FiDatabase} className="w-4 h-4 mr-2" />
                        Load Sample Data
                      </button>
                      <button 
                        onClick={handleDeleteSampleData}
                        disabled={isLoading || Object.values(sampleDataCounts).reduce((sum, count) => sum + count, 0) === 0}
                        className="flex items-center px-4 py-2 bg-warning-500 hover:bg-warning-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors duration-200"
                      >
                        <SafeIcon icon={FiTrash2} className="w-4 h-4 mr-2" />
                        Delete Sample Data
                      </button>
                    </div>
                  </div>
                </div>

                {/* Reset Data */}
                <div className="border border-danger-200 rounded-lg p-4 bg-danger-50">
                  <h3 className="text-md font-medium text-danger-900 mb-3">
                    <SafeIcon icon={FiAlertTriangle} className="w-4 h-4 inline mr-2" />
                    Danger Zone
                  </h3>
                  <div className="space-y-3">
                    <p className="text-sm text-danger-700">
                      Reset all data to start fresh. This action cannot be undone.
                    </p>
                    <button 
                      onClick={handleResetAllData}
                      disabled={isLoading}
                      className="flex items-center px-4 py-2 bg-danger-500 hover:bg-danger-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors duration-200"
                    >
                      <SafeIcon icon={FiTrash2} className="w-4 h-4 mr-2" />
                      Reset to Empty
                    </button>
                  </div>
                </div>

                {/* Storage Info */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-md font-medium text-gray-900 mb-3">Storage Information</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Transactions:</span>
                      <span>{state.transactions.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Categories:</span>
                      <span>{state.categories.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Budgets:</span>
                      <span>{state.budgets.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>People:</span>
                      <span>{state.people.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Recurring Rules:</span>
                      <span>{state.recurringRules.length}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Confirm Dialog */}
      {confirmDialog && (
        <ConfirmDialog
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmText={confirmDialog.confirmText}
          confirmStyle={confirmDialog.confirmStyle}
          requiresConfirmation={confirmDialog.requiresConfirmation}
          confirmationText={confirmDialog.confirmationText}
          onConfirm={confirmDialog.onConfirm}
          onCancel={confirmDialog.onCancel}
        />
      )}
    </motion.div>
  );
};

export default Settings;