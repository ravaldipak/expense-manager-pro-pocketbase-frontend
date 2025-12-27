import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { exportService } from '../services/exportService';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiX, FiDownload, FiFileText, FiDatabase, FiCheck } = FiIcons;

const ExportDialog = ({ 
  transactions, 
  filters, 
  selectedTransactions, 
  settings, 
  onClose 
}) => {
  const [exportFormat, setExportFormat] = useState('csv');
  const [exportScope, setExportScope] = useState('filtered');
  const [isExporting, setIsExporting] = useState(false);
  const [exportResult, setExportResult] = useState(null);

  // Calculate what will be exported
  const getExportPreview = () => {
    if (exportScope === 'selected' && selectedTransactions?.length > 0) {
      return {
        count: selectedTransactions.length,
        description: `${selectedTransactions.length} selected transactions`
      };
    } else if (exportScope === 'all') {
      return {
        count: transactions.length,
        description: `All ${transactions.length} transactions`
      };
    } else {
      // Filtered transactions
      const filtered = exportService.applyFilters(transactions, filters);
      return {
        count: filtered.length,
        description: `${filtered.length} filtered transactions`
      };
    }
  };

  const preview = getExportPreview();

  const handleExport = async () => {
    if (preview.count === 0) {
      setExportResult({
        success: false,
        error: 'No transactions to export'
      });
      return;
    }

    setIsExporting(true);
    setExportResult(null);

    try {
      let transactionsToExport;

      if (exportScope === 'selected' && selectedTransactions?.length > 0) {
        transactionsToExport = transactions.filter(t => 
          selectedTransactions.includes(t.id)
        );
      } else if (exportScope === 'all') {
        transactionsToExport = transactions;
      } else {
        transactionsToExport = exportService.applyFilters(transactions, filters);
      }

      const result = await exportService.exportTransactions(
        transactionsToExport, 
        exportFormat, 
        settings
      );

      if (result.success) {
        setExportResult({
          success: true,
          filename: result.filename,
          count: result.transactionCount,
          format: result.format
        });
      } else if (result.cancelled) {
        setExportResult({
          success: false,
          cancelled: true
        });
      }
    } catch (error) {
      console.error('Export failed:', error);
      setExportResult({
        success: false,
        error: error.message
      });
    } finally {
      setIsExporting(false);
    }
  };

  const animationProps = settings?.reducedMotion
    ? {}
    : {
        initial: { opacity: 0, scale: 0.9 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.9 },
        transition: { duration: 0.2 },
      };

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
      {...animationProps}
    >
      <motion.div
        className="bg-white rounded-lg shadow-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
        layout={!settings?.reducedMotion}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Export Transactions</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors duration-200"
            type="button"
          >
            <SafeIcon icon={FiX} className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Export Scope */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What to export
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="filtered"
                  checked={exportScope === 'filtered'}
                  onChange={(e) => setExportScope(e.target.value)}
                  className="mr-2 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Current filtered view</span>
              </label>
              
              {selectedTransactions?.length > 0 && (
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="selected"
                    checked={exportScope === 'selected'}
                    onChange={(e) => setExportScope(e.target.value)}
                    className="mr-2 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">Selected transactions only</span>
                </label>
              )}
              
              <label className="flex items-center">
                <input
                  type="radio"
                  value="all"
                  checked={exportScope === 'all'}
                  onChange={(e) => setExportScope(e.target.value)}
                  className="mr-2 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">All transactions</span>
              </label>
            </div>
          </div>

          {/* Export Format */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Export format
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setExportFormat('csv')}
                className={`flex items-center justify-center p-3 border rounded-lg transition-colors duration-200 ${
                  exportFormat === 'csv'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <SafeIcon icon={FiFileText} className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">CSV</span>
              </button>
              <button
                onClick={() => setExportFormat('json')}
                className={`flex items-center justify-center p-3 border rounded-lg transition-colors duration-200 ${
                  exportFormat === 'json'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <SafeIcon icon={FiDatabase} className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">JSON</span>
              </button>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-1">Export Preview</h4>
            <p className="text-sm text-gray-600">{preview.description}</p>
            <p className="text-xs text-gray-500 mt-1">
              Format: {exportFormat.toUpperCase()}
              {exportFormat === 'csv' && ' (Excel compatible)'}
              {exportFormat === 'json' && ' (with summary statistics)'}
            </p>
          </div>

          {/* Export Result */}
          {exportResult && (
            <div className={`p-3 rounded-lg ${
              exportResult.success 
                ? 'bg-success-100 text-success-700 border border-success-200'
                : exportResult.cancelled
                ? 'bg-warning-100 text-warning-700 border border-warning-200'
                : 'bg-danger-100 text-danger-700 border border-danger-200'
            }`}>
              <div className="flex items-center">
                {exportResult.success && <SafeIcon icon={FiCheck} className="w-4 h-4 mr-2" />}
                <span className="text-sm">
                  {exportResult.success && `Successfully exported ${exportResult.count} transactions to ${exportResult.filename}`}
                  {exportResult.cancelled && 'Export cancelled by user'}
                  {exportResult.error && `Export failed: ${exportResult.error}`}
                </span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors duration-200"
            >
              {exportResult?.success ? 'Close' : 'Cancel'}
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting || preview.count === 0}
              className="flex-1 px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors duration-200"
            >
              {isExporting ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Exporting...
                </div>
              ) : (
                <>
                  <SafeIcon icon={FiDownload} className="w-4 h-4 mr-2" />
                  Export {preview.count} Transactions
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ExportDialog;