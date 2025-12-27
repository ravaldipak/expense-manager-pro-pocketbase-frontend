import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useApp } from '../contexts/AppContext';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import ledgerService from '../services/ledgerService';
import iouService from '../services/iouService';
import peopleService from '../services/peopleService';

const {
  FiArrowLeft,
  FiUser,
  FiDollarSign,
  FiPlus,
  FiMinus,
  FiRefreshCw,
  FiMail,
  FiPhone,
  FiCalendar,
  FiFilter,
  FiDownload,
  FiCheck,
} = FiIcons;

const PersonProfile = () => {
  const { id } = useParams();
  const { state } = useApp();
  const { people, transactions, settings } = state;
  const [showAddIOU, setShowAddIOU] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [ledgerData, setLedgerData] = useState({ currentBalance: 0, ledgerEntries: [] });
  const [availableCollections, setAvailableCollections] = useState({});
  const [selectedCollections, setSelectedCollections] = useState(['ious']);
  const [isLoadingLedger, setIsLoadingLedger] = useState(false);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [personBalance, setPersonBalance] = useState(0);
  const [filters, setFilters] = useState({
    dateRange: null,
    type: '',
  });

  const person = people.find(p => p.id === id);

  // Load available collections on component mount
  useEffect(() => {
    const loadCollections = async () => {
      try {
        const collections = await ledgerService.getAvailableCollections();
        setAvailableCollections(collections);
      } catch (error) {
        console.error('Error loading collections:', error);
      }
    };
    loadCollections();
  }, []);

  // Person balance is derived from ledger fetch below

  // Load ledger data when person or selected collections change
  useEffect(() => {
    let isCancelled = false;
    
    const loadLedgerData = async () => {
      if (!person) {
        console.log('No person selected, skipping ledger data load');
        return;
      }
      
      console.log('Loading IOU ledger data for person:', person.name, 'Filters:', filters);
      setIsLoadingLedger(true);
      try {
        // Get IOU ledger data only
        console.log('Loading IOU data for person ID:', person.id);
        const iouLedgerData = await iouService.getPersonLedger(person.id, filters);
        console.log('IOU ledger data:', iouLedgerData);
        
        console.log('Final IOU ledger data:', iouLedgerData);
        
        if (!isCancelled) {
          setLedgerData(iouLedgerData);
          setPersonBalance(iouLedgerData.currentBalance);
        }
      } catch (error) {
        if (!isCancelled && !error.isAbort) {
          console.error('Error loading ledger data:', error);
          setLedgerData({ currentBalance: 0, ledgerEntries: [] });
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingLedger(false);
        }
      }
    };
    
    loadLedgerData();
    
    return () => {
      isCancelled = true;
    };
  }, [person, selectedCollections, filters]);

  // Get current balance and ledger entries from state
  const { currentBalance, ledgerEntries } = ledgerData;

  if (!person) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Person not found</h2>
        <Link
          to="/people"
          className="text-primary-600 hover:text-primary-700"
        >
          Back to People
        </Link>
      </div>
    );
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: settings?.currency || 'USD',
    }).format(amount);
  };

  const getBalanceDisplay = (balance) => {
    const absBalance = Math.abs(balance);
    const formattedAmount = formatCurrency(absBalance);
    
    if (balance > 0) {
      return {
        amount: formattedAmount,
        label: `${person?.name} owes you`,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
      };
    } else if (balance < 0) {
      return {
        amount: formattedAmount,
        label: `You owe ${person?.name}`,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200'
      };
    } else {
      return {
        amount: formatCurrency(0),
        label: 'All settled up',
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200'
      };
    }
  };

  // Use personBalance instead of ledgerData.currentBalance for display
  const balanceDisplay = getBalanceDisplay(personBalance);

  const handleSettlement = async () => {
    if (!person || personBalance === 0) return;
    
    try {
      setIsLoadingBalance(true);
      await iouService.settleBalance(person.id);
      
      // Reload balance and ledger data after settlement
      const newBalance = await iouService.calculatePersonBalance(person.id);
      setPersonBalance(newBalance);
      
      // Reload ledger data
      if (selectedCollections.includes('ious')) {
        const iouLedgerData = await iouService.getPersonLedger(person.id, filters);
        setLedgerData(prevData => ({
          ...iouLedgerData,
          ledgerEntries: [
            ...iouLedgerData.ledgerEntries,
            ...prevData.ledgerEntries.filter(entry => entry.source !== 'ious')
          ].sort((a, b) => new Date(a.date) - new Date(b.date))
        }));
      }
    } catch (error) {
      console.error('Error settling balance:', error);
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const animationProps = settings.reducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.3 },
      };

  return (
    <motion.div className="space-y-6" {...animationProps}>
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          to="/people"
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
        >
          <SafeIcon icon={FiArrowLeft} className="w-5 h-5" />
        </Link>
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-12 h-12 bg-primary-100 rounded-full">
            <SafeIcon icon={FiUser} className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{person.name}</h1>
            {person.shortName && person.shortName !== person.name && (
              <p className="text-gray-600">({person.shortName})</p>
            )}
          </div>
        </div>
      </div>

      {/* Person Info & Balance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Person Details */}
        <motion.div
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          {...animationProps}
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Info</h2>
          <div className="space-y-3">
            {person.contact && (
              <div className="flex items-center text-sm">
                <SafeIcon 
                  icon={person.contact.includes('@') ? FiMail : FiPhone} 
                  className="w-4 h-4 mr-3 text-gray-400" 
                />
                <span className="text-gray-900">{person.contact}</span>
              </div>
            )}
            <div className="flex items-center text-sm">
              <SafeIcon icon={FiCalendar} className="w-4 h-4 mr-3 text-gray-400" />
              <span className="text-gray-600">
                Added {format(new Date(person.createdAt), 'MMM d, yyyy')}
              </span>
            </div>
            {person.notes && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700 italic">"{person.notes}"</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Current Balance */}
        <motion.div
          className={`rounded-lg shadow-sm border border-gray-200 p-6 ${balanceDisplay.bgColor}`}
          {...animationProps}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Running Balance</h2>
            <SafeIcon icon={FiDollarSign} className={`w-6 h-6 ${balanceDisplay.color}`} />
          </div>
          <p className={`text-3xl font-bold ${balanceDisplay.color} mb-2`}>
            {balanceDisplay.amount}
          </p>
          <p className={`text-sm ${balanceDisplay.color} mb-4`}>
            {balanceDisplay.label}
          </p>
          {personBalance !== 0 && (
            <button
              onClick={handleSettlement}
              className="w-full flex items-center justify-center px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg font-medium transition-colors duration-200"
            >
              <SafeIcon icon={FiCheck} className="w-4 h-4 mr-2" />
              Settle Balance
            </button>
          )}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          {...animationProps}
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button
              onClick={() => setShowAddIOU(true)}
              className="w-full flex items-center justify-center px-4 py-2 bg-success-100 hover:bg-success-200 text-success-700 rounded-lg font-medium transition-colors duration-200"
            >
              <SafeIcon icon={FiPlus} className="w-4 h-4 mr-2" />
              You Lent Money
            </button>
            <button
              onClick={() => setShowAddIOU(true)}
              className="w-full flex items-center justify-center px-4 py-2 bg-danger-100 hover:bg-danger-200 text-danger-700 rounded-lg font-medium transition-colors duration-200"
            >
              <SafeIcon icon={FiMinus} className="w-4 h-4 mr-2" />
              You Borrowed Money
            </button>
            <button
              onClick={() => setShowAddIOU(true)}
              className="w-full flex items-center justify-center px-4 py-2 bg-primary-100 hover:bg-primary-200 text-primary-700 rounded-lg font-medium transition-colors duration-200"
            >
              <SafeIcon icon={FiRefreshCw} className="w-4 h-4 mr-2" />
              Record Repayment
            </button>
          </div>
        </motion.div>
      </div>

      {/* Ledger */}
      <motion.div
        className="bg-white rounded-lg shadow-sm border border-gray-200"
        {...animationProps}
      >
        {/* Ledger Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Transaction Ledger</h2>
            <div className="flex items-center space-x-3 mt-4 sm:mt-0">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                  showFilters
                    ? 'bg-primary-100 text-primary-700 border border-primary-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <SafeIcon icon={FiFilter} className="w-4 h-4 mr-2" />
                Filters
              </button>
              <button className="flex items-center px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors duration-200">
                <SafeIcon icon={FiDownload} className="w-4 h-4 mr-2" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <motion.div
            className="px-6 py-4 border-b border-gray-200 bg-gray-50"
            {...animationProps}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  IOU Type
                </label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">All IOUs</option>
                  <option value="borrowed">Money borrowed from you</option>
                  <option value="repaid">Money repaid to you</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data Collections
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {Object.keys(availableCollections).map((collectionName) => (
                    <label key={collectionName} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedCollections.includes(collectionName)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCollections(prev => [...prev, collectionName]);
                          } else {
                            setSelectedCollections(prev => prev.filter(c => c !== collectionName));
                          }
                        }}
                        className="mr-2 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">
                        {availableCollections[collectionName]?.name || collectionName}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Collection Info
                </label>
                <div className="text-xs text-gray-600 space-y-1 max-h-32 overflow-y-auto">
                  {selectedCollections.map((collectionName) => {
                    const collection = availableCollections[collectionName];
                    return (
                      <div key={collectionName} className="border-l-2 border-primary-200 pl-2">
                        <div className="font-medium">{collection?.name || collectionName}</div>
                        <div className="text-gray-500">
                          Fields: {collection?.fields ? Object.keys(collection.fields).join(', ') : 'Loading...'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Ledger Entries */}
        <div className="overflow-x-auto">
          {/* Desktop Table */}
          <div className="hidden lg:block">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Balance
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoadingLedger ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                      Loading ledger entries...
                    </td>
                  </tr>
                ) : ledgerEntries.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                      No ledger entries found
                    </td>
                  </tr>
                ) : (
                  ledgerEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {format(new Date(entry.date), 'MMM d, yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          {entry.collectionName || 'transactions'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          entry.balanceEffect > 0
                            ? 'bg-danger-100 text-danger-800'
                            : 'bg-success-100 text-success-800'
                        }`}>
                          {entry.balanceEffect > 0 ? 'Borrowed' : 'Repaid'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${
                          entry.balanceEffect > 0 ? 'text-danger-600' : 'text-success-600'
                        }`}>
                          {entry.balanceEffect > 0 ? '+' : ''}{formatCurrency(entry.balanceEffect)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                        {entry.notes || entry.category || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(entry.runningBalance)}
                        {entry.runningBalance > 0 && (
                          <span className="text-xs text-danger-600 ml-1">(owes you)</span>
                        )}
                        {entry.runningBalance < 0 && (
                          <span className="text-xs text-success-600 ml-1">(you owe)</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List */}
          <div className="lg:hidden space-y-4 p-4">
            {ledgerEntries.map((entry) => (
              <div
                key={entry.id}
                className="bg-white border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-900">
                    {format(new Date(entry.date), 'MMM d, yyyy')}
                  </span>
                  <span className={`text-lg font-bold ${
                    entry.balanceEffect > 0 ? 'text-danger-600' : 'text-success-600'
                  }`}>
                    {entry.balanceEffect > 0 ? '+' : ''}{formatCurrency(entry.balanceEffect)}
                  </span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Type:</span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      entry.balanceEffect > 0
                        ? 'bg-danger-100 text-danger-800'
                        : 'bg-success-100 text-success-800'
                    }`}>
                      {entry.balanceEffect > 0 ? 'Borrowed' : 'Repaid'}
                    </span>
                  </div>
                  
                  {(entry.notes || entry.category) && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Notes:</span>
                      <span className="text-sm font-medium truncate ml-2">
                        {entry.notes || entry.category}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                    <span className="text-sm text-gray-600">Running Balance:</span>
                    <div className="text-right">
                      <span className="text-sm font-bold text-gray-900">
                        {formatCurrency(entry.runningBalance)}
                      </span>
                      {entry.runningBalance !== 0 && (
                        <p className={`text-xs ${
                          entry.runningBalance > 0 ? 'text-danger-600' : 'text-success-600'
                        }`}>
                          {entry.runningBalance > 0 ? 'owes you' : 'you owe'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Empty State */}
        {ledgerEntries.length === 0 && (
          <div className="text-center py-12">
            <SafeIcon icon={FiDollarSign} className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions yet</h3>
            <p className="text-gray-600 mb-4">
              Start tracking IOUs with {person.name} by adding your first transaction.
            </p>
            <button
              onClick={() => setShowAddIOU(true)}
              className="inline-flex items-center px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors duration-200"
            >
              <SafeIcon icon={FiPlus} className="w-4 h-4 mr-2" />
              Add IOU
            </button>
          </div>
        )}
      </motion.div>

      {/* Add IOU Modal */}
      {showAddIOU && (
        <AddIOUForm
          person={person}
          onClose={() => setShowAddIOU(false)}
          onSave={async (iou) => {
            try {
              await iouService.createIOU(iou);

              // Reload ledger (also updates balance)
              if (selectedCollections.includes('ious')) {
                const iouLedgerData = await iouService.getPersonLedger(person.id, filters);
                setLedgerData(iouLedgerData);
                setPersonBalance(iouLedgerData.currentBalance);
              }

              setShowAddIOU(false);
            } catch (error) {
              console.error('Error creating IOU:', error);
            }
          }}
        />
      )}
    </motion.div>
  );
};

// Add IOU Form Component
const AddIOUForm = ({ person, onClose, onSave }) => {
  const { state } = useApp();
  const { settings } = state;
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'you_lent',
    amount: '',
    notes: '',
    createTransaction: false,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.amount) {
      return;
    }

    // Normalize payload for PocketBase IOU collection
    const normalizeType = (t) => {
      if (t === 'you_lent') return 'you_lent';
      if (t === 'you_borrowed') return 'you_borrowed';
      // Treat repayment as money received from the person (reduces balance)
      return 'repayment_received';
    };

    const iou = {
      person: person.id,
      amount: parseFloat(formData.amount),
      type: normalizeType(formData.type),
      notes: formData.notes,
      date: formData.date,
      status: 'active',
    };

    await onSave(iou);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const animationProps = settings.reducedMotion
    ? {}
    : {
        initial: { opacity: 0, scale: 0.9 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.9 },
        transition: { duration: 0.3 },
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
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Add IOU with {person.name}
          </h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleChange('date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => handleChange('amount', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type *
            </label>
            <select
              value={formData.type}
              onChange={(e) => handleChange('type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="you_lent">You lent money to {person.name}</option>
              <option value="you_borrowed">You borrowed money from {person.name}</option>
              <option value="repayment">Repayment</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Optional notes about this IOU..."
            />
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.createTransaction}
                onChange={(e) => handleChange('createTransaction', e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                Also create a linked transaction
              </span>
            </label>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!formData.amount}
            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors duration-200"
          >
            Add IOU
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PersonProfile;