import React, { useState, useEffect } from "react";
import { Upload, X } from "lucide-react";

// API base URL
import config from '../../config';
const API_URL = config.API_URL;

// Status options for dropdowns
const STATUS_OPTIONS = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "pending", label: "Pending" }
];

const ChargeableForm = ({ chargeable, onSave, onCancel }) => {
  // Initialize form data with chargeable data or defaults
  const [formData, setFormData] = useState(() => {
    if (chargeable) {
      return {
        quoteSendDate: chargeable.quoteSendDate ? new Date(chargeable.quoteSendDate).toISOString().split('T')[0] : "",
        customerName: chargeable.customerName || "",
        chargeableType: chargeable.chargeableType || "",
        quotationSent: chargeable.quotationSent || "no",
        followUps: chargeable.followUps || 0,
        amount: chargeable.amount?.toString() || "",
        poReceived: chargeable.poReceived || "no",
        invoiceSent: chargeable.invoiceSent || "no",
        paymentReceived: chargeable.paymentReceived || "no",
        attachments: chargeable.attachments || []
      };
    } else {
      // Default for new chargeable
      return {
        quoteSendDate: new Date().toISOString().split('T')[0], // Current date in YYYY-MM-DD format
        customerName: "",
        chargeableType: "",
        quotationSent: "no",
        followUps: 0,
        amount: "",
        poReceived: "no",
        invoiceSent: "no",
        paymentReceived: "no",
        attachments: []
      };
    }
  });

  // State for customers dropdown, UI control, and file uploads
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState([]);
  
  // Function to get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    };
  };

  // Fetch customers for dropdown when component mounts
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        
        // Get auth headers
        const headers = getAuthHeaders();
        
        // Fetch customers from backend
        const response = await fetch(`${API_URL}/chargeables/dropdown/customers`, {
          headers
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        setCustomers(data);
        
        // Also fetch contact companies as potential customers
        const contactsResponse = await fetch(`${API_URL}/contacts`, {
          headers
        });
        
        if (contactsResponse.ok) {
          const contactsData = await contactsResponse.json();
          
          // Extract unique companies from contacts
          const companies = [...new Set(contactsData.map(contact => contact.company))];
          
          // Add any unique companies not already in customers list
          const additionalCustomers = companies
            .filter(company => company && company.trim() !== '')
            .filter(company => !data.some(customer => customer.name === company))
            .map(company => ({ name: company }));
          
          if (additionalCustomers.length > 0) {
            setCustomers([...data, ...additionalCustomers]);
          }
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Error fetching customers:", err);
        setError("Failed to load customers. Please try again.");
        setLoading(false);
        
        // Fallback to empty customers list
        setCustomers([]);
      }
    };
    
    fetchCustomers();
  }, []);

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "followUps") {
      // Ensure followUps is a valid non-negative number
      const numValue = parseInt(value, 10);
      if (isNaN(numValue) || numValue < 0) return;
    }
    
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Format currency input to show commas for thousands
  const formatCurrencyInput = (value) => {
    if (!value) return "";
    
    // Remove non-numeric characters except decimal point
    let numericValue = value.toString().replace(/[^\d.]/g, '');
    
    // Ensure only one decimal point
    const parts = numericValue.split('.');
    if (parts.length > 2) {
      numericValue = parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Format with commas
    if (numericValue.includes('.')) {
      const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      return integerPart + '.' + parts[1];
    } else {
      return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
  };

  // Handle currency input changes
  const handleCurrencyInputChange = (e) => {
    const rawValue = e.target.value;
    const formattedValue = formatCurrencyInput(rawValue);
    setFormData({
      ...formData,
      amount: formattedValue
    });
  };

  // Handle file upload
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;
    
    try {
      // For both new and existing chargeables, store files temporarily
      const newAttachments = [...formData.attachments];
      const newUploadedFiles = [...uploadedFiles];
      
      files.forEach(file => {
        const fileName = file.name;
        if (!newAttachments.some(a => a.fileName === fileName)) {
          newAttachments.push({
            fileName,
            fileType: file.type,
            tempFile: true
          });
          newUploadedFiles.push(file);
        }
      });
      
      setFormData(prev => ({
        ...prev,
        attachments: newAttachments
      }));
      
      setUploadedFiles(newUploadedFiles);
      
    } catch (err) {
      console.error("Error handling file upload:", err);
      setError("Failed to process files. Please try again.");
    }
  };

  // Remove attachment
  const handleRemoveAttachment = async (index) => {
    try {
      // Get the attachment to be removed
      const attachment = formData.attachments[index];
      
      // If it's a temporary file (not yet uploaded to server)
      if (attachment.tempFile) {
        // Just remove it from local state
        const newAttachments = [...formData.attachments];
        newAttachments.splice(index, 1);
        
        const newUploadedFiles = [...uploadedFiles];
        const fileIndex = newUploadedFiles.findIndex(file => file.name === attachment.fileName);
        if (fileIndex !== -1) {
          newUploadedFiles.splice(fileIndex, 1);
        }
        
        setFormData({
          ...formData,
          attachments: newAttachments
        });
        
        setUploadedFiles(newUploadedFiles);
      } 
      // If it's already on the server and we have a chargeable ID
      else if (chargeable && chargeable._id && attachment._id) {
        setLoading(true);
        
        // Get auth headers
        const headers = getAuthHeaders();
        
        // Send delete request to backend
        const response = await fetch(`${API_URL}/chargeables/${chargeable._id}/attachments/${attachment._id}`, {
          method: 'DELETE',
          headers
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const updatedChargeable = await response.json();
        
        // Update form data with new attachments
        setFormData(prev => ({
          ...prev,
          attachments: updatedChargeable.attachments
        }));
        
        setLoading(false);
      } 
      // Otherwise, just remove from local state
      else {
        const newAttachments = [...formData.attachments];
        newAttachments.splice(index, 1);
        
        setFormData({
          ...formData,
          attachments: newAttachments
        });
      }
    } catch (err) {
      console.error("Error removing attachment:", err);
      setError("Failed to remove attachment. Please try again.");
      setLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError("");
      
      // Validate required fields
      if (!formData.quoteSendDate) {
        setError("Quote send date is required");
        setLoading(false);
        return;
      }
      
      if (!formData.customerName) {
        setError("Customer name is required");
        setLoading(false);
        return;
      }
      
      if (!formData.chargeableType) {
        setError("Chargeable type/description is required");
        setLoading(false);
        return;
      }
      
      if (!formData.amount) {
        setError("Amount is required");
        setLoading(false);
        return;
      }
      
      // Convert amount to a clean number for submission
      const cleanAmount = parseFloat(formData.amount.toString().replace(/[^\d.]/g, ''));
      
      if (isNaN(cleanAmount)) {
        setError("Please enter a valid amount");
        setLoading(false);
        return;
      }
      
      // Create the submission data
      const submissionData = {
        ...formData,
        amount: cleanAmount,
        followUps: parseInt(formData.followUps, 10)
      };
      
      // Remove temporary attachment data
      if (submissionData.attachments) {
        submissionData.attachments = submissionData.attachments
          .filter(a => !a.tempFile)
          .map(a => a._id ? a._id : a);
      }
      
      // Pass the data to the parent component for saving
      const savedChargeable = await onSave(submissionData);
      
      // If there are uploaded files, upload them now
      if (savedChargeable && uploadedFiles.length > 0) {
        const fileFormData = new FormData();
        
        // Append each file to the form data
        uploadedFiles.forEach(file => {
          fileFormData.append('files', file);
        });
        
        // Get auth headers without content-type
        const token = localStorage.getItem('token');
        const headers = {
          'Authorization': token ? `Bearer ${token}` : ''
        };
        
        try {
          console.log(`Uploading ${uploadedFiles.length} files to chargeable ${savedChargeable._id}`);
          
          // Upload files to the newly created/updated chargeable
          const fileResponse = await fetch(`${API_URL}/chargeables/${savedChargeable._id}/attachments`, {
            method: 'POST',
            headers,
            body: fileFormData
          });
          
          if (!fileResponse.ok) {
            throw new Error(`File upload failed with status: ${fileResponse.status}`);
          }
          
          console.log("Files uploaded successfully");
        } catch (fileError) {
          console.error("Error uploading files:", fileError);
          setError("Chargeable was saved but file upload failed. You can try uploading files later.");
        }
      }
      
      setLoading(false);
      return savedChargeable;
    } catch (err) {
      console.error("Error saving chargeable:", err);
      setError("Failed to save chargeable. Please try again.");
      setLoading(false);
      return null;
    }
  };

  // Get file icon based on file type/extension
  const getFileIcon = (fileName) => {
    const extension = fileName.toLowerCase().split('.').pop();
    
    if (['pdf'].includes(extension)) {
      return (
        <svg className="h-5 w-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
        </svg>
      );
    } else if (['doc', 'docx'].includes(extension)) {
      return (
        <svg className="h-5 w-5 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
        </svg>
      );
    } else if (['xls', 'xlsx'].includes(extension)) {
      return (
        <svg className="h-5 w-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" clipRule="evenodd" />
        </svg>
      );
    } else if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) {
      return (
        <svg className="h-5 w-5 text-purple-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
        </svg>
      );
    } else {
      return (
        <svg className="h-5 w-5 text-gray-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
        </svg>
      );
    }
  };

  if (loading && customers.length === 0) {
    return <div className="text-center p-4">Loading data...</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-xl font-semibold mb-4">{chargeable ? "Edit Chargeable" : "Add New Chargeable"}</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {/* Quote Send Date */}
          <div>
            <label htmlFor="quoteSendDate" className="block text-sm font-medium text-gray-700">
              Quote Send Date
            </label>
            <input
              type="date"
              name="quoteSendDate"
              id="quoteSendDate"
              value={formData.quoteSendDate}
              onChange={handleChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          {/* Customer Name */}
          <div>
            <label htmlFor="customerName" className="block text-sm font-medium text-gray-700">
              Customer Name
            </label>
            <select
              name="customerName"
              id="customerName"
              value={formData.customerName}
              onChange={handleChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Select Customer</option>
              {customers.map((customer, index) => (
                <option key={index} value={customer.name}>
                  {customer.name}
                </option>
              ))}
              <option value="Other">Other (Enter Manually)</option>
            </select>
            
            {formData.customerName === "Other" && (
              <input
                type="text"
                name="customerName"
                placeholder="Enter customer name"
                onChange={handleChange}
                className="mt-2 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            )}
          </div>
          
          {/* Chargeable Type/Description */}
          <div>
            <label htmlFor="chargeableType" className="block text-sm font-medium text-gray-700">
              Chargeable Type (Description)
            </label>
            <input
              type="text"
              name="chargeableType"
              id="chargeableType"
              value={formData.chargeableType}
              onChange={handleChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter type or description"
            />
          </div>
          
          {/* Amount field */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
              Amount (AUD)
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                $
              </span>
              <input
                type="text"
                name="amount"
                id="amount"
                value={formData.amount}
                onChange={handleCurrencyInputChange}
                required
                className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="0.00"
              />
            </div>
          </div>
          
          {/* Status Fields - Row 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="quotationSent" className="block text-sm font-medium text-gray-700">
                Quotation Sent
              </label>
              <select
                name="quotationSent"
                id="quotationSent"
                value={formData.quotationSent}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                {STATUS_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="followUps" className="block text-sm font-medium text-gray-700">
                Follow Ups
              </label>
              <input
                type="number"
                name="followUps"
                id="followUps"
                min="0"
                value={formData.followUps}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
          
          {/* Status Fields - Row 2 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="poReceived" className="block text-sm font-medium text-gray-700">
                PO Received
              </label>
              <select
                name="poReceived"
                id="poReceived"
                value={formData.poReceived}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                {STATUS_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="invoiceSent" className="block text-sm font-medium text-gray-700">
                Invoice Sent
              </label>
              <select
                name="invoiceSent"
                id="invoiceSent"
                value={formData.invoiceSent}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                {STATUS_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="paymentReceived" className="block text-sm font-medium text-gray-700">
                Payment Received
              </label>
              <select
                name="paymentReceived"
                id="paymentReceived"
                value={formData.paymentReceived}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                {STATUS_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Attachments */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Attachments
            </label>
            
            {/* File Upload Button */}
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                    <span>Upload a file</span>
                    <input 
                      id="file-upload" 
                      name="file-upload" 
                      type="file" 
                      className="sr-only"
                      multiple
                      onChange={handleFileUpload}
                      disabled={loading}
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">
                  PDF, Word, Excel, or image files up to 10MB
                </p>
              </div>
            </div>
            
            {/* Attachment List */}
            {formData.attachments && formData.attachments.length > 0 && (
              <div className="mt-3">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Uploaded Files:</h4>
                <ul className="border rounded-md divide-y">
                  {formData.attachments.map((attachment, index) => {
                    // Get filename from attachment object or string
                    const fileName = attachment.fileName || attachment;
                    return (
                      <li key={index} className="flex items-center justify-between px-4 py-2 text-sm">
                        <div className="flex items-center">
                          {getFileIcon(fileName)}
                          <span className="truncate max-w-xs">{fileName}</span>
                          {attachment.tempFile && (
                            <span className="ml-2 text-xs text-gray-500">(Will be uploaded after saving)</span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(index)}
                          className="text-red-500 hover:text-red-700"
                          disabled={loading}
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </div>
        
        {/* Form actions */}
        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            {loading ? 'Saving...' : chargeable ? 'Update Chargeable' : 'Add Chargeable'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChargeableForm;