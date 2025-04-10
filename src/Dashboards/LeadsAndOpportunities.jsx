import React, { useState, useEffect } from "react";
import * as XLSX from 'xlsx';
import LeadForm from "../Dashboards/Leads and Opportunity/leadForm"; // Import the LeadForm component
import LeadDetailsModal from "../Dashboards/Leads and Opportunity/leadDetailsPopup"; // Import the modal component

// API base URL - change this to match your backend
const API_URL = "https://crm-be.fly.dev/api";

// Define lead stages directly in this component for filtering
const LEAD_STAGES = [
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

const LeadsAndOpportunities = () => {
  const [leads, setLeads] = useState([]);
  const [pipelineData, setPipelineData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortOption, setSortOption] = useState("Recent");
  const [showForm, setShowForm] = useState(false);
  const [currentLead, setCurrentLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // State for the details modal
  const [selectedLead, setSelectedLead] = useState(null);
  // State for export process
  const [isExporting, setIsExporting] = useState(false);

  // Function to get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    };
  };

  // Fetch leads and pipeline data
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Get auth headers
      const headers = getAuthHeaders();
      
      // Fetch leads
      const leadsResponse = await fetch(`${API_URL}/leads`, { headers });
      if (!leadsResponse.ok) {
        throw new Error(`Failed to fetch leads: ${leadsResponse.status}`);
      }
      const leadsData = await leadsResponse.json();
      console.log("Fetched leads:", leadsData);
      setLeads(leadsData);

      // Fetch pipeline summary
      const pipelineResponse = await fetch(`${API_URL}/leads/pipeline/summary`, { headers });
      if (!pipelineResponse.ok) {
        throw new Error(`Failed to fetch pipeline data: ${pipelineResponse.status}`);
      }
      const pipelineData = await pipelineResponse.json();
      setPipelineData(pipelineData);
      
      setLoading(false);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load data. Please refresh the page.");
      setLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    fetchData();
  }, []);

  // Process pipeline data for display
  const processedPipeline = React.useMemo(() => {
    const stageMap = {
      "New Lead": { id: "new", color: "bg-yellow-100" },
      "Contacted": { id: "contacted", color: "bg-blue-50" },
      "Qualified": { id: "qualified", color: "bg-blue-100" },
      "Demo Done": { id: "demo", color: "bg-indigo-100" },
      "Proposal Sent": { id: "proposal", color: "bg-purple-100" },
      "Negotiation": { id: "negotiation", color: "bg-red-100" },
      "Won - Deal Closed": { id: "won", color: "bg-green-100" },
      "Lost - Not Interested": { id: "lost-not-interested", color: "bg-gray-100" },
      "Lost - Competitor Win": { id: "lost-competitor", color: "bg-gray-200" },
      "Lost - No Budget": { id: "lost-no-budget", color: "bg-gray-300" },
      "Follow-up Later": { id: "follow-up", color: "bg-orange-100" }
    };

    return pipelineData.map(stage => ({
      id: stageMap[stage._id]?.id || stage._id.toLowerCase().replace(/\s+/g, ''),
      name: stage._id,
      value: stage.totalValue,
      color: stageMap[stage._id]?.color || "bg-gray-100",
      companies: stage.leads.map(lead => lead.company)
    }));
  }, [pipelineData]);

  // Helper function to get contact name regardless of entry type
  const getContactName = (lead) => {
    if (!lead) return 'N/A';
    
    if (lead.isManualEntry) {
      return lead.contactPersonName || 'N/A';
    } else if (lead.contactPerson && typeof lead.contactPerson === 'object') {
      return lead.contactPerson.name || 'N/A';
    } else {
      return 'N/A';
    }
  };

  // Filter and sort leads based on current settings
  const filteredLeads = React.useMemo(() => {
    let result = [...leads];
    
    // Apply search filter
    if (searchTerm) {
      result = result.filter(lead => {
        // Handle both manual entries and regular contacts
        const contactName = lead.isManualEntry 
          ? (lead.contactPersonName || '') 
          : (lead.contactPerson?.name || '');
        
        const leadOwner = lead.leadOwner || '';
        return (
          lead.company.toLowerCase().includes(searchTerm.toLowerCase()) || 
          contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          leadOwner.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }
    
    // Apply status filter
    if (statusFilter !== "All") {
      result = result.filter(lead => lead.stage === statusFilter);
    }
    
    // Apply sorting
    switch (sortOption) {
      case "Value High":
        // Sort by AUD value if available, otherwise use original value
        result.sort((a, b) => {
          const aValue = a.audValue !== undefined ? a.audValue : a.value;
          const bValue = b.audValue !== undefined ? b.audValue : b.value;
          return bValue - aValue;
        });
        break;
      case "Value Low":
        // Sort by AUD value if available, otherwise use original value
        result.sort((a, b) => {
          const aValue = a.audValue !== undefined ? a.audValue : a.value;
          const bValue = b.audValue !== undefined ? b.audValue : b.value;
          return aValue - bValue;
        });
        break;
      case "Company":
        result.sort((a, b) => a.company.localeCompare(b.company));
        break;
      case "Recent":
      default:
        // Assume newest entries are at the top
        break;
    }
    
    return result;
  }, [leads, searchTerm, statusFilter, sortOption]);

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

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Function to format value with proper number formatting
  const formatValue = (value) => {
    if (value === undefined || value === null) return "—";
    
    return `$${parseFloat(value).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  // Get value to display - simplified to just use the value field
  const getDisplayValue = (lead) => {
    return formatValue(lead.value);
  };

  // Handle exporting leads to Excel
  const handleExportLeads = () => {
    // Use filtered leads if there's a search term or filter, otherwise use all leads
    const dataToExport = filteredLeads;
    
    if (dataToExport.length === 0) {
      alert("No leads to export.");
      return;
    }
    
    setIsExporting(true);
    
    try {
      // Transform leads to a format suitable for Excel
      const exportData = dataToExport.map(lead => ({
        'Company': lead.company || '',
        'Contact Name': getContactName(lead),
        'Value': lead.value ? parseFloat(lead.value).toFixed(2) : '0.00',
        'Stage': lead.stage || '',
        'Priority': lead.priority || 'Medium',
        'Country': lead.country || 'Australia',
        'Lead Owner': lead.leadOwner || 'Unassigned',
        'Source': lead.source || '',
        'Created Date': formatDate(lead.createdAt),
        'Last Updated': formatDate(lead.updatedAt),
        'Notes': lead.notes || ''
      }));
      
      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads');
      
      // Generate Excel file and download
      XLSX.writeFile(workbook, `Leads_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`);
      
      console.log("Successfully exported leads to Excel");
    } catch (err) {
      console.error("Export error:", err);
      alert("Failed to export leads. " + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  // Handle saving a lead (create or update) - just refresh the data
  const handleSaveLead = () => {
    fetchData();
    setShowForm(false);
    setCurrentLead(null);
  };

  // Edit lead handler
  const handleEditLead = (lead) => {
    console.log("Editing lead:", lead); // Debug
    setCurrentLead(lead);
    setShowForm(true);
  };

  // Delete lead handler
  const handleDeleteLead = async (leadId) => {
    if (window.confirm("Are you sure you want to delete this lead?")) {
      try {
        const headers = getAuthHeaders();
        
        const response = await fetch(`${API_URL}/leads/${leadId}`, {
          method: 'DELETE',
          headers
        });
        
        if (!response.ok) {
          throw new Error('Failed to delete lead');
        }
        
        fetchData();
      } catch (err) {
        console.error("Error deleting lead:", err);
        alert("Failed to delete lead. Please try again.");
      }
    }
  };

  // View lead details handler - opens the modal
  const handleViewLead = (lead) => {
    setSelectedLead(lead);
  };

  // Close the lead details modal
  const handleCloseModal = () => {
    setSelectedLead(null);
  };

  if (loading && leads.length === 0) {
    return <div className="p-4 sm:p-6 text-center">Loading data...</div>;
  }

  return (
    <div className="p-4 sm:p-6">
      {/* Lead details modal (conditionally rendered) */}
      {selectedLead && (
        <LeadDetailsModal 
          lead={selectedLead} 
          onClose={handleCloseModal} 
        />
      )}
      
      {/* Error message if any */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      
      {/* Sales Pipeline Section - Made responsive with horizontal scroll on mobile */}
      <div className="bg-white p-4 sm:p-6 rounded-md shadow mb-6">
        {/* <h2 className="text-lg sm:text-xl font-semibold mb-4">Sales Pipeline</h2> */}
        
        {processedPipeline.length > 0 ? (
          <div className="overflow-x-auto pb-2">
            <div className="flex space-x-2 min-w-max">
              {processedPipeline.map(stage => (
                <div key={stage.id} className="w-36 sm:w-40 md:w-48 flex-shrink-0 border rounded-md overflow-hidden">
                  <div className="p-3 border-b bg-gray-50">
                    <div className="font-medium text-sm sm:text-base truncate">{stage.name}</div>
                    <div className="text-lg font-bold">
                      ${parseFloat(stage.value || 0).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </div>
                  </div>
                  
                  <div className="p-2 max-h-40 overflow-y-auto">
                    {stage.companies.map((company, index) => (
                      <div 
                        key={`${company}-${index}`} 
                        className={`${stage.color} p-2 rounded-md mb-2 text-xs sm:text-sm truncate`}
                      >
                        {company}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center p-4 text-gray-500">
            No pipeline data available. Add some leads to see your sales pipeline.
          </div>
        )}
      </div>
      
      {/* Leads List Section */}
      <div className="bg-white p-4 sm:p-6 rounded-md shadow">
        {/* UPDATED UNIFIED ACTION BAR */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Input - Takes priority on mobile, full width on desktop */}
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="Search leads..."
                className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            
            {/* Filters and Buttons Container - Stack on mobile, side by side on large screens */}
            <div className="flex flex-col sm:flex-row gap-2 lg:gap-3">
              {/* Status Filter */}
              <div className="w-full sm:w-40">
                <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="All">Status: All</option>
                  {LEAD_STAGES.map(stage => (
                    <option key={stage} value={stage}>
                      {stage}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Sort Options */}
              <div className="w-full sm:w-40">
                <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                >
                  <option value="Recent">Sort: Recent</option>
                  <option value="Value High">Value: High to Low</option>
                  <option value="Value Low">Value: Low to High</option>
                  <option value="Company">Company: A-Z</option>
                </select>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-2">
                <button 
                  className="px-3 py-2 flex items-center text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  onClick={handleExportLeads}
                  disabled={isExporting}
                >
                  {isExporting ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Exporting...
                    </span>
                  ) : (
                    <>
                      <svg className="mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Export
                    </>
                  )}
                </button>
                <button 
                  className="px-3 py-2 flex items-center text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  onClick={() => {
                    setCurrentLead(null);
                    setShowForm(true);
                  }}
                >
                  <svg className="mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  New Lead
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Lead form (conditionally shown) */}
        {showForm && (
          <LeadForm
            lead={currentLead}
            onSave={handleSaveLead}
            onCancel={() => {
              setShowForm(false);
              setCurrentLead(null);
            }}
          />
        )}
        
        {/* Leads Table - Responsive with priority columns */}
        {filteredLeads.length > 0 ? (
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Company/Contact</th>
                  <th className="hidden md:table-cell text-left py-3 px-4">Value (AUD)</th>
                  <th className="hidden md:table-cell text-left py-3 px-4">Country</th>
                  <th className="text-left py-3 px-4">Stage</th>
                  <th className="hidden sm:table-cell text-left py-3 px-4">Priority</th>
                  <th className="hidden lg:table-cell text-left py-3 px-4">Lead Owner</th>
                  <th className="hidden md:table-cell text-left py-3 px-4">Created</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead) => (
                  <tr 
                    key={lead._id} 
                    className="border-b hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleViewLead(lead)}
                  >
                    <td className="py-3 px-4">
                      <div className="font-medium">{lead.company}</div>
                      <div className="text-sm text-gray-500">
                        {lead.isManualEntry ? lead.contactPersonName : lead.contactPerson?.name || 'N/A'}
                      </div>
                      {/* Mobile-only value display */}
                      <div className="md:hidden text-sm font-semibold mt-1">
                        {getDisplayValue(lead)}
                      </div>
                      {/* Mobile-only country display */}
                      <div className="md:hidden text-xs text-gray-500 mt-1">
                        {lead.country || 'Australia'}
                      </div>
                    </td>
                    <td className="hidden md:table-cell py-3 px-4">
                      {getDisplayValue(lead)}
                    </td>
                    <td className="hidden md:table-cell py-3 px-4">
                      {lead.country || 'Australia'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`${getStageBadgeColor(lead.stage)} px-2 py-1 rounded-full text-xs`}>
                        {lead.stage}
                      </span>
                      {/* Mobile-only priority display */}
                      {!lead.priority ? null : (
                        <div className="sm:hidden mt-2">
                          <span className={`${getPriorityBadgeColor(lead.priority)} px-2 py-1 rounded-full text-xs`}>
                            {lead.priority}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="hidden sm:table-cell py-3 px-4">
                      <span className={`${getPriorityBadgeColor(lead.priority)} px-2 py-1 rounded-full text-xs`}>
                        {lead.priority || 'Medium'}
                      </span>
                    </td>
                    <td className="hidden lg:table-cell py-3 px-4">{lead.leadOwner || 'Unassigned'}</td>
                    <td className="hidden md:table-cell py-3 px-4">{formatDate(lead.createdAt)}</td>
                    <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button 
                          className="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded-md text-xs sm:text-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditLead(lead);
                          }}
                        >
                          Edit
                        </button>
                        <button 
                          className="bg-red-100 hover:bg-red-200 px-3 py-1 rounded-md text-xs sm:text-sm text-red-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteLead(lead._id);
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center p-6 text-gray-500">
            No leads found. Add a new lead or adjust your filters.
          </div>
        )}
        
        {/* Pagination */}
        {filteredLeads.length > 0 && (
          <div className="mt-4 text-center text-sm text-gray-600">
            Showing 1 to {filteredLeads.length} of {leads.length} entries
          </div>
        )}
      </div>
    </div>
  );
};

export default LeadsAndOpportunities;