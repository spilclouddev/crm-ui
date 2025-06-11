import React, { useState } from "react";
import { FileText, File, Download, Eye, Camera } from "lucide-react";

const ContactDetails = ({ 
  contact, 
  closeModal, 
  handleEdit,
  handleDelete
}) => {
  const [activeTab, setActiveTab] = useState('company');
  const [imagePreview, setImagePreview] = useState(null);
  
  if (!contact) return null;

  // Support both old and new schema
  const companyName = contact.companyName || contact.company || "";
  const companyEmail = contact.companyEmail || contact.email || "";
  const phoneNumber = contact.phoneNumber || contact.phone || "";
  const contactType = contact.contactType || "prospect";
  const website = contact.website || "";
  const companyAddress = contact.companyAddress || {};
  const contactPersons = contact.contactPersons || [];
  const additionalDetails = contact.additionalDetails || "";
  const companyLogo = contact.companyLogo;
  const attachments = contact.attachments || [];

  // Format address if it exists
  const formatAddress = (address) => {
    if (!address) return "No address provided";
    
    const parts = [];
    if (address.addressLine1) parts.push(address.addressLine1);
    if (address.addressLine2) parts.push(address.addressLine2);
    
    const cityStateParts = [];
    if (address.state) cityStateParts.push(address.state);
    if (address.postalCode) cityStateParts.push(address.postalCode);
    
    if (cityStateParts.length > 0) {
      parts.push(cityStateParts.join(", "));
    }
    
    if (address.country) parts.push(address.country);
    
    return parts.length > 0 ? parts.join(", ") : "No address provided";
  };

  // Get file icon based on file extension
  const getFileIcon = (fileName, fileType) => {
    const extension = fileName.toLowerCase().split('.').pop();
    
    // Check if it's an image
    if (fileType && fileType.startsWith('image/')) {
      return <Eye className="h-5 w-5 text-purple-500" />;
    }
    
    if (['pdf'].includes(extension)) {
      return <FileText className="h-5 w-5 text-red-500" />;
    } else if (['doc', 'docx'].includes(extension)) {
      return <FileText className="h-5 w-5 text-blue-500" />;
    } else if (['xls', 'xlsx'].includes(extension)) {
      return <FileText className="h-5 w-5 text-green-500" />;
    } else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
      return <Eye className="h-5 w-5 text-purple-500" />;
    } else {
      return <File className="h-5 w-5 text-gray-500" />;
    }
  };

  // Handle attachment click
  const handleAttachmentClick = (attachment) => {
    if (attachment.filePath) {
      // For images, show preview modal
      if (attachment.fileType && attachment.fileType.startsWith('image/')) {
        setImagePreview(attachment);
      } else {
        // For other files, open in new tab
        window.open(attachment.filePath, '_blank');
      }
    }
  };

  // Close image preview
  const closeImagePreview = () => {
    setImagePreview(null);
  };

  return (
    <>
      {/* Backdrop with blur effect */}
      <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40" onClick={closeModal}></div>
      
      {/* Modal content */}
      <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 overflow-hidden pointer-events-auto">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">
              Contact Details
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
                Company Info
              </button>
              <button
                onClick={() => setActiveTab('persons')}
                className={`px-6 py-3 border-b-2 text-sm font-medium ${
                  activeTab === 'persons'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Contact Persons {contactPersons.length > 0 && `(${contactPersons.length})`}
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
          
          {/* Tab Content */}
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {/* Company Information Tab */}
            {activeTab === 'company' && (
              <div>
                <div className="mb-6 flex flex-col items-center">
                  {/* Company Logo */}
                  <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center mb-4 overflow-hidden border-2 border-gray-200">
                    {companyLogo && companyLogo.filePath ? (
                      <img 
                        src={companyLogo.filePath} 
                        alt={companyName}
                        className="h-full w-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setImagePreview(companyLogo)}
                      />
                    ) : (
                      <div className="flex flex-col items-center">
                        {companyName ? (
                          <span className="text-2xl font-medium text-gray-600">
                            {companyName.charAt(0).toUpperCase()}
                          </span>
                        ) : (
                          <Camera className="h-8 w-8 text-gray-400" />
                        )}
                      </div>
                    )}
                  </div>
                  <h2 className="text-xl font-semibold text-gray-800">{companyName}</h2>
                  <div className="mt-2">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      contactType === 'customer' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {contactType.charAt(0).toUpperCase() + contactType.slice(1)}
                    </span>
                  </div>
                </div>

                <div className="space-y-5">
                  {/* Email */}
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">Company Email</p>
                      <a href={`mailto:${companyEmail}`} className="text-sm text-blue-600 hover:underline">
                        {companyEmail}
                      </a>
                    </div>
                  </div>
                  
                  {/* Phone */}
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">Phone</p>
                      <a href={`tel:${phoneNumber}`} className="text-sm text-blue-600 hover:underline">
                        {phoneNumber}
                      </a>
                    </div>
                  </div>
                  
                  {/* Website */}
                  {website && (
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mt-1">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m-9 9a9 9 0 019-9"></path>
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">Website</p>
                        <a href={website.startsWith('http') ? website : `https://${website}`} 
                           target="_blank" 
                           rel="noreferrer" 
                           className="text-sm text-blue-600 hover:underline">
                          {website}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {/* Address */}
                  {companyAddress && (Object.keys(companyAddress).some(key => companyAddress[key])) && (
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mt-1">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">Address</p>
                        <p className="text-sm text-gray-600 whitespace-pre-line">
                          {formatAddress(companyAddress)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Contact Persons Tab */}
            {activeTab === 'persons' && (
              <div>
                {contactPersons.length > 0 ? (
                  <div className="space-y-6">
                    {contactPersons.map((person, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="text-md font-semibold text-gray-800">
                              {person.title && `${person.title} `}{person.name}
                            </h3>
                            {person.designation && (
                              <p className="text-sm text-gray-600">{person.designation}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          {/* Contact Person Email */}
                          {person.email && (
                            <div className="flex items-center">
                              <svg className="h-4 w-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                              </svg>
                              <a href={`mailto:${person.email}`} className="text-sm text-blue-600 hover:underline">
                                {person.email}
                              </a>
                            </div>
                          )}
                          
                          {/* Contact Person Phone */}
                          {person.phoneNumber && (
                            <div className="flex items-center">
                              <svg className="h-4 w-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                              </svg>
                              <a href={`tel:${person.phoneNumber}`} className="text-sm text-blue-600 hover:underline">
                                {person.phoneNumber}
                              </a>
                            </div>
                          )}
                          
                          {/* LinkedIn */}
                          {person.linkedin && (
                            <div className="flex items-center">
                              <svg className="h-4 w-4 text-gray-400 mr-2" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                              </svg>
                              <a href={person.linkedin.startsWith('http') ? person.linkedin : `https://${person.linkedin}`} 
                                 target="_blank" 
                                 rel="noreferrer" 
                                 className="text-sm text-blue-600 hover:underline">
                                LinkedIn Profile
                              </a>
                            </div>
                          )}
                          
                          {/* Notes */}
                          {person.notes && (
                            <div className="mt-2">
                              <p className="text-sm font-medium text-gray-700">Notes:</p>
                              <p className="text-sm text-gray-600">
                                {person.notes}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    No contact persons have been added yet.
                  </div>
                )}
              </div>
            )}
            
            {/* Additional Details Tab */}
            {activeTab === 'details' && (
              <div>
                {/* Additional Details */}
                {additionalDetails ? (
                  <div className="bg-gray-50 p-4 rounded-lg mb-6">
                    <h3 className="text-md font-semibold text-gray-800 mb-2">Additional Information</h3>
                    <p className="text-sm text-gray-600 whitespace-pre-line">{additionalDetails}</p>
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500 mb-6">
                    No additional details available.
                  </div>
                )}
                
                {/* Attachments */}
                {attachments && attachments.length > 0 ? (
                  <div>
                    <h3 className="text-md font-semibold text-gray-800 mb-3">
                      Attachments ({attachments.length})
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                      {attachments.map((attachment, index) => (
                        <div key={index} className="flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer transition-colors">
                          <div className="flex-shrink-0 mr-3">
                            {getFileIcon(attachment.fileName, attachment.fileType)}
                          </div>
                          <div className="min-w-0 flex-1" onClick={() => handleAttachmentClick(attachment)}>
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {attachment.fileName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {attachment.fileType}
                              {attachment.fileSize && ` • ${(attachment.fileSize / 1024).toFixed(1)} KB`}
                            </p>
                          </div>
                          <div>
                            <button
                              onClick={() => handleAttachmentClick(attachment)}
                              className="text-indigo-600 hover:text-indigo-900 text-sm flex items-center"
                            >
                              {attachment.fileType && attachment.fileType.startsWith('image/') ? (
                                <>
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </>
                              ) : (
                                <>
                                  <Download className="h-4 w-4 mr-1" />
                                  Open
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    No attachments available.
                  </div>
                )}
                
                {/* Creation/Update timestamps */}
                {contact.createdAt && (
                  <div className="mt-6 text-xs text-gray-500 border-t pt-4">
                    Created: {new Date(contact.createdAt).toLocaleString()}
                    {contact.updatedAt && contact.updatedAt !== contact.createdAt && (
                      <span> • Updated: {new Date(contact.updatedAt).toLocaleString()}</span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
            <button
              onClick={() => handleDelete(contact._id)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-red-600 bg-white hover:bg-gray-50"
            >
              Delete
            </button>
            <button
              onClick={() => handleEdit(contact)}
              className="px-4 py-2 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Edit
            </button>
          </div>
        </div>
      </div>

      {/* Image Preview Modal */}
      {imagePreview && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-75 z-60" onClick={closeImagePreview}></div>
          <div className="fixed inset-0 flex items-center justify-center z-70 pointer-events-none">
            <div className="max-w-4xl max-h-[90vh] bg-white rounded-lg overflow-hidden pointer-events-auto">
              <div className="flex justify-between items-center p-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900">
                  {imagePreview.fileName || 'Company Logo'}
                </h3>
                <button 
                  onClick={closeImagePreview}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
              <div className="p-4">
                <img 
                  src={imagePreview.filePath} 
                  alt={imagePreview.fileName || 'Company Logo'}
                  className="max-w-full max-h-[70vh] object-contain mx-auto"
                />
              </div>
              <div className="p-4 border-t bg-gray-50 flex justify-center">
                <a
                  href={imagePreview.filePath}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Original
                </a>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default ContactDetails;