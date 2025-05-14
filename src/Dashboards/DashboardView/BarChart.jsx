import React, { useState, useEffect } from 'react';
import CanvasJSReact from '@canvasjs/react-charts';
import config from "../../config";

const CanvasJS = CanvasJSReact.CanvasJS;
const CanvasJSChart = CanvasJSReact.CanvasJSChart;

// API base URL - change this to match your backend

const API_URL = config.API_URL;

const BarChart = () => {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    };
  };

  // Fetch leads data
  const fetchLeads = async () => {
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
      processLeadData(leadsData);
    } catch (err) {
      console.error("Error fetching leads data:", err);
      setError("Failed to load chart data. Please refresh the page.");
      setLoading(false);
    }
  };

  // Process lead data to extract company and implementation values
  const processLeadData = (leads) => {
    // Group leads by company and sum implementation values
    const companyData = {};
    
    leads.forEach(lead => {
      const company = lead.company || 'Unknown';
      const value = parseFloat(lead.value || 0);
      
      // Skip leads with zero value
      if (value <= 0) return;
      
      // Add value to the company total
      if (!companyData[company]) {
        companyData[company] = value;
      } else {
        companyData[company] += value;
      }
    });
    
    // Convert to array format needed for the chart
    let chartPoints = Object.entries(companyData).map(([company, value]) => ({
      label: company,
      y: value,
      formattedValue: `$${value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`
    }));
    
    // Sort by value (highest first)
    chartPoints.sort((a, b) => b.y - a.y);
    
    // Limit to top 10 companies for readability
    if (chartPoints.length > 10) {
      // Get top 9 companies
      const topCompanies = chartPoints.slice(0, 9);
      
      // Sum the rest into "Others"
      const otherCompanies = chartPoints.slice(9);
      const othersTotal = otherCompanies.reduce((sum, company) => sum + company.y, 0);
      
      if (othersTotal > 0) {
        topCompanies.push({
          label: "Others",
          y: othersTotal,
          formattedValue: `$${othersTotal.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}`
        });
      }
      
      chartPoints = topCompanies;
    }
    
    setChartData(chartPoints);
    setLoading(false);
  };

  // Format large numbers with K, M, B suffixes
  function addSymbols(e) {
    const suffixes = ["", "K", "M", "B"];
    let order = Math.max(Math.floor(Math.log(Math.abs(e.value)) / Math.log(1000)), 0);
    
    if (order > suffixes.length - 1) {
      order = suffixes.length - 1;
    }
    
    const suffix = suffixes[order];
    return '$' + CanvasJS.formatNumber(e.value / Math.pow(1000, order)) + suffix;
  }

  // Fetch data on component mount
  useEffect(() => {
    fetchLeads();
  }, []);

  // Prepare chart options
  const options = {
    animationEnabled: true,
    theme: "light2",
    title: {
      text: ""
    },
    axisX: {
      title: "Company",
      reversed: true,
    },
    axisY: {
      title: "Implementation Value ($)",
      includeZero: true,
      labelFormatter: addSymbols
    },
    data: [{
      type: "bar",
      dataPoints: chartData,
      indexLabel: "{formattedValue}",
      indexLabelFontColor: "#555",
      indexLabelPlacement: "outside",
      toolTipContent: "<b>{label}</b>: {formattedValue}"
    }]
  };

  if (loading) {
    return <div className="text-center p-4">Loading chart data...</div>;
  }

  if (error) {
    return (
      <div className="text-center p-4 text-red-600">
        <p>{error}</p>
        <button 
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={fetchLeads}
        >
          Retry
        </button>
      </div>
    );
  }
  
  // If no meaningful data is available
  if (chartData.length === 0) {
    return (
      <div className="text-center p-4 text-gray-500">
        No implementation value data available by company.
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <CanvasJSChart options={options} />
    </div>
  );
};

export default BarChart;