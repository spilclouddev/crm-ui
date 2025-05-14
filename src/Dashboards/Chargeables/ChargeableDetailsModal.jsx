import React, { useState, useEffect } from "react";
import { FileText, File, Download, X } from "lucide-react";

// API base URL
import config from '../../config';
const API_URL = config.API_URL;

const ChargeableDetailsModal = ({ chargeable, onClose }) => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Function to get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    };
  };

  // Fetch audit logs when component mounts
  useEffect(() => {
    if (!chargeable?._id) return;

    const fetchAuditLogs = async () => {
      try {
        setLoading(true);
        
        // Get auth headers
        const headers = getAuthHeaders();
        
        // Fetch from backend
        const response = await fetch(`${API_URL}/chargeables/audit/${chargeable._id}`, {
          headers
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        setAuditLogs(data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching audit logs:", err);
        setError("Failed to load audit history. Please try again.");
        setLoading(false);
        
        // Fallback to empty audit logs
        setAuditLogs([]);
      }
    };

    fetchAuditLogs();
  }, [chargeable]);

  // Handle attachment download
  const handleDownloadAttachment = (attachment) => {
    // For Cloudinary-hosted files, we can directly open the URL
    if (attachment.filePath) {
      window.open(attachment.filePath, '_blank');
      return;
    }
    
    // Legacy support for older file formats
    // Get the file path
    const filePath = attachment.filePath || `/api/chargeables/${chargeable._id}/attachments/${attachment._id}`;
    
    if (!filePath) {
      console.error("No file path available for download");
      return;
    }
    
    // Create a full URL
    const downloadUrl = filePath.startsWith('http') ? filePath : `${API_URL}${filePath}`;
    
    // Open in a new tab or trigger download
    window.open(downloadUrl, '_blank');
  };

  // Get file icon based on file extension
  const getFileIcon = (fileName) => {
    const extension = fileName.toLowerCase().split('.').pop();
    
    if (['pdf'].includes(extension)) {
      return <FileText className="h-5 w-5 text-red-500 mr-2" />;
    } else if (['doc', 'docx'].includes(extension)) {
      return <FileText className="h-5 w-5 text-blue-500 mr-2" />;
    } else if (['xls', 'xlsx'].includes(extension)) {
      return <FileText className="h-5 w-5 text-green-500 mr-2" />;
    } else if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) {
      return <FileText className="h-5 w-5 text-purple-500 mr-2" />;
    } else {
      return <File className="h-5 w-5 text-gray-500 mr-2" />;
    }
  };

  if (!chargeable) return null;

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString(); // Using toLocaleString for date and time
  };

  // Format currency for display
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD'
    }).format(amount);
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

  // Format field name for display
  const formatFieldName = (fieldName) => {
    switch(fieldName) {
      case "quotationSent": return "Quotation Sent";
      case "poReceived": return "PO Received";
      case "invoiceSent": return "Invoice Sent";
      case "paymentReceived": return "Payment Received";
      case "amount": return "Amount";
      case "followUps": return "Follow Ups";
      case "chargeableType": return "Chargeable Type";
      case "customerName": return "Customer Name";
      case "quoteSendDate": return "Quote Send Date";
      case "attachments": return "Attachments";
      case "all": return "All Fields";
      case "status": return "Status";
      default: return fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
    }
  };

  // Format field value for display
  const formatFieldValue = (field, value) => {
    if (value === undefined || value === null || value === "") return "—";
    
    switch(field) {
      case "amount":
        return formatCurrency(parseFloat(value));
      
      case "quotationSent":
      case "poReceived":
      case "invoiceSent":
      case "paymentReceived":
        return (
          <span className={`${getStatusBadgeColor(value)} px-2 py-1 rounded-full text-xs inline-block`}>
            {value === "yes" ? "Yes" : value === "no" ? "No" : "Pending"}
          </span>
        );
      
      case "quoteSendDate":
        try {
          return formatDate(value).split(',')[0]; // Return just the date part
        } catch (e) {
          return value;
        }
      
      default:
        // For all other fields, return the string value but truncate if too long
        return typeof value === 'string' && value.length > 100 
          ? `${value.substring(0, 97)}...` 
          : value;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header with close button */}
        <div className="flex justify-between items-center border-b p-4 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-semibold">Chargeable Details</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        {/* Chargeable details content */}
        <div className="p-6 space-y-6">
          {/* Main info section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Information</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-500">Customer:</span>
                  <p className="font-medium">{chargeable.customerName || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Contact Person:</span>
                  <p className="font-medium">
                    {chargeable.contactPerson ? 
                     (typeof chargeable.contactPerson === 'object' ? 
                      chargeable.contactPerson.name : 'Contact information') : 
                     'N/A'}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Chargeable Type:</span>
                  <p className="font-medium">{chargeable.chargeableType || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Quote Send Date:</span>
                  <p className="font-medium">{formatDate(chargeable.quoteSendDate).split(',')[0] || 'N/A'}</p>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Financial Information</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-500">Amount:</span>
                  <p className="font-medium">{formatCurrency(chargeable.amount)}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Currency:</span>
                  <p className="font-medium">{chargeable.currencyCode || 'AUD'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Follow Ups:</span>
                  <p className="font-medium">{chargeable.followUps}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Status section */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Status Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="text-sm text-gray-500 mb-1">Quotation Sent</div>
                <div>
                  <span className={`${getStatusBadgeColor(chargeable.quotationSent)} px-3 py-1 rounded-full text-sm inline-block`}>
                    {chargeable.quotationSent === "yes" ? "Yes" : 
                     chargeable.quotationSent === "no" ? "No" : "Pending"}
                  </span>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="text-sm text-gray-500 mb-1">PO Received</div>
                <div>
                  <span className={`${getStatusBadgeColor(chargeable.poReceived)} px-3 py-1 rounded-full text-sm inline-block`}>
                    {chargeable.poReceived === "yes" ? "Yes" : 
                     chargeable.poReceived === "no" ? "No" : "Pending"}
                  </span>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="text-sm text-gray-500 mb-1">Invoice Sent</div>
                <div>
                  <span className={`${getStatusBadgeColor(chargeable.invoiceSent)} px-3 py-1 rounded-full text-sm inline-block`}>
                    {chargeable.invoiceSent === "yes" ? "Yes" : 
                     chargeable.invoiceSent === "no" ? "No" : "Pending"}
                  </span>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="text-sm text-gray-500 mb-1">Payment Received</div>
                <div>
                  <span className={`${getStatusBadgeColor(chargeable.paymentReceived)} px-3 py-1 rounded-full text-sm inline-block`}>
                    {chargeable.paymentReceived === "yes" ? "Yes" : 
                     chargeable.paymentReceived === "no" ? "No" : "Pending"}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Attachments section */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Attachments</h3>
            {chargeable.attachments && chargeable.attachments.length > 0 ? (
              <div className="bg-gray-50 p-4 rounded-md">
                <ul className="divide-y divide-gray-200">
                  {Array.isArray(chargeable.attachments) && chargeable.attachments.map((attachment, index) => {
                    // Get filename from attachment object or string
                    const fileName = attachment.fileName || attachment;
                    return (
                      <li key={index} className="py-3 flex justify-between items-center">
                        <div className="flex items-center">
                          {getFileIcon(fileName)}
                          <span>{fileName}</span>
                        </div>
                        <button 
                          className="text-purple-600 hover:text-purple-900 flex items-center"
                          onClick={() => handleDownloadAttachment(attachment)}
                        >
                          <Download className="h-5 w-5 mr-1" />
                          <span>View/Download</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : (
              <div className="bg-gray-50 p-4 rounded-md text-gray-500 italic">
                No attachments available for this chargeable.
              </div>
            )}
          </div>
          
          {/* Audit log section */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Audit Log</h3>
            {loading ? (
              <div className="text-center p-4">Loading audit history...</div>
            ) : error ? (
              <div className="bg-red-50 p-4 rounded-md text-red-600">{error}</div>
            ) : auditLogs.length === 0 ? (
              <div className="bg-gray-50 p-4 rounded-md text-gray-500 italic">No audit records found for this chargeable.</div>
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
                              {log.userName}
                            </td>
                            <td colSpan={3} className="px-4 py-2 text-sm text-gray-500 italic">
                              No specific changes recorded
                            </td>
                          </tr>
                        ];
                      }
                      
                      return log.changes.map((change, changeIndex) => (
                        <tr key={`${log._id}-${changeIndex}`} className="hover:bg-gray-50">
                          {/* Only show date and user on first row of each log entry */}
                          {changeIndex === 0 ? (
                            <>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500" rowSpan={log.changes.length}>
                                {formatDate(log.timestamp)}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900" rowSpan={log.changes.length}>
                                {log.userName}
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
              <p>{formatDate(chargeable.createdAt)}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Last Updated:</span>
              <p>{formatDate(chargeable.updatedAt)}</p>
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

export default ChargeableDetailsModal;