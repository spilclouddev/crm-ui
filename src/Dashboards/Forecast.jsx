import React, { useState, useEffect } from "react";
import * as XLSX from 'xlsx';
import CanvasJSReact from '@canvasjs/react-charts';
import config from '../config';

const CanvasJSChart = CanvasJSReact.CanvasJSChart;
const API_URL = config.API_URL;

const Forecast = () => {
  const [leads, setLeads] = useState([]);
  const [subscriptionStatus, setSubscriptionStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showDropdown, setShowDropdown] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  // Function to get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    };
  };

  // Load subscription status from localStorage with better error handling
  const loadSubscriptionStatus = () => {
    try {
      const savedStatus = localStorage.getItem('forecast_subscription_status');
      if (savedStatus) {
        const parsedStatus = JSON.parse(savedStatus);
        console.log("Loaded subscription status from localStorage:", parsedStatus);
        return parsedStatus;
      }
    } catch (err) {
      console.error("Error loading subscription status:", err);
    }
    return {};
  };

  // Save subscription status to localStorage with better error handling
  const saveSubscriptionStatus = (status) => {
    try {
      localStorage.setItem('forecast_subscription_status', JSON.stringify(status));
      console.log("Saved subscription status to localStorage:", status);
    } catch (err) {
      console.error("Error saving subscription status:", err);
    }
  };

  // Clear subscription status from localStorage
  const clearSubscriptionStatus = () => {
    try {
      localStorage.removeItem('forecast_subscription_status');
      // Reset to initial state
      const initialStatus = {};
      leads.forEach(lead => {
        initialStatus[lead._id] = Array(12).fill(false);
      });
      setSubscriptionStatus(initialStatus);
      saveSubscriptionStatus(initialStatus);
    } catch (err) {
      console.error("Error clearing subscription status:", err);
    }
  };

  // Fetch leads data
  const fetchLeads = async () => {
    try {
      setLoading(true);
      
      // Get auth headers
      const headers = getAuthHeaders();
      
      // Fetch leads
      const response = await fetch(`${API_URL}/leads`, { headers });
      if (!response.ok) {
        throw new Error(`Failed to fetch leads: ${response.status}`);
      }
      
      const leadsData = await response.json();
      
      // Filter out leads that aren't in "Won - Deal Closed" stage
      const closedLeads = leadsData.filter(lead => lead.stage === "Won - Deal Closed");
      
      // Load existing subscription status from localStorage FIRST
      const savedStatus = loadSubscriptionStatus();
      
      // Initialize subscription status for each lead, preserving ALL saved data
      const initialStatus = { ...savedStatus }; // Start with saved data
      
      closedLeads.forEach(lead => {
        // Only initialize if lead doesn't exist in saved status
        if (!initialStatus[lead._id]) {
          initialStatus[lead._id] = Array(12).fill(false);
        }
      });
      
      setLeads(closedLeads);
      setSubscriptionStatus(initialStatus);
      
      // Save the merged status back to localStorage to ensure persistence
      saveSubscriptionStatus(initialStatus);
      
      setLoading(false);
    } catch (err) {
      console.error("Error fetching leads:", err);
      setError("Failed to load leads data. Please refresh the page.");
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchLeads();
  }, []);

  // Save subscription status to localStorage whenever it changes (with debounce)
  useEffect(() => {
    if (Object.keys(subscriptionStatus).length > 0) {
      const timeoutId = setTimeout(() => {
        saveSubscriptionStatus(subscriptionStatus);
      }, 100); // Small debounce to avoid excessive saves
      
      return () => clearTimeout(timeoutId);
    }
  }, [subscriptionStatus]);

  // Calculate total expected revenue for a lead
  const calculateExpectedRevenue = (lead) => {
    const implementationValue = parseFloat(lead.value || 0);
    const subscriptionValue = parseFloat(lead.subscription || 0);
    
    return implementationValue + (subscriptionValue * 12);
  };

  // Calculate received revenue based on subscription status
  const calculateReceivedRevenue = (lead) => {
    const implementationValue = parseFloat(lead.value || 0);
    const subscriptionValue = parseFloat(lead.subscription || 0);
    
    // Count completed months from subscription status
    const completedMonths = subscriptionStatus[lead._id] 
      ? subscriptionStatus[lead._id].filter(month => month).length 
      : 0;
    
    return implementationValue + (subscriptionValue * completedMonths);
  };

  // Toggle month selection in subscription status
  const toggleMonth = (leadId, monthIndex) => {
    setSubscriptionStatus(prevStatus => {
      const newStatus = { ...prevStatus };
      if (!newStatus[leadId]) {
        newStatus[leadId] = Array(12).fill(false);
      }
      
      const updatedMonths = [...newStatus[leadId]];
      updatedMonths[monthIndex] = !updatedMonths[monthIndex];
      
      newStatus[leadId] = updatedMonths;
      
      return newStatus;
    });
  };

  // Toggle dropdown visibility
  const toggleDropdown = (leadId) => {
    setShowDropdown(showDropdown === leadId ? null : leadId);
  };

  // Handle exporting forecast data to Excel
  const handleExport = () => {
    if (leads.length === 0) {
      alert("No data to export.");
      return;
    }
    
    setIsExporting(true);
    
    try {
      // Transform leads to a format suitable for Excel
      const exportData = leads.map(lead => {
        const expectedRevenue = calculateExpectedRevenue(lead);
        const receivedRevenue = calculateReceivedRevenue(lead);
        const completedMonths = subscriptionStatus[lead._id] 
          ? subscriptionStatus[lead._id].filter(month => month).length 
          : 0;
        
        return {
          'Company': lead.company || '',
          'Implementation Value': parseFloat(lead.value || 0).toFixed(2),
          'Monthly Subscription': parseFloat(lead.subscription || 0).toFixed(2),
          'Expected Revenue': expectedRevenue.toFixed(2),
          'Received Revenue': receivedRevenue.toFixed(2),
          'Completed Months': completedMonths,
          'Completion Percentage': ((receivedRevenue / expectedRevenue) * 100).toFixed(2) + '%'
        };
      });
      
      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Forecast');
      
      // Generate Excel file and download
      XLSX.writeFile(workbook, `Revenue_Forecast_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`);
      
      console.log("Successfully exported forecast data to Excel");
    } catch (err) {
      console.error("Export error:", err);
      alert("Failed to export data. " + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  // Format currency values
  const formatCurrency = (value) => {
    return `$${parseFloat(value).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  // Prepare chart data - FIXED TO SHOW ONLY MONTHLY SUBSCRIPTION VALUES
  const getChartOptions = () => {
    // Prepare data for each company - focusing on monthly subscription only
    const chartData = leads.map(lead => {
      const monthlySubscription = parseFloat(lead.subscription || 0);
      const completedMonths = subscriptionStatus[lead._id] 
        ? subscriptionStatus[lead._id].filter(month => month).length 
        : 0;
      const receivedSubscriptionRevenue = monthlySubscription * completedMonths;
      const remainingSubscriptionRevenue = monthlySubscription * (12 - completedMonths);
      
      return {
        company: lead.company,
        monthlySubscription: monthlySubscription,
        completedMonths: completedMonths,
        receivedSubscriptionRevenue: receivedSubscriptionRevenue,
        remainingSubscriptionRevenue: remainingSubscriptionRevenue,
        totalAnnualSubscription: monthlySubscription * 12
      };
    });

    // Prepare data points for the stacked bar chart (subscription only)
    const receivedData = chartData.map(data => ({
      y: data.receivedSubscriptionRevenue,
      label: data.company,
      monthlySubscription: data.monthlySubscription,
      completedMonths: data.completedMonths,
      totalAnnualSubscription: data.totalAnnualSubscription
    }));

    const remainingData = chartData.map(data => ({
      y: data.remainingSubscriptionRevenue,
      label: data.company
    }));

    return {
      animationEnabled: true,
      theme: "darkblue",
      title: {
        text: ""
      },
      axisX: {
        title: "Companies",
        titleFontColor: "black"
      },
      axisY: {
        title: "Subscription Amount (AUD)",
        titleFontColor: "black",
        includeZero: true
      },
      toolTip: {
        shared: true,
        contentFormatter: function(e) {
          let content = `<strong>${e.entries[0].dataPoint.label}</strong><br/>`;
          
          // Get the dataPoint from the first entry
          const dataPoint = e.entries[0].dataPoint;
          
          if (dataPoint.monthlySubscription !== undefined) {
            content += `<span style="color: #369EAD;">Monthly Subscription:</span> $${dataPoint.monthlySubscription.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}<br/>`;
            
            content += `<span style="color: #7F6084;">Completed Months:</span> ${dataPoint.completedMonths}/12<br/>`;
            
            content += `<span style="color: #7F6084;">Received Subscription Revenue:</span> $${(dataPoint.monthlySubscription * dataPoint.completedMonths).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}<br/>`;
            
            content += `<span style="color: #4F81BC;">Total Annual Subscription:</span> $${dataPoint.totalAnnualSubscription.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}<br/>`;
          }
          
          return content;
        }
      },
      legend: {
        verticalAlign: "top",
        horizontalAlign: "center"
      },
      data: [
        {
          type: "stackedColumn",
          name: "Received Subscription Revenue",
          showInLegend: true,
          color: "#7F6084",
          indexLabel: "${y}",
          indexLabelPlacement: "inside",
          indexLabelFontColor: "white",
          indexLabelFormatter: function(e) {
            if (e.dataPoint.y > 0) {
              return "$" + e.dataPoint.y.toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              });
            }
            return "";
          },
          dataPoints: receivedData
        },
        {
          type: "stackedColumn",
          name: "Remaining Subscription Revenue",
          showInLegend: true,
          color: "#4F81BC",
          indexLabel: "${y}",
          indexLabelPlacement: "inside",
          indexLabelFontColor: "white",
          indexLabelFormatter: function(e) {
            if (e.dataPoint.y > 0) {
              return "$" + e.dataPoint.y.toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              });
            }
            return "";
          },
          dataPoints: remainingData
        }
      ]
    };
  };

  if (loading) {
    return <div className="p-4 sm:p-6 text-center">Loading forecast data...</div>;
  }

  return (
    <div className="p-4 sm:p-6">
      {/* Error message if any */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Chart Section */}
      <div className="bg-white p-4 sm:p-6 rounded-md shadow mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <h2 className="text-lg sm:text-xl font-semibold">Monthly Subscription Revenue Forecast</h2>
          <div className="flex flex-col sm:flex-row gap-2">
            {/* <button 
              className="px-3 py-2 flex items-center text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              onClick={clearSubscriptionStatus}
              disabled={isExporting}
            >
              <svg className="mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reset Status
            </button> */}
            <button 
              className="px-3 py-2 flex items-center text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={handleExport}
              disabled={isExporting}
            >
              {isExporting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Exporting...
                </span>
              ) : (
                <>
                  <svg className="mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export Forecast
                </>
              )}
            </button>
          </div>
        </div>
        
        {leads.length > 0 ? (
          <div className="h-96 w-full">
            <CanvasJSChart options={getChartOptions()} />
          </div>
        ) : (
          <div className="text-center p-4 text-gray-500">
            No forecast data available. Closed deals will appear here.
          </div>
        )}
      </div>

      {/* Forecast Table */}
      <div className="bg-white p-4 sm:p-6 rounded-md shadow">
        <h2 className="text-lg sm:text-xl font-semibold mb-4">Revenue Details</h2>
        
        {leads.length > 0 ? (
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Company</th>
                  <th className="text-left py-3 px-4">Implementation Value</th>
                  <th className="text-left py-3 px-4">Monthly Subscription</th>
                  <th className="text-left py-3 px-4">Expected Revenue</th>
                  <th className="text-left py-3 px-4">Received Revenue</th>
                  <th className="text-left py-3 px-4">Subscription Status</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => {
                  const expectedRevenue = calculateExpectedRevenue(lead);
                  const receivedRevenue = calculateReceivedRevenue(lead);
                  const percentage = expectedRevenue > 0 
                    ? (receivedRevenue / expectedRevenue) * 100 
                    : 0;
                  
                  return (
                    <tr key={lead._id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-medium">{lead.company}</div>
                      </td>
                      <td className="py-3 px-4">
                        {formatCurrency(lead.value || 0)}
                      </td>
                      <td className="py-3 px-4">
                        {formatCurrency(lead.subscription || 0)}
                      </td>
                      <td className="py-3 px-4">
                        {formatCurrency(expectedRevenue)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span>{formatCurrency(receivedRevenue)}</span>
                          <span className="text-xs text-gray-500">
                            ({percentage.toFixed(1)}% of expected)
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 relative">
                        <button
                          className="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded-md text-sm"
                          onClick={() => toggleDropdown(lead._id)}
                        >
                          {subscriptionStatus[lead._id] 
                            ? subscriptionStatus[lead._id].filter(m => m).length 
                            : 0} / 12 months
                        </button>
                        
                        {showDropdown === lead._id && (
                          <div className="absolute z-10 mt-2 w-64 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                            <div className="p-3">
                              <div className="text-sm font-medium text-gray-700 mb-2">
                                Select completed subscription months:
                              </div>
                              <div className="grid grid-cols-4 gap-2">
                                {months.map((month, index) => (
                                  <label
                                    key={index}
                                    className="flex items-center space-x-1 cursor-pointer"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={subscriptionStatus[lead._id] && subscriptionStatus[lead._id][index] || false}
                                      onChange={() => toggleMonth(lead._id, index)}
                                      className="form-checkbox h-4 w-4 text-indigo-600"
                                    />
                                    <span className="text-sm">{month}</span>
                                  </label>
                                ))}
                              </div>
                              <div className="mt-3 text-right">
                                <button
                                  className="text-sm text-gray-600 hover:text-gray-800"
                                  onClick={() => setShowDropdown(null)}
                                >
                                  Close
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center p-4 text-gray-500">
            No forecast data available. Closed deals will appear here.
          </div>
        )}
      </div>
    </div>
  );
};

export default Forecast;