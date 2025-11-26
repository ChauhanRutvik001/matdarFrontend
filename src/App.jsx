import React, { useState, useMemo, useEffect } from 'react';
import { Download, Search, Filter } from 'lucide-react';

// API URL resolution:
// - Use Vite env `VITE_API_URL` if set (recommended when accessing from mobile)
// - Otherwise fall back to http://<current-host>:5000/api so mobile devices accessing the app
//   via the machine IP will use the correct backend host.
const DEFAULT_API_PORT = 5000;
const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:${DEFAULT_API_PORT}/api`;

export default function AdvancedNumberStatusTracker() {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [recentChanges, setRecentChanges] = useState([]);

  // Fetch data from MongoDB on component mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/numbers`);
      const numbers = await response.json();
      
      // Convert array to object format with all fields
      const dataObject = {};
      numbers.forEach(item => {
        dataObject[item.number] = { 
          status: item.status, 
          name: item.name,
          doneDate: item.doneDate,
          deadSubStatus: item.deadSubStatus,
          deadDoneDate: item.deadDoneDate,
          resettleSubStatus: item.resettleSubStatus,
          resettleDoneDate: item.resettleDoneDate,
          pendingSubStatus: item.pendingSubStatus,
          pendingDoneDate: item.pendingDoneDate,
          duplicatesSubStatus: item.duplicatesSubStatus,
          duplicatesDoneDate: item.duplicatesDoneDate
        };
      });
      
      setData(dataObject);
    } catch (error) {
      console.error('Error fetching data:', error);
      // Fallback to localStorage or initialize
      const saved = localStorage.getItem('numberStatusData');
      if (saved) {
        try {
          setData(JSON.parse(saved));
        } catch (e) {
          initializeDefaultData();
        }
      } else {
        initializeDefaultData();
      }
    } finally {
      setLoading(false);
    }
  };

  const initializeDefaultData = () => {
    const initial = {};
    for (let i = 1; i <= 1421; i++) {
      initial[i] = { 
        status: 'no', 
        name: '', 
        doneDate: null,
        deadSubStatus: null,
        deadDoneDate: null,
        resettleSubStatus: null,
        resettleDoneDate: null,
        pendingSubStatus: null,
        pendingDoneDate: null,
        duplicatesSubStatus: null,
        duplicatesDoneDate: null
      };
    }
    setData(initial);
  };

  // Save to localStorage as backup
  useEffect(() => {
    if (Object.keys(data).length > 0) {
      localStorage.setItem('numberStatusData', JSON.stringify(data));
    }
  }, [data]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [rangeInput, setRangeInput] = useState('');
  const [bulkStatus, setBulkStatus] = useState('done');
  const [editingDate, setEditingDate] = useState({});
  const [dateFilterType, setDateFilterType] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const statusOptions = [
    { value: 'done', label: 'Done', bg: 'bg-green-100', badge: 'bg-green-600' },
    { value: 'no', label: 'No', bg: 'bg-red-100', badge: 'bg-red-600' },
    { value: 'pending', label: 'Pending', bg: 'bg-yellow-100', badge: 'bg-yellow-600' },
    { value: 'dead', label: 'Dead', bg: 'bg-gray-100', badge: 'bg-gray-600' },
    { value: 'resettle', label: 'Resettle', bg: 'bg-blue-100', badge: 'bg-blue-600' },
    { value: 'duplicates', label: 'Duplicates', bg: 'bg-purple-100', badge: 'bg-purple-600' }
  ];

  const addToRecentChanges = (number) => {
    setRecentChanges(prev => {
      const filtered = prev.filter(n => n !== number);
      return [number, ...filtered].slice(0, 5);
    });
  };

  const updateStatus = async (number, newStatus, customDate = null) => {
    const currentData = data[number] || {};
    
    // Add to recent changes
    addToRecentChanges(number);
    
    // Optimistically update UI
    const updatedItem = { 
      ...currentData, 
      status: newStatus,
      doneDate: newStatus === 'done' ? (customDate || new Date().toISOString()) : null,
      deadSubStatus: newStatus === 'dead' ? currentData.deadSubStatus : null,
      deadDoneDate: newStatus === 'dead' ? currentData.deadDoneDate : null,
      resettleSubStatus: newStatus === 'resettle' ? currentData.resettleSubStatus : null,
      resettleDoneDate: newStatus === 'resettle' && currentData.resettleSubStatus === 'done' ? currentData.resettleDoneDate : null,
      pendingSubStatus: newStatus === 'pending' ? currentData.pendingSubStatus : null,
      pendingDoneDate: newStatus === 'pending' && currentData.pendingSubStatus === 'done' ? currentData.pendingDoneDate : null,
      duplicatesSubStatus: newStatus === 'duplicates' ? currentData.duplicatesSubStatus : null,
      duplicatesDoneDate: newStatus === 'duplicates' && currentData.duplicatesSubStatus === 'done' ? currentData.duplicatesDoneDate : null
    };
    
    setData(prev => ({
      ...prev,
      [number]: updatedItem
    }));

    // Save to backend without waiting for response
    fetch(`${API_URL}/numbers/${number}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        status: newStatus, 
        name: currentData.name || '',
        deadSubStatus: updatedItem.deadSubStatus,
        deadDoneDate: updatedItem.deadDoneDate,
        resettleSubStatus: updatedItem.resettleSubStatus,
        resettleDoneDate: updatedItem.resettleDoneDate,
        pendingSubStatus: updatedItem.pendingSubStatus,
        pendingDoneDate: updatedItem.pendingDoneDate,
        duplicatesSubStatus: updatedItem.duplicatesSubStatus,
        duplicatesDoneDate: updatedItem.duplicatesDoneDate,
        doneDate: updatedItem.doneDate
      })
    }).catch(error => {
      console.error('Error updating status:', error);
    });
  };

  const updateSubStatus = async (number, subStatus, type, customDate = null) => {
    const currentData = data[number] || {};
    
    // Add to recent changes
    addToRecentChanges(number);
    
    // Optimistically update UI
    const updatedItem = { 
      ...currentData,
      [type === 'dead' ? 'deadSubStatus' : type === 'resettle' ? 'resettleSubStatus' : type === 'pending' ? 'pendingSubStatus' : 'duplicatesSubStatus']: subStatus,
      deadDoneDate: type === 'dead' && subStatus === 'done' ? (customDate || new Date().toISOString()) : (type === 'dead' && subStatus !== 'done' ? null : currentData.deadDoneDate),
      resettleDoneDate: type === 'resettle' && subStatus === 'done' ? (customDate || new Date().toISOString()) : (type === 'resettle' && subStatus !== 'done' ? null : currentData.resettleDoneDate),
      pendingDoneDate: type === 'pending' && subStatus === 'done' ? (customDate || new Date().toISOString()) : (type === 'pending' && subStatus !== 'done' ? null : currentData.pendingDoneDate),
      duplicatesDoneDate: type === 'duplicates' && subStatus === 'done' ? (customDate || new Date().toISOString()) : (type === 'duplicates' && subStatus !== 'done' ? null : currentData.duplicatesDoneDate)
    };
    
    setData(prev => ({
      ...prev,
      [number]: updatedItem
    }));

    // Save to backend without waiting for response
    fetch(`${API_URL}/numbers/${number}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        status: currentData.status,
        name: currentData.name || '',
        deadSubStatus: type === 'dead' ? subStatus : currentData.deadSubStatus,
        deadDoneDate: updatedItem.deadDoneDate,
        resettleSubStatus: type === 'resettle' ? subStatus : currentData.resettleSubStatus,
        resettleDoneDate: updatedItem.resettleDoneDate,
        pendingSubStatus: type === 'pending' ? subStatus : currentData.pendingSubStatus,
        pendingDoneDate: updatedItem.pendingDoneDate,
        duplicatesSubStatus: type === 'duplicates' ? subStatus : currentData.duplicatesSubStatus,
        duplicatesDoneDate: updatedItem.duplicatesDoneDate
      })
    }).catch(error => {
      console.error('Error updating substatus:', error);
    });
  };

  const updateDoneDate = async (number, newDate) => {
    const currentData = data[number] || {};
    
    // Add to recent changes
    addToRecentChanges(number);
    
    // Update data with new date
    setData(prev => ({
      ...prev,
      [number]: { ...prev[number], doneDate: newDate }
    }));

    // Save to backend without waiting for response
    fetch(`${API_URL}/numbers/${number}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        status: currentData.status,
        name: currentData.name || '',
        deadSubStatus: currentData.deadSubStatus,
        deadDoneDate: currentData.deadDoneDate,
        resettleSubStatus: currentData.resettleSubStatus,
        resettleDoneDate: currentData.resettleDoneDate,
        pendingSubStatus: currentData.pendingSubStatus,
        pendingDoneDate: currentData.pendingDoneDate,
        duplicatesSubStatus: currentData.duplicatesSubStatus,
        duplicatesDoneDate: currentData.duplicatesDoneDate,
        doneDate: newDate
      })
    }).catch(error => {
      console.error('Error updating done date:', error);
    });
  };

  const updateDeadDate = async (number, newDate) => {
    const currentData = data[number] || {};
    
    // Add to recent changes
    addToRecentChanges(number);
    
    // Update data with new date
    setData(prev => ({
      ...prev,
      [number]: { ...prev[number], deadDoneDate: newDate }
    }));

    // Save to backend without waiting for response
    fetch(`${API_URL}/numbers/${number}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        status: currentData.status,
        name: currentData.name || '',
        deadSubStatus: currentData.deadSubStatus,
        deadDoneDate: newDate,
        resettleSubStatus: currentData.resettleSubStatus,
        resettleDoneDate: currentData.resettleDoneDate,
        pendingSubStatus: currentData.pendingSubStatus,
        pendingDoneDate: currentData.pendingDoneDate,
        duplicatesSubStatus: currentData.duplicatesSubStatus,
        duplicatesDoneDate: currentData.duplicatesDoneDate
      })
    }).catch(error => {
      console.error('Error updating dead date:', error);
    });
  };

  const updateResettleDate = async (number, newDate) => {
    const currentData = data[number] || {};
    
    // Add to recent changes
    addToRecentChanges(number);
    
    // Update data with new date
    setData(prev => ({
      ...prev,
      [number]: { ...prev[number], resettleDoneDate: newDate }
    }));

    // Save to backend without waiting for response
    fetch(`${API_URL}/numbers/${number}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        status: currentData.status,
        name: currentData.name || '',
        deadSubStatus: currentData.deadSubStatus,
        deadDoneDate: currentData.deadDoneDate,
        resettleSubStatus: currentData.resettleSubStatus,
        resettleDoneDate: newDate,
        pendingSubStatus: currentData.pendingSubStatus,
        pendingDoneDate: currentData.pendingDoneDate,
        duplicatesSubStatus: currentData.duplicatesSubStatus,
        duplicatesDoneDate: currentData.duplicatesDoneDate
      })
    }).catch(error => {
      console.error('Error updating resettle date:', error);
    });
  };

  const updatePendingDate = async (number, newDate) => {
    const currentData = data[number] || {};
    
    // Add to recent changes
    addToRecentChanges(number);
    
    // Update data with new date
    setData(prev => ({
      ...prev,
      [number]: { ...prev[number], pendingDoneDate: newDate }
    }));

    // Save to backend without waiting for response
    fetch(`${API_URL}/numbers/${number}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        status: currentData.status,
        name: currentData.name || '',
        deadSubStatus: currentData.deadSubStatus,
        deadDoneDate: currentData.deadDoneDate,
        resettleSubStatus: currentData.resettleSubStatus,
        resettleDoneDate: currentData.resettleDoneDate,
        pendingSubStatus: currentData.pendingSubStatus,
        pendingDoneDate: newDate,
        duplicatesSubStatus: currentData.duplicatesSubStatus,
        duplicatesDoneDate: currentData.duplicatesDoneDate
      })
    }).catch(error => {
      console.error('Error updating pending date:', error);
    });
  };

  const updateDuplicatesDate = async (number, newDate) => {
    const currentData = data[number] || {};
    
    // Add to recent changes
    addToRecentChanges(number);
    
    // Update data with new date
    setData(prev => ({
      ...prev,
      [number]: { ...prev[number], duplicatesDoneDate: newDate }
    }));

    // Save to backend without waiting for response
    fetch(`${API_URL}/numbers/${number}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        status: currentData.status,
        name: currentData.name || '',
        deadSubStatus: currentData.deadSubStatus,
        deadDoneDate: currentData.deadDoneDate,
        resettleSubStatus: currentData.resettleSubStatus,
        resettleDoneDate: currentData.resettleDoneDate,
        pendingSubStatus: currentData.pendingSubStatus,
        pendingDoneDate: currentData.pendingDoneDate,
        duplicatesSubStatus: currentData.duplicatesSubStatus,
        duplicatesDoneDate: newDate
      })
    }).catch(error => {
      console.error('Error updating duplicates date:', error);
    });
  };

  const updateName = async (number, newName) => {
    const currentData = data[number] || {};
    
    // Add to recent changes
    addToRecentChanges(number);
    
    // Optimistically update UI
    setData(prev => ({
      ...prev,
      [number]: { ...prev[number], name: newName }
    }));

    // Save to backend without waiting for response
    fetch(`${API_URL}/numbers/${number}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        status: currentData.status || 'no', 
        name: newName,
        deadSubStatus: currentData.deadSubStatus,
        deadDoneDate: currentData.deadDoneDate,
        resettleSubStatus: currentData.resettleSubStatus,
        resettleDoneDate: currentData.resettleDoneDate,
        pendingSubStatus: currentData.pendingSubStatus,
        pendingDoneDate: currentData.pendingDoneDate,
        duplicatesSubStatus: currentData.duplicatesSubStatus,
        duplicatesDoneDate: currentData.duplicatesDoneDate
      })
    }).catch(error => {
      console.error('Error updating name:', error);
    });
  };

  const applyBulkStatus = async () => {
    if (!rangeInput.trim()) return;
    
    const numbers = [];
    const parts = rangeInput.split(',').map(p => p.trim());
    
    parts.forEach(part => {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(n => parseInt(n.trim()));
        if (!isNaN(start) && !isNaN(end)) {
          for (let i = Math.min(start, end); i <= Math.max(start, end); i++) {
            if (i >= 1 && i <= 1421) numbers.push(i);
          }
        }
      } else {
        const num = parseInt(part);
        if (!isNaN(num) && num >= 1 && num <= 1421) numbers.push(num);
      }
    });

    // Optimistically update UI
    const newData = { ...data };
    numbers.forEach(num => {
      newData[num] = { ...newData[num], status: bulkStatus };
    });
    setData(newData);
    setRangeInput('');

    // Save to backend
    try {
      await fetch(`${API_URL}/numbers/bulk-update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numbers, status: bulkStatus })
      });
    } catch (error) {
      console.error('Error in bulk update:', error);
    }
  };

  const counts = useMemo(() => {
    const result = {
      done: 0,
      no: 0,
      pending: 0,
      pendingDone: 0,
      pendingNo: 0,
      dead: 0,
      deadDone: 0,
      deadNo: 0,
      resettle: 0,
      resettleDone: 0,
      resettleNo: 0,
      duplicates: 0,
      duplicatesDone: 0,
      duplicatesNo: 0
    };
    Object.values(data).forEach(item => {
      result[item.status]++;
      
      if (item.status === 'dead') {
        if (item.deadSubStatus === 'done') result.deadDone++;
        else if (item.deadSubStatus === 'no') result.deadNo++;
      }
      
      if (item.status === 'resettle') {
        if (item.resettleSubStatus === 'done') result.resettleDone++;
        else if (item.resettleSubStatus === 'no') result.resettleNo++;
      }
      
      if (item.status === 'pending') {
        if (item.pendingSubStatus === 'done') result.pendingDone++;
        else if (item.pendingSubStatus === 'no') result.pendingNo++;
      }
      
      if (item.status === 'duplicates') {
        if (item.duplicatesSubStatus === 'done') result.duplicatesDone++;
        else if (item.duplicatesSubStatus === 'no') result.duplicatesNo++;
      }
    });
    return result;
  }, [data]);

  const filteredNumbers = useMemo(() => {
    const numbers = Array.from({ length: 1421 }, (_, i) => i + 1);
    
    // Check if search term is a number
    const searchNumber = parseInt(searchTerm);
    const isNumberSearch = !isNaN(searchNumber) && searchTerm.trim() !== '';
    
    let filteredResults = numbers.filter(num => {
      const itemData = data[num] || {};
      
      // If searching by number, include the number and next 10 numbers
      let matchesSearch = false;
      if (isNumberSearch) {
        matchesSearch = num >= searchNumber && num <= searchNumber + 10;
      } else {
        matchesSearch = 
          num.toString().includes(searchTerm.toLowerCase()) ||
          (itemData.name || '').toLowerCase().includes(searchTerm.toLowerCase());
      }
      
      const matchesFilter = 
        filterStatus === 'all' || itemData.status === filterStatus;
      
      // Date filter logic
      let matchesDateFilter = true;
      if (dateFilterType !== 'all' && (startDate || endDate)) {
        let itemDate = null;
        
        if (dateFilterType === 'done' && itemData.status === 'done' && itemData.doneDate) {
          itemDate = new Date(itemData.doneDate);
        } else if (dateFilterType === 'deadDone' && itemData.status === 'dead' && itemData.deadSubStatus === 'done' && itemData.deadDoneDate) {
          itemDate = new Date(itemData.deadDoneDate);
        } else if (dateFilterType === 'resettleDone' && itemData.status === 'resettle' && itemData.resettleSubStatus === 'done' && itemData.resettleDoneDate) {
          itemDate = new Date(itemData.resettleDoneDate);
        } else if (dateFilterType === 'pendingDone' && itemData.status === 'pending' && itemData.pendingSubStatus === 'done' && itemData.pendingDoneDate) {
          itemDate = new Date(itemData.pendingDoneDate);
        } else if (dateFilterType === 'duplicatesDone' && itemData.status === 'duplicates' && itemData.duplicatesSubStatus === 'done' && itemData.duplicatesDoneDate) {
          itemDate = new Date(itemData.duplicatesDoneDate);
        }
        
        if (itemDate) {
          if (startDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            if (itemDate < start) matchesDateFilter = false;
          }
          if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            if (itemDate > end) matchesDateFilter = false;
          }
        } else {
          matchesDateFilter = false;
        }
      }
      
      return matchesSearch && matchesFilter && matchesDateFilter;
    });
    
    return filteredResults;
  }, [searchTerm, filterStatus, data, dateFilterType, startDate, endDate]);

  // Get last 5 updated records
  const recentUpdates = useMemo(() => {
    const allNumbers = Object.entries(data)
      .filter(([_, item]) => item.status !== 'no')
      .map(([num, item]) => ({
        number: parseInt(num),
        ...item,
        lastUpdate: item.doneDate || item.deadDoneDate || item.resettleDoneDate || new Date().toISOString()
      }))
      .sort((a, b) => new Date(b.lastUpdate) - new Date(a.lastUpdate))
      .slice(0, 5);
    
    return allNumbers;
  }, [data]);

  const exportToCSV = () => {
    let csv = 'Number,Status,Name\n';
    for (let i = 1; i <= 1421; i++) {
      const item = data[i] || { status: 'no', name: '' };
      csv += `${i},${item.status},${item.name}\n`;
    }
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'number-status-tracker.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading data...</p>
        </div>
      </div>
    );
  }

  const getStatusConfig = (status) => {
    return statusOptions.find(opt => opt.value === status);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 flex flex-col">
      <div className="w-full flex-1 flex flex-col">
        <div className="bg-white rounded-lg shadow-lg p-4 mb-3 shrink-0">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Advanced Number Status Tracker</h1>
          
          {/* Recent Updates Section */}
          {recentChanges.length > 0 && (
            <div className="bg-purple-50 rounded-lg p-3 mb-3 border-2 border-purple-200">
              <h3 className="text-sm font-semibold text-purple-700 mb-2">Recent 5 Updates</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {recentChanges.map((num) => {
                  const item = data[num] || {};
                  const statusConfig = getStatusConfig(item.status || 'no');
                  return (
                    <div key={num} className={`${statusConfig.bg} rounded p-2 border border-gray-300`}>
                      <div className="text-xs font-bold text-gray-800">#{num}</div>
                      <div className={`text-xs font-semibold text-white ${statusConfig.badge} rounded px-1 mt-1`}>
                        {statusConfig.label}
                      </div>
                      {item.name && (
                        <div className="text-xs text-gray-600 truncate mt-1" title={item.name}>
                          {item.name}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2 mb-3">
            <div className="bg-blue-50 rounded-lg p-2 border-2 border-blue-200">
              <div className="text-xs text-blue-600 font-medium">Total</div>
              <div className="text-xl font-bold text-blue-700">1421</div>
            </div>
            <div className="bg-green-50 rounded-lg p-2 border-2 border-green-200">
              <div className="text-xs text-green-600 font-medium">Done</div>
              <div className="text-xl font-bold text-green-700">{counts.done}</div>
            </div>
            <div className="bg-red-50 rounded-lg p-2 border-2 border-red-200">
              <div className="text-xs text-red-600 font-medium">No</div>
              <div className="text-xl font-bold text-red-700">{counts.no}</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-2 border-2 border-yellow-200">
              <div className="text-xs text-yellow-600 font-medium">Pending</div>
              <div className="text-xl font-bold text-yellow-700">{counts.pending}</div>
              <div className="text-xs text-yellow-500 mt-1">D:{counts.pendingDone} N:{counts.pendingNo}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-2 border-2 border-gray-300">
              <div className="text-xs text-gray-600 font-medium">Dead</div>
              <div className="text-xl font-bold text-gray-700">{counts.dead}</div>
              <div className="text-xs text-gray-500 mt-1">D:{counts.deadDone} N:{counts.deadNo}</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-2 border-2 border-blue-300">
              <div className="text-xs text-blue-600 font-medium">Resettle</div>
              <div className="text-xl font-bold text-blue-700">{counts.resettle}</div>
              <div className="text-xs text-blue-500 mt-1">D:{counts.resettleDone} N:{counts.resettleNo}</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-2 border-2 border-purple-300">
              <div className="text-xs text-purple-600 font-medium">Duplicates</div>
              <div className="text-xl font-bold text-purple-700">{counts.duplicates}</div>
              <div className="text-xs text-purple-500 mt-1">D:{counts.duplicatesDone} N:{counts.duplicatesNo}</div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 mb-3">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Bulk Update</h3>
            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                placeholder="e.g., 121,122 or 100-150 or 1,5,10-20"
                value={rangeInput}
                onChange={(e) => setRangeInput(e.target.value)}
                className="flex-1 min-w-64 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={bulkStatus}
                onChange={(e) => setBulkStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {statusOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <button
                onClick={applyBulkStatus}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
              >
                Apply
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">Enter single numbers (121,122) or ranges (100-150)</p>
          </div>

          <div className="flex flex-wrap gap-2 mb-0">
            <div className="flex-1 min-w-64 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search by number or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
              >
                <option value="all">All Status</option>
                {statusOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <select
              value={dateFilterType}
              onChange={(e) => setDateFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="all">All Dates</option>
              <option value="done">Done Date</option>
              <option value="deadDone">Dead Done Date</option>
              <option value="resettleDone">Resettle Done Date</option>
              <option value="pendingDone">Pending Done Date</option>
              <option value="duplicatesDone">Duplicates Done Date</option>
            </select>
            {dateFilterType !== 'all' && (
              <>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  placeholder="Start Date"
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  placeholder="End Date"
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </>
            )}
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
            >
              <Download size={18} />
              Export CSV
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden flex-1 flex flex-col min-h-[400px] md:min-h-[600px]">
          <div className="overflow-x-auto flex-1 flex flex-col min-h-0 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <div className="flex-1 overflow-y-auto">
              <table className="w-full table-auto">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="px-1 sm:px-2 md:px-4 py-2 md:py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 border-b w-12 sm:w-16 md:w-20">Number</th>
                    <th className="px-1 sm:px-2 md:px-4 py-2 md:py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 border-b w-24 sm:w-32 md:w-36">Status</th>
                    <th className="px-1 sm:px-2 md:px-4 py-2 md:py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 border-b w-20 sm:w-24 md:w-32">Sub Status</th>
                    <th className="px-1 sm:px-2 md:px-4 py-2 md:py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 border-b w-24 sm:w-32 md:w-40">Date</th>
                    <th className="hidden md:table-cell px-2 md:px-4 py-2 md:py-3 text-left text-sm font-semibold text-gray-700 border-b">Name</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredNumbers.map((num) => {
                    const statusConfig = getStatusConfig(data[num]?.status || 'no');
                    const itemData = data[num] || {};
                    const showDeadSubStatus = itemData.status === 'dead';
                    const showResettleSubStatus = itemData.status === 'resettle';
                    const showPendingSubStatus = itemData.status === 'pending';
                    const showDuplicatesSubStatus = itemData.status === 'duplicates';
                    
                    return (
                      <tr
                        key={num}
                        className={`border-b hover:opacity-80 transition ${statusConfig.bg}`}
                      >
                        <td className="px-1 sm:px-2 md:px-4 py-1 md:py-2 text-xs sm:text-sm font-medium text-gray-800">{num}</td>
                        <td className="px-1 sm:px-2 md:px-4 py-1 md:py-2">
                          <select
                            value={itemData.status}
                            onChange={(e) => updateStatus(num, e.target.value)}
                            className={`w-full px-1 sm:px-2 py-1 rounded text-xs sm:text-sm font-semibold text-white ${statusConfig.badge} border-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1`}
                          >
                            {statusOptions.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-1 sm:px-2 md:px-4 py-1 md:py-2">
                          {showDeadSubStatus && (
                            <select
                              value={itemData.deadSubStatus || ''}
                              onChange={(e) => updateSubStatus(num, e.target.value, 'dead')}
                              className="w-full px-1 sm:px-2 py-1 rounded text-xs sm:text-sm font-semibold border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            >
                              <option value="">Select</option>
                              <option value="done">Done</option>
                              <option value="no">No</option>
                            </select>
                          )}
                          {showResettleSubStatus && (
                            <select
                              value={itemData.resettleSubStatus || ''}
                              onChange={(e) => updateSubStatus(num, e.target.value, 'resettle')}
                              className="w-full px-1 sm:px-2 py-1 rounded text-xs sm:text-sm font-semibold border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            >
                              <option value="">Select</option>
                              <option value="done">Done</option>
                              <option value="no">No</option>
                            </select>
                          )}
                          {showPendingSubStatus && (
                            <select
                              value={itemData.pendingSubStatus || ''}
                              onChange={(e) => updateSubStatus(num, e.target.value, 'pending')}
                              className="w-full px-1 sm:px-2 py-1 rounded text-xs sm:text-sm font-semibold border border-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white"
                            >
                              <option value="">Select</option>
                              <option value="done">Done</option>
                              <option value="no">No</option>
                            </select>
                          )}
                          {showDuplicatesSubStatus && (
                            <select
                              value={itemData.duplicatesSubStatus || ''}
                              onChange={(e) => updateSubStatus(num, e.target.value, 'duplicates')}
                              className="w-full px-1 sm:px-2 py-1 rounded text-xs sm:text-sm font-semibold border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                            >
                              <option value="">Select</option>
                              <option value="done">Done</option>
                              <option value="no">No</option>
                            </select>
                          )}
                          {!showDeadSubStatus && !showResettleSubStatus && !showPendingSubStatus && !showDuplicatesSubStatus && (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-1 sm:px-2 md:px-4 py-1 md:py-2 text-xs sm:text-sm text-gray-600">
                          {itemData.status === 'done' && (
                            <input
                              type="date"
                              value={itemData.doneDate ? new Date(itemData.doneDate).toISOString().split('T')[0] : ''}
                              onChange={(e) => updateDoneDate(num, e.target.value)}
                              className="w-full px-1 sm:px-2 py-1 border border-gray-300 rounded text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                            />
                          )}
                          {itemData.status === 'dead' && itemData.deadSubStatus === 'done' && (
                            <input
                              type="date"
                              value={itemData.deadDoneDate ? new Date(itemData.deadDoneDate).toISOString().split('T')[0] : ''}
                              onChange={(e) => updateDeadDate(num, e.target.value)}
                              className="w-full px-1 sm:px-2 py-1 border border-gray-300 rounded text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 bg-white"
                            />
                          )}
                          {itemData.status === 'resettle' && itemData.resettleSubStatus === 'done' && (
                            <input
                              type="date"
                              value={itemData.resettleDoneDate ? new Date(itemData.resettleDoneDate).toISOString().split('T')[0] : ''}
                              onChange={(e) => updateResettleDate(num, e.target.value)}
                              className="w-full px-1 sm:px-2 py-1 border border-gray-300 rounded text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            />
                          )}
                          {itemData.status === 'pending' && itemData.pendingSubStatus === 'done' && (
                            <input
                              type="date"
                              value={itemData.pendingDoneDate ? new Date(itemData.pendingDoneDate).toISOString().split('T')[0] : ''}
                              onChange={(e) => updatePendingDate(num, e.target.value)}
                              className="w-full px-1 sm:px-2 py-1 border border-gray-300 rounded text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white"
                            />
                          )}
                          {itemData.status === 'duplicates' && itemData.duplicatesSubStatus === 'done' && (
                            <input
                              type="date"
                              value={itemData.duplicatesDoneDate ? new Date(itemData.duplicatesDoneDate).toISOString().split('T')[0] : ''}
                              onChange={(e) => updateDuplicatesDate(num, e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                            />
                          )}
                          {itemData.status !== 'done' && 
                           !(itemData.status === 'dead' && itemData.deadSubStatus === 'done') && 
                           !(itemData.status === 'resettle' && itemData.resettleSubStatus === 'done') && 
                           !(itemData.status === 'pending' && itemData.pendingSubStatus === 'done') && 
                           !(itemData.status === 'duplicates' && itemData.duplicatesSubStatus === 'done') && (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={itemData.name}
                            onChange={(e) => updateName(num, e.target.value)}
                            placeholder="Enter name..."
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="mt-2 text-center text-sm text-gray-600 shrink-0">
          Showing {filteredNumbers.length} of 1421 numbers
        </div>
      </div>
    </div>
  );
}