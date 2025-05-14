import React, { useState, useEffect } from "react";
import ChargeableForm from "../Dashboards/Chargeables/ChargeableForm";
import ChargeableDetailsModal from "../Dashboards/Chargeables/ChargeableDetailsModal";
import { Menu, Search, Plus, RefreshCw, Eye, Edit, Trash2, FileText, File, Download, Filter } from "lucide-react";

// API base URL
import config from '../config';
const API_URL = config.API_URL;

// Define status options for dropdowns
export const STATUS_OPTIONS = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "pending", label: "Pending" }
];

// Component to display chargeables data grid and form
const Chargeables = () => {
  // State management
  const [chargeables, setChargeables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [currentChargeable, setCurrentChargeable] = useState(null);
  const [selectedChargeable, setSelectedChargeable] = useState(null);
  const [filterOptions, setFilterOptions] = useState({
    quotationSent: "",
    poReceived: "",
    invoiceSent: "",
    paymentReceived: ""
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "quoteSendDate",
    direction: "desc"
  });
  const [showFilters, setShowFilters] = useState(false);
  const [customerTotals, setCustomerTotals] = useState({});

  // Function to get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    };
  };

  // Fetch chargeables data
  const fetchChargeables = async () => {
    try {
      setLoading(true);
      setError("");
      
      // Get auth headers
      const headers = getAuthHeaders();
      
      // Fetch data from backend
      const response = await fetch(`${API_URL}/chargeables`, { 
        headers 
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // If the search term is set, filter the data
      if (searchTerm) {
        searchChargeables(searchTerm);
        return;
      }
      
      setChargeables(data);
      calculateCustomerTotals(data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching chargeables:", err);
      setError("Failed to load chargeables. Please try again.");
      setLoading(false);
    }
  };
  
  // Search chargeables
  const searchChargeables = async (term) => {
    if (!term) {
      fetchChargeables();
      return;
    }
    
    try {
      setLoading(true);
      setError("");
      
      // Get auth headers
      const headers = getAuthHeaders();
      
      // Fetch searched data from backend
      const response = await fetch(`${API_URL}/chargeables/search?term=${encodeURIComponent(term)}`, { 
        headers 
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      
      setChargeables(data);
      calculateCustomerTotals(data);
      setLoading(false);
    } catch (err) {
      console.error("Error searching chargeables:", err);
      setError("Failed to search chargeables. Please try again.");
      setLoading(false);
    }
  };
  
  // Calculate totals per customer
  const calculateCustomerTotals = (data) => {
    const totals = {};
    
    data.forEach(chargeable => {
      const customerName = chargeable.customerName;
      if (!totals[customerName]) {
        totals[customerName] = 0;
      }
      totals[customerName] += chargeable.amount;
    });
    
    setCustomerTotals(totals);
  };

  // Fetch data on initial load
  useEffect(() => {
    fetchChargeables();
  }, []);
  
  // Fetch data when search term changes
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm) {
        searchChargeables(searchTerm);
      } else {
        fetchChargeables();
      }
    }, 500);
    
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  // Handle form submission (add/edit)
  const handleSaveChargeable = async (formData) => {
    try {
      setLoading(true);
      setError("");
      
      // Get auth headers
      const headers = getAuthHeaders();
      
      let response;
      let method;
      let url;
      
      if (currentChargeable) {
        // Update existing chargeable
        method = 'PUT';
        url = `${API_URL}/chargeables/${currentChargeable._id}`;
      } else {
        // Add new chargeable
        method = 'POST';
        url = `${API_URL}/chargeables`;
      }
      
      // Send to backend
      response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const savedChargeable = await response.json();
      
      // Update local state
      if (currentChargeable) {
        setChargeables(prevChargeables =>
          prevChargeables.map(c => c._id === savedChargeable._id ? savedChargeable : c)
        );
      } else {
        setChargeables(prevChargeables => [...prevChargeables, savedChargeable]);
      }
      
      // Recalculate totals
      fetchChargeables();
      
      setCurrentChargeable(null);
      setShowForm(false);
      setLoading(false);
      
      return savedChargeable; // Return saved chargeable for file uploads
    } catch (err) {
      console.error("Error saving chargeable:", err);
      setError("Failed to save chargeable. Please try again.");
      setLoading(false);
      return null;
    }
  };

  // Handle editing a chargeable
  const handleEditChargeable = (chargeable) => {
    setCurrentChargeable(chargeable);
    setShowForm(true);
  };

  // Handle deleting a chargeable
  const handleDeleteChargeable = async (chargeableId) => {
    if (!window.confirm("Are you sure you want to delete this chargeable? This will also delete all associated files.")) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Get auth headers
      const headers = getAuthHeaders();
      
      // Send to backend
      const response = await fetch(`${API_URL}/chargeables/${chargeableId}`, {
        method: 'DELETE',
        headers
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      // Update local state
      setChargeables(chargeables.filter(c => c._id !== chargeableId));
      calculateCustomerTotals(chargeables.filter(c => c._id !== chargeableId));
      
      setLoading(false);
    } catch (err) {
      console.error("Error deleting chargeable:", err);
      setError("Failed to delete chargeable. Please try again.");
      setLoading(false);
    }
  };

  // Handle viewing detailed chargeable information
  const handleViewChargeable = async (chargeable) => {
    try {
      setLoading(true);
      
      // Get auth headers
      const headers = getAuthHeaders();
      
      // Fetch the full chargeable details
      const response = await fetch(`${API_URL}/chargeables/${chargeable._id}`, {
        headers
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const detailedChargeable = await response.json();
      setSelectedChargeable(detailedChargeable);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching chargeable details:", err);
      setError("Failed to load chargeable details. Please try again.");
      setLoading(false);
      
      // Fallback to using the basic info we already have
      setSelectedChargeable(chargeable);
    }
  };

  // Close the details modal
  const handleCloseModal = () => {
    setSelectedChargeable(null);
  };

  // Handle sorting
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Apply sorting to the data
  const getSortedData = () => {
    const sortableData = [...chargeables];
    
    if (sortConfig.key) {
      sortableData.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        
        // Special handling for date fields
        if (sortConfig.key === 'quoteSendDate') {
          aValue = new Date(aValue);
          bValue = new Date(bValue);
        }
        
        // Handle numeric values
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
        }
        
        // Handle strings and other types
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    
    return sortableData;
  };

  // Apply filters and search to the data
  const getFilteredData = () => {
    const sortedData = getSortedData();
    
    return sortedData.filter(chargeable => {
      // Apply status filters if set
      if (filterOptions.quotationSent && chargeable.quotationSent !== filterOptions.quotationSent) return false;
      if (filterOptions.poReceived && chargeable.poReceived !== filterOptions.poReceived) return false;
      if (filterOptions.invoiceSent && chargeable.invoiceSent !== filterOptions.invoiceSent) return false;
      if (filterOptions.paymentReceived && chargeable.paymentReceived !== filterOptions.paymentReceived) return false;
      
      return true;
    });
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-AU'); // Format as DD/MM/YYYY for Australian format
  };

  // Format currency for display
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD'
    }).format(amount);
  };

  // Reset all filters
  const resetFilters = () => {
    setFilterOptions({
      quotationSent: "",
      poReceived: "",
      invoiceSent: "",
      paymentReceived: ""
    });
    setSearchTerm("");
    setShowFilters(false);
    fetchChargeables();
  };

  // Get status badge color
  const getStatusBadgeColor = (status) => {
    switch(status) {
      case "yes": return "bg-green-100 text-green-800";
      case "no": return "bg-red-100 text-red-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Get file icon based on file type/extension
  const getFileIcon = (fileName) => {
    const extension = fileName.toLowerCase().split('.').pop();
    
    if (['pdf'].includes(extension)) {
      return <FileText className="h-5 w-5 text-red-500" />;
    } else if (['doc', 'docx'].includes(extension)) {
      return <FileText className="h-5 w-5 text-blue-500" />;
    } else if (['xls', 'xlsx'].includes(extension)) {
      return <FileText className="h-5 w-5 text-green-500" />;
    } else if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) {
      return <FileText className="h-5 w-5 text-purple-500" />;
    } else {
      return <File className="h-5 w-5 text-gray-500" />;
    }
  };

  // Render the component
  return (
    <div className="bg-gray-50 min-h-screen p-4 md:p-6">
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        {/* <h1 className="text-2xl font-bold text-gray-900 mb-4 md:mb-0">Chargeables</h1> */}
        
        <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3">
          {/* Search box */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search customer or type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 block w-full"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
          
          {/* Filter button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            <Filter className="h-5 w-5 mr-2" />
            Filters
          </button>
          
          {/* Refresh button */}
          <button
            onClick={fetchChargeables}
            className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            <RefreshCw className="h-5 w-5 mr-2" />
            Refresh
          </button>
          
          {/* Add new button */}
          <button
            onClick={() => {
              setCurrentChargeable(null);
              setShowForm(true);
            }}
            className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add New Chargeable
          </button>
        </div>
      </div>
      
      {/* Filter panel */}
      {showFilters && (
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:space-x-6 mb-4">
            <h3 className="text-lg font-medium mb-3 md:mb-0">Filters</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 flex-grow">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quotation Sent</label>
                <select
                  value={filterOptions.quotationSent}
                  onChange={(e) => setFilterOptions({...filterOptions, quotationSent: e.target.value})}
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">All</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PO Received</label>
                <select
                  value={filterOptions.poReceived}
                  onChange={(e) => setFilterOptions({...filterOptions, poReceived: e.target.value})}
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">All</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Sent</label>
                <select
                  value={filterOptions.invoiceSent}
                  onChange={(e) => setFilterOptions({...filterOptions, invoiceSent: e.target.value})}
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">All</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Received</label>
                <select
                  value={filterOptions.paymentReceived}
                  onChange={(e) => setFilterOptions({...filterOptions, paymentReceived: e.target.value})}
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">All</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>
            
            <button
              onClick={resetFilters}
              className="mt-3 md:mt-0 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              Reset Filters
            </button>
          </div>
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {/* Form for adding/editing */}
      {showForm && (
        <ChargeableForm
          chargeable={currentChargeable}
          onSave={handleSaveChargeable}
          onCancel={() => {
            setCurrentChargeable(null);
            setShowForm(false);
          }}
        />
      )}
      
      {/* Data grid */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading && chargeables.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Loading chargeables...</div>
        ) : getFilteredData().length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort('quoteSendDate')}
                  >
                    Quote Send Date
                    {sortConfig.key === 'quoteSendDate' && (
                      <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort('customerName')}
                  >
                    Customer Name
                    {sortConfig.key === 'customerName' && (
                      <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort('chargeableType')}
                  >
                    Chargeable Type
                    {sortConfig.key === 'chargeableType' && (
                      <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort('quotationSent')}
                  >
                    Quotation Sent
                    {sortConfig.key === 'quotationSent' && (
                      <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort('followUps')}
                  >
                    Follow Ups
                    {sortConfig.key === 'followUps' && (
                      <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort('amount')}
                  >
                    Amount (AUD)
                    {sortConfig.key === 'amount' && (
                      <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort('poReceived')}
                  >
                    PO Received
                    {sortConfig.key === 'poReceived' && (
                      <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort('invoiceSent')}
                  >
                    Invoice Sent
                    {sortConfig.key === 'invoiceSent' && (
                      <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => requestSort('paymentReceived')}
                  >
                    Payment Received
                    {sortConfig.key === 'paymentReceived' && (
                      <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getFilteredData().map((chargeable) => {
                  // Add customer total row after the last item of each customer group
                  const customerItems = getFilteredData().filter(item => item.customerName === chargeable.customerName);
                  const isLastOfCustomer = customerItems[customerItems.length - 1]._id === chargeable._id;
                  
                  return (
                    <React.Fragment key={chargeable._id}>
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(chargeable.quoteSendDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {chargeable.customerName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {chargeable.chargeableType}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className={`${getStatusBadgeColor(chargeable.quotationSent)} px-2 py-1 rounded-full text-xs`}>
                            {chargeable.quotationSent === "yes" ? "Yes" : 
                             chargeable.quotationSent === "no" ? "No" : "Pending"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {chargeable.followUps}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatCurrency(chargeable.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className={`${getStatusBadgeColor(chargeable.poReceived)} px-2 py-1 rounded-full text-xs`}>
                            {chargeable.poReceived === "yes" ? "Yes" : 
                             chargeable.poReceived === "no" ? "No" : "Pending"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className={`${getStatusBadgeColor(chargeable.invoiceSent)} px-2 py-1 rounded-full text-xs`}>
                            {chargeable.invoiceSent === "yes" ? "Yes" : 
                             chargeable.invoiceSent === "no" ? "No" : "Pending"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className={`${getStatusBadgeColor(chargeable.paymentReceived)} px-2 py-1 rounded-full text-xs`}>
                            {chargeable.paymentReceived === "yes" ? "Yes" : 
                             chargeable.paymentReceived === "no" ? "No" : "Pending"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleViewChargeable(chargeable)}
                              className="text-purple-600 hover:text-purple-900"
                              title="View Details"
                            >
                              <Eye className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleEditChargeable(chargeable)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Edit"
                            >
                              <Edit className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteChargeable(chargeable._id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      
                      {/* Display customer total row after the last item of a customer */}
                      {isLastOfCustomer && (
                        <tr className="bg-gray-100">
                          <td colSpan={5} className="px-6 py-2 text-sm font-semibold text-gray-700 text-right">
                            Total for {chargeable.customerName}:
                          </td>
                          <td className="px-6 py-2 whitespace-nowrap text-sm font-semibold text-gray-700">
                            {formatCurrency(customerTotals[chargeable.customerName])}
                          </td>
                          <td colSpan={4}></td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            {chargeables.length === 0 ? "No chargeables found." : "No matching chargeables found. Try adjusting your filters."}
          </div>
        )}
      </div>
      
      {/* Details Modal */}
      {selectedChargeable && (
        <ChargeableDetailsModal
          chargeable={selectedChargeable}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default Chargeables;