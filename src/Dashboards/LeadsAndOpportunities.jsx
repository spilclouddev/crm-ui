import React, { useState, useEffect } from "react";

// API base URL - change this to match your backend
const API_URL = "https://crm-be.fly.dev/api";

// Lead form component for adding/editing leads
const LeadForm = ({ lead, onSave, onCancel }) => {
  const [formData, setFormData] = useState(
    lead || {
      contactPerson: "",
      value: "",
      stage: "New Lead"
    }
  );
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch all contacts when component mounts
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/contacts`);
        if (!response.ok) {
          throw new Error('Failed to fetch contacts');
        }
        const data = await response.json();
        setContacts(data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching contacts:", err);
        setError("Failed to load contacts. Please try again.");
        setLoading(false);
      }
    };

    fetchContacts();
  }, []);

  // Auto-populate company when contact person changes
  useEffect(() => {
    const updateCompanyFromContact = async () => {
      if (!formData.contactPerson) return;
      
      try {
        const response = await fetch(`${API_URL}/leads/contact/${formData.contactPerson}`);
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
      
      const requestOptions = {
        method: lead && lead._id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactPerson: formData.contactPerson,
          value: formData.value,
          stage: formData.stage
        })
      };
      
      const url = lead && lead._id 
        ? `${API_URL}/leads/${lead._id}` 
        : `${API_URL}/leads`;
        
      const response = await fetch(url, requestOptions);
      
      if (!response.ok) {
        throw new Error('Failed to save lead');
      }
      
      setLoading(false);
      onSave(); // Notify parent component to refresh data
    } catch (err) {
      console.error("Error saving lead:", err);
      setError("Failed to save lead. Please try again.");
      setLoading(false);
    }
  };

  if (loading && contacts.length === 0) {
    return <div className="text-center p-4">Loading contacts...</div>;
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
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="value" className="block text-sm font-medium text-gray-700">
                Value ($)
              </label>
              <input
                type="text"
                name="value"
                id="value"
                value={formData.value}
                onChange={handleChange}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
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
                <option value="New Lead">New Lead</option>
                <option value="Qualified">Qualified</option>
                <option value="Proposal">Proposal</option>
                <option value="Negotiation">Negotiation</option>
                <option value="Closed Won">Closed Won</option>
              </select>
            </div>
          </div>
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

  // Fetch leads and pipeline data
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch leads
      const leadsResponse = await fetch(`${API_URL}/leads`);
      if (!leadsResponse.ok) {
        throw new Error('Failed to fetch leads');
      }
      const leadsData = await leadsResponse.json();
      setLeads(leadsData);

      // Fetch pipeline summary
      const pipelineResponse = await fetch(`${API_URL}/leads/pipeline/summary`);
      if (!pipelineResponse.ok) {
        throw new Error('Failed to fetch pipeline data');
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
      "Qualified": { id: "qualified", color: "bg-blue-100" },
      "Proposal": { id: "proposal", color: "bg-blue-200" },
      "Negotiation": { id: "negotiation", color: "bg-red-100" },
      "Closed Won": { id: "closed", color: "bg-green-100" }
    };

    return pipelineData.map(stage => ({
      id: stageMap[stage._id]?.id || stage._id.toLowerCase().replace(/\s+/g, ''),
      name: stage._id,
      value: stage.totalValue,
      color: stageMap[stage._id]?.color || "bg-gray-100",
      companies: stage.leads.map(lead => lead.company)
    }));
  }, [pipelineData]);

  // Filter and sort leads based on current settings
  const filteredLeads = React.useMemo(() => {
    let result = [...leads];
    
    // Apply search filter
    if (searchTerm) {
      result = result.filter(lead => {
        const contactName = lead.contactPerson?.name || '';
        return (
          lead.company.toLowerCase().includes(searchTerm.toLowerCase()) || 
          contactName.toLowerCase().includes(searchTerm.toLowerCase())
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
        result.sort((a, b) => b.value - a.value);
        break;
      case "Value Low":
        result.sort((a, b) => a.value - b.value);
        break;
      case "Company":
        result.sort((a, b) => a.company.localeCompare(b.company));
        break;
      case "Recent":
      default:
        // Assume newest entries are at the top
        // MongoDB _id contains timestamp info, so this would work with actual data
        break;
    }
    
    return result;
  }, [leads, searchTerm, statusFilter, sortOption]);

  // Get stage badge color
  const getStageBadgeColor = (stage) => {
    switch(stage) {
      case "New Lead": return "bg-yellow-200";
      case "Qualified": return "bg-blue-200";
      case "Proposal": return "bg-purple-200";
      case "Negotiation": return "bg-red-200";
      case "Closed Won": return "bg-green-200";
      default: return "bg-gray-200";
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
    setCurrentLead(lead);
    setShowForm(true);
  };

  // Delete lead handler
  const handleDeleteLead = async (leadId) => {
    if (window.confirm("Are you sure you want to delete this lead?")) {
      try {
        const response = await fetch(`${API_URL}/leads/${leadId}`, {
          method: 'DELETE'
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

  if (loading && leads.length === 0) {
    return <div className="p-6 text-center">Loading data...</div>;
  }

  return (
    <div className="p-6">
      {/* Error message if any */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      
      {/* Sales Pipeline Section */}
      <div className="bg-white p-6 rounded-md shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Sales Pipeline</h2>
        
        {processedPipeline.length > 0 ? (
          <div className="flex space-x-2">
            {processedPipeline.map(stage => (
              <div key={stage.id} className="flex-1 border rounded-md overflow-hidden">
                <div className="p-3 border-b bg-gray-50">
                  <div className="font-medium">{stage.name}</div>
                  <div className="text-lg font-bold">${stage.value?.toLocaleString() || 0}</div>
                </div>
                
                <div className="p-2">
                  {stage.companies.map((company, index) => (
                    <div 
                      key={`${company}-${index}`} 
                      className={`${stage.color} p-2 rounded-md mb-2 text-sm`}
                    >
                      {company}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-4 text-gray-500">
            No pipeline data available. Add some leads to see your sales pipeline.
          </div>
        )}
      </div>
      
      {/* Leads List Section */}
      <div className="bg-white p-6 rounded-md shadow">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Leads List</h2>
          <button 
            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md"
            onClick={() => {
              setCurrentLead(null);
              setShowForm(true);
            }}
          >
            + New Lead
          </button>
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
        
        {/* Filters and Search */}
        <div className="flex space-x-4 mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search leads..."
              className="w-full px-3 py-2 border rounded-md"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="w-40">
            <select 
              className="w-full px-3 py-2 border rounded-md"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">Status: All</option>
              <option value="New Lead">New Lead</option>
              <option value="Qualified">Qualified</option>
              <option value="Proposal">Proposal</option>
              <option value="Negotiation">Negotiation</option>
              <option value="Closed Won">Closed Won</option>
            </select>
          </div>
          
          <div className="w-40">
            <select 
              className="w-full px-3 py-2 border rounded-md"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
            >
              <option value="Recent">Sort: Recent</option>
              <option value="Value High">Value: High to Low</option>
              <option value="Value Low">Value: Low to High</option>
              <option value="Company">Company: A-Z</option>
            </select>
          </div>
        </div>
        
        {/* Leads Table with Reordered Columns */}
        {filteredLeads.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Contact Person</th>
                  <th className="text-left py-3 px-4">Company</th>
                  <th className="text-left py-3 px-4">Value</th>
                  <th className="text-left py-3 px-4">Stage</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead) => (
                  <tr key={lead._id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{lead.contactPerson?.name || 'N/A'}</td>
                    <td className="py-3 px-4">{lead.company}</td>
                    <td className="py-3 px-4">${lead.value.toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <span className={`${getStageBadgeColor(lead.stage)} px-3 py-1 rounded-full text-sm`}>
                        {lead.stage}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button 
                        className="bg-gray-200 hover:bg-gray-300 px-4 py-1 rounded-md text-sm mr-2"
                        onClick={() => handleEditLead(lead)}
                      >
                        Edit
                      </button>
                      <button 
                        className="bg-red-100 hover:bg-red-200 px-4 py-1 rounded-md text-sm text-red-700"
                        onClick={() => handleDeleteLead(lead._id)}
                      >
                        Delete
                      </button>
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
