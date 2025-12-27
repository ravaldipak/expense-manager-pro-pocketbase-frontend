import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../contexts/AppContext';
import { backupService } from '../services/backupService';
import { settingsService } from '../services/settingsService';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiHardDrive, FiFolderOpen } = FiIcons;

const BackupStatus = () => {
  const { state } = useApp();
  const { settings } = state;
  const [backupStatus, setBackupStatus] = useState('up-to-date');
  const [showTooltip, setShowTooltip] = useState(false);
  const [lastBackup, setLastBackup] = useState(null);
  const [nextBackup, setNextBackup] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => {
      // updateBackupStatus();
    }, 60000); // Update every minute

    // updateBackupStatus();
    return () => clearInterval(interval);
  }, []);

  const updateBackupStatus = async () => {
    try {
      const lastBackupTime = await settingsService.getSettings('lastBackup');
      setLastBackup(lastBackupTime);

      if (!lastBackupTime) {
        setBackupStatus('overdue');
        return;
      }

      const now = new Date();
      const lastBackupDate = new Date(lastBackupTime);
      const timeDiff = now - lastBackupDate;
      const minutesDiff = Math.floor(timeDiff / (1000 * 60));

      if (minutesDiff > 15) {
        setBackupStatus('overdue');
      } else if (minutesDiff > 10) {
        setBackupStatus('warning');
      } else {
        setBackupStatus('up-to-date');
      }

      // Calculate next backup time
      const nextBackupTime = new Date(lastBackupDate.getTime() + (15 * 60 * 1000));
      setNextBackup(nextBackupTime);
    } catch (error) {
      console.error('Failed to update backup status:', error);
      setBackupStatus('error');
    }
  };

  const performBackup = async () => {
    try {
      const data = await backupService.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });

      const filename = `expense-manager-backup-${new Date().toISOString().split('T')[0]}.json`;
      
      // Check if File System Access API is available (Chromium browsers)
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
          setBackupStatus('up-to-date');
          updateBackupStatus();
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
        setBackupStatus('up-to-date');
        updateBackupStatus();
      }
    } catch (error) {
      console.error('Backup failed:', error);
      setBackupStatus('error');
    }
  };

  const getStatusColor = () => {
    switch (backupStatus) {
      case 'up-to-date':
        return 'text-success-500';
      case 'warning':
        return 'text-warning-500';
      case 'overdue':
        return 'text-danger-500';
      case 'error':
        return 'text-danger-600';
      default:
        return 'text-gray-500';
    }
  };

  const getTooltipContent = () => {
    const formatTime = (date) => {
      return date ? new Date(date).toLocaleString('en-AU') : 'Never';
    };

    const getCountdown = () => {
      if (!nextBackup) return 'Unknown';
      const now = new Date();
      const diff = nextBackup - now;
      if (diff <= 0) return 'Overdue';
      
      const minutes = Math.floor(diff / (1000 * 60));
      const hours = Math.floor(minutes / 60);
      
      if (hours > 0) {
        return `${hours}h ${minutes % 60}m`;
      }
      return `${minutes}m`;
    };

    return (
      <div className="text-xs space-y-1">
        <div>Last backup: {formatTime(lastBackup)}</div>
        <div>Next backup: {getCountdown()}</div>
        <div>Status: {backupStatus.replace('-', ' ')}</div>
        {settings.backupFolder && (
          <div>Folder: {settings.backupFolder}</div>
        )}
        {'showDirectoryPicker' in window && settings.backupFolder && (
          <button
            onClick={async () => {
              try {
                const dirHandle = await window.showDirectoryPicker();
                // Open folder logic here
              } catch (err) {
                console.error('Failed to open folder:', err);
              }
            }}
            className="flex items-center mt-2 px-2 py-1 bg-primary-500 text-white rounded text-xs hover:bg-primary-600"
          >
            <SafeIcon icon={FiFolderOpen} className="w-3 h-3 mr-1" />
            Open Folder
          </button>
        )}
      </div>
    );
  };

  const animationProps = settings.reducedMotion
    ? {}
    : {
        initial: { scale: 0 },
        animate: { scale: 1 },
        whileHover: { scale: 1.1 },
        transition: { duration: 0.2 },
      };

  return (
    <div className="fixed bottom-6 left-6 z-30">
      <div className="relative">
        <motion.button
          onClick={performBackup}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className={`w-12 h-12 rounded-full shadow-lg focus:outline-none focus:ring-4 focus:ring-primary-300 ${getStatusColor()} bg-white border-2 border-current`}
          {...animationProps}
        >
          <SafeIcon icon={FiHardDrive} className="w-5 h-5 mx-auto" />
        </motion.button>

        {/* Tooltip */}
        {showTooltip && (
          <motion.div
            className="absolute bottom-full left-0 mb-2 p-3 bg-gray-900 text-white rounded-lg shadow-lg whitespace-nowrap"
            initial={settings.reducedMotion ? {} : { opacity: 0, y: 10 }}
            animate={settings.reducedMotion ? {} : { opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {getTooltipContent()}
            <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default BackupStatus;