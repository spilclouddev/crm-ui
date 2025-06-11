import React, { useState } from "react";
import { Upload, X, Camera, FileText, File } from "lucide-react";

// API base URL
import config from '../../config';
const API_URL = config.API_URL;

const ContactForm = ({ 
  currentContact, 
  handleInputChange, 
  setCurrentContact,
  handleSaveContact, 
  closeModal, 
  isEditing, 
  isLoading 
}) => {
  const [activeTab, setActiveTab] = useState('company');
  const [tempContactPerson, setTempContactPerson] = useState({
    title: "",
    name: "",
    designation: "",
    email: "",
    phoneNumber: "",
    linkedin: "",
    address: {
      country: "",
      state: "",
      addressLine1: "",
      addressLine2: "",
      postalCode: ""
    },
    notes: ""
  });
  const [showPersonForm, setShowPersonForm] = useState(false);
  const [editingPersonIndex, setEditingPersonIndex] = useState(-1);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  // Function to get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Authorization': token ? `Bearer ${token}` : ''
    };
  };

  // Handle contact person input change
  const handlePersonInputChange = (e) => {
    const { name, value } = e.target;
    
    // Handle nested fields for address
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setTempContactPerson({
        ...tempContactPerson,
        [parent]: {
          ...tempContactPerson[parent],
          [child]: value
        }
      });
    } else {
      setTempContactPerson({ ...tempContactPerson, [name]: value });
    }
  };

  // Add new contact person
  const handleAddPerson = () => {
    setTempContactPerson({
      title: "",
      name: "",
      designation: "",
      email: "",
      phoneNumber: "",
      linkedin: "",
      address: {
        country: "",
        state: "",
        addressLine1: "",
        addressLine2: "",
        postalCode: ""
      },
      notes: ""
    });
    setEditingPersonIndex(-1);
    setShowPersonForm(true);
  };

  // Save contact person
  const handleSavePerson = () => {
    // Validate required fields
    if (!tempContactPerson.name || tempContactPerson.name.trim() === "") {
      alert("Contact person name is required");
      return;
    }

    // Create a copy of the current contact persons array
    const updatedPersons = [...currentContact.contactPersons];
    
    if (editingPersonIndex >= 0) {
      // Update existing person
      updatedPersons[editingPersonIndex] = tempContactPerson;
    } else {
      // Add new person
      updatedPersons.push(tempContactPerson);
    }
    
    // Update the current contact state
    setCurrentContact({
      ...currentContact,
      contactPersons: updatedPersons
    });
    
    // Reset form
    setShowPersonForm(false);
    setEditingPersonIndex(-1);
  };

  // Edit existing contact person
  const handleEditPerson = (index) => {
    setTempContactPerson(currentContact.contactPersons[index]);
    setEditingPersonIndex(index);
    setShowPersonForm(true);
  };

  // Remove contact person
  const handleRemovePerson = (index) => {
    if (window.confirm("Are you sure you want to remove this contact person?")) {
      const updatedPersons = [...currentContact.contactPersons];
      updatedPersons.splice(index, 1);
      
      setCurrentContact({
        ...currentContact,
        contactPersons: updatedPersons
      });
    }
  };

  // Handle logo file selection
  const handleLogoFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      
      setLogoFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload logo
  const handleLogoUpload = async (contactId) => {
    if (!logoFile || !contactId) return null;
    
    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append('companyLogo', logoFile);
      
      const headers = getAuthHeaders();
      
      const response = await fetch(`${API_URL}/contacts/${contactId}/logo`, {
        method: 'POST',
        headers,
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Logo upload failed: ${response.statusText}`);
      }
      
      const updatedContact = await response.json();
      console.log('Logo uploaded successfully');
      
      // Clear temporary states
      setLogoFile(null);
      setLogoPreview(null);
      
      return updatedContact;
    } catch (error) {
      console.error('Error uploading logo:', error);
      alert('Failed to upload logo: ' + error.message);
      return null;
    } finally {
      setUploading(false);
    }
  };

  // Remove logo
  const handleRemoveLogo = async () => {
    if (!currentContact._id) {
      // If editing and no logo file selected, just clear the preview
      setLogoFile(null);
      setLogoPreview(null);
      return;
    }
    
    if (!window.confirm('Are you sure you want to remove the company logo?')) {
      return;
    }
    
    try {
      setUploading(true);
      
      const headers = getAuthHeaders();
      
      const response = await fetch(`${API_URL}/contacts/${currentContact._id}/logo`, {
        method: 'DELETE',
        headers
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete logo: ${response.statusText}`);
      }
      
      const updatedContact = await response.json();
      
      // Update the current contact state
      setCurrentContact({
        ...currentContact,
        companyLogo: undefined
      });
      
      console.log('Logo deleted successfully');
    } catch (error) {
      console.error('Error deleting logo:', error);
      alert('Failed to delete logo: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  // Handle attachment file selection
  const handleAttachmentFileSelect = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;
    
    // For new contacts, store files temporarily
    const newUploadedFiles = [...uploadedFiles];
    const newAttachments = [...(currentContact.attachments || [])];
    
    files.forEach(file => {
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        alert(`File ${file.name} is too large. Maximum size is 10MB.`);
        return;
      }
      
      const fileName = file.name;
      if (!newAttachments.some(a => a.fileName === fileName)) {
        newAttachments.push({
          fileName,
          fileType: file.type,
          fileSize: file.size,
          tempFile: true
        });
        newUploadedFiles.push(file);
      }
    });
    
    setCurrentContact(prev => ({
      ...prev,
      attachments: newAttachments
    }));
    
    setUploadedFiles(newUploadedFiles);
  };

  // Upload attachments
  const handleAttachmentsUpload = async (contactId) => {
    if (uploadedFiles.length === 0 || !contactId) return null;
    
    try {
      setUploading(true);
      
      const formData = new FormData();
      uploadedFiles.forEach(file => {
        formData.append('attachments', file);
      });
      
      const headers = getAuthHeaders();
      
      const response = await fetch(`${API_URL}/contacts/${contactId}/attachments`, {
        method: 'POST',
        headers,
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Attachments upload failed: ${response.statusText}`);
      }
      
      const updatedContact = await response.json();
      console.log('Attachments uploaded successfully');
      
      // Clear temporary states
      setUploadedFiles([]);
      
      return updatedContact;
    } catch (error) {
      console.error('Error uploading attachments:', error);
      alert('Failed to upload attachments: ' + error.message);
      return null;
    } finally {
      setUploading(false);
    }
  };

  // Remove attachment
  const handleRemoveAttachment = async (index) => {
    try {
      const attachment = currentContact.attachments[index];
      
      // If it's a temporary file (not yet uploaded to server)
      if (attachment.tempFile) {
        // Just remove it from local state
        const newAttachments = [...currentContact.attachments];
        newAttachments.splice(index, 1);
        
        const newUploadedFiles = [...uploadedFiles];
        const fileIndex = newUploadedFiles.findIndex(file => file.name === attachment.fileName);
        if (fileIndex !== -1) {
          newUploadedFiles.splice(fileIndex, 1);
        }
        
        setCurrentContact({
          ...currentContact,
          attachments: newAttachments
        });
        
        setUploadedFiles(newUploadedFiles);
      } 
      // If it's already on the server and we have a contact ID
      else if (currentContact._id && attachment._id) {
        if (!window.confirm('Are you sure you want to remove this attachment?')) {
          return;
        }
        
        setUploading(true);
        
        const headers = getAuthHeaders();
        
        const response = await fetch(`${API_URL}/contacts/${currentContact._id}/attachments/${attachment._id}`, {
          method: 'DELETE',
          headers
        });
        
        if (!response.ok) {
          throw new Error(`Failed to delete attachment: ${response.statusText}`);
        }
        
        const updatedContact = await response.json();
        
        // Update form data with new attachments
        setCurrentContact(prev => ({
          ...prev,
          attachments: updatedContact.attachments
        }));
        
        setUploading(false);
        console.log('Attachment deleted successfully');
      } 
      // Otherwise, just remove from local state
      else {
        const newAttachments = [...currentContact.attachments];
        newAttachments.splice(index, 1);
        
        setCurrentContact({
          ...currentContact,
          attachments: newAttachments
        });
      }
    } catch (error) {
      console.error('Error removing attachment:', error);
      alert('Failed to remove attachment: ' + error.message);
      setUploading(false);
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
    } else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
      return <FileText className="h-5 w-5 text-purple-500" />;
    } else {
      return <File className="h-5 w-5 text-gray-500" />;
    }
  };

  // Enhanced save contact function
  const handleEnhancedSaveContact = async () => {
    try {
      // First save the contact
      const savedContact = await handleSaveContact();
      
      if (!savedContact) {
        return; // Save failed
      }
      
      // Then upload logo if selected
      if (logoFile) {
        const updatedWithLogo = await handleLogoUpload(savedContact._id);
        if (updatedWithLogo) {
          setCurrentContact(updatedWithLogo);
        }
      }
      
      // Then upload attachments if any
      if (uploadedFiles.length > 0) {
        const updatedWithAttachments = await handleAttachmentsUpload(savedContact._id);
        if (updatedWithAttachments) {
          setCurrentContact(updatedWithAttachments);
        }
      }
      
      // Close the modal if everything succeeded
      if (!logoFile || logoFile.length === 0) {
        closeModal();
      }
      
    } catch (error) {
      console.error('Error in enhanced save:', error);
    }
  };

  return (
    <>
      {/* Backdrop with blur effect */}
      <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40" onClick={closeModal}></div>
      
      {/* Modal content */}
      <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 pointer-events-auto max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">
              {isEditing ? "Edit Contact" : "Add Contact"}
            </h3>
            <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('company')}
                className={`px-6 py-3 border-b-2 text-sm font-medium ${
                  activeTab === 'company'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Company Information
              </button>
              <button
                onClick={() => setActiveTab('address')}
                className={`px-6 py-3 border-b-2 text-sm font-medium ${
                  activeTab === 'address'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Address
              </button>
              <button
                onClick={() => setActiveTab('persons')}
                className={`px-6 py-3 border-b-2 text-sm font-medium ${
                  activeTab === 'persons'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Contact Persons {currentContact.contactPersons.length > 0 && `(${currentContact.contactPersons.length})`}
              </button>
              <button
                onClick={() => setActiveTab('details')}
                className={`px-6 py-3 border-b-2 text-sm font-medium ${
                  activeTab === 'details'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Additional Details
              </button>
            </nav>
          </div>
          
          {/* Form content */}
          <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 130px)' }}>
            {/* Company Information Tab */}
            {activeTab === 'company' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="contactType" className="block text-sm font-medium text-gray-700">
                      Contact Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="contactType"
                      name="contactType"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      value={currentContact.contactType}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="prospect">Prospect</option>
                      <option value="customer">Customer</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                      Company Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="companyName"
                      id="companyName"
                      placeholder="Acme Inc."
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      value={currentContact.companyName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="companyEmail" className="block text-sm font-medium text-gray-700">
                      Company Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="companyEmail"
                      id="companyEmail"
                      placeholder="info@company.com"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      value={currentContact.companyEmail}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      id="phoneNumber"
                      placeholder="555-123-4567"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      value={currentContact.phoneNumber}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="website" className="block text-sm font-medium text-gray-700">
                    Website
                  </label>
                  <input
                    type="url"
                    name="website"
                    id="website"
                    placeholder="https://www.example.com"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    value={currentContact.website}
                    onChange={handleInputChange}
                  />
                </div>
                
                {/* Company Logo Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Logo
                  </label>
                  <div className="flex items-center space-x-4">
                    {/* Logo Preview */}
                    <div className="h-20 w-20 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center border-2 border-gray-200">
                      {logoPreview ? (
                        <img 
                          src={logoPreview} 
                          alt="Logo Preview" 
                          className="h-full w-full object-cover" 
                        />
                      ) : currentContact.companyLogo && currentContact.companyLogo.filePath ? (
                        <img 
                          src={currentContact.companyLogo.filePath} 
                          alt="Company Logo" 
                          className="h-full w-full object-cover" 
                        />
                      ) : (
                        <Camera className="h-8 w-8 text-gray-400" />
                      )}
                    </div>
                    
                    {/* Upload Controls */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <label className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                          <span>Choose Logo</span>
                          <input
                            type="file"
                            className="sr-only"
                            accept="image/*"
                            onChange={handleLogoFileSelect}
                            disabled={uploading}
                          />
                        </label>
                        
                        {(logoPreview || (currentContact.companyLogo && currentContact.companyLogo.filePath)) && (
                          <button
                            type="button"
                            onClick={handleRemoveLogo}
                            className="py-2 px-3 border border-red-300 rounded-md shadow-sm text-sm leading-4 font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            disabled={uploading}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      
                      <p className="text-xs text-gray-500 mt-1">
                        PNG, JPG, GIF up to 5MB. Recommended size: 300x300px
                      </p>
                      
                      {logoFile && (
                        <p className="text-xs text-green-600 mt-1">
                          Selected: {logoFile.name} ({(logoFile.size / 1024).toFixed(1)} KB)
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Address Tab */}
            {activeTab === 'address' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="companyAddress.country" className="block text-sm font-medium text-gray-700">
                      Country
                    </label>
                    <input
                      type="text"
                      name="companyAddress.country"
                      id="companyAddress.country"
                      placeholder="United States"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      value={currentContact.companyAddress.country}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="companyAddress.state" className="block text-sm font-medium text-gray-700">
                      State/Province
                    </label>
                    <input
                      type="text"
                      name="companyAddress.state"
                      id="companyAddress.state"
                      placeholder="California"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      value={currentContact.companyAddress.state}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="companyAddress.addressLine1" className="block text-sm font-medium text-gray-700">
                    Address Line 1
                  </label>
                  <input
                    type="text"
                    name="companyAddress.addressLine1"
                    id="companyAddress.addressLine1"
                    placeholder="123 Main Street"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    value={currentContact.companyAddress.addressLine1}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div>
                  <label htmlFor="companyAddress.addressLine2" className="block text-sm font-medium text-gray-700">
                    Address Line 2
                  </label>
                  <input
                    type="text"
                    name="companyAddress.addressLine2"
                    id="companyAddress.addressLine2"
                    placeholder="Suite 100"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    value={currentContact.companyAddress.addressLine2}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div>
                  <label htmlFor="companyAddress.postalCode" className="block text-sm font-medium text-gray-700">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    name="companyAddress.postalCode"
                    id="companyAddress.postalCode"
                    placeholder="94105"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    value={currentContact.companyAddress.postalCode}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            )}
            
            {/* Contact Persons Tab */}
            {activeTab === 'persons' && (
              <div>
                {/* List of existing contact persons */}
                {!showPersonForm && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium text-gray-900">Contact Persons</h3>
                      <button
                        type="button"
                        onClick={handleAddPerson}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <svg className="-ml-0.5 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                        </svg>
                        Add Person
                      </button>
                    </div>
                    
                    {currentContact.contactPersons.length > 0 ? (
                      <div className="space-y-4">
                        {currentContact.contactPersons.map((person, index) => (
                          <div key={index} className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="text-md font-semibold text-gray-800">
                                  {person.title && `${person.title} `}{person.name}
                                </h4>
                                {person.designation && (
                                  <p className="text-sm text-gray-600">{person.designation}</p>
                                )}
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  type="button"
                                  onClick={() => handleEditPerson(index)}
                                  className="text-indigo-600 hover:text-indigo-900 text-sm"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemovePerson(index)}
                                  className="text-red-600 hover:text-red-900 text-sm"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                            
                            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                              {person.email && (
                                <div className="text-sm">
                                  <span className="text-gray-500">Email:</span> {person.email}
                                </div>
                              )}
                              {person.phoneNumber && (
                                <div className="text-sm">
                                  <span className="text-gray-500">Phone:</span> {person.phoneNumber}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-gray-50 p-6 text-center rounded-lg">
                        <p className="text-gray-500">No contact persons added yet.</p>
                        <p className="text-gray-500 text-sm mt-1">Click "Add Person" to add your first contact person.</p>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Contact Person Form */}
                {showPersonForm && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        {editingPersonIndex >= 0 ? "Edit Contact Person" : "Add Contact Person"}
                      </h3>
                      <button
                        type="button"
                        onClick={() => setShowPersonForm(false)}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label htmlFor="person-title" className="block text-sm font-medium text-gray-700">
                            Title
                          </label>
                          <select
                            id="person-title"
                            name="title"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            value={tempContactPerson.title}
                            onChange={handlePersonInputChange}
                          >
                            <option value="">Select</option>
                            <option value="Mr.">Mr.</option>
                            <option value="Ms.">Ms.</option>
                            <option value="Mrs.">Mrs.</option>
                            <option value="Dr.">Dr.</option>
                            <option value="Prof.">Prof.</option>
                          </select>
                        </div>
                        
                        <div className="md:col-span-2">
                          <label htmlFor="person-name" className="block text-sm font-medium text-gray-700">
                            Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            id="person-name"
                            name="name"
                            placeholder="John Smith"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            value={tempContactPerson.name}
                            onChange={handlePersonInputChange}
                            required
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="person-designation" className="block text-sm font-medium text-gray-700">
                          Designation
                        </label>
                        <input
                          type="text"
                          id="person-designation"
                          name="designation"
                          placeholder="CEO, Manager, etc."
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          value={tempContactPerson.designation}
                          onChange={handlePersonInputChange}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="person-email" className="block text-sm font-medium text-gray-700">
                            Email
                          </label>
                          <input
                            type="email"
                            id="person-email"
                            name="email"
                            placeholder="john@example.com"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            value={tempContactPerson.email}
                            onChange={handlePersonInputChange}
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="person-phone" className="block text-sm font-medium text-gray-700">
                            Phone Number
                          </label>
                          <input
                            type="tel"
                            id="person-phone"
                            name="phoneNumber"
                            placeholder="555-987-6543"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            value={tempContactPerson.phoneNumber}
                            onChange={handlePersonInputChange}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="person-linkedin" className="block text-sm font-medium text-gray-700">
                          LinkedIn
                        </label>
                        <input
                          type="url"
                          id="person-linkedin"
                          name="linkedin"
                          placeholder="https://linkedin.com/in/johnsmith"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          value={tempContactPerson.linkedin}
                          onChange={handlePersonInputChange}
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="person-notes" className="block text-sm font-medium text-gray-700">
                          Notes
                        </label>
                        <textarea
                          id="person-notes"
                          name="notes"
                          rows="3"
                          placeholder="Additional information about this contact person..."
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          value={tempContactPerson.notes}
                          onChange={handlePersonInputChange}
                        ></textarea>
                      </div>
                      
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => setShowPersonForm(false)}
                          className="mr-3 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSavePerson}
                          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          {editingPersonIndex >= 0 ? "Update Person" : "Add Person"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Additional Details Tab */}
            {activeTab === 'details' && (
              <div className="space-y-6">
                <div>
                  <label htmlFor="additionalDetails" className="block text-sm font-medium text-gray-700">
                    Additional Details
                  </label>
                  <textarea
                    id="additionalDetails"
                    name="additionalDetails"
                    rows="5"
                    placeholder="Add any additional information about this contact..."
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    value={currentContact.additionalDetails}
                    onChange={handleInputChange}
                  ></textarea>
                </div>
                
                {/* Attachments Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Attachments
                  </label>
                  
                  {/* File Upload Area */}
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-600 justify-center">
                        <label
                          htmlFor="attachment-upload"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                        >
                          <span>Upload files</span>
                          <input
                            id="attachment-upload"
                            name="attachment-upload"
                            type="file"
                            className="sr-only"
                            multiple
                            onChange={handleAttachmentFileSelect}
                            disabled={uploading}
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt,.webp"
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, PDF, Word, Excel files up to 10MB each
                      </p>
                    </div>
                  </div>
                  
                  {/* Display current attachments */}
                  {currentContact.attachments && currentContact.attachments.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Attachments ({currentContact.attachments.length})
                      </h4>
                      <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
                        {currentContact.attachments.map((attachment, index) => (
                          <li key={index} className="px-4 py-3 flex items-center justify-between text-sm">
                            <div className="flex items-center">
                              {getFileIcon(attachment.fileName)}
                              <div className="ml-3">
                                <span className="truncate max-w-xs font-medium">{attachment.fileName}</span>
                                <div className="text-xs text-gray-500">
                                  {attachment.fileType} 
                                  {attachment.fileSize && ` • ${(attachment.fileSize / 1024).toFixed(1)} KB`}
                                  {attachment.tempFile && (
                                    <span className="text-orange-600"> • Will upload after saving</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {!attachment.tempFile && attachment.filePath && (
                                <a
                                  href={attachment.filePath}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-indigo-600 hover:text-indigo-900"
                                >
                                  View
                                </a>
                              )}
                              <button
                                type="button"
                                onClick={() => handleRemoveAttachment(index)}
                                className="text-red-600 hover:text-red-900"
                                disabled={uploading}
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Footer with buttons */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              disabled={isLoading || uploading}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleEnhancedSaveContact}
              className="px-4 py-2 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              disabled={isLoading || uploading}
            >
              {isLoading || uploading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {uploading ? 'Uploading...' : 'Processing...'}
                </span>
              ) : (
                isEditing ? "Update" : "Add"
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ContactForm;