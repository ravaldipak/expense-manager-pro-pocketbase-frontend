import { format } from 'date-fns';

class ExportService {
  /**
   * Export transactions to CSV format
   */
  exportTransactionsToCSV(transactions, settings = {}) {
    if (!transactions || transactions.length === 0) {
      throw new Error('No transactions to export');
    }

    const currency = settings.currency || 'AUD';
    
    // CSV headers
    const headers = [
      'Date',
      'Type',
      'Amount',
      'Category',
      'Payee',
      'Notes',
      'Tags',
      'Account',
      'Person',
      'Status',
      'Created At',
      'Updated At'
    ];

    // Convert transactions to CSV rows
    const rows = transactions.map(transaction => [
      format(new Date(transaction.date), 'yyyy-MM-dd'),
      transaction.type,
      transaction.amount,
      transaction.category || '',
      transaction.payee || '',
      transaction.notes || '',
      Array.isArray(transaction.tags) ? transaction.tags.join('; ') : (transaction.tags || ''),
      transaction.account || '',
      transaction.person || '',
      transaction.status || 'posted',
      transaction.createdAt ? format(new Date(transaction.createdAt), 'yyyy-MM-dd HH:mm:ss') : '',
      transaction.updatedAt ? format(new Date(transaction.updatedAt), 'yyyy-MM-dd HH:mm:ss') : ''
    ]);

    // Combine headers and rows
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    return csvContent;
  }

  /**
   * Export transactions to JSON format
   */
  exportTransactionsToJSON(transactions, settings = {}) {
    if (!transactions || transactions.length === 0) {
      throw new Error('No transactions to export');
    }

    const exportData = {
      exportDate: new Date().toISOString(),
      version: '2.0.0',
      currency: settings.currency || 'AUD',
      totalTransactions: transactions.length,
      summary: this.generateTransactionsSummary(transactions),
      transactions: transactions.map(transaction => ({
        ...transaction,
        // Ensure dates are properly formatted
        date: format(new Date(transaction.date), 'yyyy-MM-dd'),
        createdAt: transaction.createdAt ? new Date(transaction.createdAt).toISOString() : null,
        updatedAt: transaction.updatedAt ? new Date(transaction.updatedAt).toISOString() : null,
      }))
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Generate summary statistics for transactions
   */
  generateTransactionsSummary(transactions) {
    const income = transactions.filter(t => t.type === 'income');
    const expenses = transactions.filter(t => t.type === 'expense');
    
    const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
    
    const categories = [...new Set(transactions.map(t => t.category))];
    const dateRange = {
      earliest: transactions.reduce((earliest, t) => 
        !earliest || new Date(t.date) < new Date(earliest) ? t.date : earliest, null),
      latest: transactions.reduce((latest, t) => 
        !latest || new Date(t.date) > new Date(latest) ? t.date : latest, null)
    };

    return {
      totalIncome,
      totalExpenses,
      netAmount: totalIncome - totalExpenses,
      incomeTransactions: income.length,
      expenseTransactions: expenses.length,
      uniqueCategories: categories.length,
      categories,
      dateRange,
      averageTransactionAmount: transactions.length > 0 ? 
        (totalIncome + totalExpenses) / transactions.length : 0
    };
  }

  /**
   * Download file to user's device
   */
  async downloadFile(content, filename, contentType = 'text/plain') {
    const blob = new Blob([content], { type: contentType });

    // Check if File System Access API is available (Chrome/Edge)
    if ('showSaveFilePicker' in window) {
      try {
        const fileExtension = filename.split('.').pop();
        const fileHandle = await window.showSaveFilePicker({
          suggestedName: filename,
          types: [{
            description: `${fileExtension.toUpperCase()} files`,
            accept: { [contentType]: [`.${fileExtension}`] },
          }],
        });
        
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
        
        return { success: true, method: 'fileSystemAccess' };
      } catch (err) {
        if (err.name === 'AbortError') {
          return { success: false, cancelled: true };
        }
        // Fall through to traditional download
      }
    }

    // Fallback for other browsers or if File System Access fails
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    return { success: true, method: 'traditional' };
  }

  /**
   * Generate filename with timestamp
   */
  generateFilename(prefix, extension, includeTimestamp = true) {
    const timestamp = includeTimestamp ? 
      `-${format(new Date(), 'yyyy-MM-dd-HHmm')}` : '';
    return `${prefix}${timestamp}.${extension}`;
  }

  /**
   * Export transactions with format selection
   */
  async exportTransactions(transactions, format = 'csv', settings = {}) {
    if (!transactions || transactions.length === 0) {
      throw new Error('No transactions to export');
    }

    let content, contentType, filename;

    switch (format.toLowerCase()) {
      case 'csv':
        content = this.exportTransactionsToCSV(transactions, settings);
        contentType = 'text/csv';
        filename = this.generateFilename('transactions', 'csv');
        break;
        
      case 'json':
        content = this.exportTransactionsToJSON(transactions, settings);
        contentType = 'application/json';
        filename = this.generateFilename('transactions', 'json');
        break;
        
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }

    const result = await this.downloadFile(content, filename, contentType);
    
    if (result.success) {
      return {
        success: true,
        filename,
        format,
        transactionCount: transactions.length,
        method: result.method
      };
    } else if (result.cancelled) {
      return {
        success: false,
        cancelled: true
      };
    } else {
      throw new Error('Failed to download file');
    }
  }

  /**
   * Export filtered transactions from UI state
   */
  async exportFilteredTransactions(allTransactions, filters, selectedTransactions, format = 'csv', settings = {}) {
    // Determine which transactions to export
    let transactionsToExport;
    
    if (selectedTransactions && selectedTransactions.length > 0) {
      // Export only selected transactions
      transactionsToExport = allTransactions.filter(t => 
        selectedTransactions.includes(t.id)
      );
    } else {
      // Export all filtered transactions
      transactionsToExport = this.applyFilters(allTransactions, filters);
    }

    if (transactionsToExport.length === 0) {
      throw new Error('No transactions match the current filters');
    }

    return this.exportTransactions(transactionsToExport, format, settings);
  }

  /**
   * Apply filters to transactions (same logic as in Transactions component)
   */
  applyFilters(transactions, filters) {
    return transactions.filter(transaction => {
      // Date range filter
      if (filters.dateRange) {
        const transactionDate = new Date(transaction.date);
        const { start, end } = filters.dateRange;
        if (transactionDate < start || transactionDate > end) {
          return false;
        }
      }

      // Category filter
      if (filters.category && transaction.category !== filters.category) {
        return false;
      }

      // Person filter
      if (filters.person && transaction.person !== filters.person) {
        return false;
      }

      // Type filter
      if (filters.type && transaction.type !== filters.type) {
        return false;
      }

      // Search text filter
      if (filters.searchText) {
        const searchLower = filters.searchText.toLowerCase();
        const searchableText = [
          transaction.payee,
          transaction.notes,
          transaction.category,
          Array.isArray(transaction.tags) ? transaction.tags.join(' ') : transaction.tags,
        ].join(' ').toLowerCase();
        
        if (!searchableText.includes(searchLower)) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Export categories to CSV
   */
  exportCategoriesToCSV(categories) {
    if (!categories || categories.length === 0) {
      throw new Error('No categories to export');
    }

    const headers = ['Name', 'Type', 'Color', 'Icon', 'Created At', 'Updated At'];
    
    const rows = categories.map(category => [
      category.name,
      category.type,
      category.color || '',
      category.icon || '',
      category.createdAt ? format(new Date(category.createdAt), 'yyyy-MM-dd HH:mm:ss') : '',
      category.updatedAt ? format(new Date(category.updatedAt), 'yyyy-MM-dd HH:mm:ss') : ''
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    return csvContent;
  }

  /**
   * Export budgets to CSV
   */
  exportBudgetsToCSV(budgets) {
    if (!budgets || budgets.length === 0) {
      throw new Error('No budgets to export');
    }

    const headers = ['Category', 'Amount', 'Period', 'Start Date', 'End Date', 'Created At', 'Updated At'];
    
    const rows = budgets.map(budget => [
      budget.category,
      budget.amount,
      budget.period || 'monthly',
      budget.startDate ? format(new Date(budget.startDate), 'yyyy-MM-dd') : '',
      budget.endDate ? format(new Date(budget.endDate), 'yyyy-MM-dd') : '',
      budget.createdAt ? format(new Date(budget.createdAt), 'yyyy-MM-dd HH:mm:ss') : '',
      budget.updatedAt ? format(new Date(budget.updatedAt), 'yyyy-MM-dd HH:mm:ss') : ''
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    return csvContent;
  }
}

export const exportService = new ExportService();