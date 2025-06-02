import React, { useState, useEffect } from "react";
import config from '../../config';

// Define lead stages directly in the component
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

// Country options
export const COUNTRIES = [
  "Argentina",
  "Australia",
  "Canada",
  "Croatia",
  "New Zealand",
  "USA"
];

// Currency options for reference
export const CURRENCIES = [
  { code: "AUD", name: "Australian Dollar" }
];

// API base URL - change this to match your backend

const API_URL = config.API_URL;

const LeadForm = ({ lead, onSave, onCancel }) => {
  // Initialize form data with lead data or defaults
  const [formData, setFormData] = useState(() => {
    // If we have a lead, initialize with its data
    if (lead) {
      console.log("Initializing form with lead:", lead);
      
      // Determine if this is a manual entry lead
      const isManualLead = lead.isManualEntry || 
                            !lead.contactPerson || 
                            (lead.contactPersonName && !lead.contactPerson?._id);
      
      return {
        contactPerson: isManualLead ? "" : (lead.contactPerson?._id || lead.contactPerson),
        contactPersonName: isManualLead ? (lead.contactPersonName || "") : "",
        company: lead.company || "",
        country: lead.country || "Australia",
        value: lead.value?.toString() || "",
        subscription: lead.subscription?.toString() || "",
        stage: lead.stage || "New Lead",
        priority: lead.priority || "Medium",
        notes: lead.notes || "",
        nextStep: lead.nextStep || "",
        leadOwner: lead.leadOwner || ""
      };
    } else {
      // Default for new lead
      return {
        contactPerson: "",
        contactPersonName: "",
        company: "",
        country: "Australia",
        value: "",
        subscription: "",
        stage: "New Lead",
        priority: "Medium",
        notes: "",
        nextStep: "",
        leadOwner: ""
      };
    }
  });

  // State for dropdown data and UI control
  const [contacts, setContacts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // New state for tracking if user wants to manually enter contact details
  const [isManualEntry, setIsManualEntry] = useState(() => {
    // Default to manual entry if:
    // 1. Editing a lead with isManualEntry flag
    // 2. Or editing a lead with contactPersonName but no contactPerson
    // 3. Or lead has no contactPerson reference
    if (lead) {
      return lead.isManualEntry || 
             (lead.contactPersonName && !lead.contactPerson?._id) || 
             !lead.contactPerson;
    }
    // Default to false for new leads
    return false;
  });

  // Log the initial state to debug issues
  useEffect(() => {
    if (lead) {
      console.log("Lead details:", {
        id: lead._id,
        isManualEntry: lead.isManualEntry,
        contactPerson: lead.contactPerson,
        contactPersonName: lead.contactPersonName
      });
      console.log("Form initialized with isManualEntry:", isManualEntry);
    }
  }, [lead, isManualEntry]);

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

  // Auto-populate company when contact person changes (only when using dropdown)
  useEffect(() => {
    const updateCompanyFromContact = async () => {
      // Skip if no contact person is selected or if in manual entry mode
      if (!formData.contactPerson || isManualEntry) return;
      
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
        console.log("Got contact data:", data);
        
        setFormData(prev => ({
          ...prev,
          company: data.company,
          contactPersonName: data.name // Store the name for reference
        }));
      } catch (err) {
        console.error("Error fetching contact details:", err);
      }
    };

    updateCompanyFromContact();
  }, [formData.contactPerson, isManualEntry]);

  // Handle toggle between dropdown and manual entry
  const handleEntryModeChange = (e) => {
    const mode = e.target.value === "manual";
    setIsManualEntry(mode);
    
    // Reset contact-related fields when switching modes
    if (mode) {
      // Switching to manual mode
      setFormData(prev => ({
        ...prev,
        contactPerson: "", // Clear the contactPerson ID
        // If we already have a contactPerson object with a name, use it as the contactPersonName
        contactPersonName: prev.contactPerson?.name || prev.contactPersonName || "",
        // Keep the company value when switching to manual
        company: prev.company || ""
      }));
    } else {
      // Switching to dropdown mode
      setFormData(prev => ({
        ...prev,
        contactPerson: "", // Clear to make user select from dropdown
        contactPersonName: "", // Clear the manual name
        company: "" // Clear company to be auto-filled from contact
      }));
    }
  };

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(""); // Clear any previous errors
      
      // Validate required fields
      if (isManualEntry && !formData.contactPersonName) {
        setError("Contact Person Name is required for manual entries");
        setLoading(false);
        return;
      }
      
      if (!isManualEntry && !formData.contactPerson) {
        setError("Please select a contact person");
        setLoading(false);
        return;
      }
      
      if (!formData.company) {
        setError("Company is required");
        setLoading(false);
        return;
      }
      
      // Get auth headers
      const headers = getAuthHeaders();
      
      // Convert value to a clean number for submission
      const cleanValue = formData.value ? parseFloat(formData.value.toString().replace(/[^\d.]/g, '')) : 0;
      
      // Convert subscription to a clean number for submission
      const cleanSubscription = formData.subscription ? parseFloat(formData.subscription.toString().replace(/[^\d.]/g, '')) : 0;
      
      // Create request body based on entry mode
      const requestBody = {
        isManualEntry: isManualEntry, // Flag to tell backend this is manual entry
        company: formData.company,
        country: formData.country,
        value: cleanValue,
        subscription: cleanSubscription,
        currencyCode: "AUD", // Default to AUD 
        stage: formData.stage,
        priority: formData.priority,
        notes: formData.notes || "",
        nextStep: formData.nextStep || "",
        leadOwner: formData.leadOwner || ""
      };
      
      // Handle contact person data differently based on entry mode
      if (isManualEntry) {
        // For manual entry, explicitly send the name in contactPersonName field
        requestBody.contactPersonName = formData.contactPersonName;
        // Set contactPerson to null for manual entries
        requestBody.contactPerson = null;
      } else {
        // For dropdown selection, send the ID in contactPerson field
        requestBody.contactPerson = typeof formData.contactPerson === 'object' 
          ? formData.contactPerson._id 
          : formData.contactPerson;
        // Set contactPersonName to null for dropdown selection
        requestBody.contactPersonName = null;
      }
      
      console.log("Submitting form data:", requestBody);
      
      const requestOptions = {
        method: lead && lead._id ? 'PUT' : 'POST',
        headers: headers,
        body: JSON.stringify(requestBody)
      };
      
      const url = lead && lead._id 
        ? `${API_URL}/leads/${lead._id}` 
        : `${API_URL}/leads`;
        
      const response = await fetch(url, requestOptions);
      if (!response.ok) {
        const responseData = await response.json();
        throw new Error(responseData.error || 
                       (responseData.details ? responseData.details.map(e => e.message).join(", ") : 'Failed to save lead'));
      }
      
      const responseData = await response.json();
      console.log("Saved lead data:", responseData);
      
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
    const { name, value } = e.target;
    const formattedValue = formatCurrencyInput(value);
    setFormData({
      ...formData,
      [name]: formattedValue
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
          {/* Contact Entry Mode Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 text-left mb-2">
              Contact Information
            </label>
            <div className="flex space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  value="dropdown"
                  checked={!isManualEntry}
                  onChange={handleEntryModeChange}
                  className="form-radio h-4 w-4 text-indigo-600"
                />
                <span className="ml-2 text-sm text-gray-700">Select from contacts</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  value="manual"
                  checked={isManualEntry}
                  onChange={handleEntryModeChange}
                  className="form-radio h-4 w-4 text-indigo-600"
                />
                <span className="ml-2 text-sm text-gray-700">Enter manually</span>
              </label>
            </div>
          </div>
          
          {/* Conditional rendering based on entry mode */}
          {isManualEntry ? (
            <>
              {/* Manual entry fields */}
              <div>
                <label htmlFor="contactPersonName" className="block text-sm font-medium text-gray-700 text-left">
                  Contact Person Name
                </label>
                <input
                  type="text"
                  name="contactPersonName"
                  id="contactPersonName"
                  value={formData.contactPersonName || ""}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter contact person name"
                />
              </div>
              
              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-700 text-left">
                  Company
                </label>
                <input
                  type="text"
                  name="company"
                  id="company"
                  value={formData.company || ""}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter company name"
                />
              </div>
            </>
          ) : (
            <>
              {/* Dropdown selection fields */}
              <div>
                <label htmlFor="contactPerson" className="block text-sm font-medium text-gray-700 text-left">
                  Contact Person
                </label>
                <select
                  name="contactPerson"
                  id="contactPerson"
                  value={formData.contactPerson || ""}
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
                <label htmlFor="company" className="block text-sm font-medium text-gray-700 text-left">
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
                <p className="text-xs text-gray-500 mt-1 text-left">Auto-populated from selected contact</p>
              </div>
            </>
          )}
          
          {/* Country dropdown */}
          <div>
            <label htmlFor="country" className="block text-sm font-medium text-gray-700 text-left">
              Country
            </label>
            <select
              name="country"
              id="country"
              value={formData.country || "Australia"}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              {COUNTRIES.map(country => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </div>
          
          {/* Value input field */}
          <div>
            <label htmlFor="value" className="block text-sm font-medium text-gray-700 text-left">
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
          
          {/* Subscription input field */}
          <div>
            <label htmlFor="subscription" className="block text-sm font-medium text-gray-700 text-left">
              Subscription (AUD)
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                $
              </span>
              <input
                type="text"
                name="subscription"
                id="subscription"
                value={formData.subscription}
                onChange={handleCurrencyInputChange}
                className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="0.00"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="stage" className="block text-sm font-medium text-gray-700 text-left">
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
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 text-left">
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
            <label htmlFor="leadOwner" className="block text-sm font-medium text-gray-700 text-left">
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
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 text-left">
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
          
          {/* Next Step field */}
          <div>
            <label htmlFor="nextStep" className="block text-sm font-medium text-gray-700 text-left">
              Next Step
            </label>
            <textarea
              name="nextStep"
              id="nextStep"
              rows="3"
              value={formData.nextStep || ""}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="What's the next step for this lead?"
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

export default LeadForm;