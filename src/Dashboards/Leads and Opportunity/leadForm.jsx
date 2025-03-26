// Define constants at module level for separate export
export const LEAD_STAGES = [
  "New Lead",
  "Contacted",
  "Qualified",
  "Demo Done",
  "Proposal Sent",
  "Negotiation",
  "Won - Deal Closed",
  "Lost - Not Interested",
  "Lost - Competitor Win",
  "Lost - No Budget",
  "Follow-up Later"
];

// Currency options - kept for reference but won't be used for conversion
export const CURRENCIES = [
  { code: "AUD", name: "Australian Dollar" }
];

import React, { useState, useEffect } from "react";

// API base URL - change this to match your backend
const API_URL = "http://localhost:5000/api";

const LeadForm = ({ lead, onSave, onCancel }) => {
  const [formData, setFormData] = useState(
    lead || {
      contactPerson: "",
      value: "",
      stage: "New Lead",
      priority: "Medium", // Default priority
      notes: "",
      leadOwner: ""
    }
  );
  const [contacts, setContacts] = useState([]);
  const [users, setUsers] = useState([]);
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

  // Fetch all contacts and users when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get auth headers for API requests
        const headers = getAuthHeaders();
        
        // Using Promise.all to fetch contacts and users in parallel
        const [contactsResponse, usersResponse] = await Promise.all([
          fetch(`${API_URL}/contacts`, { headers }),
          fetch(`${API_URL}/tasks/dropdown/users`, { headers })
        ]);
        
        if (!contactsResponse.ok) {
          throw new Error(`Failed to fetch contacts: ${contactsResponse.status}`);
        }
        
        if (!usersResponse.ok) {
          throw new Error(`Failed to fetch users: ${usersResponse.status}`);
        }
        
        const contactsData = await contactsResponse.json();
        const usersData = await usersResponse.json();
        
        console.log("Fetched contacts:", contactsData);
        console.log("Fetched users:", usersData);
        
        setContacts(contactsData);
        setUsers(usersData);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load necessary data. Please try again.");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Auto-populate company when contact person changes
  useEffect(() => {
    const updateCompanyFromContact = async () => {
      // Skip if no contact person is selected
      if (!formData.contactPerson) return;
      
      try {
        // Get auth headers
        const headers = getAuthHeaders();
        
        // Extract the contact ID properly to ensure it's a string
        const contactId = typeof formData.contactPerson === 'object' 
          ? formData.contactPerson._id 
          : formData.contactPerson;
        
        // Ensure we have a valid ID before making the request
        if (!contactId || contactId === 'undefined' || contactId === '[object Object]') {
          console.error("Invalid contact ID:", contactId);
          return;
        }
        
        const response = await fetch(`${API_URL}/leads/contact/${contactId}`, { headers });
        
        if (!response.ok) {
          throw new Error('Failed to fetch contact details');
        }
        
        const data = await response.json();
        
        setFormData(prev => ({
          ...prev,
          company: data.company
        }));
      } catch (err) {
        console.error("Error fetching contact details:", err);
      }
    };

    updateCompanyFromContact();
  }, [formData.contactPerson]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Get auth headers
      const headers = getAuthHeaders();
      
      // Ensure contactPerson is a valid ID string, not an object
      const contactPersonId = typeof formData.contactPerson === 'object' 
        ? formData.contactPerson._id 
        : formData.contactPerson;
      
      // Convert value to a clean number for submission
      const cleanValue = formData.value ? parseFloat(formData.value.toString().replace(/[^\d.]/g, '')) : 0;
      
      // Create request body - simplified without currency conversion
      const requestBody = {
        contactPerson: contactPersonId,
        value: cleanValue,
        currencyCode: "AUD", // Default to AUD since we're not converting anymore
        stage: formData.stage,
        priority: formData.priority,
        notes: formData.notes,
        leadOwner: formData.leadOwner
      };
      
      const requestOptions = {
        method: lead && lead._id ? 'PUT' : 'POST',
        headers: headers,
        body: JSON.stringify(requestBody)
      };
      
      console.log("Form submission data:", requestBody);
      
      const url = lead && lead._id 
        ? `${API_URL}/leads/${lead._id}` 
        : `${API_URL}/leads`;
        
      const response = await fetch(url, requestOptions);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save lead');
      }
      
      const savedData = await response.json();
      console.log("Saved lead data:", savedData);
      
      setLoading(false);
      onSave(); // Notify parent component to refresh data
    } catch (err) {
      console.error("Error saving lead:", err);
      setError(err.message || "Failed to save lead. Please try again.");
      setLoading(false);
    }
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

  const handleCurrencyInputChange = (e) => {
    const rawValue = e.target.value;
    const formattedValue = formatCurrencyInput(rawValue);
    setFormData({
      ...formData,
      value: formattedValue
    });
  };

  if (loading && contacts.length === 0) {
    return <div className="text-center p-4">Loading data...</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-xl font-semibold mb-4">{lead ? "Edit Lead" : "Add New Lead"}</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label htmlFor="contactPerson" className="block text-sm font-medium text-gray-700">
              Contact Person
            </label>
            <select
              name="contactPerson"
              id="contactPerson"
              value={formData.contactPerson}
              onChange={handleChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Select a contact</option>
              {contacts.map(contact => (
                <option key={contact._id} value={contact._id}>
                  {contact.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="company" className="block text-sm font-medium text-gray-700">
              Company
            </label>
            <input
              type="text"
              name="company"
              id="company"
              value={formData.company || ""}
              disabled
              className="mt-1 block w-full border border-gray-300 bg-gray-100 rounded-md shadow-sm py-2 px-3"
            />
            <p className="text-xs text-gray-500 mt-1">Auto-populated from selected contact</p>
          </div>
          
          {/* Simplified value input without currency selection */}
          <div>
            <label htmlFor="value" className="block text-sm font-medium text-gray-700">
              Value (AUD)
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                $
              </span>
              <input
                type="text"
                name="value"
                id="value"
                value={formData.value}
                onChange={handleCurrencyInputChange}
                required
                className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="0.00"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="stage" className="block text-sm font-medium text-gray-700">
                Stage
              </label>
              <select
                name="stage"
                id="stage"
                value={formData.stage}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                {LEAD_STAGES.map((stage) => (
                  <option key={stage} value={stage}>
                    {stage}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                Priority
              </label>
              <select
                name="priority"
                id="priority"
                value={formData.priority}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>
          
          <div>
            <label htmlFor="leadOwner" className="block text-sm font-medium text-gray-700">
              Lead Owner
            </label>
            <select
              name="leadOwner"
              id="leadOwner"
              value={formData.leadOwner}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Select Lead Owner</option>
              {users.map((user) => (
                <option key={user._id} value={user.name}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
              Notes
            </label>
            <textarea
              name="notes"
              id="notes"
              rows="3"
              value={formData.notes || ""}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Add any important details about this lead..."
            ></textarea>
          </div>
          
          {lead && lead.createdAt && (
            <div className="text-sm text-gray-500">
              <span className="font-medium">Created:</span> {new Date(lead.createdAt).toLocaleString()}
            </div>
          )}
        </div>
        
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
            {loading ? 'Saving...' : lead ? 'Update Lead' : 'Add Lead'}
          </button>
        </div>
      </form>
    </div>
  );
};

// Export the LeadForm component as default
export default LeadForm;