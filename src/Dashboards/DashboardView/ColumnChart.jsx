import React, { useState, useEffect } from 'react';
import CanvasJSReact from '@canvasjs/react-charts';
import config from "../../config";

const CanvasJSChart = CanvasJSReact.CanvasJSChart;

// API base URL - change this to match your backend

const API_URL = config.API_URL;

const ColumnChart = () => {
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

  // Process lead data to get implementation values by company
  const processLeadData = (leads) => {
    // Map companies to their implementation values
    const companyData = leads
      .filter(lead => lead.value && parseFloat(lead.value) > 0) // Filter out leads with no value
      .map(lead => ({
        label: lead.company || 'Unnamed Company',
        y: parseFloat(lead.value || 0),
        formattedValue: `$${parseFloat(lead.value || 0).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })}`
      }));
    
    // Sort by implementation value (highest first)
    companyData.sort((a, b) => b.y - a.y);
    
    // Limit to top 15 companies for better visualization
    const topCompanies = companyData.slice(0, 15);
    
    setChartData(topCompanies);
    setLoading(false);
  };

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
      title: "Companies",
      labelAngle: -45, // Angle the labels to prevent overlap
      labelFontSize: 12,
      interval: 1
    },
    axisY: {
      title: "Implementation Value ($)",
      includeZero: true,
      prefix: "$",
      valueFormatString: "#,###.##"
    },
    toolTip: {
      shared: false,
      contentFormatter: function (e) {
        const point = e.entries[0].dataPoint;
        return `<strong>${point.label}</strong><br/>Value: ${point.formattedValue}`;
      }
    },
    data: [
      {
        type: "column",
        name: "Implementation Value",
        indexLabel: "${y}",
        indexLabelFontSize: 12,
        indexLabelPlacement: "outside",
        indexLabelOrientation: "horizontal",
        indexLabelFontColor: "#555",
        dataPoints: chartData
      }
    ]
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

export default ColumnChart;