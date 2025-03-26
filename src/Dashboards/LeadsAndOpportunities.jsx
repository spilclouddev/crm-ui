import React, { useState, useEffect } from "react";
import LeadForm, {
  LEAD_STAGES,
  CURRENCIES,
} from "../Dashboards/Leads and Opportunity/leadForm"; // Import the LeadForm component and stages
import LeadDetailsModal from "../Dashboards/Leads and Opportunity/leadDetailsPopup"; // Import the new modal component

// API base URL - change this to match your backend
const API_URL = `https://crm-be.fly.dev/api`;

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
  // New state for the details modal
  const [selectedLead, setSelectedLead] = useState(null);

  // Function to get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      Authorization: token ? `Bearer ${token}` : "",
      "Content-Type": "application/json",
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
      setLeads(leadsData);

      // Fetch pipeline summary
      const pipelineResponse = await fetch(
        `${API_URL}/leads/pipeline/summary`,
        { headers }
      );
      if (!pipelineResponse.ok) {
        throw new Error(
          `Failed to fetch pipeline data: ${pipelineResponse.status}`
        );
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
      Contacted: { id: "contacted", color: "bg-blue-50" },
      Qualified: { id: "qualified", color: "bg-blue-100" },
      "Demo Done": { id: "demo", color: "bg-indigo-100" },
      "Proposal Sent": { id: "proposal", color: "bg-purple-100" },
      Negotiation: { id: "negotiation", color: "bg-red-100" },
      "Won - Deal Closed": { id: "won", color: "bg-green-100" },
      "Lost - Not Interested": {
        id: "lost-not-interested",
        color: "bg-gray-100",
      },
      "Lost - Competitor Win": { id: "lost-competitor", color: "bg-gray-200" },
      "Lost - No Budget": { id: "lost-no-budget", color: "bg-gray-300" },
      "Follow-up Later": { id: "follow-up", color: "bg-orange-100" },
    };

    return pipelineData.map((stage) => ({
      id:
        stageMap[stage._id]?.id || stage._id.toLowerCase().replace(/\s+/g, ""),
      name: stage._id,
      value: stage.totalValue,
      color: stageMap[stage._id]?.color || "bg-gray-100",
      companies: stage.leads.map((lead) => lead.company),
    }));
  }, [pipelineData]);

  // Filter and sort leads based on current settings
  const filteredLeads = React.useMemo(() => {
    let result = [...leads];

    // Apply search filter
    if (searchTerm) {
      result = result.filter((lead) => {
        const contactName = lead.contactPerson?.name || "";
        const leadOwner = lead.leadOwner || "";
        return (
          lead.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
          contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          leadOwner.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    // Apply status filter
    if (statusFilter !== "All") {
      result = result.filter((lead) => lead.stage === statusFilter);
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
    switch (stage) {
      case "New Lead":
        return "bg-yellow-200";
      case "Contacted":
        return "bg-blue-100";
      case "Qualified":
        return "bg-blue-200";
      case "Demo Done":
        return "bg-indigo-200";
      case "Proposal Sent":
        return "bg-purple-200";
      case "Negotiation":
        return "bg-red-200";
      case "Won - Deal Closed":
        return "bg-green-200";
      case "Lost - Not Interested":
        return "bg-gray-200 text-gray-800";
      case "Lost - Competitor Win":
        return "bg-gray-300 text-gray-800";
      case "Lost - No Budget":
        return "bg-gray-400 text-white";
      case "Follow-up Later":
        return "bg-orange-200";
      default:
        return "bg-gray-200";
    }
  };

  // Get priority badge color
  const getPriorityBadgeColor = (priority) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-800";
      case "Medium":
        return "bg-orange-100 text-orange-800";
      case "Low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-200";
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
      maximumFractionDigits: 2,
    })}`;
  };

  // Get value to display - simplified to just use the value field
  const getDisplayValue = (lead) => {
    return formatValue(lead.value);
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
        const headers = getAuthHeaders();

        const response = await fetch(`${API_URL}/leads/${leadId}`, {
          method: "DELETE",
          headers,
        });

        if (!response.ok) {
          throw new Error("Failed to delete lead");
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
        <LeadDetailsModal lead={selectedLead} onClose={handleCloseModal} />
      )}

      {/* Error message if any */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Sales Pipeline Section - Made responsive with horizontal scroll on mobile */}
      <div className="bg-white p-4 sm:p-6 rounded-md shadow mb-6">
        <h2 className="text-lg sm:text-xl font-semibold mb-4">
          Sales Pipeline
        </h2>

        {processedPipeline.length > 0 ? (
          <div className="overflow-x-auto pb-2">
            <div className="flex space-x-2 min-w-max">
              {processedPipeline.map((stage) => (
                <div
                  key={stage.id}
                  className="w-36 sm:w-40 md:w-48 flex-shrink-0 border rounded-md overflow-hidden"
                >
                  <div className="p-3 border-b bg-gray-50">
                    <div className="font-medium text-sm sm:text-base truncate">
                      {stage.name}
                    </div>
                    <div className="text-lg font-bold">
                      $
                      {parseFloat(stage.value || 0).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
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
            No pipeline data available. Add some leads to see your sales
            pipeline.
          </div>
        )}
      </div>

      {/* Leads List Section */}
      <div className="bg-white p-4 sm:p-6 rounded-md shadow">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h2 className="text-lg sm:text-xl font-semibold">Leads List</h2>
          <button
            className="w-full sm:w-auto bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md"
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

        {/* Filters and Search - Responsive design */}
        <div className="flex flex-col space-y-4 mb-6">
          <div className="w-full">
            <input
              type="text"
              placeholder="Search leads..."
              className="w-full px-3 py-2 border rounded-md"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <select
              className="w-full px-3 py-2 border rounded-md"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">Status: All</option>
              {LEAD_STAGES.map((stage) => (
                <option key={stage} value={stage}>
                  {stage}
                </option>
              ))}
            </select>

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

        {/* Leads Table - Responsive with priority columns */}
        {filteredLeads.length > 0 ? (
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Company/Contact</th>
                  <th className="hidden md:table-cell text-left py-3 px-4">
                    Value (AUD)
                  </th>
                  <th className="text-left py-3 px-4">Stage</th>
                  <th className="hidden sm:table-cell text-left py-3 px-4">
                    Priority
                  </th>
                  <th className="hidden lg:table-cell text-left py-3 px-4">
                    Lead Owner
                  </th>
                  <th className="hidden md:table-cell text-left py-3 px-4">
                    Created
                  </th>
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
                        {lead.contactPerson?.name || "N/A"}
                      </div>
                      {/* Mobile-only value display */}
                      <div className="md:hidden text-sm font-semibold mt-1">
                        {getDisplayValue(lead)}
                      </div>
                    </td>
                    <td className="hidden md:table-cell py-3 px-4">
                      {getDisplayValue(lead)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`${getStageBadgeColor(
                          lead.stage
                        )} px-2 py-1 rounded-full text-xs`}
                      >
                        {lead.stage}
                      </span>
                      {/* Mobile-only priority display */}
                      {!lead.priority ? null : (
                        <div className="sm:hidden mt-2">
                          <span
                            className={`${getPriorityBadgeColor(
                              lead.priority
                            )} px-2 py-1 rounded-full text-xs`}
                          >
                            {lead.priority}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="hidden sm:table-cell py-3 px-4">
                      <span
                        className={`${getPriorityBadgeColor(
                          lead.priority
                        )} px-2 py-1 rounded-full text-xs`}
                      >
                        {lead.priority || "Medium"}
                      </span>
                    </td>
                    <td className="hidden lg:table-cell py-3 px-4">
                      {lead.leadOwner || "Unassigned"}
                    </td>
                    <td className="hidden md:table-cell py-3 px-4">
                      {formatDate(lead.createdAt)}
                    </td>
                    <td
                      className="py-3 px-4"
                      onClick={(e) => e.stopPropagation()}
                    >
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
