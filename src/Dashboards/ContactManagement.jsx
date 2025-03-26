import React, { useState, useEffect } from "react";
import ContactForm from "../Dashboards/Contact form/contactForm";
import ContactDetails from "../Dashboards/Contact form/contactDetailsPopup";

const ContactManagement = () => {
  const [contacts, setContacts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentContact, setCurrentContact] = useState({
    _id: null,
    contactType: "prospect",
    companyName: "",
    companyEmail: "",
    phoneNumber: "",
    website: "",
    companyAddress: {
      country: "",
      state: "",
      addressLine1: "",
      addressLine2: "",
      postalCode: ""
    },
    additionalDetails: "",
    contactPersons: [],
    attachments: []
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [loginCredentials, setLoginCredentials] = useState({
    email: '',
    password: ''
  });

  // Add class to body when modal is open to prevent scrolling
  useEffect(() => {
    if (showForm || showDetails) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [showForm, showDetails]);

  // API base URL - ensure this matches your backend deployment
  const API_URL = "http://localhost:5000/api/contacts";
  const AUTH_URL = "http://localhost:5000/api/auth";

  // Check if user is authenticated on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    } else {
      setShowLoginForm(true);
    }
  }, []);

  // Fetch contacts when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchContacts();
    }
  }, [isAuthenticated]);

  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${AUTH_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: loginCredentials.email,
          password: loginCredentials.password
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Login failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Save token to localStorage
      localStorage.setItem('token', data.token);
      
      // Update auth state
      setIsAuthenticated(true);
      setShowLoginForm(false);
      
      // Fetch contacts
      fetchContacts();
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setShowLoginForm(true);
    setContacts([]);
  };

  // Get the authentication token
  const getAuthToken = () => {
    return localStorage.getItem('token');
  };

  // Fetch contacts from API with authentication
  const fetchContacts = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const token = getAuthToken();
      
      if (!token) {
        setIsAuthenticated(false);
        setShowLoginForm(true);
        throw new Error("Authentication required. Please log in.");
      }
      
      const response = await fetch(API_URL, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });
      
      if (response.status === 401) {
        // Authentication error - token expired or invalid
        localStorage.removeItem('token');
        setIsAuthenticated(false);
        setShowLoginForm(true);
        throw new Error("Authentication expired. Please log in again.");
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Error: ${response.status} - ${errorData.error || response.statusText}`);
      }
      
      const data = await response.json();
      setContacts(data);
      
      console.log("Successfully fetched contacts:", data);
    } catch (err) {
      setError("Failed to fetch contacts. " + err.message);
      console.error("Fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter contacts based on search term - handle both old and new schema fields
  const filteredContacts = contacts.filter(contact => {
    const searchLower = searchTerm.toLowerCase();
    
    // Handle both old and new schema field names for backward compatibility
    const companyName = contact.companyName || contact.company || "";
    const companyEmail = contact.companyEmail || contact.email || "";
    const contactType = contact.contactType || "";
    const phoneNumber = contact.phoneNumber || contact.phone || "";
    
    return (
      companyName.toLowerCase().includes(searchLower) ||
      companyEmail.toLowerCase().includes(searchLower) ||
      contactType.toLowerCase().includes(searchLower) ||
      phoneNumber.toLowerCase().includes(searchLower)
    );
  });

  // Handle adding a new contact
  const handleAddNewContact = () => {
    setCurrentContact({
      _id: null,
      contactType: "prospect",
      companyName: "",
      companyEmail: "",
      phoneNumber: "",
      website: "",
      companyAddress: {
        country: "",
        state: "",
        addressLine1: "",
        addressLine2: "",
        postalCode: ""
      },
      additionalDetails: "",
      contactPersons: [],
      attachments: []
    });
    setIsEditing(false);
    setShowForm(true);
  };

  // Handle viewing contact details
  const handleViewContact = (contact) => {
    setSelectedContact(contact);
    setShowDetails(true);
  };

  // Handle editing an existing contact
  const handleEditContact = (contact) => {
    // Create a structured object from either the new or old schema fields
    const editContact = {
      _id: contact._id,
      contactType: contact.contactType || "prospect",
      companyName: contact.companyName || contact.company || "",
      companyEmail: contact.companyEmail || contact.email || "",
      phoneNumber: contact.phoneNumber || contact.phone || "",
      website: contact.website || "",
      companyAddress: contact.companyAddress || {
        country: "",
        state: "",
        addressLine1: "",
        addressLine2: "",
        postalCode: ""
      },
      additionalDetails: contact.additionalDetails || "",
      contactPersons: contact.contactPersons || [],
      attachments: contact.attachments || []
    };
    
    setCurrentContact(editContact);
    setIsEditing(true);
    setShowForm(true);
    setShowDetails(false); // Close details modal if open
  };

  // Form validation for the new schema
  const validateForm = () => {
    const errors = [];
    
    if (!currentContact.companyName || currentContact.companyName.trim() === "") {
      errors.push("Company name is required");
    }
    
    if (!currentContact.companyEmail || currentContact.companyEmail.trim() === "") {
      errors.push("Company email is required");
    } else if (!/\S+@\S+\.\S+/.test(currentContact.companyEmail)) {
      errors.push("Company email is invalid");
    }
    
    if (!currentContact.phoneNumber || currentContact.phoneNumber.trim() === "") {
      errors.push("Phone number is required");
    }
    
    return errors;
  };

  // Handle saving a contact (new or edited) with auth
  const handleSaveContact = async () => {
    const validationErrors = validateForm();
    
    if (validationErrors.length > 0) {
      alert(validationErrors.join("\n"));
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const token = getAuthToken();
      
      if (!token) {
        setIsAuthenticated(false);
        setShowLoginForm(true);
        throw new Error("Authentication required. Please log in.");
      }
      
      // Use the new schema fields for the API request
      const contactData = {
        contactType: currentContact.contactType,
        companyName: currentContact.companyName.trim(),
        companyEmail: currentContact.companyEmail.trim(),
        phoneNumber: currentContact.phoneNumber.trim(),
        website: currentContact.website?.trim(),
        companyAddress: currentContact.companyAddress,
        additionalDetails: currentContact.additionalDetails,
        contactPersons: currentContact.contactPersons,
        attachments: currentContact.attachments
      };
      
      let response;
      
      if (isEditing) {
        // Update existing contact
        response = await fetch(`${API_URL}/${currentContact._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(contactData)
        });
      } else {
        // Add new contact
        response = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(contactData)
        });
      }
      
      if (response.status === 401) {
        // Authentication expired
        localStorage.removeItem('token');
        setIsAuthenticated(false);
        setShowLoginForm(true);
        throw new Error("Authentication expired. Please log in again.");
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Error: ${response.status} - ${errorData.error || response.statusText}`);
      }
      
      const savedContact = await response.json();
      console.log(`Successfully ${isEditing ? 'updated' : 'created'} contact:`, savedContact);
      
      // Update the local state to avoid needing an extra fetch
      if (isEditing) {
        setContacts(contacts.map(c => 
          c._id === savedContact._id ? savedContact : c
        ));
        
        // If the details modal is showing this contact, update it there too
        if (selectedContact && selectedContact._id === savedContact._id) {
          setSelectedContact(savedContact);
        }
      } else {
        setContacts([savedContact, ...contacts]);
      }
      
      // Close form and reset
      setShowForm(false);
      setCurrentContact({
        _id: null,
        contactType: "prospect",
        companyName: "",
        companyEmail: "",
        phoneNumber: "",
        website: "",
        companyAddress: {
          country: "",
          state: "",
          addressLine1: "",
          addressLine2: "",
          postalCode: ""
        },
        additionalDetails: "",
        contactPersons: [],
        attachments: []
      });
    } catch (err) {
      setError(`Failed to ${isEditing ? 'update' : 'create'} contact. ` + err.message);
      console.error("Save error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle deleting a contact with auth
  const handleDeleteContact = async (id) => {
    if (window.confirm("Are you sure you want to delete this contact?")) {
      setIsLoading(true);
      setError(null);
      
      try {
        const token = getAuthToken();
        
        if (!token) {
          setIsAuthenticated(false);
          setShowLoginForm(true);
          throw new Error("Authentication required. Please log in.");
        }
        
        const response = await fetch(`${API_URL}/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.status === 401) {
          localStorage.removeItem('token');
          setIsAuthenticated(false);
          setShowLoginForm(true);
          throw new Error("Authentication expired. Please log in again.");
        }
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`Error: ${response.status} - ${errorData.error || response.statusText}`);
        }
        
        // Update local state instead of refetching
        setContacts(contacts.filter(contact => contact._id !== id));
        console.log("Successfully deleted contact with ID:", id);
        
        // Close details modal if it's showing the deleted contact
        if (selectedContact && selectedContact._id === id) {
          setShowDetails(false);
          setSelectedContact(null);
        }
      } catch (err) {
        setError("Failed to delete contact. " + err.message);
        console.error("Delete error:", err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Handle input change in form (updated for nested objects)
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Handle nested fields using dot notation (e.g., companyAddress.country)
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setCurrentContact({
        ...currentContact,
        [parent]: {
          ...currentContact[parent],
          [child]: value
        }
      });
    } else {
      // Regular field update
      setCurrentContact({ ...currentContact, [name]: value });
    }
  };

  // Handle login form input changes
  const handleLoginInputChange = (e) => {
    const { name, value } = e.target;
    setLoginCredentials({
      ...loginCredentials,
      [name]: value
    });
  };

  // Close modals
  const closeFormModal = () => {
    setShowForm(false);
  };
  
  const closeDetailsModal = () => {
    setShowDetails(false);
    setSelectedContact(null);
  };

  // If not authenticated and login form is showing
  if (showLoginForm) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-6 text-center">Login to Access Contacts</h2>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}
          
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={loginCredentials.email}
                onChange={handleLoginInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={loginCredentials.password}
                onChange={handleLoginInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            
            <button
              type="submit"
              className="w-full py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Logging in...
                </span>
              ) : "Login"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Main contacts view for authenticated users
  return (
    <div className="w-full min-h-screen flex flex-col bg-gray-50">
      {/* Main content area */}
      <div className="flex-grow p-4 sm:p-6">
        {/* Title and Add Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h2 className="text-xl sm:text-2xl font-bold">Business Contacts</h2>
          <div className="flex gap-3">
            <button
              onClick={handleAddNewContact}
              className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              + Add Contact
            </button>
            <button
              onClick={handleLogout}
              className="w-full sm:w-auto px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Logout
            </button>
          </div>
        </div>
        
        {/* Error message */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md flex justify-between items-center">
            <span>{error}</span>
            <button 
              onClick={() => setError(null)} 
              className="text-red-500 hover:text-red-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        )}
        
        {/* Search Bar - Responsive */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="w-full">
              <input
                type="text"
                placeholder="Search contacts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <button
              onClick={fetchContacts}
              className="w-full sm:w-auto px-4 py-2 border border-gray-300 bg-white rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Refresh
            </button>
          </div>
        </div>
        
        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex justify-center my-6">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        )}
        
        {/* Contacts Table - Updated for mobile responsiveness */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredContacts.length > 0 ? (
                  filteredContacts.map((contact) => (
                    <tr 
                      key={contact._id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleViewContact(contact)}
                    >
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {contact.companyName || contact.company || "—"}
                        </div>
                        {/* Mobile view - Show contact type, email on same cell */}
                        <div className="sm:hidden">
                          <div className="text-xs text-gray-500">{contact.companyEmail || contact.email || "—"}</div>
                          <div className="mt-1">
                            {contact.contactType ? (
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                contact.contactType === 'customer' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {contact.contactType.charAt(0).toUpperCase() + contact.contactType.slice(1)}
                              </span>
                            ) : "—"}
                          </div>
                        </div>
                      </td>
                      <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {contact.contactType ? (
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              contact.contactType === 'customer' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {contact.contactType.charAt(0).toUpperCase() + contact.contactType.slice(1)}
                            </span>
                          ) : "—"}
                        </div>
                      </td>
                      <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{contact.companyEmail || contact.email || "—"}</div>
                      </td>
                      <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{contact.phoneNumber || contact.phone || "—"}</div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditContact(contact);
                          }}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                          disabled={isLoading}
                        >
                          Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteContact(contact._id);
                          }}
                          className="text-red-600 hover:text-red-900"
                          disabled={isLoading}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                      {searchTerm ? "No matching contacts found" : "No contacts available. Add your first contact to get started."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Contact Form Component */}
      {showForm && (
        <ContactForm 
          currentContact={currentContact}
          handleInputChange={handleInputChange}
          setCurrentContact={setCurrentContact}
          handleSaveContact={handleSaveContact}
          closeModal={closeFormModal}
          isEditing={isEditing}
          isLoading={isLoading}
        />
      )}
      
      {/* Contact Details Component */}
      {showDetails && selectedContact && (
        <ContactDetails 
          contact={selectedContact}
          closeModal={closeDetailsModal}
          handleEdit={handleEditContact}
          handleDelete={handleDeleteContact}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};

export default ContactManagement;