import React, { useState, useEffect } from "react";

// API base URL - change this to match your backend
const API_URL = "https://crm-be.fly.dev/api";

// Component to display full lead details in a modal popup with audit log
const LeadDetailsModal = ({ lead, onClose }) => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [conversionRates, setConversionRates] = useState({});
  const [audValue, setAudValue] = useState(null);

  // Function to get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    };
  };

  // Fetch current user, currency rates and audit logs when component mounts
  useEffect(() => {
    if (!lead?._id) return;

    const fetchData = async () => {
      try {
        // Fetch current user, currency rates, and audit logs in parallel
        const fetchPromises = [
          fetchCurrentUser(),
          fetchCurrencyRates(),
          fetchAuditLogs()
        ];
        
        await Promise.all(fetchPromises);
      } catch (err) {
        console.error("Error in data fetching:", err);
      }
    };

    fetchData();
  }, [lead]);

  // Calculate AUD value whenever lead or conversion rates change
  useEffect(() => {
    if (lead?.value && conversionRates && Object.keys(conversionRates).length > 0) {
      calculateAudValue();
    }
  }, [lead, conversionRates]);

  // Helper function to fetch current user
  const fetchCurrentUser = async () => {
    try {
      // Get token from localStorage or wherever you store it
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${API_URL}/users/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        setCurrentUser(userData);
      }
    } catch (err) {
      console.error("Error fetching current user:", err);
    }
  };

  // Helper function to fetch currency rates
  const fetchCurrencyRates = async () => {
    try {
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/AUD');
      
      if (!response.ok) {
        throw new Error('Failed to fetch currency rates');
      }
      
      const data = await response.json();
      
      // Process and store exchange rates
      // We're getting rates with AUD as base, so we need to invert them
      // since we'll be converting from other currencies to AUD
      const invertedRates = {};
      Object.entries(data.rates).forEach(([currency, rate]) => {
        invertedRates[currency] = 1 / rate;
      });
      
      // Set AUD to 1 since we're using it as base
      invertedRates["AUD"] = 1;
      
      setConversionRates(invertedRates);
    } catch (err) {
      console.error("Error fetching currency rates:", err);
    }
  };

  // Helper function to fetch audit logs
  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      
      // Get auth headers
      const headers = getAuthHeaders();
      
      console.log(`Fetching audit logs for lead ID: ${lead._id}`);
      const response = await fetch(`${API_URL}/leads/audit/${lead._id}`, {
        headers: headers
      });
      
      // Log the response status for debugging
      console.log('Audit logs API response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error response data:', errorData);
        throw new Error(errorData.error || 'Failed to fetch audit logs');
      }
      
      const data = await response.json();
      console.log('Received audit logs:', data);
      
      setAuditLogs(data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching audit logs:", err);
      setError(`Failed to load audit history: ${err.message}`);
      setLoading(false);
      
      // Fallback to mock data only if we're in development mode
      if (process.env.NODE_ENV === 'development') {
        console.log('Using mock audit data as fallback');
        const mockAuditData = generateMockAuditData(lead);
        setAuditLogs(mockAuditData);
      }
    }
  };

  // Calculate AUD value based on lead value and currency
  const calculateAudValue = () => {
    // Default to AUD if no currency code is specified
    const currencyCode = lead.currencyCode || 'AUD';
    
    // If we don't have a conversion rate for this currency, use 1
    const rate = conversionRates[currencyCode] || 1;
    
    // Calculate AUD value
    const convertedValue = lead.value * rate;
    
    setAudValue(convertedValue);
  };

  // Generate mock audit data for demonstration purposes
  // Remove this in production when backend is implemented
  const generateMockAuditData = (lead) => {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date(now);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const lastWeek = new Date(now);
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    return [
      {
        _id: "audit1",
        leadId: lead._id,
        userId: "user123",
        userName: "John Smith",
        timestamp: now.toISOString(),
        changes: [
          {
            field: "stage",
            oldValue: "Negotiation",
            newValue: lead.stage
          },
          {
            field: "notes",
            oldValue: "Customer is considering our proposal",
            newValue: lead.notes || "Need to follow up next week"
          }
        ]
      },
      {
        _id: "audit2",
        leadId: lead._id,
        userId: "user456",
        userName: "Jane Doe",
        timestamp: yesterday.toISOString(),
        changes: [
          {
            field: "value",
            oldValue: "9500",
            newValue: lead.value ? lead.value.toString() : "10000"
          }
        ]
      },
      {
        _id: "audit3",
        leadId: lead._id,
        userId: "user123",
        userName: "John Smith",
        timestamp: twoDaysAgo.toISOString(),
        changes: [
          {
            field: "stage",
            oldValue: "Proposal Sent",
            newValue: "Negotiation"
          }
        ]
      },
      {
        _id: "audit4",
        leadId: lead._id,
        userId: "user789",
        userName: "System User",
        timestamp: lastWeek.toISOString(),
        changes: [
          {
            field: "priority",
            oldValue: "Medium", 
            newValue: lead.priority || "High"
          },
          {
            field: "leadOwner",
            oldValue: "Alex Johnson",
            newValue: lead.leadOwner || "John Smith"
          }
        ]
      }
    ];
  };

  if (!lead) return null;

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString(); // Using toLocaleString for date and time
  };

  // Get stage badge color
  const getStageBadgeColor = (stage) => {
    switch(stage) {
      case "New Lead": return "bg-yellow-200";
      case "Contacted": return "bg-blue-100";
      case "Qualified": return "bg-blue-200";
      case "Demo Done": return "bg-indigo-200";
      case "Proposal Sent": return "bg-purple-200";
      case "Negotiation": return "bg-red-200";
      case "Won - Deal Closed": return "bg-green-200";
      case "Lost - Not Interested": return "bg-gray-200 text-gray-800";
      case "Lost - Competitor Win": return "bg-gray-300 text-gray-800";
      case "Lost - No Budget": return "bg-gray-400 text-white";
      case "Follow-up Later": return "bg-orange-200";
      default: return "bg-gray-200";
    }
  };

  // Get priority badge color
  const getPriorityBadgeColor = (priority) => {
    switch(priority) {
      case "High": return "bg-red-100 text-red-800";
      case "Medium": return "bg-orange-100 text-orange-800";
      case "Low": return "bg-green-100 text-green-800";
      default: return "bg-gray-200";
    }
  };

  // Format field name for display
  const formatFieldName = (fieldName) => {
    switch(fieldName) {
      case "stage": return "Stage";
      case "priority": return "Priority";
      case "value": return "Value";
      case "currencyCode": return "Currency";
      case "notes": return "Notes";
      case "leadOwner": return "Lead Owner";
      case "status": return "Status"; // For handling deletion logs
      default: return fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
    }
  };

  // Format currency value for display
  const formatCurrencyValue = (value, currencyCode = 'AUD') => {
    if (!value) return "—";
    
    // Define currency formatter
    const formatter = new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2
    });
    
    return formatter.format(value);
  };

  // Format field value for display
  const formatFieldValue = (field, value) => {
    if (value === undefined || value === null || value === "") return "—";
    
    switch(field) {
      case "value":
        return formatCurrencyValue(parseFloat(value), lead.currencyCode || 'AUD');
      
      case "stage":
        return <span className={`${getStageBadgeColor(value)} px-2 py-1 rounded-full text-xs inline-block`}>{value}</span>;
      
      case "priority":
        return <span className={`${getPriorityBadgeColor(value)} px-2 py-1 rounded-full text-xs inline-block`}>{value}</span>;
      
      case "status":
        if (value === "Deleted") {
          return <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs inline-block">Deleted</span>;
        }
        return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs inline-block">{value}</span>;
      
      case "contactPerson":
        // For contact person, try to extract the name if it's a complex object
        try {
          if (typeof value === 'string' && value.includes('name:')) {
            const nameMatch = value.match(/name:\s*'([^']+)'/);
            return nameMatch ? nameMatch[1] : value;
          }
        } catch (e) {
          console.error("Error formatting contact person:", e);
        }
        return value;
        
      default:
        // For all other fields, return the string value but truncate if too long
        return typeof value === 'string' && value.length > 100 
          ? `${value.substring(0, 97)}...` 
          : value;
    }
  };
  
  // Map user name in audit log to current user if it's "System User"
  const getUserName = (userName) => {
    if (userName === "System User" && currentUser) {
      return currentUser.name || currentUser.email || "Current User";
    }
    
    // If we don't have the current user info, but the UI is showing "System User"
    // We could still return a default display name
    if (userName === "System User") {
      return "Current User";
    }
    
    return userName;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header with close button */}
        <div className="flex justify-between items-center border-b p-4 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-semibold">Lead Details</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Lead details content */}
        <div className="p-6 space-y-6">
          {/* Main info section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-500">Company:</span>
                  <p className="font-medium">{lead.company || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Contact:</span>
                  <p className="font-medium">{lead.contactPerson?.name || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Lead Owner:</span>
                  <p className="font-medium">{lead.leadOwner || 'Unassigned'}</p>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Deal Information</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-500">Original Value:</span>
                  <p className="font-medium">
                    {formatCurrencyValue(lead.value, lead.currencyCode || 'AUD')}
                    {lead.currencyCode && lead.currencyCode !== 'AUD' && (
                      <span className="ml-1 text-sm text-gray-500">({lead.currencyCode})</span>
                    )}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">AUD Value:</span>
                  <p className="font-medium">
                    {lead.audValue ? formatCurrencyValue(lead.audValue) : 
                     (audValue ? formatCurrencyValue(audValue) : '—')}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Stage:</span>
                  <div className="mt-1">
                    <span className={`${getStageBadgeColor(lead.stage)} px-3 py-1 rounded-full text-sm inline-block`}>
                      {lead.stage || 'N/A'}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Priority:</span>
                  <div className="mt-1">
                    <span className={`${getPriorityBadgeColor(lead.priority)} px-3 py-1 rounded-full text-sm inline-block`}>
                      {lead.priority || 'Medium'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Notes section */}
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Notes</h3>
            <div className="bg-gray-50 p-4 rounded-md min-h-[100px]">
              {lead.notes ? (
                <p className="whitespace-pre-wrap">{lead.notes}</p>
              ) : (
                <p className="text-gray-400 italic">No notes available for this lead.</p>
              )}
            </div>
          </div>
          
          {/* Audit log section */}
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Audit Log</h3>
            {loading ? (
              <div className="text-center p-4">Loading audit history...</div>
            ) : error ? (
              <div className="bg-red-50 p-4 rounded-md text-red-600">{error}</div>
            ) : auditLogs.length === 0 ? (
              <div className="bg-gray-50 p-4 rounded-md text-gray-500 italic">No audit records found for this lead.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Field
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Old Value
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        New Value
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {auditLogs.flatMap(log => {
                      // If there are no changes, render a single row with a message
                      if (!log.changes || log.changes.length === 0) {
                        return [
                          <tr key={log._id} className="hover:bg-gray-50">
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(log.timestamp)}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                              {getUserName(log.userName)}
                            </td>
                            <td colSpan={3} className="px-4 py-2 text-sm text-gray-500 italic">
                              No specific changes recorded
                            </td>
                          </tr>
                        ];
                      }
                      
                      // Filter out empty changes
                      const filteredChanges = log.changes.filter(change => 
                        change && change.field && (change.field !== "contactPerson" || 
                        (change.oldValue !== change.newValue))
                      );
                      
                      // Skip this entire log entry if there are no changes left after filtering
                      if (filteredChanges.length === 0) return [];
                      
                      return filteredChanges.map((change, changeIndex) => (
                        <tr key={`${log._id}-${changeIndex}`} className="hover:bg-gray-50">
                          {/* Only show date and user on first row of each log entry */}
                          {changeIndex === 0 ? (
                            <>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500" rowSpan={filteredChanges.length}>
                                {formatDate(log.timestamp)}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900" rowSpan={filteredChanges.length}>
                                {getUserName(log.userName)}
                              </td>
                            </>
                          ) : null}
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                            {formatFieldName(change.field)}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-500">
                            {formatFieldValue(change.field, change.oldValue)}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {formatFieldValue(change.field, change.newValue)}
                          </td>
                        </tr>
                      ));
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          {/* Dates section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4 mt-4">
            <div>
              <span className="text-sm text-gray-500">Created:</span>
              <p>{formatDate(lead.createdAt)}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Last Updated:</span>
              <p>{formatDate(lead.updatedAt)}</p>
            </div>
          </div>
        </div>
        
        {/* Footer with action buttons */}
        <div className="border-t p-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeadDetailsModal;